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

import { isValidHandleJSON, validateHandleJSON } from "./CommonRuleHandle";

describe("isValidHandleJSON", () => {
  it("accepts values while the structured form is active", () => {
    expect(isValidHandleJSON("1", undefined)).toBe(true);
  });

  it("accepts JSON objects", () => {
    expect(isValidHandleJSON("2", '{"enabled":true}')).toBe(true);
  });

  it.each(["", "null", "[]", "true", "not-json"])(
    "rejects non-object JSON input %p",
    (value) => {
      expect(isValidHandleJSON("2", value)).toBe(false);
    },
  );
});

describe("validateHandleJSON", () => {
  it.each([
    ["1", undefined, undefined],
    ["2", '{"enabled":true}', undefined],
    ["2", "[]", "Invalid JSON object"],
  ])("calls back once for handle type %s", (handleType, value, error) => {
    const callback = jest.fn();

    validateHandleJSON(handleType, value, callback, "Invalid JSON object");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(error);
  });
});
