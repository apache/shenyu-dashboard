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

// Plugin handle metadata (extObj.rule) stores optional validation rules as
// regular expression literals such as "/^(true|false)$/" or "/^[a-z]+$/i".
// The value is admin-editable data, so it must be parsed, never evaluated.
const VALID_FLAGS = /^[dgimsuvy]*$/;

// JavaScript line terminators: LF, CR, LINE SEPARATOR, PARAGRAPH SEPARATOR.
const LINE_TERMINATOR = /[\n\r\u2028\u2029]/;

// Splits "/source/flags" at the first "/" that closes the literal, following
// JavaScript regular expression literal rules: "\/" and "/" inside a
// character class do not end the literal, and a line terminator (escaped or
// not) is not allowed anywhere in the literal.
function splitRegExpLiteral(literal) {
  if (literal[0] !== "/") {
    return null;
  }
  let inClass = false;
  for (let i = 1; i < literal.length; i += 1) {
    const char = literal[i];
    if (LINE_TERMINATOR.test(char)) {
      return null;
    }
    if (char === "\\") {
      i += 1;
      if (LINE_TERMINATOR.test(literal[i])) {
        return null;
      }
    } else if (char === "[") {
      inClass = true;
    } else if (char === "]") {
      inClass = false;
    } else if (char === "/" && !inClass) {
      return { source: literal.slice(1, i), flags: literal.slice(i + 1) };
    }
  }
  return null;
}

/**
 * Converts a stored check rule into a RegExp without executing it as code.
 *
 * @param {*} rule rule in "/source/flags" form
 * @returns {RegExp|undefined} the parsed RegExp, or undefined when the rule
 *   is empty or is not a valid regular expression literal
 */
export function parseRegExpRule(rule) {
  if (typeof rule !== "string") {
    return undefined;
  }
  const literal = splitRegExpLiteral(rule.trim());
  if (!literal || !literal.source || !VALID_FLAGS.test(literal.flags)) {
    return undefined;
  }
  try {
    return new RegExp(literal.source, literal.flags);
  } catch (e) {
    // Invalid pattern or flag combination (e.g. duplicated flags).
    return undefined;
  }
}

// Rules already reported, so each invalid rule is logged once. Capped so a
// long-lived page that sees many distinct invalid rules cannot grow it
// without bound.
const MAX_REPORTED_INVALID_RULES = 100;
const reportedInvalidRules = new Set();

/**
 * Returns the pattern a form field should be validated against for a stored
 * check rule.
 *
 * An empty rule means the field has no pattern check. A rule that is not a
 * valid regular expression literal used to make eval() throw while the form
 * rendered; it now produces a pattern that matches nothing, so any non-empty
 * value fails validation with the rule shown in the message, and the problem
 * is reported once in the console instead of validation being skipped.
 *
 * @param {*} rule rule in "/source/flags" form
 * @returns {RegExp|undefined} the pattern to validate against, or undefined
 *   when the rule is empty
 */
export function checkRulePattern(rule) {
  if (!rule || (typeof rule === "string" && !rule.trim())) {
    return undefined;
  }
  const pattern = parseRegExpRule(rule);
  if (pattern) {
    return pattern;
  }
  if (!reportedInvalidRules.has(String(rule))) {
    if (reportedInvalidRules.size >= MAX_REPORTED_INVALID_RULES) {
      reportedInvalidRules.clear();
    }
    reportedInvalidRules.add(String(rule));
    // eslint-disable-next-line no-console
    console.error(
      "Invalid plugin handle check rule, expected a /pattern/flags literal:",
      rule,
    );
  }
  return /(?!)/;
}
