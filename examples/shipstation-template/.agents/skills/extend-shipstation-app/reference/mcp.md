# MCP setup

Both MCPs are required before changing Digit GraphQL or ShipStation HTTP. If either is
disconnected, **stop** and ask the user to connect it. Do not invent schema, permission
keys, or ShipStation request bodies.

Do **not** put a ShipStation API key (or Digit token) in MCP config, `mcp.json`, or
committed files. Runtime keys are pasted on the setup screen (`API_TOKEN_DIGIT`,
`PUBLIC_WEBHOOK_URL`) and stored in D1.

## Digit MCP

Already required by create-digit-app. Use:

- Resources: `graphql-schema://index`, `graphql-schema://type/{TypeName}`,
  `graphql-schema://search/{query}`
- Tools: `appPermissions`, `apps`, publish flow (`generateAppUploadLink` → POST zip →
  `publishApp` → poll `appPublish`)

Live org queries are optional. Schema lookup is not.

## ShipStation docs MCP

Official server: **documentation only**. It does not create labels or list carriers for
the customer’s account.

Cursor `mcp.json` (HTTP):

```json
{
  "mcpServers": {
    "shipstation-docs": {
      "url": "https://docs.shipstation.com/mcp"
    }
  }
}
```

Use it to confirm method, path, auth header (`api-key`), and JSON shape for **V2**
(`https://api.shipstation.com`). Then implement the call in `src/backend/shipstation.js`.

ShipStation also has V1 (`ssapi.shipstation.com`) and ShipEngine. This template is **V2
only**. Ignore V1 examples.

## Fallback if docs MCP is down

1. Ask the user to connect `https://docs.shipstation.com/mcp`.
2. If they cannot: fetch the **live** OpenAPI for that session from
   `https://docs.shipstation.com/_bundle/apis/@shipstation-v2/openapi.yaml`.
   Do not commit that file. Do not paste ShipStation prose docs into the repo.

A third-party *live* ShipStation API MCP (key in Cursor, tools that POST to ShipStation)
is out of scope. Org credentials stay in Digit.
