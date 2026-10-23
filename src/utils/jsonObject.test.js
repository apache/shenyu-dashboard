/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { formatJsonObject, parseJsonObject } from "./jsonObject";

it.each([undefined, null, ""])("treats %p as no stored value", (text) => {
  expect(parseJsonObject(text)).toEqual({ value: undefined });
});

it("returns a parsed JSON object", () => {
  expect(parseJsonObject('{"timeout": 5, "nested": {"a": [1]}}')).toEqual({
    value: { timeout: 5, nested: { a: [1] } },
  });
});

it("accepts a value that is already an object", () => {
  const value = { timeout: 5 };
  expect(parseJsonObject(value)).toEqual({ value });
});

it.each(["{not json", "{", "timeout=5", "{'a': 1}"])(
  "reports malformed text %p as an error instead of throwing",
  (text) => {
    const result = parseJsonObject(text);
    expect(result.value).toBeUndefined();
    expect(typeof result.error).toBe("string");
    expect(result.error.length).toBeGreaterThan(0);
  },
);

it.each(["[1, 2]", '"text"', "42", "true", "null"])(
  "reports valid JSON of an unexpected type %p as an error",
  (text) => {
    expect(parseJsonObject(text)).toEqual({ error: "not a JSON object" });
  },
);

it("pretty-prints a stored object and shows empty input as an empty object", () => {
  expect(formatJsonObject('{"timeout":5}')).toBe('{\n    "timeout": 5\n}');
  expect(formatJsonObject(null)).toBe("{}");
  expect(formatJsonObject("")).toBe("{}");
});

it("returns text that is not a JSON object unchanged for display", () => {
  expect(formatJsonObject("{not json")).toBe("{not json");
  expect(formatJsonObject("<b>x</b>")).toBe("<b>x</b>");
  expect(formatJsonObject("[1, 2]")).toBe("[1, 2]");
});
