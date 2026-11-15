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
import model from "./namespace";
import { deleteNamespace, getAllNamespaces } from "../services/api";

jest.mock("../services/api", () => ({
  deleteNamespace: jest.fn(),
  getAllNamespaces: jest.fn(),
}));
jest.mock("../components/ui/feedback", () => ({
  message: { success: jest.fn(), warn: jest.fn() },
}));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

it("preserves the namespace UUID filter when reloading after a mutation", () => {
  const fetchValue = {
    name: "demo",
    namespaceId: "ns-filter",
    currentPage: 2,
    pageSize: 20,
    enabled: undefined,
  };
  const effect = model.effects.reload(
    { fetchValue },
    { put: (action) => action },
  );
  expect(effect.next().value).toEqual({ type: "fetch", payload: fetchValue });
});

it("reads the active namespace after an asynchronous deletion completes", async () => {
  let finish;
  let active = "ns-before";
  deleteNamespace.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const callback = jest.fn();
  const dispatch = jest.fn();
  const task = runSaga(
    { dispatch, getState: () => ({ global: { currentNamespaceId: active } }) },
    model.effects.delete,
    { payload: { list: ["row-a"] }, fetchValue: {}, callback },
    effects,
  );
  active = "ns-after";
  finish({ code: 200 });
  await task.done;
  expect(callback).toHaveBeenCalledWith({ currentNamespaceId: "ns-after" });
  expect(dispatch).toHaveBeenCalledWith({ type: "reload", fetchValue: {} });
});

it("keeps the newest response when identical list queries complete out of order", async () => {
  const replies = [];
  getAllNamespaces.mockImplementation(
    () =>
      new Promise((resolve) => {
        replies.push(resolve);
      }),
  );
  let state = { ...model.state };
  const environment = {
    getState: () => ({ namespace: state }),
    dispatch: (action) => {
      if (model.reducers[action.type])
        state = model.reducers[action.type](state, action);
    },
  };
  const query = { name: "demo", currentPage: 1, pageSize: 12 };
  const first = runSaga(
    environment,
    model.effects.fetch,
    { payload: query },
    effects,
  );
  const second = runSaga(
    environment,
    model.effects.fetch,
    { payload: query },
    effects,
  );
  const response = (name) => ({
    code: 200,
    data: { dataList: [{ id: "row", name }], page: { totalCount: 1 } },
  });
  replies[1](response("New result"));
  await second.done;
  replies[0](response("Old result"));
  await first.done;
  expect(state.namespaceList.map((row) => row.name)).toEqual(["New result"]);
});
