/**
 * @typedef {'success' | 'skipped' | 'error'} ChannelResultStatus
 */

/**
 * @typedef {object} ChannelResult
 * @property {ChannelResultStatus} status
 * @property {boolean} [skipped]
 * @property {string} [reason]
 * @property {string} [message]
 * @property {string} [externalOrderId]
 */

/**
 * @typedef {object} ChannelAdapterContext
 * @property {Record<string, unknown>} env
 * @property {import('@cloudflare/workers-types').D1Database | null} db
 * @property {string | null} [organizationId]
 */

/**
 * @typedef {object} AfterDigitShippedContext
 * @property {Record<string, unknown>} env
 * @property {import('@cloudflare/workers-types').D1Database | null} db
 * @property {string | null} [organizationId]
 * @property {Record<string, unknown>} order
 * @property {{ trackingNumber?: string | null, carrierName?: string | null, shipDate?: string | null, digitShipmentId?: string | null }} shipment
 */

/**
 * @typedef {object} InboundOrderContext
 * @property {Record<string, unknown>} env
 * @property {import('@cloudflare/workers-types').D1Database | null} db
 * @property {string | null} [organizationId]
 * @property {Record<string, unknown>} ids
 * @property {Record<string, unknown>} payload
 */

/**
 * @typedef {object} VerifyWebhookContext
 * @property {Record<string, unknown>} env
 * @property {import('@cloudflare/workers-types').D1Database | null} db
 * @property {Record<string, string>} headers
 * @property {Uint8Array} body
 */

/**
 * @typedef {object} ChannelAdapter
 * @property {string} id
 * @property {string} label
 * @property {string[]} secretKeys
 * @property {string | null} [webhookPath]
 * @property {(ctx: ChannelAdapterContext) => Promise<boolean>} isConfigured
 * @property {(ctx: AfterDigitShippedContext) => Promise<ChannelResult>} [afterDigitShipped]
 * @property {(ctx: InboundOrderContext) => Promise<ChannelResult>} [onInboundOrder]
 * @property {(ctx: VerifyWebhookContext) => Promise<boolean>} [verifyWebhook]
 * @property {(payload: Record<string, unknown>) => Record<string, unknown>} [extractWebhookIds]
 * @property {(headers: Record<string, string>, ids: Record<string, unknown>) => string} [webhookIdempotencyKey]
 */

export {};
