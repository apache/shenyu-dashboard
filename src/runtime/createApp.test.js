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
import createApp from "./createApp";
import { routerRedux } from "./router";
import createLoading from "../utils/loading";
import globalModel from "../models/global";
import loginModel from "../models/login";
import resourceModel from "../models/resource";
import fetch from "../utils/fetch";
import { setRequestDispatch } from "../utils/request";

jest.mock("../utils/fetch", () => jest.fn());
jest.mock("../components/ui/feedback", () => ({
  message: { destroy: jest.fn(), error: jest.fn(), warn: jest.fn() },
  notification: { error: jest.fn() },
}));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../utils/AuthRoute", () => ({ resetAuthMenuCache: jest.fn() }));
jest.mock("../components/_utils/utils", () => ({
  defaultNamespaceId: "default",
}));

function response(body, status = 200) {
  return {
    status,
    statusText: "Unauthorized",
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  fetch.mockReset();
});
afterEach(() => {
  setRequestDispatch(() => {});
  window.sessionStorage.clear();
});

it("preserves namespaced effects, reducers, subscriptions and navigation", async () => {
  const history = createMemoryHistory({ initialEntries: ["/user/login"] });
  const visited = [];
  const app = createApp({ history });
  app.use(createLoading());
  app.model({
    namespace: "demo",
    state: { value: 0 },
    reducers: { save: (state, { payload }) => ({ ...state, value: payload }) },
    effects: {
      *load({ payload }, { call, put }) {
        const value = yield call(() => Promise.resolve(payload));
        yield put({ type: "save", payload: value });
        yield put(routerRedux.push("/home"));
        return value;
      },
    },
    subscriptions: {
      setup({ history: modelHistory }) {
        return modelHistory.listen(({ location }) =>
          visited.push(location.pathname),
        );
      },
    },
  });
  app.start();
  const store = app._store; // eslint-disable-line no-underscore-dangle
  await expect(store.dispatch({ type: "demo/load", payload: 7 })).resolves.toBe(
    7,
  );
  expect(store.getState().demo).toEqual({ value: 7 });
  expect(store.getState().loading.effects["demo/load"]).toBe(false);
  expect(history.location.pathname).toBe("/home");
  expect(visited).toEqual(["/home"]);
  app.unmodel("demo");
  history.push("/other");
  expect(visited).toEqual(["/home"]);
});

it.each(["http", "application", "network"])(
  "keeps navigation effects alive after a real %s failure and re-login in the same app",
  async (kind) => {
    const report = jest.spyOn(console, "error").mockImplementation(() => {});
    const history = createMemoryHistory({ initialEntries: ["/home"] });
    const app = createApp({ history });
    app.use(createLoading());
    [globalModel, loginModel, resourceModel].forEach((source) =>
      app.model({
        ...source,
        effects: { ...source.effects },
        reducers: { ...source.reducers },
      }),
    );
    app.start();
    const store = app._store; // eslint-disable-line no-underscore-dangle
    setRequestDispatch(store.dispatch);
    window.sessionStorage.setItem("token", "expired-session");
    const failure = new TypeError("Network unavailable");
    if (kind === "network") {
      fetch.mockRejectedValueOnce(failure);
    } else {
      fetch.mockResolvedValueOnce(
        kind === "http"
          ? response(null, 401)
          : response({ code: 401, message: "Session expired" }),
      );
    }
    let rejection;
    const first = store.dispatch({ type: "global/fetchPermission" });
    first.catch((error) => {
      rejection = error;
    });
    const namespaces = [{ namespaceId: "default", name: "Default" }];
    const menu = [{ url: "/system" }];
    fetch.mockImplementation((url) => {
      if (url.endsWith("/platform/login"))
        return Promise.resolve(
          response({
            code: 200,
            data: { token: "new-session", userName: "current", id: "current" },
          }),
        );
      if (url.includes("getUserPermissionByNamespace"))
        return Promise.resolve(
          response({ code: 200, data: { menu, currentAuth: [] } }),
        );
      return Promise.resolve(response({ code: 200, data: namespaces }));
    });
    try {
      // Let the real request rejection propagate through the model's effect wrapper.
      await waitFor(() =>
        expect(store.getState().loading.effects["global/fetchPermission"]).toBe(
          false,
        ),
      );
      await store.dispatch({ type: "login/logout" });
      await store.dispatch({
        type: "login/login",
        payload: {
          envelope: {
            version: 1,
            keyId: "key",
            wrappedKey: "wrapped",
            iv: "iv",
            ciphertext: "ciphertext",
          },
        },
      });
      await waitFor(() =>
        expect(store.getState().global.namespaces).toEqual(namespaces),
      );
      await waitFor(() =>
        expect(store.getState().global.permissions).toEqual({
          menu,
          button: [],
        }),
      );
      expect(window.sessionStorage.getItem("token")).toBe("new-session");
      expect(history.location.pathname).toBe("/home");
      // A caller can still handle the original failure; it is not converted to success.
      expect(rejection).toEqual(
        kind === "network" ? failure : expect.objectContaining({ name: 401 }),
      );
      if (kind === "network") {
        expect(report.mock.calls).toEqual([
          ["Dashboard effect failed", "global/fetchPermission"],
        ]);
      } else {
        expect(report).not.toHaveBeenCalled();
      }
      expect(store.getState().loading.global).toBe(false);
    } finally {
      ["global", "login", "resource"].forEach((namespace) =>
        app.unmodel(namespace),
      );
    }
  },
);

it("reports fire-and-forget failures and keeps sibling effects running", async () => {
  const report = jest.spyOn(console, "error").mockImplementation(() => {});
  const app = createApp({ history: createMemoryHistory() });
  const failure = new TypeError("Network unavailable");
  app.model({
    namespace: "demo",
    state: { recovered: false },
    reducers: { recover: () => ({ recovered: true }) },
    effects: {
      *fail(_, { call }) {
        yield call(() => Promise.reject(failure));
      },
      *retry(_, { put }) {
        yield put({ type: "recover" });
      },
    },
  });
  app.start();
  const store = app._store; // eslint-disable-line no-underscore-dangle
  try {
    // UI event handlers normally dispatch without awaiting or adding a catch.
    store.dispatch({ type: "demo/fail" });
    await waitFor(() =>
      expect(report).toHaveBeenCalledWith(
        "Dashboard effect failed",
        "demo/fail",
      ),
    );
    await store.dispatch({ type: "demo/retry" });
    expect(store.getState().demo.recovered).toBe(true);
  } finally {
    app.unmodel("demo");
  }
});
