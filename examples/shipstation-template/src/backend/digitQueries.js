const ADDRESS_FIELDS = `
  id title addressLineOne addressLineTwo city state zip country
  isShippingDefault isShipFromDefault isBillingDefault isManufacturingDefault
`;

export const ORDER_DETAIL_QUERY = `
  query ShipStationOrder($orderIds: [ID!], $connection: ConnectionInput) {
    organization {
      id
      name
      replyToEmail
      defaultCurrency { code }
      addresses { ${ADDRESS_FIELDS} }
    }
    orders(
      orderIds: $orderIds
      orderStatuses: [unfulfilled, partially_fulfilled]
      connection: $connection
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        documentNumber
        orderNumber
        orderStatus
        packingStatus
        pickingStatus
        fulfillmentStatus
        notes
        tags { id value }
        customer { id name }
        customerContact { id fullName phone email }
        shippingAddress { ${ADDRESS_FIELDS} }
        billingAddress { ${ADDRESS_FIELDS} }
        packContainers {
          id
          packedItemsTotalCount
          shipment { id }
        }
        shipments {
          id
          shippingStatus
          trackingNumber
        }
        items {
          id
          quantity
          customerSku
          itemAvailability
          totalShippedQuantity
          pickingStatus
          packingStatus
          item { id name sku }
        }
      }
    }
  }
`;

export const ORDER_BY_ID_QUERY = `
  query ShipStationOrderById($orderIds: [ID!]!) {
    organization {
      id
      name
      replyToEmail
      defaultCurrency { code }
      addresses { ${ADDRESS_FIELDS} }
    }
    orders(orderIds: $orderIds, connection: { first: 20 }) {
      nodes {
        id
        documentNumber
        orderNumber
        orderStatus
        packingStatus
        pickingStatus
        fulfillmentStatus
        notes
        tags { id value }
        customer { id name }
        customerContact { id fullName phone email }
        shippingAddress { ${ADDRESS_FIELDS} }
        billingAddress { ${ADDRESS_FIELDS} }
        packContainers {
          id
          packedItemsTotalCount
          shipment { id }
        }
        shipments {
          id
          shippingStatus
          trackingNumber
        }
        items {
          id
          quantity
          customerSku
          itemAvailability
          totalShippedQuantity
          pickingStatus
          packingStatus
          item { id name sku }
        }
      }
    }
  }
`;

export const ITEMS_BY_SEARCH_QUERY = `
  query ShipStationItems($search: String, $connection: ConnectionInput) {
    items(search: $search, connection: $connection) {
      nodes { id name sku }
    }
  }
`;

export const COMPANIES_SEARCH_QUERY = `
  query ShipStationCompanies($search: String, $connection: ConnectionInput) {
    companies(search: $search, connection: $connection) {
      nodes { id name }
    }
  }
`;

export const CREATE_COMPANY_MUTATION = `
  mutation ShipStationCreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      company { id name }
    }
  }
`;

export const CREATE_COMPANY_LOCATION_MUTATION = `
  mutation ShipStationCreateCompanyLocation($input: CreateCompanyLocationInput!) {
    createCompanyLocation(input: $input) {
      address { id }
    }
  }
`;

export const CREATE_ORDER_MUTATION = `
  mutation ShipStationCreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order { id documentNumber }
    }
  }
`;

export const CREATE_PACK_CONTAINER_MUTATION = `
  mutation ShipStationCreatePackContainer($input: CreatePackContainerInput!) {
    createPackContainer(input: $input) {
      packContainer { id }
    }
  }
`;

export const CREATE_SHIPMENT_MUTATION = `
  mutation ShipStationCreateShipment($input: CreateShipmentInput!) {
    createShipment(input: $input) {
      shipment { id trackingNumber shippingStatus }
    }
  }
`;

export const UPDATE_SHIPMENT_MUTATION = `
  mutation ShipStationUpdateShipment($input: UpdateShipmentInput!) {
    updateShipment(input: $input) {
      shipment { id trackingNumber shippingStatus }
    }
  }
`;
