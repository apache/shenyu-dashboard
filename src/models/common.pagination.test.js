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

import { runSaga, effects } from "dva/saga";
import { getAllSelectors } from "../services/api";
import model from "./common";

jest.mock("../services/api", () => ({
  getAllSelectors: jest.fn(),
}));
jest.mock("antd", () => ({
  message: {
    error: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock("../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("keeps the tool pager aligned with the selector refresh", async () => {
  getAllSelectors.mockResolvedValue({
    code: 200,
    data: {
      page: { totalCount: 1 },
      dataList: [{ id: "selector-1", name: "orders" }],
    },
  });
  const actions = [];

  await runSaga(
    { dispatch: (action) => actions.push(action), logger: jest.fn() },
    model.effects.fetchSelector,
    {
      payload: {
        pluginId: "plugin-1",
        currentPage: 3,
        pageSize: 20,
        name: "orders",
        namespaceId: "namespace-1",
        rulePageSize: 50,
      },
    },
    effects,
  ).done;

  expect(getAllSelectors).toHaveBeenCalledWith({
    pluginId: "plugin-1",
    currentPage: 3,
    pageSize: 20,
    name: "orders",
    namespaceId: "namespace-1",
  });
  expect(actions).toContainEqual({
    type: "fetchRule",
    payload: {
      currentPage: 1,
      pageSize: 50,
      selectorId: "selector-1",
      namespaceId: "namespace-1",
    },
  });
});
