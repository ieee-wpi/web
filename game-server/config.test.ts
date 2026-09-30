import "./test-env";
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSheetBase } from "./config";

test("normalizeSheetBase accepts the forms officers paste", () => {
  const b = "https://docs.google.com/spreadsheets/d/e/2PACX-abc";
  for (const input of [b, `${b}/`, `${b}/pub`, `${b}/pub?output=csv`, `${b}/pubhtml`, `${b}/pub?gid=5&single=true&output=csv`, ` ${b}/pub `]) {
    assert.equal(normalizeSheetBase(input), `${b}/pub`, input);
  }
  assert.equal(normalizeSheetBase(""), "");
});
