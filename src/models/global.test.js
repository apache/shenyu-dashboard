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
import { message } from "antd";
import model from "./global";
import {
  getPluginsByNamespace,
  getUserPermissionByNamespace,
} from "../services/api";

jest.mock("../services/api", () => ({
  getPluginsByNamespace: jest.fn(),
  getUserPermissionByNamespace: jest.fn(),
}));
jest.mock("antd", () => ({ message: { warn: jest.fn(), success: jest.fn() } }));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
// The unrelated TypeScript utility module also exports random color helpers.
jest.mock("../components/_utils/utils", () => ({
  defaultNamespaceId: "default-namespace",
}));

let state;
let actions;
const oldPermissions = {
  menu: [{ url: "/old" }],
  button: [{ perms: "old:edit" }],
};

function dispatch(action) {
  actions.push(action);
  const reducer = model.reducers[action.type];
  if (reducer) state = reducer(state, action);
}

function runEffect(name, payload = {}) {
  return runSaga(
    { dispatch, getState: () => ({ global: state }), logger: jest.fn() },
    model.effects[name],
    { payload },
    effects,
  ).done;
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.sessionStorage.setItem("token", "session-token");
  state = {
    ...model.state,
    currentNamespaceId: "namespace-A",
    plugins: [{ id: "old-plugin" }],
    permissions: oldPermissions,
  };
  actions = [];
  getPluginsByNamespace.mockReset();
  getUserPermissionByNamespace.mockReset();
});

afterEach(() => window.sessionStorage.clear());

it("switches namespace without retaining the old namespace's plugins or permissions", () => {
  const previous = Object.freeze({ ...state, collapsed: true });
  const next = model.reducers.saveCurrentNamespaceId(previous, {
    payload: "namespace-B",
  });
  expect(next.currentNamespaceId).toBe("namespace-B");
  expect(window.sessionStorage.getItem("currentNamespaceId")).toBe(
    "namespace-B",
  );
  expect(next.plugins).toEqual([]);
  expect(next.permissions).toEqual({ menu: [], button: [] });
  expect(next.collapsed).toBe(true);
  expect(previous.permissions).toBe(oldPermissions);
  expect(previous.currentNamespaceId).toBe("namespace-A");
});

it("does not clear loaded data when selecting the same namespace", () => {
  const next = model.reducers.saveCurrentNamespaceId(state, {
    payload: "namespace-A",
  });
  expect(next.plugins).toEqual(state.plugins);
  expect(next.permissions).toEqual(state.permissions);
});

it("loads plugins using the selected namespace and replaces old data", async () => {
  dispatch({ type: "saveCurrentNamespaceId", payload: "namespace-B" });
  const plugins = [{ id: "plugin-B" }];
  getPluginsByNamespace.mockResolvedValue({
    code: 200,
    data: { dataList: plugins },
  });
  const callback = jest.fn();
  await runEffect("fetchPlugins", { callback });
  expect(getPluginsByNamespace).toHaveBeenCalledWith({
    namespaceId: "namespace-B",
    currentPage: 1,
    pageSize: 50,
  });
  expect(state.plugins).toEqual(plugins);
  expect(callback).toHaveBeenCalledWith(plugins);
});

it.each(["fetchPermission", "refreshPermission"])(
  "%s replaces permissions using the selected namespace and session",
  async (effect) => {
    const permissions = {
      menu: [{ url: "/new" }],
      currentAuth: [{ perms: "new:read" }],
    };
    getUserPermissionByNamespace.mockResolvedValue({
      code: 200,
      data: permissions,
    });
    const callback = jest.fn();
    await runEffect(effect, { callback });
    expect(getUserPermissionByNamespace).toHaveBeenCalledWith({
      token: "session-token",
      namespaceId: "namespace-A",
    });
    expect(state.permissions).toEqual({
      menu: permissions.menu,
      button: permissions.currentAuth,
    });
    expect(callback).toHaveBeenCalledWith(state.permissions);
  },
);

it.each(["fetchPermission", "refreshPermission"])(
  "%s denies access without a session",
  async (effect) => {
    window.sessionStorage.removeItem("token");
    const callback = jest.fn();
    await runEffect(effect, { callback });
    expect(getUserPermissionByNamespace).not.toHaveBeenCalled();
    expect(state.permissions).toEqual({ menu: [], button: [] });
    expect(callback).toHaveBeenCalledWith(state.permissions);
  },
);

it.each(["fetchPermission", "refreshPermission"])(
  "%s clears permissions after a rejected business response",
  async (effect) => {
    getUserPermissionByNamespace.mockResolvedValue({
      code: 403,
      message: "Denied",
    });
    await runEffect(effect, { callback: jest.fn() });
    expect(state.permissions).toEqual({ menu: [], button: [] });
    if (effect === "fetchPermission") {
      expect(message.warn).toHaveBeenCalledWith("SHENYU.PERMISSION.EMPTY");
      expect(actions).toContainEqual(
        expect.objectContaining({ type: "@@router/CALL_HISTORY_METHOD" }),
      );
    }
  },
);

it("propagates a failed plugin request without calling its success callback", async () => {
  const failure = new Error("Network unavailable");
  getPluginsByNamespace.mockRejectedValue(failure);
  const callback = jest.fn();
  await expect(runEffect("fetchPlugins", { callback })).rejects.toBe(failure);
  expect(callback).not.toHaveBeenCalled();
  expect(actions).toEqual([]);
});

it.each(["fetchPlugins", "fetchPermission", "refreshPermission"])(
  "%s ignores an old response arriving after a namespace switch",
  async (effect) => {
    let resolveRequest;
    const pending = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    const api =
      effect === "fetchPlugins"
        ? getPluginsByNamespace
        : getUserPermissionByNamespace;
    api.mockReturnValue(pending);
    const callback = jest.fn();
    const task = runEffect(effect, { callback });
    expect(api).toHaveBeenCalledTimes(1);
    dispatch({ type: "saveCurrentNamespaceId", payload: "namespace-B" });
    // A newer namespace response has already populated state.
    dispatch({
      type: "savePlugins",
      payload: { dataList: [{ id: "plugin-B" }] },
    });
    dispatch({
      type: "savePermissions",
      payload: { permissions: { menu: [{ url: "/B" }], button: [] } },
    });
    resolveRequest({
      code: 200,
      data: {
        dataList: [{ id: "plugin-A" }],
        menu: [{ url: "/A" }],
        currentAuth: [{ perms: "A:edit" }],
      },
    });
    await task;
    expect(state.currentNamespaceId).toBe("namespace-B");
    expect(state.plugins).toEqual([{ id: "plugin-B" }]);
    expect(state.permissions).toEqual({ menu: [{ url: "/B" }], button: [] });
    expect(callback).not.toHaveBeenCalled();
  },
);

it("resets permissions on logout without changing unrelated layout state", async () => {
  const collapsed = state.collapsed;
  await runEffect("resetPermission");
  expect(state.permissions).toEqual({ menu: [], button: [] });
  expect(state.collapsed).toBe(collapsed);
});
