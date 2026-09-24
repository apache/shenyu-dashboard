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

import common from "./common";
import { asyncConfigExportByNamespace } from "../services/api";

jest.mock("../services/api", () => ({
  getAllSelectors: jest.fn(),
  getAllRules: jest.fn(),
  addSelector: jest.fn(),
  findSelector: jest.fn(),
  deleteSelector: jest.fn(),
  updateSelector: jest.fn(),
  enableSelector: jest.fn(),
  addRule: jest.fn(),
  deleteRule: jest.fn(),
  findRule: jest.fn(),
  updateRule: jest.fn(),
  enableRule: jest.fn(),
  asyncConfigExport: jest.fn(),
  asyncConfigExportByNamespace: jest.fn(),
  asyncConfigImport: jest.fn(),
}));

describe("common exportByNamespace effect", () => {
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
});
