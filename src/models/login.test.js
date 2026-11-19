import { runSaga } from "redux-saga";
import * as effects from "redux-saga/effects";
import "regenerator-runtime/runtime";
import { createMemoryHistory } from "history";
import { waitFor } from "@testing-library/react";
import { message } from "../components/ui/feedback";
import createApp from "../runtime/createApp";
import model from "./login";
import globalModel from "./global";
import resourceModel from "./resource";
import { resetAuthMenuCache } from "../utils/AuthRoute";
import {
  queryLogin,
  getNamespaceList,
  getUserPermissionByNamespace,
  getPluginsByNamespace,
  getMenuTree,
} from "../services/api";

jest.mock("../services/api", () => ({
  queryLogin: jest.fn(),
  getNamespaceList: jest.fn(),
  getUserPermissionByNamespace: jest.fn(),
  getPluginsByNamespace: jest.fn(),
  getMenuTree: jest.fn(),
}));
jest.mock("../components/ui/feedback", () => ({
  message: { destroy: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("../components/_utils/utils", () => ({
  defaultNamespaceId: "default",
}));

jest.mock("../utils/AuthRoute", () => ({ resetAuthMenuCache: jest.fn() }));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

beforeEach(() => window.sessionStorage.clear());
afterEach(() => window.sessionStorage.clear());

it("does not dereference an absent login response", async () => {
  queryLogin.mockResolvedValueOnce(undefined);
  const callback = jest.fn();

  await runSaga(
    { dispatch: jest.fn(), getState: () => ({ global: { namespaces: [] } }) },
    model.effects.login,
    { payload: { callback } },
    effects,
  ).done;

  expect(callback).toHaveBeenCalledWith(undefined);
  expect(message.error).toHaveBeenCalledWith("Login failed");
});

it("handles rejected login requests without dereferencing a response", async () => {
  const error = new Error("request failed");
  queryLogin.mockRejectedValueOnce(error);
  const callback = jest.fn();

  await runSaga(
    { dispatch: jest.fn(), getState: () => ({ global: { namespaces: [] } }) },
    model.effects.login,
    { payload: { callback } },
    effects,
  ).done;

  expect(callback).toHaveBeenCalledWith(undefined);
  expect(message.error).toHaveBeenCalledWith("request failed");
});

it("rejects a business-error data object instead of treating it as a session", async () => {
  queryLogin.mockResolvedValueOnce({
    code: 500,
    message: "Denied",
    data: { token: "invalid" },
  });
  const dispatch = jest.fn();
  await runSaga(
    { dispatch, getState: () => ({ global: { namespaces: [] } }) },
    model.effects.login,
    { payload: { callback: jest.fn() } },
    effects,
  ).done;
  expect(window.sessionStorage.getItem("token")).toBeNull();
  expect(dispatch).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledWith("Denied");
});

it("discards a delayed login completion after another session has been established", async () => {
  let complete;
  queryLogin.mockReturnValueOnce(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  const dispatch = jest.fn();
  const callback = jest.fn();
  const pending = runSaga(
    { dispatch, getState: () => ({ global: { namespaces: [] } }) },
    model.effects.login,
    { payload: { callback } },
    effects,
  ).done;
  window.sessionStorage.setItem("token", "new-session");
  complete({
    code: 200,
    data: { token: "obsolete-login", userName: "old", id: "old" },
  });
  await pending;
  expect(window.sessionStorage.getItem("token")).toBe("new-session");
  expect(dispatch).not.toHaveBeenCalled();
  expect(callback).not.toHaveBeenCalled();
});

it("rebuilds navigation after expiry and re-login in the same application while old permission loading is in flight", async () => {
  const history = createMemoryHistory({ initialEntries: ["/home"] });
  const app = createApp({ history });
  [model, globalModel, resourceModel].forEach((source) =>
    app.model({
      ...source,
      effects: { ...source.effects },
      reducers: { ...source.reducers },
    }),
  );
  app.start();
  const store = app._store; // eslint-disable-line no-underscore-dangle
  let completeOldPermission;
  getUserPermissionByNamespace.mockReturnValueOnce(
    new Promise((resolve) => {
      completeOldPermission = resolve;
    }),
  );
  const menu = [{ url: "/system" }];
  getUserPermissionByNamespace.mockResolvedValue({
    code: 200,
    data: { menu, currentAuth: [] },
  });
  getNamespaceList.mockResolvedValue({
    code: 200,
    data: [{ namespaceId: "default", name: "Default" }],
  });
  getPluginsByNamespace.mockResolvedValue({
    code: 200,
    data: { dataList: [{ id: "divide" }] },
  });
  getMenuTree.mockResolvedValue({ code: 200, data: menu });
  queryLogin.mockResolvedValueOnce({
    code: 200,
    data: { token: "new-session", userName: "current", id: "current" },
  });
  try {
    window.sessionStorage.setItem("token", "expired-session");
    store.dispatch({
      type: "global/saveNamespaces",
      payload: [{ namespaceId: "default", name: "Old default" }],
    });
    store.dispatch({
      type: "global/savePlugins",
      payload: { dataList: [{ id: "old" }] },
    });
    store.dispatch({
      type: "global/savePermissions",
      payload: { permissions: { menu: [{ url: "/old" }], button: [] } },
    });
    store.dispatch({
      type: "resource/saveMenuTree",
      payload: { menuTree: [{ url: "/old" }] },
    });
    store.dispatch({
      type: "resource/saveAuthMenu",
      payload: { authMenu: [{ path: "/old" }] },
    });
    store.dispatch({ type: "global/changeLanguage", payload: "zh-CN" });
    store.dispatch({ type: "global/changeLayoutCollapsed", payload: true });
    const oldPermission = store.dispatch({
      type: "global/fetchPermission",
      payload: { callback: jest.fn() },
    });
    await store.dispatch({ type: "login/logout" });
    expect(store.getState().global).toMatchObject({
      namespaces: [],
      plugins: [],
      permissions: { menu: [], button: [] },
      collapsed: true,
      language: "zh-CN",
    });
    expect(store.getState().resource).toEqual(resourceModel.state);
    expect(resetAuthMenuCache).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem("token")).toBeNull();
    expect(history.location.pathname).toBe("/user/login");
    await store.dispatch({ type: "login/login", payload: {} });
    await waitFor(() =>
      expect(getUserPermissionByNamespace).toHaveBeenCalledWith({
        token: "new-session",
        namespaceId: "default",
      }),
    );
    await waitFor(() =>
      expect(store.getState().global.namespaces).toEqual([
        { namespaceId: "default", name: "Default" },
      ]),
    );
    expect(getNamespaceList).toHaveBeenCalledTimes(1);
    // BasicLayout owns these normal mount-time requests; no reload or store replacement.
    await store.dispatch({ type: "global/fetchPlugins" });
    await store.dispatch({ type: "resource/fetchMenuTree" });
    completeOldPermission({
      code: 200,
      data: { menu: [{ url: "/obsolete" }], currentAuth: [] },
    });
    await oldPermission;
    await waitFor(() =>
      expect(store.getState().global.permissions).toEqual({ menu, button: [] }),
    );
    expect(store.getState().global.plugins).toEqual([{ id: "divide" }]);
    expect(store.getState().resource.menuTree).toEqual(menu);
    expect(store.getState().global.currentNamespaceId).toBe("default");
    expect(window.sessionStorage.getItem("token")).toBe("new-session");
    expect(resetAuthMenuCache).toHaveBeenCalledTimes(2);
    expect(history.location.pathname).toBe("/home");
  } finally {
    ["login", "global", "resource"].forEach((namespace) =>
      app.unmodel(namespace),
    );
  }
});
