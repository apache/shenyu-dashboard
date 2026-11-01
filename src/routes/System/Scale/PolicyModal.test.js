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

import moment from "moment";
import { buildPolicyData } from "./PolicyModal";

describe("buildPolicyData", () => {
  it.each(["1", "3"])(
    "does not require time values for policy type %s",
    (id) => {
      const values = { num: 2, status: true };

      expect(buildPolicyData(values, id)).toEqual({
        num: 2,
        status: 1,
        id,
      });
    },
  );

  it("formats time values for time-window policies", () => {
    const values = {
      num: 2,
      status: false,
      beginTime: moment("2026-11-01 10:00:00", "YYYY-MM-DD HH:mm:ss"),
      endTime: moment("2026-11-01 11:00:00", "YYYY-MM-DD HH:mm:ss"),
    };

    expect(buildPolicyData(values, "2")).toEqual({
      ...values,
      status: 0,
      id: "2",
      beginTime: "2026-11-01T10:00:00Z",
      endTime: "2026-11-01T11:00:00Z",
    });
  });
});
