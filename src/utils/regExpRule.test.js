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

import { checkRulePattern, parseRegExpRule } from "./regExpRule";

describe("parseRegExpRule", () => {
  afterEach(() => {
    delete global.pwned;
  });

  it("parses the rule formats shipped in ShenYu plugin handle data", () => {
    const booleanRule = parseRegExpRule("/^(true|false)$/");
    expect(booleanRule).toBeInstanceOf(RegExp);
    expect(booleanRule.source).toBe("^(true|false)$");
    expect(booleanRule.test("true")).toBe(true);
    expect(booleanRule.test("yes")).toBe(false);

    const bitRule = parseRegExpRule("/^[01]$/");
    expect(bitRule.test("1")).toBe(true);
    expect(bitRule.test("2")).toBe(false);
  });

  it("keeps valid flags", () => {
    const rule = parseRegExpRule("/^abc$/i");
    expect(rule.flags).toBe("i");
    expect(rule.test("ABC")).toBe(true);
    expect(parseRegExpRule("/^a.b$/ms").flags).toBe("ms");
  });

  it("matches the same values as the equivalent regular expression literal", () => {
    expect(parseRegExpRule(" /^\\d+$/ ").source).toBe(/^\d+$/.source);
    expect(parseRegExpRule("/^a\\/b$/").test("a/b")).toBe(true);
    expect(parseRegExpRule("/^[/]+$/").test("//")).toBe(true);
  });

  it.each(["/abc/x", "/abc/gg", "/abc/I", "/abc/ i"])(
    "rejects invalid flags: %s",
    (rule) => {
      expect(parseRegExpRule(rule)).toBeUndefined();
    },
  );

  it.each([
    undefined,
    null,
    1,
    {},
    "",
    "//",
    "/",
    "abc",
    "^\\d+$",
    "/(/",
    "/abc",
    "/a/b/",
  ])(
    "returns undefined for a value that is not a valid literal: %p",
    (rule) => {
      expect(parseRegExpRule(rule)).toBeUndefined();
    },
  );

  // JavaScript rejects these as regular expression literals (SyntaxError).
  it.each([
    ["LF", "/a\nb/"],
    ["CR", "/a\rb/"],
    ["LINE SEPARATOR", "/a\u2028b/"],
    ["PARAGRAPH SEPARATOR", "/a\u2029b/"],
    ["LF in a character class", "/[\n]/"],
    ["escaped LF", "/a\\\nb/"],
    ["escaped LINE SEPARATOR", "/a\\\u2028b/"],
  ])("rejects a line terminator inside the literal: %s", (name, rule) => {
    expect(parseRegExpRule(rule)).toBeUndefined();
  });

  it("ignores line terminators around the literal", () => {
    expect(parseRegExpRule("\n/^a$/i\r\n").test("A")).toBe(true);
    expect(parseRegExpRule("\u2028/^a$/\u2029").test("a")).toBe(true);
  });

  it("accepts an escaped line terminator written as an escape sequence", () => {
    expect(parseRegExpRule("/^a\\nb$/").test("a\nb")).toBe(true);
    expect(parseRegExpRule("/^a\\u2028b$/").test("a\u2028b")).toBe(true);
  });

  it.each([
    "alert(1)",
    "(()=>{globalThis.pwned=1})()",
    "/x/,globalThis.pwned=1",
    "/x/;globalThis.pwned=1",
    "/x/.constructor.constructor('globalThis.pwned=1')()",
    "globalThis.pwned=1,/x/",
  ])("does not execute code stored in the rule: %s", (rule) => {
    expect(parseRegExpRule(rule)).toBeUndefined();
    expect(global.pwned).toBeUndefined();
  });
});

describe("checkRulePattern", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([undefined, null, "", "   ", "\t\r\n"])(
    "adds no pattern for an empty rule: %p",
    (rule) => {
      const error = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(checkRulePattern(rule)).toBeUndefined();
      expect(error).not.toHaveBeenCalled();
    },
  );

  it("returns the parsed pattern for a valid rule", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const pattern = checkRulePattern("/^(true|false)$/");
    expect(pattern.test("true")).toBe(true);
    expect(pattern.test("yes")).toBe(false);
    expect(error).not.toHaveBeenCalled();
  });

  it.each(["^\\d+$", "abc", "/(/", "/a\u2028b/", "//", 1, {}])(
    "fails validation for an invalid rule instead of skipping it: %p",
    (rule) => {
      const error = jest.spyOn(console, "error").mockImplementation(() => {});
      const pattern = checkRulePattern(rule);
      expect(pattern).toBeInstanceOf(RegExp);
      ["", "a", "true", "123", "\n"].forEach((value) => {
        expect(pattern.test(value)).toBe(false);
      });
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0]).toContain(rule);
    },
  );

  it("reports the same invalid rule only once", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    checkRulePattern("not-a-literal-once");
    checkRulePattern("not-a-literal-once");
    expect(checkRulePattern("not-a-literal-once").test("x")).toBe(false);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("does not execute code stored in an invalid rule", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    checkRulePattern("(()=>{globalThis.pwned=1})()");
    expect(global.pwned).toBeUndefined();
  });
});
