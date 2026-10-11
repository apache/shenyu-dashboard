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
import { notification } from "antd";
import store from "../index";
import request from "./request";

jest.mock("dva/fetch", () => jest.fn());
jest.mock("antd", () => ({ notification: { error: jest.fn() } }));
jest.mock("../index", () => ({ dispatch: jest.fn() }));
jest.mock("./IntlUtils", () => ({ getIntlContent: (key) => key }));

const payload = { code: 200, data: { id: "rule-1" } };
function response(status = 200, body = payload) {
  return {
    status,
    statusText: "Request failed",
    url: "/rule",
    json: jest.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  fetch.mockReset();
  fetch.mockResolvedValue(response());
});

afterEach(() => window.sessionStorage.clear());

it("returns the API payload without requiring options or a token", async () => {
  await expect(request("/rule")).resolves.toEqual(payload);
  expect(fetch).toHaveBeenCalledWith("/rule", {});
});

it.each(["POST", "PUT", "DELETE"])(
  "serializes %s JSON without losing false, zero, empty or nested values",
  async (method) => {
    const body = Object.freeze({
      enabled: false,
      sort: 0,
      name: "",
      nullable: null,
      config: { nodes: ["a", "b"] },
    });
    const headers = Object.freeze({ "X-Custom": "value" });
    const options = Object.freeze({ method, body, headers });
    window.sessionStorage.setItem("token", "session-token");
    await request("/rule", options);
    const sent = fetch.mock.calls[0][1];
    expect(JSON.parse(sent.body)).toEqual(body);
    expect(sent.headers).toMatchObject({
      "Content-Type": "application/json; charset=utf-8",
      "X-Access-Token": "session-token",
      "X-Custom": "value",
    });
    expect(options.body).toBe(body);
    expect(options.headers).toEqual({ "X-Custom": "value" });
  },
);

it("keeps FormData intact and lets the browser supply the multipart boundary", async () => {
  const body = new FormData();
  body.append("file", new File(["plugin"], "plugin.jar"));
  window.sessionStorage.setItem("token", "session-token");
  await request("/plugin-template", { method: "POST", body });
  const sent = fetch.mock.calls[0][1];
  expect(sent.body).toBe(body);
  expect(sent.headers["X-Access-Token"]).toBe("session-token");
  expect(sent.headers).not.toHaveProperty("Content-Type");
});

it("reads the current token for each call instead of retaining an old session", async () => {
  window.sessionStorage.setItem("token", "first");
  await request("/rule");
  window.sessionStorage.setItem("token", "second");
  await request("/rule");
  window.sessionStorage.removeItem("token");
  await request("/rule");
  expect(fetch.mock.calls[0][1].headers["X-Access-Token"]).toBe("first");
  expect(fetch.mock.calls[1][1].headers["X-Access-Token"]).toBe("second");
  expect(fetch.mock.calls[2][1].headers).toBeUndefined();
});

it("preserves custom content types", async () => {
  await request("/rule", {
    method: "POST",
    headers: { "Content-Type": "application/custom+json" },
    body: {},
  });
  expect(fetch.mock.calls[0][1].headers["Content-Type"]).toBe(
    "application/custom+json",
  );
});

it.each([200, 201])("returns JSON for successful status %s", async (status) => {
  fetch.mockResolvedValue(response(status));
  await expect(request("/rule", { method: "DELETE" })).resolves.toEqual(
    payload,
  );
});

it("does not parse JSON from an empty 204 response", async () => {
  const empty = response(204);
  empty.json.mockRejectedValue(new SyntaxError("Unexpected end of JSON input"));
  fetch.mockResolvedValue(empty);
  await expect(request("/rule", { method: "DELETE" })).resolves.toBeNull();
  expect(empty.json).not.toHaveBeenCalled();
});

it.each(["http", "application"])(
  "rejects %s 401 and resets login and permissions",
  async (kind) => {
    const unauthorized =
      kind === "http"
        ? response(401)
        : response(200, { code: 401, message: "Session expired" });
    fetch.mockResolvedValue(unauthorized);
    await expect(request("/rule")).rejects.toMatchObject({ name: 401 });
    expect(store.dispatch.mock.calls).toEqual([
      [{ type: "login/logout" }],
      [{ type: "global/resetPermission" }],
    ]);
    expect(notification.error).toHaveBeenCalledTimes(1);
  },
);

it.each([403, 404, 500, 503])(
  "rejects HTTP %s without logging the user out",
  async (status) => {
    const failed = response(status);
    fetch.mockResolvedValue(failed);
    await expect(request("/rule")).rejects.toMatchObject({
      name: status,
      response: failed,
    });
    expect(failed.json).not.toHaveBeenCalled();
    expect(notification.error).toHaveBeenCalledTimes(1);
    expect(store.dispatch).not.toHaveBeenCalled();
  },
);

it("propagates network failures unchanged to callers", async () => {
  const error = new TypeError("Failed to fetch");
  fetch.mockRejectedValue(error);
  await expect(request("/rule")).rejects.toBe(error);
  expect(store.dispatch).not.toHaveBeenCalled();
});

it("propagates malformed JSON instead of resolving with undefined", async () => {
  const invalid = response();
  const error = new SyntaxError("Invalid JSON");
  invalid.json.mockRejectedValue(error);
  fetch.mockResolvedValue(invalid);
  await expect(request("/rule")).rejects.toBe(error);
});

it("leaves non-authentication business errors available to model callers", async () => {
  const rejected = {
    code: 400,
    message: "A rule with this name already exists",
  };
  fetch.mockResolvedValue(response(200, rejected));
  await expect(request("/rule")).resolves.toEqual(rejected);
  expect(store.dispatch).not.toHaveBeenCalled();
});
