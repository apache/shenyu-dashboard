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
import store from "../index";
import download from "./download";

jest.mock("dva/fetch", () => jest.fn());
jest.mock("../index", () => ({ dispatch: jest.fn() }));

const createHeaders = (headers = {}) => ({
  get: jest.fn((name) => headers[name.toLowerCase()] || null),
});

const createResponse = ({
  ok = true,
  status = 200,
  statusText = "OK",
  headers = {},
  json,
  blob,
}) => ({
  ok,
  status,
  statusText,
  headers: createHeaders(headers),
  json: jest.fn().mockImplementation(() => Promise.resolve(json)),
  blob: jest.fn().mockImplementation(() => Promise.resolve(blob)),
});

describe("download", () => {
  let clickSpy;

  beforeEach(() => {
    window.sessionStorage.clear();
    store.dispatch.mockClear();
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:config"),
    });
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  it("downloads a successful attachment", async () => {
    const blob = new Blob(["config"], { type: "application/zip" });
    const response = createResponse({
      headers: {
        "content-disposition": 'attachment;filename="config.zip"',
      },
      blob,
    });
    fetch.mockResolvedValue(response);

    await expect(download("/configs/export", { method: "GET" })).resolves.toBe(
      undefined,
    );

    expect(response.blob).toHaveBeenCalledTimes(1);
    expect(response.json).not.toHaveBeenCalled();
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects an HTTP error without downloading it", async () => {
    const response = createResponse({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: { code: 401, message: "Authentication failed", data: null },
    });
    fetch.mockResolvedValue(response);

    await expect(
      download("/configs/export", { method: "GET" }),
    ).rejects.toThrow("Authentication failed");

    expect(response.blob).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("dispatches login/logout and resetPermission on an HTTP 401", async () => {
    const response = createResponse({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: { code: 401, message: "Authentication failed", data: null },
    });
    fetch.mockResolvedValue(response);

    await expect(
      download("/configs/export", { method: "GET" }),
    ).rejects.toThrow("Authentication failed");

    expect(store.dispatch).toHaveBeenCalledWith({ type: "login/logout" });
    expect(store.dispatch).toHaveBeenCalledWith({
      type: "global/resetPermission",
    });
  });

  it("dispatches login/logout and resetPermission on an HTTP 200 Admin error with code 401", async () => {
    const response = createResponse({
      json: { code: 401, message: "Authentication failed", data: null },
    });
    fetch.mockResolvedValue(response);

    await expect(
      download("/configs/export", { method: "GET" }),
    ).rejects.toThrow("Authentication failed");

    expect(store.dispatch).toHaveBeenCalledWith({ type: "login/logout" });
    expect(store.dispatch).toHaveBeenCalledWith({
      type: "global/resetPermission",
    });
  });

  it.each([601, 500])(
    "rejects an HTTP 200 Admin error with code %s",
    async (code) => {
      const response = createResponse({
        json: { code, message: "Export failed", data: null },
      });
      fetch.mockResolvedValue(response);

      await expect(
        download("/configs/export", { method: "GET" }),
      ).rejects.toThrow("Export failed");

      expect(response.blob).not.toHaveBeenCalled();
      expect(clickSpy).not.toHaveBeenCalled();
      expect(store.dispatch).not.toHaveBeenCalled();
    },
  );
});
