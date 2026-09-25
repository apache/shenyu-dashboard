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
import download from "./download";

jest.mock("dva/fetch", () => jest.fn());
jest.mock("antd", () => ({ notification: { error: jest.fn() } }));
jest.mock("../index", () => ({ dispatch: jest.fn() }));

function response(overrides = {}) {
  return {
    ok: true,
    status: 200,
    url: "/configs/export",
    headers: { get: jest.fn().mockReturnValue(null) },
    blob: jest.fn().mockResolvedValue(new Blob(["export"])),
    ...overrides,
  };
}

beforeEach(() => {
  fetch.mockReset();
  window.sessionStorage.clear();
  notification.error.mockReset();
  store.dispatch.mockReset();
  jest.spyOn(document, "createElement").mockReturnValue({
    click: jest.fn(),
  });
  jest.spyOn(document.body, "appendChild").mockImplementation(() => {});
  jest.spyOn(document.body, "removeChild").mockImplementation(() => {});
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn().mockReturnValue("blob:export"),
  });
});

afterEach(() => jest.restoreAllMocks());

it("does not save a failed download response", async () => {
  const failed = response({
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    json: jest.fn().mockResolvedValue({ message: "Export failed" }),
  });
  fetch.mockResolvedValue(failed);

  await expect(download("/configs/export")).rejects.toThrow();
  expect(failed.blob).not.toHaveBeenCalled();
  expect(document.createElement).not.toHaveBeenCalled();
  expect(failed.json).toHaveBeenCalled();
  expect(notification.error).toHaveBeenCalledWith({
    message: "请求错误 500: /configs/export",
    description: "Export failed",
  });
});

it("resets the session when the download requires authentication", async () => {
  const unauthorized = response({
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    json: jest.fn().mockResolvedValue({ message: "Session expired" }),
  });
  fetch.mockResolvedValue(unauthorized);

  await expect(download("/configs/export")).rejects.toThrow(
    "下载文件失败：401: Session expired",
  );
  expect(store.dispatch.mock.calls).toEqual([
    [{ type: "login/logout" }],
    [{ type: "global/resetPermission" }],
  ]);
  expect(document.createElement).not.toHaveBeenCalled();
});

it("saves a successful download response", async () => {
  const anchor = document.createElement();
  fetch.mockResolvedValue(response());

  await download("/configs/export");

  expect(anchor.click).toHaveBeenCalled();
  expect(URL.createObjectURL).toHaveBeenCalled();
});
