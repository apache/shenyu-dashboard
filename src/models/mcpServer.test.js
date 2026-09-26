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
import { mcpSwaggerImport } from "../services/api";
import model from "./mcpServer";

jest.mock("antd", () => ({
  message: {
    success: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("../services/api", () => ({
  mcpSwaggerImport: jest.fn(),
}));

const call = (fn, payload) => ({ type: "call", fn, payload });
const put = (action) => ({ type: "put", action });
const effects = { call, put };

beforeEach(() => {
  jest.clearAllMocks();
});

it("refreshes the visible selector list after a successful Swagger import", () => {
  const payload = {
    swaggerUrl: "https://example.test/openapi.json",
    projectName: "example",
    namespaceId: "namespace-1",
  };
  const fetchValue = {
    pluginId: "plugin-1",
    currentPage: 2,
    pageSize: 20,
    name: "orders",
    namespaceId: "namespace-1",
  };
  const callback = jest.fn();
  const generator = model.effects.swaggerImport(
    { payload, fetchValue, callback },
    effects,
  );

  expect(generator.next().value).toEqual(call(mcpSwaggerImport, payload));

  const response = { code: 200, message: "Imported" };
  expect(generator.next(response).value).toEqual(
    put({
      type: "common/fetchSelector",
      payload: fetchValue,
    }),
  );
  expect(message.success).toHaveBeenCalledWith(response.message);
  expect(callback).not.toHaveBeenCalled();

  expect(generator.next().done).toBe(true);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(message.warn).not.toHaveBeenCalled();
});

it("does not refresh or close the modal after a failed Swagger import", () => {
  const payload = {
    swaggerUrl: "https://example.test/openapi.json",
    projectName: "example",
    namespaceId: "namespace-1",
  };
  const callback = jest.fn();
  const generator = model.effects.swaggerImport(
    { payload, fetchValue: {}, callback },
    effects,
  );

  generator.next();
  const response = { code: 500, message: "Import failed" };
  expect(generator.next(response).done).toBe(true);
  expect(message.warn).toHaveBeenCalledWith(response.message);
  expect(message.success).not.toHaveBeenCalled();
  expect(callback).not.toHaveBeenCalled();
});
