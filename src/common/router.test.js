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

import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { dynamicWrapper, getRouterData } from "./router";

jest.mock("./menu", () => ({
  getMenuData: () => [
    { path: "/config/metadata", name: "Metadata", authority: "admin" },
  ],
}));
jest.mock("../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../components/_utils/utils", () => ({
  defaultNamespaceId: "test-namespace",
}));
jest.mock("../models/metadata", () => ({
  __esModule: true,
  default: { namespace: "metadata", state: {} },
}));

const namespaces = [
  "user",
  "login",
  "mcpServer",
  "discovery",
  "common",
  "role",
  "manage",
  "dataPermission",
  "resource",
  "alert",
  "scale",
  "namespace",
  "metadata",
  "plugin",
  "instance",
  "registry",
  "namespacePlugin",
  "pluginHandle",
  "auth",
  "shenyuDict",
  "error",
];

beforeAll(() => {
  const apiBase = document.createElement("div");
  apiBase.id = "httpPath";
  document.body.appendChild(apiBase);
});

afterAll(() => {
  document.getElementById("httpPath").remove();
});

function createApp(exclude) {
  const models = namespaces
    .filter((name) => name !== exclude)
    .map((namespace) => ({ namespace }));
  return {
    _models: models,
    model: jest.fn((model) => models.push(model)),
  };
}

it("retains hash route keys and menu permission metadata", () => {
  const app = createApp();
  const routes = getRouterData(app);
  expect(routes["/config/metadata"]).toMatchObject({
    name: "Metadata",
    authority: "admin",
  });
  [
    "/",
    "/user/login",
    "/plug/:index/:id",
    "/config/auth",
    "/plug/Mcp/mcpServer",
  ].forEach((path) => {
    expect(routes[path].component).toBeDefined();
  });
  expect(app.model).not.toHaveBeenCalled();
});

it("registers a missing route model once without replacing existing namespaces", () => {
  const app = createApp("metadata");
  getRouterData(app);
  getRouterData(app);
  expect(app.model).toHaveBeenCalledTimes(1);
  expect(app.model).toHaveBeenCalledWith({ namespace: "metadata", state: {} });
});

it.each(namespaces)(
  "registers the original %s model synchronously and only once",
  (namespace) => {
    const app = createApp(namespace);
    const pageLoader = jest.fn(() => Promise.resolve({ default: () => null }));
    dynamicWrapper(app, [namespace], pageLoader);
    expect(app.model).toHaveBeenCalledTimes(1);
    const model = app.model.mock.calls[0][0];
    expect(model.namespace).toBe(namespace);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    expect(model).toBe(require(`../models/${namespace}`).default);
    expect(pageLoader).not.toHaveBeenCalled();

    dynamicWrapper(app, [namespace], pageLoader);
    expect(app.model).toHaveBeenCalledTimes(1);
    expect(pageLoader).not.toHaveBeenCalled();
  },
);

it.each(["notRegistered", "constructor", "__proto__"])(
  "rejects unsupported model %s before registration or page loading",
  (namespace) => {
    const app = createApp();
    const pageLoader = jest.fn();
    expect(() => dynamicWrapper(app, [namespace], pageLoader)).toThrow();
    expect(app.model).not.toHaveBeenCalled();
    expect(pageLoader).not.toHaveBeenCalled();
  },
);

it("waits for a promise loader regardless of its source text, then forwards route props", async () => {
  const onSave = jest.fn();
  const Page = dynamicWrapper(createApp(), [], () =>
    Promise.resolve({
      default: (props) => (
        <div>
          <span>{props.recordId}</span>
          <span>{props.routerData["/config/metadata"].name}</span>
          <button type="button" onClick={props.onSave}>
            Save
          </button>
        </div>
      ),
    }),
  );
  render(<Page recordId="caller-record" onSave={onSave} />);
  expect(screen.getByRole("status").getAttribute("aria-label")).toBe(
    "SHENYU.COMMON.PAGE.LOADING",
  );
  await screen.findByText("caller-record");
  expect(screen.getByText("Metadata")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave).toHaveBeenCalledTimes(1);
});

it("recovers a failed route download with the current route props", async () => {
  const loader = jest
    .fn()
    .mockRejectedValueOnce(new Error("Route chunk unavailable"))
    .mockResolvedValueOnce({ default: (props) => <div>{props.recordId}</div> });
  const Page = dynamicWrapper(createApp(), [], loader);
  const { rerender } = render(<Page recordId="previous-record" />);
  await screen.findByRole("alert");
  expect(screen.getByText("SHENYU.COMMON.PAGE.LOAD.FAILED")).toBeDefined();
  rerender(<Page recordId="current-record" />);
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.COMMON.PAGE.RETRY" }),
  );
  await screen.findByText("current-record");
  expect(loader).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("previous-record")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("does not mount a page when its pending route was unmounted", async () => {
  let completeLoad;
  const PageContent = jest.fn(() => <div>Obsolete page</div>);
  const Page = dynamicWrapper(
    createApp(),
    [],
    () =>
      new Promise((resolve) => {
        completeLoad = resolve;
      }),
  );
  const { unmount } = render(<Page />);
  unmount();
  await act(async () => {
    completeLoad({ default: PageContent });
  });
  expect(PageContent).not.toHaveBeenCalled();
  expect(screen.queryByText("Obsolete page")).toBeNull();
});

it("reuses a downloaded route when it is revisited", async () => {
  const loader = jest
    .fn()
    .mockResolvedValue({ default: () => <div>Cached page</div> });
  const Page = dynamicWrapper(createApp(), [], loader);
  const { unmount } = render(<Page />);
  await screen.findByText("Cached page");
  unmount();
  render(<Page />);
  await screen.findByText("Cached page");
  expect(loader).toHaveBeenCalledTimes(1);
});
