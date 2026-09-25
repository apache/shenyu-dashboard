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

import fetch from "dva/fetch";

jest.mock("dva/fetch", () => jest.fn());
jest.mock("../index", () => ({ dispatch: jest.fn() }));
jest.mock("antd", () => ({ notification: { error: jest.fn() } }));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

let api;
const namespaceId = "namespace-A";
const success = { code: 200, data: {} };

beforeAll(() => {
  document.body.innerHTML = '<span id="httpPath">/admin</span>';
  // The service reads its base URL from the document at import time.
  // eslint-disable-next-line global-require
  api = require("./api");
});

beforeEach(() => {
  window.sessionStorage.clear();
  window.sessionStorage.setItem("token", "test-token");
  fetch.mockReset();
  fetch.mockResolvedValue({ status: 200, json: async () => success });
});

afterEach(() => window.sessionStorage.clear());
afterAll(() => {
  document.body.innerHTML = "";
});

it.each([
  ["getAllSelectors", "/admin/selector"],
  ["getAllRules", "/admin/rule"],
  ["getPluginsByNamespace", "/admin/namespace-plugin"],
  ["getAllMetadata", "/admin/meta-data/queryList"],
])(
  "%s scopes and encodes list filters without changing the caller's parameters",
  async (method, path) => {
    const params = Object.freeze({
      namespaceId,
      currentPage: 2,
      pageSize: 10,
      name: "a&b / 中文",
      path: "/hello?x=1&y=2",
    });
    await expect(api[method](params)).resolves.toEqual(success);
    const [url, options] = fetch.mock.calls[0];
    const parsed = new URL(url, "http://localhost");
    expect(parsed.pathname).toBe(path);
    expect(parsed.searchParams.get("namespaceId")).toBe(namespaceId);
    expect(parsed.searchParams.get("currentPage")).toBe("2");
    expect(parsed.searchParams.get("name")).toBe(params.name);
    expect(parsed.searchParams.get("path")).toBe(params.path);
    expect(options.method).toBe("GET");
    expect(options.headers["X-Access-Token"]).toBe("test-token");
  },
);

it.each([
  ["deleteSelector", "/admin/selector/batch"],
  ["deleteRule", "/admin/rule/batch"],
  ["deleteMetadata", "/admin/meta-data/batchDeleted"],
  ["deleteNamespacePlugin", "/admin/namespace-plugin/batch"],
])("%s sends namespace and resource IDs together", async (method, path) => {
  const list = Object.freeze(["id-1", "id-2"]);
  await api[method](Object.freeze({ list, namespaceId }));
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe(path);
  expect(options.method).toBe("DELETE");
  expect(JSON.parse(options.body)).toEqual({
    ids: ["id-1", "id-2"],
    namespaceId,
  });
});

it.each([
  ["enableSelector", "/admin/selector/batchEnabled"],
  ["enableRule", "/admin/rule/batchEnabled"],
  ["updateNamespacePluginEnabled", "/admin/namespace-plugin/enabled"],
  [
    "updateNamespacePluginEnabledByNamespace",
    "/admin/namespace-plugin/enabledByNamespace",
  ],
])(
  "%s preserves an explicit disabled value and its namespace",
  async (method, path) => {
    await api[method]({ list: ["id-1"], enabled: false, namespaceId });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(path);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      ids: ["id-1"],
      enabled: false,
      namespaceId,
    });
  },
);

it("includes and encodes the namespace when deleting discovery configuration", async () => {
  await api.deleteDiscovery({
    discoveryId: "discovery-1",
    namespaceId: "space & other",
  });
  const [url, options] = fetch.mock.calls[0];
  const parsed = new URL(url, "http://localhost");
  expect(parsed.pathname).toBe("/admin/discovery/discovery-1");
  expect(parsed.searchParams.get("namespaceId")).toBe("space & other");
  expect(options.method).toBe("DELETE");
});

it("targets the selected namespace when loading its permissions", async () => {
  await api.getUserPermissionByNamespace({ namespaceId });
  const [url, options] = fetch.mock.calls[0];
  expect(new URL(url, "http://localhost").searchParams.get("namespaceId")).toBe(
    namespaceId,
  );
  expect(options.headers["X-Access-Token"]).toBe("test-token");
});

it.each([
  ["updateSelector", "/admin/selector/id-1"],
  ["updateRule", "/admin/rule/id-1"],
  ["updateNamespacePlugin", "/admin/namespace-plugin/id-1"],
])(
  "%s retains configuration and fields unrelated to the edit",
  async (method, path) => {
    const params = Object.freeze({
      id: "id-1",
      namespaceId,
      enabled: false,
      sort: 0,
      name: "",
      config: JSON.stringify({
        enabled: false,
        timeout: 0,
        extension: { tags: ["x"] },
      }),
      handle: { conditions: [] },
    });
    await api[method](params);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(path);
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual(params);
  },
);

it("carries request failures through the service boundary", async () => {
  const failure = new TypeError("Network unavailable");
  fetch.mockRejectedValue(failure);
  await expect(api.updateRule({ id: "id-1", namespaceId })).rejects.toBe(
    failure,
  );
});

it.each(["addPlugin", "updatePlugin"])(
  "%s sends an explicitly emptied configuration in multipart data",
  async (method) => {
    await api[method]({
      id: "id-1",
      name: "divide",
      role: "proxy",
      sort: 0,
      enabled: false,
      config: "",
    });
    const [, options] = fetch.mock.calls[0];
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("config")).toBe("");
    expect(options.body.get("sort")).toBe("0");
    expect(options.body.get("enabled")).toBe("false");
  },
);
