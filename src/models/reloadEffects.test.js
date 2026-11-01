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

import pluginHandle from "./pluginHandle";
import shenyuDict from "./shenyuDict";

jest.mock("../services/api", () => ({
  addPluginHandle: jest.fn(),
  addShenYuDict: jest.fn(),
  batchDeletePluginHandle: jest.fn(),
  batchDeleteShenYuDict: jest.fn(),
  fetchPluginHandleByPluginId: jest.fn(),
  fetchShenYuDictByType: jest.fn(),
  fetchShenYuDicts: jest.fn(),
  findPluginHandle: jest.fn(),
  findShenYuDict: jest.fn(),
  getAllPluginHandles: jest.fn(),
  getPluginDropDownList: jest.fn(),
  updatePluginHandle: jest.fn(),
  updateShenYuDict: jest.fn(),
  updateShenYuDictEnabled: jest.fn(),
}));

const put = (action) => ({ type: "put", action });

describe("reload effects", () => {
  it("reloads plugin handles using the current filters and pagination", () => {
    const fetchValue = { pluginId: "http", currentPage: 2, pageSize: 10 };
    const generator = pluginHandle.effects.reload({ fetchValue }, { put });

    expect(generator.next().value).toEqual(
      put({ type: "fetch", payload: fetchValue }),
    );
    expect(generator.next().done).toBe(true);
    expect(pluginHandle.reducers.reload).toBeUndefined();
  });

  it("reloads dictionary entries using the current filters and pagination", () => {
    const fetchValue = {
      type: 1,
      dictCode: "protocol",
      dictName: "Protocol",
      currentPage: 3,
      pageSize: 20,
    };
    const generator = shenyuDict.effects.reload({ fetchValue }, { put });

    expect(generator.next().value).toEqual(
      put({ type: "fetch", payload: fetchValue }),
    );
    expect(generator.next().done).toBe(true);
    expect(shenyuDict.reducers.reload).toBeUndefined();
  });
});
