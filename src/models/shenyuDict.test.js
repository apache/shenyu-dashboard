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

import "regenerator-runtime/runtime";
import { createMemoryHistory } from "history";
import { waitFor } from "@testing-library/react";
import createApp from "../runtime/createApp";
import model from "./shenyuDict";
import * as api from "../services/api";

jest.mock("../services/api", () => ({
  addShenYuDict: jest.fn(),
  updateShenYuDict: jest.fn(),
  batchDeleteShenYuDict: jest.fn(),
  updateShenYuDictEnabled: jest.fn(),
  fetchShenYuDicts: jest.fn(),
}));
jest.mock("../components/ui/feedback", () => ({
  message: { success: jest.fn(), warn: jest.fn() },
}));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
it.each([
  ["add", "addShenYuDict"],
  ["update", "updateShenYuDict"],
  ["delete", "batchDeleteShenYuDict"],
  ["updateEn", "updateShenYuDictEnabled"],
])(
  "refreshes %s through a real effect while preserving the model and query",
  async (effect, service) => {
    const app = createApp({ history: createMemoryHistory() });
    app.model({
      ...model,
      effects: { ...model.effects },
      reducers: { ...model.reducers },
    });
    app.start();
    const store = app._store; // eslint-disable-line no-underscore-dangle
    const query = {
      type: "custom",
      dictCode: "zero",
      dictName: "Zero",
      currentPage: 1,
      pageSize: 20,
    };
    api[service].mockResolvedValue({ code: 200 });
    api.fetchShenYuDicts.mockReset().mockResolvedValue({
      code: 200,
      data: {
        dataList: [{ id: "new", dictValue: "0" }],
        page: { totalCount: 1 },
      },
    });
    try {
      const callback = jest.fn();
      await store.dispatch({
        type: `shenyuDict/${effect}`,
        payload: { list: ["old"], enabled: false },
        fetchValue: query,
        callback,
      });
      await waitFor(() =>
        expect(api.fetchShenYuDicts).toHaveBeenCalledTimes(1),
      );
      expect(api.fetchShenYuDicts).toHaveBeenCalledWith(query);
      await waitFor(() =>
        expect(store.getState().shenyuDict.shenyuDictList).toEqual([
          expect.objectContaining({ id: "new", dictValue: "0" }),
        ]),
      );
      expect(store.getState().shenyuDict.shenyuDictMap).toEqual({});
      expect(callback).toHaveBeenCalledTimes(1);
    } finally {
      app.unmodel("shenyuDict");
    }
  },
);
