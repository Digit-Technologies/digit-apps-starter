/**
 * Public API shared by Sutton custom app frontend and backend code.
 * Only import from this package root — other files are implementation details.
 */

export * from './codes.js';

export type {
  SuccessResult,
  ErrorResult,
  Result,
  ParseResult,
} from './result.js';

export {
  parseJsonResponse,
  requiredString,
  optionalString,
  parseObject,
} from './validate.js';
