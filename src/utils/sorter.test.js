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

import { compareDate, compareNumber, sortByDate, sortByNumber } from "./sorter";

describe("compareNumber", () => {
  it("orders numbers and numeric strings by value", () => {
    expect(["42", 8, "100", 0].sort(compareNumber)).toEqual([
      0,
      8,
      "42",
      "100",
    ]);
  });

  it("orders missing values before present values", () => {
    // Array#sort always moves undefined to the end without calling the
    // comparator, so undefined is checked directly below.
    expect([3, null, 1, ""].sort(compareNumber)).toEqual([null, "", 1, 3]);
    expect(compareNumber(undefined, 1)).toBeLessThan(0);
    expect(compareNumber(1, undefined)).toBeGreaterThan(0);
  });

  it("treats two missing values as equal", () => {
    expect(compareNumber(null, undefined)).toBe(0);
  });
});

describe("compareDate", () => {
  it("orders date strings and timestamps chronologically", () => {
    const dates = [
      "2026-09-26 10:00:00",
      1735689600000, // 2025-01-01T00:00:00Z
      "2024-05-01T08:30:00Z",
    ];
    expect([...dates].sort(compareDate)).toEqual([
      "2024-05-01T08:30:00Z",
      1735689600000,
      "2026-09-26 10:00:00",
    ]);
  });

  it("orders missing and invalid dates before valid dates", () => {
    expect(["2026-01-01", null, "not a date"].sort(compareDate)).toEqual([
      null,
      "not a date",
      "2026-01-01",
    ]);
  });
});

describe("column sorters", () => {
  it("sorts rows by the requested numeric field, ignoring other fields", () => {
    const rows = [
      { role: "a", sort: 300 },
      { role: "b", sort: 10 },
      { role: "c", sort: 200 },
    ];
    expect([...rows].sort(sortByNumber("sort")).map((row) => row.sort)).toEqual(
      [10, 200, 300],
    );
  });

  it("sorts rows by the requested date field, ignoring other fields", () => {
    const rows = [
      { instanceType: "http", lastHeartBeatTime: "2026-09-03 00:00:00" },
      { instanceType: "http", lastHeartBeatTime: "2026-09-01 00:00:00" },
      { instanceType: "http", lastHeartBeatTime: "2026-09-02 00:00:00" },
    ];
    expect(
      [...rows]
        .sort(sortByDate("lastHeartBeatTime"))
        .map((row) => row.lastHeartBeatTime),
    ).toEqual([
      "2026-09-01 00:00:00",
      "2026-09-02 00:00:00",
      "2026-09-03 00:00:00",
    ]);
  });
});
