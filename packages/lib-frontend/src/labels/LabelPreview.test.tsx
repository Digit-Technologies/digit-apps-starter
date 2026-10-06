import React from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { LabelPreview } from "./LabelPreview";

test("LabelPreview shows the host HTML in a script-free sandboxed iframe", () => {
  const html = renderToStaticMarkup(
    <LabelPreview
      html={'<!DOCTYPE html><html><body><script>alert(1)</script><p>label</p></body></html>'}
      title="Widget"
      widthIn={4}
      heightIn={6}
      copies={2}
    />,
  );

  assert.match(html, /<iframe\b/);
  assert.match(html, /sandbox=""/);
  assert.doesNotMatch(html, /allow-scripts/);
  assert.doesNotMatch(html, /allow-modals/);
  assert.doesNotMatch(html, /allow-same-origin/);
  assert.match(html, /title="Widget"/);
  assert.match(html, /referrerpolicy="no-referrer"/i);
  assert.match(html, /srcdoc="/i);
  assert.match(html, /label/);
  assert.match(html, /width:4in/);
  assert.match(html, /height:12in/);
  assert.match(html, /data-digit-label-preview=""/);
});
