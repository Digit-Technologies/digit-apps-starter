export type DigitCarrierOption = { id: string; value: string };

export type SsServiceRow = {
  serviceCode: string;
  name: string;
  inCatalog?: boolean;
  digitOptionId?: string | null;
  digitValue?: string | null;
  matchSource?: string | null;
  inheritedFromCarrier?: boolean;
};

export type SsCarrierRow = {
  carrierCode: string;
  name: string;
  inCatalog?: boolean;
  /** Carrier-level Digit default (empty service map). */
  digitOptionId?: string | null;
  digitValue?: string | null;
  matchSource?: string | null;
  services?: SsServiceRow[];
};

export type CarrierMappingRow = {
  ssCarrierCode: string;
  ssServiceCode?: string;
  digitOptionId: string | null;
  source: string;
};

export type UnmappedCarrierRow = {
  carrierCode: string | null;
  carrierName: string | null;
  serviceCode?: string | null;
  serviceName?: string | null;
  inCatalog?: boolean;
};

export type OrgSettingsData = {
  organizationId: string;
  defaultFulfillmentMethod: string;
  defaultWeightOz?: number;
  digitCarriers?: DigitCarrierOption[];
  ssCarriers?: SsCarrierRow[];
  carrierMappings?: CarrierMappingRow[];
  unmappedCarriers?: UnmappedCarrierRow[];
  digitCarriersError?: string | null;
};

export type CarrierDraft = {
  defaults: Record<string, string>;
  services: Record<string, string>;
};

export function serviceDraftKey(carrierCode: string, serviceCode: string) {
  return `${carrierCode}::${serviceCode}`;
}

export function unmatchedServicesFrom(orgSettings: OrgSettingsData | undefined): SsServiceRow[] {
  const out: SsServiceRow[] = [];
  for (const carrier of orgSettings?.ssCarriers ?? []) {
    for (const service of carrier.services ?? []) {
      if (!service.digitOptionId) out.push(service);
    }
  }
  return out;
}

export function draftFromOrgSettings(orgSettings: OrgSettingsData | undefined): CarrierDraft {
  const defaults: Record<string, string> = {};
  const services: Record<string, string> = {};
  for (const carrier of orgSettings?.ssCarriers ?? []) {
    defaults[carrier.carrierCode] = carrier.digitOptionId || '';
    for (const service of carrier.services ?? []) {
      const pinned = service.matchSource === 'manual' && !service.inheritedFromCarrier;
      services[serviceDraftKey(carrier.carrierCode, service.serviceCode)] = pinned
        ? service.digitOptionId || ''
        : '';
    }
  }
  return { defaults, services };
}

export function mappingsFromDraft(draft: CarrierDraft) {
  const mappings: { ssCarrierCode: string; ssServiceCode: string; digitOptionId: string | null }[] =
    [];
  for (const [ssCarrierCode, digitOptionId] of Object.entries(draft.defaults)) {
    mappings.push({
      ssCarrierCode,
      ssServiceCode: '',
      digitOptionId: digitOptionId ? digitOptionId : null,
    });
  }
  for (const [key, digitOptionId] of Object.entries(draft.services)) {
    const sep = key.indexOf('::');
    const ssCarrierCode = sep === -1 ? key : key.slice(0, sep);
    const ssServiceCode = sep === -1 ? '' : key.slice(sep + 2);
    mappings.push({
      ssCarrierCode,
      ssServiceCode,
      digitOptionId: digitOptionId ? digitOptionId : null,
    });
  }
  return mappings;
}
