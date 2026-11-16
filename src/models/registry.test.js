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

import { runSaga } from "redux-saga";
import * as effects from "redux-saga/effects";
import model from "./registry";
import { getRegistryList } from "../services/api";

jest.mock("../services/api", () => ({ getRegistryList: jest.fn() }));
jest.mock("../components/ui/feedback", () => ({
  message: { destroy: jest.fn(), error: jest.fn() },
}));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

it("keeps the newest registry response when list requests finish out of order", async () => {
  const replies = [];
  getRegistryList.mockImplementation(
    () =>
      new Promise((resolve) => {
        replies.push(resolve);
      }),
  );
  let state = { ...model.state };
  const environment = {
    getState: () => ({ registry: state }),
    dispatch: (action) => {
      if (model.reducers[action.type])
        state = model.reducers[action.type](state, action);
    },
  };
  const payload = { registryId: "demo", currentPage: 1, pageSize: 12 };
  const first = runSaga(environment, model.effects.fetch, { payload }, effects);
  const second = runSaga(
    environment,
    model.effects.fetch,
    { payload },
    effects,
  );
  const response = (address) => ({
    code: 200,
    data: { dataList: [{ id: "row", address }], page: { totalCount: 1 } },
  });
  replies[1](response("new:2181"));
  await second.done;
  replies[0](response("old:2181"));
  await first.done;
  expect(state.registryList.map((row) => row.address)).toEqual(["new:2181"]);
});
