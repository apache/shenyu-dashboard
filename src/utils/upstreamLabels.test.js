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
  getUpstreamLabels,
  parseUpstreamProps,
  serializeUpstreamProps,
  validateLabelRows,
} from "./upstreamLabels";

describe("discovery upstream labels", () => {
  it("preserves labels and unrelated props when saving an upstream", () => {
    const item = {
      props: JSON.stringify({
        labels: { release: "canary", region: "cn" },
        custom: { tls: true },
        gray: "false",
      }),
      warmupTime: 20,
      gray: true,
    };
    expect(JSON.parse(serializeUpstreamProps(item))).toEqual({
      labels: { release: "canary", region: "cn" },
      custom: { tls: true },
      warmupTime: 20,
      gray: "true",
    });
  });
  it("retains an explicit empty map for clearing labels", () => {
    expect(
      getUpstreamLabels(
        serializeUpstreamProps({ props: '{"labels":{}}', gray: false }),
      ),
    ).toEqual({});
  });
  it("accepts upstreams with no metadata", () => {
    expect(getUpstreamLabels(null)).toEqual({});
    expect(parseUpstreamProps("")).toEqual({});
  });
  it("rejects malformed props and non-string labels without silently discarding them", () => {
    [
      "{",
      "[]",
      '{"labels":null}',
      '{"labels":[]}',
      '{"labels":{"release":true}}',
      '{"labels":{"release":" "}}',
    ].forEach((props) => expect(() => getUpstreamLabels(props)).toThrow());
  });
  it("rejects blank and duplicate keys but allows clearing the last row", () => {
    expect(
      validateLabelRows([
        { key: "release", value: "canary" },
        { key: "release", value: "stable" },
        { key: "region", value: " " },
      ]),
    ).toEqual(["", "DUPLICATE", "REQUIRED"]);
    expect(validateLabelRows([])).toEqual([]);
  });
  it("retains exact label text for backend matching", () => {
    expect(getUpstreamLabels('{"labels":{"release":" canary "}}')).toEqual({
      release: " canary ",
    });
  });
});
