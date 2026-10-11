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

import {
  getDefaultValueList,
  getDiscoveryProps,
  getLastTagName,
} from "./optionalFields";

describe("optional discovery and document fields", () => {
  it("returns the final tag name without assuming tags exist", () => {
    expect(getLastTagName([{ name: "first" }, { name: "last" }])).toBe("last");
    expect(getLastTagName([])).toBeUndefined();
    expect(getLastTagName(undefined)).toBeUndefined();
  });

  it("normalizes missing discovery props to an empty object", () => {
    expect(getDiscoveryProps(null)).toEqual({});
    expect(getDiscoveryProps({ timeout: "3s" })).toEqual({ timeout: "3s" });
  });

  it("does not dereference a missing discovery handler", () => {
    expect(getDefaultValueList(undefined)).toEqual([]);
    expect(getDefaultValueList({})).toEqual([]);
    expect(getDefaultValueList({ defaultValue: "http,https" })).toEqual([
      "http",
      "https",
    ]);
  });
});
