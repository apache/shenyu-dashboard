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
import model from "./resource";
import { getMenuTree } from "../services/api";

jest.mock("../services/api", () => ({ getMenuTree: jest.fn() }));
jest.mock("../components/ui/feedback", () => ({ message: {} }));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

beforeEach(() => window.sessionStorage.clear());
afterEach(() => window.sessionStorage.clear());

it("does not let a previous session overwrite the new session menu tree", async () => {
  let complete;
  getMenuTree.mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  window.sessionStorage.setItem("token", "expired-session");
  const dispatch = jest.fn();
  const pending = runSaga(
    { dispatch },
    model.effects.fetchMenuTree,
    {},
    effects,
  ).done;
  window.sessionStorage.setItem("token", "new-session");
  complete({ code: 200, data: [{ id: "expired-menu" }] });
  await pending;
  expect(dispatch).not.toHaveBeenCalled();
});

it("still saves the current session menu tree", async () => {
  getMenuTree.mockResolvedValue({ code: 200, data: [{ id: "current-menu" }] });
  const dispatch = jest.fn();
  await runSaga({ dispatch }, model.effects.fetchMenuTree, {}, effects).done;
  expect(dispatch).toHaveBeenCalledWith({
    type: "saveMenuTree",
    payload: { menuTree: [{ id: "current-menu" }] },
  });
});

it("clears resource and authorized-menu data between logins", () => {
  const state = {
    resourceList: [{ id: "old" }],
    menuTree: [{ id: "old" }],
    authMenu: [{ path: "/old" }],
    total: 1,
  };
  expect(model.reducers.resetSession(state)).toEqual(model.state);
  expect(state.total).toBe(1);
});
