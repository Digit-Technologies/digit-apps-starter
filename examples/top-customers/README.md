# Top Customers

React + MUI, themed with `@digit/app-theme`'s `DigitThemeProvider`. Ranks customers by
total sales order amount, using `window.DigitProxyClient` to page through the `orders`
GraphQL root field and aggregating totals client-side (there is no server-side
aggregation endpoint).

## Notes

- Works only inside the Digit harness (local Vite has no `DigitProxyClient`)
- Declares `read:order` and `read:company` in `public/manifest.json`
- Pages through orders in batches of 100, up to 5000 orders, and shows the top 10 customers
- If multiple currency codes are present across orders, totals are summed without conversion
  and a note is shown
- The field names in the `orders` query (`totalOrderAmount`, `currencyCode`, `customer { id
  name }`) match the sortable/filterable fields exposed by the `salesOrders` MCP tool; verify
  against the live schema (e.g. GraphQL introspection) if orders render with missing data

```bash
npm install
npm run build
```
