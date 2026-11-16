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
  createCanaryDraft,
  mergeDivideHandle,
  serializeCanaryDraft,
  validateCanaryDraft,
} from "./canary";

const config = () => ({
  enabled: true,
  percentage: 10,
  matchMode: 0,
  fallbackPolicy: "STABLE",
  stableLabels: { release: "stable" },
  canaryLabels: { release: "canary" },
  stickyKey: { paramType: "header", paramName: "x-user-id" },
  conditions: [],
});
const errors = (overrides) =>
  validateCanaryDraft(createCanaryDraft({ ...config(), ...overrides }));

describe("Divide Canary payload", () => {
  it("preserves missing and null canary on legacy edits", () => {
    expect(
      JSON.parse(
        mergeDivideHandle('{"retry":2,"custom":{"tls":true}}', '{"retry":3}'),
      ),
    ).toEqual({ retry: 3, custom: { tls: true } });
    expect(JSON.parse(mergeDivideHandle('{"canary":null}', "{}"))).toEqual({
      canary: null,
    });
  });
  it("distinguishes disabled configuration from explicit removal", () => {
    const original = {
      retry: 2,
      timeout: 3000,
      extension: { limit: 2 },
      canary: config(),
    };
    expect(
      JSON.parse(
        mergeDivideHandle(original, {}, { ...config(), enabled: false }),
      ).canary.enabled,
    ).toBe(false);
    expect(JSON.parse(mergeDivideHandle(original, { retry: 4 }, null))).toEqual(
      { retry: 4, timeout: 3000, extension: { limit: 2 } },
    );
    expect(original.canary.enabled).toBe(true);
  });
  it("round trips unknown config, sticky and condition metadata", () => {
    const original = {
      ...config(),
      extension: { version: 2 },
      stickyKey: { paramType: "header", paramName: " uid ", custom: "keep" },
      conditions: [
        {
          paramType: "header",
          paramName: "x-version",
          operator: "=",
          paramValue: "beta",
          extension: true,
        },
      ],
    };
    const draft = createCanaryDraft(original);
    draft.percentage = 25;
    expect(serializeCanaryDraft(draft)).toEqual({
      ...original,
      percentage: 25,
    });
    expect(original.percentage).toBe(10);
  });
  it("omits an unset optional sticky key instead of sending null or an empty object", () => {
    const draft = createCanaryDraft({
      ...config(),
      percentage: 100,
      stickyKey: undefined,
    });
    expect(validateCanaryDraft(draft)).toEqual({});
    expect(serializeCanaryDraft(draft)).not.toHaveProperty("stickyKey");
  });
  it("rejects blank, duplicate, empty and overlapping label groups", () => {
    const draft = createCanaryDraft(config());
    draft.stableRows.push({ key: "release", value: "duplicate" });
    expect(validateCanaryDraft(draft)["stable.1"]).toBe("LABEL_DUPLICATE");
    draft.stableRows = [{ key: " ", value: "stable" }];
    expect(validateCanaryDraft(draft)["stable.0"]).toBe("LABEL_REQUIRED");
    expect(errors({ stableLabels: {} }).stable).toBe("LABELS_REQUIRED");
    expect(errors({ stableLabels: { release: "canary" } }).partition).toBe(
      "PARTITION_REQUIRED",
    );
    expect(errors({ stableLabels: { region: "shanghai" } }).partition).toBe(
      "PARTITION_REQUIRED",
    );
  });
  it("keeps exact label keys and handles __proto__ safely", () => {
    const draft = createCanaryDraft(config());
    draft.stableRows.push(
      { key: "__proto__", value: "test" },
      { key: "release ", value: "unchanged" },
    );
    expect(validateCanaryDraft(draft)).toEqual({});
    const result = JSON.parse(JSON.stringify(serializeCanaryDraft(draft)));
    expect(
      Object.getOwnPropertyDescriptor(result.stableLabels, "__proto__").value,
    ).toBe("test");
    expect(result.stableLabels["release "]).toBe("unchanged");
  });
  it("rejects percentages outside the integer contract", () => {
    [-1, 101, 2.5, "10", "", null, NaN].forEach((percentage) =>
      expect(errors({ percentage }).percentage).toBe("PERCENTAGE_INVALID"),
    );
    [0, 1, 99, 100].forEach((percentage) =>
      expect(errors({ percentage })).toEqual({}),
    );
  });
  it("requires sticky for enabled intermediate percentages and validates supplied optional sources", () => {
    [1, 99].forEach((percentage) =>
      expect(errors({ percentage, stickyKey: undefined }).stickyKey).toBe(
        "SOURCE_REQUIRED",
      ),
    );
    [0, 100].forEach((percentage) =>
      expect(errors({ percentage, stickyKey: undefined })).toEqual({}),
    );
    expect(errors({ enabled: false, stickyKey: undefined })).toEqual({});
    expect(
      errors({
        percentage: 0,
        stickyKey: { paramType: "header", paramName: " " },
      }).stickyKey,
    ).toBe("PARAM_REQUIRED");
  });
  it("accepts dictionary extensions and optional parameter names", () => {
    const draft = createCanaryDraft({
      ...config(),
      stickyKey: { paramType: "custom-user", paramName: "tenant" },
      conditions: [
        {
          paramType: "custom-user",
          operator: "custom-equal",
          paramValue: "abc",
        },
      ],
    });
    expect(
      validateCanaryDraft(draft, {
        paramType: [{ dictValue: "custom-user" }],
        operator: [{ dictValue: "custom-equal" }],
      }),
    ).toEqual({});
    expect(validateCanaryDraft(draft, { paramType: [] }).stickyKey).toBe(
      "SOURCE_INVALID",
    );
  });
  it("allows empty conditions and isBlank but checks source, operator and values", () => {
    expect(errors({ conditions: [] })).toEqual({});
    expect(
      errors({
        conditions: [
          {
            paramType: "header",
            paramName: "x",
            operator: "isBlank",
            paramValue: "",
          },
        ],
      }),
    ).toEqual({});
    expect(
      errors({
        conditions: [
          {
            paramType: "header",
            paramName: "",
            operator: "=",
            paramValue: "a",
          },
        ],
      })["condition.0"],
    ).toBe("PARAM_REQUIRED");
    expect(
      errors({
        conditions: [{ paramType: "ip", operator: "=", paramValue: " " }],
      })["condition.0"],
    ).toBe("VALUE_REQUIRED");
  });
  it("does not silently normalize malformed stored objects", () => {
    [[], false, "invalid"].forEach((value) =>
      expect(() => createCanaryDraft(value)).toThrow(),
    );
    expect(() =>
      createCanaryDraft({ ...config(), stableLabels: { release: 3 } }),
    ).toThrow();
    expect(() =>
      createCanaryDraft({ ...config(), conditions: null }),
    ).toThrow();
    expect(() => createCanaryDraft({ ...config(), stickyKey: null })).toThrow();
    expect(() => createCanaryDraft({ ...config(), stickyKey: {} })).toThrow();
    expect(() => mergeDivideHandle("invalid", {}, undefined)).toThrow();
  });
});
