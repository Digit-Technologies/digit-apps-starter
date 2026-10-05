/**
 * Maps an inventory record to the values a composer label's `bindingKey`s read.
 * Mirrors digit-web's `buildLayoutPreviewValues` / `getOptionValue`, so a studio
 * app prints the same text, serials and GS1 payloads native label print does.
 */

import {
  gs1BarcodePayload,
  resolveLotNumber,
  type Gs1Context,
  type Gs1Inventory,
} from "./gs1";
import type { LabelPrintRecord } from "./types";

type Rec = Record<string, unknown>;

const isRec = (value: unknown): value is Rec =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const rec = (value: unknown): Rec => (isRec(value) ? value : {});

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatShortDate(value: unknown): string {
  const date = value == null || value === "" ? new Date() : new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "short" }).format(date);
}

function formatDateTime(value: unknown): string {
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function toSentenceCase(value: string): string {
  const spaced = value.replace(/[_-]+/g, " ").toLowerCase().trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** The pieces of a label record, however the app shaped it. */
export type NormalizedLabelRecord = {
  inventory: Rec;
  item: Rec;
  job: Rec;
  org: Rec;
  purchaseOrder: Rec;
  shipment: Rec;
  quantity: number;
  defaultUom: string;
  uomLabel: string;
  serialNumber: string;
};

/**
 * Accepts either the full shape (`{ inventory, item, job, org, ... }`) or the
 * short one an app usually has on hand: an inventory object with its `item`
 * embedded, optionally spread with `{ item, ...inventory }`.
 */
export function normalizeLabelRecord(record: LabelPrintRecord): NormalizedLabelRecord {
  const inventory = isRec(record.inventory) ? record.inventory : record;
  const item = isRec(record.item) ? record.item : rec(inventory.item);
  const stockUom = rec(item.defaultStockUom);
  const quantity =
    typeof record.quantity === "number"
      ? record.quantity
      : num(inventory.quantityInStock) || num(inventory.quantityAvailable) || num(inventory.acceptedItems);
  const serial =
    str(record.serialNumber).trim() || str(inventory.scanCodeSerialNumber).trim() || str(inventory.serialNumber).trim();
  return {
    inventory,
    item,
    job: rec(record.job),
    org: rec(record.org ?? record.organization),
    purchaseOrder: rec(record.purchaseOrder),
    shipment: rec(record.shipment),
    quantity,
    defaultUom: str(record.defaultUom) || "lb",
    uomLabel: str(record.uomLabel) || str(stockUom.symbol),
    serialNumber: serial,
  };
}

function customFieldValue(field: Rec): string {
  const type = str(field.fieldType);
  if (type === "SINGLE_SELECT") return str(rec(field.fieldValueOption).value);
  if (type === "MULTI_SELECT") {
    return list(field.fieldValueOptions)
      .map((option) => str(rec(option).value))
      .filter(Boolean)
      .join(", ");
  }
  if (type === "DATE" && field.fieldValueDate) return formatShortDate(field.fieldValueDate);
  if (type === "DATETIME" && field.fieldValueDateTime) return formatDateTime(field.fieldValueDateTime);
  if (type === "NUMBER" && field.fieldValueNumber != null) return String(field.fieldValueNumber);
  return str(field.fieldValueText) || str(field.fieldValueIdentifier);
}

function customFieldValues(...groups: unknown[]): Rec {
  const out: Record<string, string> = {};
  for (const group of groups) {
    for (const entry of list(group)) {
      const field = rec(entry);
      const id = str(field.fieldId);
      const key = `cf_${id}`;
      if (!id || out[key]) continue;
      out[key] = customFieldValue(field);
    }
  }
  return out;
}

function addressEntries(prefix: string, address: unknown): Record<string, string> {
  const a = rec(address);
  const lineOne = str(a.addressLineOne);
  const lineTwo = str(a.addressLineTwo);
  const city = str(a.city);
  const state = str(a.state);
  const zip = str(a.zip);
  const country = str(a.country);
  const cityState = [city.trim(), state.trim()].filter(Boolean).join(", ");
  const cityStateZip = [cityState, zip.trim()].filter(Boolean).join(" ");
  return {
    [prefix]: [lineOne.trim(), lineTwo.trim(), cityStateZip, country.trim()].filter(Boolean).join("\n"),
    [`${prefix}.lineOne`]: lineOne,
    [`${prefix}.lineTwo`]: lineTwo,
    [`${prefix}.city`]: city,
    [`${prefix}.state`]: state,
    [`${prefix}.zip`]: zip,
    [`${prefix}.country`]: country,
  };
}

function customerSku(item: Rec, customerId: string, addressId: string): string {
  if (!customerId) return "";
  const nodes = list(rec(item.itemCustomers).nodes).map(rec).filter((node) => {
    const id = str(rec(node.customer).id);
    return !id || id === customerId;
  });
  const byAddress = nodes.find((node) => addressId && str(rec(node.customerAddress).id) === addressId);
  const fallback = nodes.find((node) => !str(rec(node.customerAddress).id));
  return str((byAddress ?? fallback)?.customerItemSku);
}

export type LabelBindingOptions = {
  /** AI chain for GS1-128 stamps (see `resolveGs1128Identifiers`). */
  gs1128ApplicationIdentifiers?: readonly string[] | null;
};

/** Values for every native binding key, derived from the record. */
export function buildLabelBindings(
  record: LabelPrintRecord,
  options: LabelBindingOptions = {},
): Record<string, string> {
  const n = normalizeLabelRecord(record);
  const { inventory, item, job, org, purchaseOrder, shipment } = n;
  const jobOrder = rec(job.salesOrder);
  const shipmentOrder = rec(shipment.order);
  const customerId = str(rec(jobOrder.customer).id) || str(rec(shipmentOrder.customer).id);
  const shippingAddressId = str(rec(jobOrder.shippingAddress).id) || str(rec(shipmentOrder.shippingAddress).id);

  const gross = num(inventory.grossWeight);
  const tare = num(inventory.tareWeight);
  const qtyText = `${formatNumber(n.quantity)} ${n.uomLabel}`;
  const lotNumber = resolveLotNumber(inventory as Gs1Inventory, job as { lotNumber?: string }) ?? "";
  const created = formatShortDate(inventory.createdAt);
  const isMixed = inventory.isMixed === true || record.isMixed === true;

  const ctx: Gs1Context = {
    serialNumber: n.serialNumber,
    inventory: inventory as Gs1Inventory,
    item: item as Gs1Context["item"],
    job: job as Gs1Context["job"],
  };
  const gs1128 = gs1BarcodePayload("gs1128", options.gs1128ApplicationIdentifiers, ctx);
  const dataMatrix = gs1BarcodePayload("dataMatrix", undefined, ctx);
  const receivingDocument = str(purchaseOrder.receivingDocumentNumber) || "-";
  const orgAddresses = list(org.addresses).map(rec);
  const orgAddress = orgAddresses.find((a) => a.isShippingDefault === true) ?? orgAddresses[0];
  const vendorOrder = purchaseOrder;
  const tags = list(inventory.tags)
    .map((tag) => str(rec(tag).value).trim())
    .filter(Boolean)
    .join(", ");

  return {
    carrierName: str(rec(shipment.shippingCarrierField).value),
    createdDate: created,
    defaultBinLocation: str(rec(item.defaultWarehouseLocation).locationCode),
    expirationDate: inventory.expirationDate ? formatShortDate(inventory.expirationDate) : "",
    grossWeight: `${formatNumber(gross)} ${n.defaultUom}`,
    gtin: str(item.gtin),
    internalSku: str(item.sku),
    item: isMixed ? "Mixed" : str(item.name),
    labelCategory: str(rec(inventory.scanCodeCategory).value),
    labelNumber: `Label #${str(inventory.scanCodeNumber)}`,
    lotNumber,
    notes: str(inventory.notes),
    jobNumber: str(job.documentNumber),
    netWeight: `${formatNumber(gross - tare)} ${n.defaultUom}`,
    orderCustomerRefNumber: str(shipmentOrder.customerReferenceNumber) || str(jobOrder.customerReferenceNumber),
    producedDate: created,
    producedQuantity: qtyText,
    quantity: qtyText,
    qtyShipped: `${list(shipment.packContainers).reduce<number>((sum, c) => sum + num(rec(c).packedItemsTotalCount), 0)} units`,
    receiveDate: created,
    receivedQuantity: qtyText,
    receivingStatus: inventory.receivingStatus ? toSentenceCase(str(inventory.receivingStatus)) : "",
    referenceIdNumber: receivingDocument,
    stockUom: n.uomLabel || str(rec(item.defaultStockUom).symbol),
    tags,
    tareWeight: `${formatNumber(tare)} ${n.defaultUom}`,
    ticketNumber: receivingDocument,
    companySku:
      str(item.vendorSku) || str(rec(rec(inventory.purchaseOrderItem).itemVendor).vendorItemSku),
    customerSku: customerSku(item, customerId, shippingAddressId),

    barCode: n.serialNumber,
    gs1128: gs1128.symbology === "gs1_128" ? gs1128.encodedValue : n.serialNumber,
    qrCode: n.serialNumber,
    gs1128Text: gs1128.symbology === "gs1_128" ? gs1128.caption : "",
    dataMatrix: dataMatrix.symbology === "gs1_datamatrix" ? dataMatrix.encodedValue : "",
    dataMatrixText: dataMatrix.symbology === "gs1_datamatrix" ? dataMatrix.caption : "",

    detailSerialNumber: n.serialNumber,

    orgName: str(org.name),
    ...addressEntries("orgAddress", orgAddress),
    orgLogo: str(org.logo),

    vendorName: str(rec(vendorOrder.vendor).name),
    ...addressEntries("vendorAddress", vendorOrder.vendorAddress),
    vendorLogo: str(rec(vendorOrder.vendor).logo),

    customerName: str(rec(jobOrder.customer).name),
    ...addressEntries("customerAddress", jobOrder.shippingAddress),
    ...addressEntries("shipToAddress", jobOrder.shippingAddress),
    customerLogo: str(rec(jobOrder.customer).logo),

    itemImage: str(rec(list(item.itemImages)[0]).url),

    ...customFieldValues(item.customFields, inventory.customFields, job.customFields, rec(vendorOrder.vendor).customFields),
  } as Record<string, string>;
}
