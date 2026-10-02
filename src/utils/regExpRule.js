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

// Splits "/source/flags" at the first "/" that closes the literal, following
// JavaScript regular expression literal rules: "\/" and "/" inside a
// character class do not end the literal.
function splitRegExpLiteral(literal) {
  if (literal[0] !== "/") {
    return null;
  }
  let inClass = false;
  for (let i = 1; i < literal.length; i += 1) {
    const char = literal[i];
    if (char === "\\") {
      i += 1;
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
