/**
 * Public API shared by Digit app frontend and backend.
 * Only import from this package root — other files are implementation details.
 */

export * from './codes';

export { okResult, errResult } from './result';
export type {
  SuccessResult,
  ErrorResult,
  Result,
  ParseResult,
} from './result';

export {
  parseJsonResponse,
  requiredString,
  optionalString,
  parseObject,
} from './validate';
export type {
  StringFieldOptions,
  RequiredStringArgs,
  OptionalStringArgs,
  ParseFields,
  ParseObjectArgs,
  ParseJsonResponseArgs,
} from './validate';
