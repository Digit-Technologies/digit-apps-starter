import assert from "node:assert/strict";
import { test } from "node:test";

import { withheldMessage } from "./LabelPrintDialog";

test("withheldMessage is null when the host left nothing off", () => {
  assert.equal(withheldMessage([]), null);
});

test("withheldMessage names every permission the manifest is missing", () => {
  const message = withheldMessage(["READ_JOB", "READ_ITEM_CUSTOMER"]);
  assert.match(message ?? "", /READ_JOB, READ_ITEM_CUSTOMER/);
  assert.match(message ?? "", /manifest/);
});
