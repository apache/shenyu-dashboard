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

import { getConfigFieldValue, serializePluginConfig } from "./pluginConfig";

const fields = ["timeout", "enabled", "name", "settings"].map((field) => ({
  field,
}));

it.each([0, false, "", null])(
  "keeps a stored %p instead of replacing it with the default",
  (value) => {
    expect(getConfigFieldValue({ timeout: value }, "timeout", 30)).toBe(value);
  },
);

it("uses defaults only for missing values", () => {
  expect(getConfigFieldValue({}, "timeout", 30)).toBe(30);
  expect(getConfigFieldValue(undefined, "timeout", 30)).toBe(30);
  expect(getConfigFieldValue({ timeout: undefined }, "timeout", 30)).toBe(30);
});

it("preserves zero, booleans, empty strings and explicit null on submission", () => {
  const config = serializePluginConfig({
    fields,
    values: {
      __timeout__: 0,
      __enabled__: false,
      __name__: "",
      __settings__: null,
    },
  });
  expect(JSON.parse(config)).toEqual({
    timeout: 0,
    enabled: false,
    name: "",
    settings: null,
  });
});

it("preserves fields outside the form and unchanged nested JSON during edit-save", () => {
  const original = {
    timeout: 5,
    enabled: false,
    name: "",
    settings: {
      retries: 0,
      enabled: false,
      nodes: [{ host: "upstream", weight: 0 }],
    },
    extension: { vendor: "custom" },
  };
  const config = serializePluginConfig({
    fields,
    values: { __timeout__: 5, __enabled__: false, __name__: "" },
    config: JSON.stringify(original),
  });
  expect(JSON.parse(config)).toEqual(original);
});

it("changes only submitted fields, without mutating the original configuration or form values", () => {
  const original = Object.freeze({
    timeout: 30,
    extension: Object.freeze({ keep: true }),
  });
  const values = Object.freeze({
    __timeout__: 0,
    name: "plugin",
    __unknown__: "ignored",
  });
  const config = serializePluginConfig({ fields, values, config: original });
  expect(JSON.parse(config)).toEqual({ timeout: 0, extension: { keep: true } });
  expect(original.timeout).toBe(30);
  expect(values).toHaveProperty("__timeout__", 0);
});

it("distinguishes an omitted form field from an explicitly cleared one", () => {
  const config = serializePluginConfig({
    fields,
    values: { __timeout__: undefined },
    config: '{"timeout":30,"enabled":false}',
  });
  expect(JSON.parse(config)).toEqual({ enabled: false });
});

it("preserves the raw configuration when there is no generated form", () => {
  const config = ' { "enabled": false, "items": [] } ';
  expect(serializePluginConfig({ values: {}, config })).toBe(config);
  expect(serializePluginConfig({ fields: [], values: {}, config })).toBe(
    config,
  );
  expect(
    serializePluginConfig({ fields: [], values: { config: "" }, config }),
  ).toBe("");
});

it("keeps an empty configuration empty", () => {
  expect(serializePluginConfig({ fields, values: {}, config: "" })).toBe("");
});

it("retains nested JSON types supplied by the JSON editor and unrelated fields", () => {
  const edited = {
    checks: [{ enabled: false, retries: 0 }],
    empty: {},
    list: [],
  };
  const config = serializePluginConfig({
    fields,
    values: { __name__: "edited" },
    config: '{"extension":"keep","settings":{"old":true}}',
    jsonValues: { settings: edited },
  });
  expect(JSON.parse(config)).toEqual({
    name: "edited",
    extension: "keep",
    settings: edited,
  });
});

it("can explicitly clear a JSON object without restoring its old contents", () => {
  const config = serializePluginConfig({
    fields,
    values: {},
    config: '{"settings":{"old":true}}',
    jsonValues: { settings: {} },
  });
  expect(JSON.parse(config)).toEqual({ settings: {} });
});

it("does not silently discard malformed stored JSON", () => {
  expect(() =>
    serializePluginConfig({ fields, values: {}, config: "{invalid" }),
  ).toThrow(SyntaxError);
});
