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

import { message } from "antd";
import fetch from "dva/fetch";

jest.mock("antd", () => ({
  message: {
    error: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("dva/fetch", () => jest.fn());
jest.mock("../utils/request", () => jest.fn());

document.body.innerHTML = '<div id="httpPath"></div>';

const common = require("./common").default;
const { asyncConfigExportByNamespace } = require("../services/api");

const createErrorResponse = ({ ok, status, statusText, body }) => ({
  ok,
  status,
  statusText,
  headers: {
    get: jest.fn(() => null),
  },
  json: jest.fn().mockResolvedValue(body),
});

describe("common export effects", () => {
  it("invokes its callback after the export completes", () => {
    const callback = jest.fn();
    const params = {
      payload: { namespace: "default" },
      callback,
    };
    const call = jest.fn((fn, args) => ({ fn, args }));
    const iterator = common.effects.exportByNamespace(params, { call });

    expect(iterator.next().value).toEqual({
      fn: asyncConfigExportByNamespace,
      args: params,
    });
    expect(callback).not.toHaveBeenCalled();

    expect(iterator.next().done).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "an HTTP error",
      createErrorResponse({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        body: { code: 401, message: "Authentication failed", data: null },
      }),
      "Authentication failed",
    ],
    [
      "an HTTP 200 Admin error",
      createErrorResponse({
        ok: true,
        status: 200,
        statusText: "OK",
        body: { code: 601, message: "Export failed", data: null },
      }),
      "Export failed",
    ],
  ])("keeps the modal open for %s", async (_, response, expectedMessage) => {
    const callback = jest.fn();
    const params = {
      payload: { namespace: "default" },
      callback,
    };
    const call = jest.fn((fn, args) => fn(args));
    const iterator = common.effects.exportByNamespace(params, { call });
    fetch.mockResolvedValue(response);

    const exportRequest = iterator.next().value;
    let exportError;
    try {
      await exportRequest;
    } catch (error) {
      exportError = error;
    }

    expect(exportError).toBeInstanceOf(Error);
    const result = iterator.throw(exportError);

    expect(result.done).toBe(true);
    expect(callback).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledWith(
      expect.stringContaining(expectedMessage),
    );
  });

  it("surfaces failures when exporting all configuration", () => {
    const call = jest.fn((fn, args) => ({ fn, args }));
    const iterator = common.effects.exportAll({}, { call });

    iterator.next();
    const result = iterator.throw(new Error("Export failed"));

    expect(result.done).toBe(true);
    expect(message.error).toHaveBeenCalledWith("Export failed");
  });
});
