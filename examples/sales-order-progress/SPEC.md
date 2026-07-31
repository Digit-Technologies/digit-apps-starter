# SPEC: Sales Order Progress

## What it does

Shows the 20 most recent sales orders (by `orderDate`, descending) with the order
number, customer name, order date, total amount, a status badge, and a progress bar
showing how far each order is toward completion. Built for a single user checking
recent order status at a glance; no filtering/search UI. Read-only — makes no
mutations.

## Data & permissions

- **Permissions**: `read:order`, `read:order:costInfo` (for `totalOrderAmount.costAmount`),
  `read:company` (for `customer.name`). Copied the `read:order:costInfo` pattern from the
  sibling `top-customers` app in this repo, since no `apiPermissions` MCP tool was
  available on the connected instance to verify permission strings directly.
- **GraphQL**: `Query.orders(connection, order)` → `OrdersConnection`. Sort via
  `order: { by: orderDate, direction: desc }`. Fields used: `id`, `orderNumber`,
  `orderDate`, `orderStatus`, `shippedPercentage`, `customer.name`,
  `totalOrderAmount.costAmount`, `totalOrderAmount.currency.code`.
- **Schema notes**:
  - `Order.shippedPercentage: Float` is a server-computed field (shipped vs. ordered
    quantity) — used directly as the progress-bar fill instead of computing fulfillment
    client-side from line items.
  - `orderStatus` enum: `draft`, `requested`, `unfulfilled`, `partially_fulfilled`,
    `fulfilled`, `cancelled`, `returned`, `refunded`, `closed`. `fulfilled`/`closed` are
    forced to 100% regardless of `shippedPercentage`; `cancelled`/`returned`/`refunded`
    render the bar in a "stopped" color since they aren't progressing toward completion.
  - No pagination UI — fetches a single page of 20 via `connection.first`.

## Prompts

> can you help me build a new digit app that will show me my most recent sales orders
> and a progress bar on their status to completion? Let me know what questions you have

Clarifying questions asked and answered before implementation:
- Environment/connector: `digit-local`
- App already created in Digit UI; appId provided as `019fafec-46b2-704c-825e-b6a8a8ac1414`
- Progress metric: user said "not sure — recommend one"; agent inspected the `Order`
  GraphQL type, found `shippedPercentage`, and used it as the recommended metric.

## Context supplied

- Copied project layout/conventions from `examples/digit-api` (Vite + `DigitProxyClient`
  template) and from the sibling `top-customers` app already in this repo (permission
  set pattern, root-level app placement instead of under `examples/`).
- Inspected live schema via the `digit-local` MCP server's `graphql-schema://type/Query`,
  `graphql-schema://type/Order`, and `graphql-schema://type/OrderOrderInput` resources,
  and sampled 3 real sales orders via the `salesOrders` MCP tool to confirm field shapes
  before writing the query.
