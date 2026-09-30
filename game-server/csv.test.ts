import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCsv } from "./csv";

test("plain rows, LF and CRLF", () => {
  assert.deepEqual(parseCsv("a,b\r\nc,d\n"), [["a", "b"], ["c", "d"]]);
  assert.deepEqual(parseCsv("a,b\nc,d"), [["a", "b"], ["c", "d"]]);
});

test("quoted commas, escaped quotes, embedded newlines", () => {
  assert.deepEqual(parseCsv('"x, y","say ""hi""","line1\nline2"\n'), [["x, y", 'say "hi"', "line1\nline2"]]);
});

test("empty fields and BOM", () => {
  assert.deepEqual(parseCsv("﻿a,,c\n,,\n"), [["a", "", "c"], ["", "", ""]]);
});
