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

import renderApp from "./runtime/render";
import { getRouterData } from "./common/router";
import { setRequestDispatch } from "./utils/request";

jest.mock("./polyfill", () => ({}));
jest.mock("./runtime/createApp", () => jest.fn(() => mockApp));
jest.mock("./runtime/render", () => jest.fn());
jest.mock("history", () => ({ createHashHistory: jest.fn(() => ({})) }));
jest.mock("./utils/loading", () => jest.fn(() => ({})));
jest.mock("./utils/IntlUtils", () => ({ initIntl: jest.fn() }));
jest.mock("./utils/emit", () => ({ emit: { on: jest.fn() } }));
jest.mock("./utils/request", () => ({ setRequestDispatch: jest.fn() }));
jest.mock("./models/global", () => ({
  __esModule: true,
  default: { namespace: "global" },
}));
jest.mock("./common/router", () => ({ getRouterData: jest.fn(() => ({})) }));
jest.mock("./router", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockApp = {
  use: jest.fn(),
  model: jest.fn(),
  start: jest.fn(),
  _store: { dispatch: jest.fn() },
};

it("registers models and request dispatch before startup and renders with the live store", () => {
  const container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
  // eslint-disable-next-line global-require
  require("./index");
  expect(getRouterData.mock.invocationCallOrder[0]).toBeLessThan(
    mockApp.start.mock.invocationCallOrder[0],
  );
  expect(setRequestDispatch.mock.invocationCallOrder[0]).toBeLessThan(
    mockApp.start.mock.invocationCallOrder[0],
  );
  expect(mockApp.start.mock.invocationCallOrder[0]).toBeLessThan(
    renderApp.mock.invocationCallOrder[0],
  );
  expect(mockApp.model).toHaveBeenCalledWith({ namespace: "global" });
  expect(renderApp.mock.calls[0][1]).toBe(container);
  const store = mockApp._store; // eslint-disable-line no-underscore-dangle
  expect(renderApp.mock.calls[0][0].props.store).toBe(store);
  expect(renderApp.mock.calls[0][0].props.children.type).toEqual(
    expect.any(Function),
  );
  const send = setRequestDispatch.mock.calls[0][0];
  send({ type: "login/logout" });
  expect(store.dispatch).toHaveBeenCalledWith({ type: "login/logout" });
  const nextDispatch = jest.fn();
  mockApp._store = { dispatch: nextDispatch }; // eslint-disable-line no-underscore-dangle
  send({ type: "global/resetPermission" });
  expect(nextDispatch).toHaveBeenCalledWith({ type: "global/resetPermission" });
  container.remove();
});

it("uses the browser's Chinese locale when no locale is stored", () => {
  const container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
  window.localStorage.removeItem("locale");
  Object.defineProperty(window.navigator, "language", {
    value: "zh-CN",
    configurable: true,
  });
  try {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require("./index");
      // eslint-disable-next-line global-require
      const { initIntl } = require("./utils/IntlUtils");
      expect(initIntl).toHaveBeenCalledWith("zh-CN");
    });
  } finally {
    delete window.navigator.language;
    window.localStorage.removeItem("locale");
    container.remove();
  }
});

it("keeps the stored locale choice over the browser language", () => {
  const container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
  window.localStorage.setItem("locale", "en-US");
  Object.defineProperty(window.navigator, "language", {
    value: "zh-CN",
    configurable: true,
  });
  try {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require("./index");
      // eslint-disable-next-line global-require
      const { initIntl } = require("./utils/IntlUtils");
      expect(initIntl).toHaveBeenCalledWith("en-US");
    });
  } finally {
    delete window.navigator.language;
    window.localStorage.removeItem("locale");
    container.remove();
  }
});

it("does not store the browser language at startup", () => {
  const container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
  window.localStorage.removeItem("locale");
  Object.defineProperty(window.navigator, "language", {
    value: "zh-CN",
    configurable: true,
  });
  try {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require("./index");
    });
    expect(window.localStorage.getItem("locale")).toBeNull();
  } finally {
    delete window.navigator.language;
    container.remove();
  }
});

