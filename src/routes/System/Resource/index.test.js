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
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Resource from "./index";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const mockDenied = new Set();
beforeEach(() => mockDenied.clear());
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children, perms }) =>
      mockDenied.has(perms) ? null : children,
);
jest.mock("../../../components/ui/feedback", () => ({
  message: { warn: jest.fn(), destroy: jest.fn() },
}));
jest.mock("../../../utils/AuthRoute", () => ({
  resetAuthMenuCache: jest.fn(),
}));
const tree = () => [
  {
    id: "config",
    url: "/config",
    resourceType: 0,
    meta: { title: "Config", icon: "setting" },
    children: [
      {
        id: "alpha",
        url: "/config/alpha",
        resourceType: 1,
        meta: { title: "Alpha", icon: "home" },
      },
      {
        id: "beta",
        url: "/config/beta",
        resourceType: 1,
        meta: { title: "Beta", icon: "api" },
      },
    ],
  },
  {
    id: "plugin",
    url: "/plug/divide",
    resourceType: 1,
    meta: { title: "Divide", icon: "api" },
  },
];
function setup() {
  const callbacks = {};
  const dispatch = jest.fn((action) => {
    if (action.type === "resource/fetchButtons")
      callbacks[action.payload.id] = action.callback;
    if (action.type === "resource/delete") callbacks.delete = action.callback;
  });
  const menuTree = tree();
  render(
    <Resource resource={{ menuTree }} loading={false} dispatch={dispatch} />,
  );
  return { dispatch, callbacks, menuTree };
}
function row(title) {
  return { id: title, title, icon: "home", perms: "test:read" };
}

it("loads a leaf's buttons and clears the table for a parent", async () => {
  const { dispatch, callbacks } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "resource/fetchButtons",
      payload: { id: "alpha" },
    }),
  );
  act(() => callbacks.alpha([row("Alpha action")]));
  expect(await screen.findByText("Alpha action", { exact: true })).toBeTruthy();
  fireEvent.click(screen.getByText("Config", { exact: true }));
  expect(screen.queryByText("Alpha action", { exact: true })).toBeNull();
});

it("filters case-insensitively while retaining the matching ancestor", () => {
  setup();
  fireEvent.click(screen.getByText("Config", { exact: true }));
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.SYSTEM.RESOURCE.MENU.INPUT.NAME"),
    { target: { value: "aLpHa" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }));
  expect(screen.getByText("Config", { exact: true })).toBeTruthy();
  expect(screen.getByText("Alpha", { exact: true })).toBeTruthy();
  expect(screen.queryByText("Beta", { exact: true })).toBeNull();
  expect(screen.queryByText("Divide", { exact: true })).toBeNull();
});

it("opens editing without triggering a second selection", () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByRole("button", {
      name: "SHENYU.BUTTON.RESOURCE.MENU.EDIT",
    }) || screen.getByLabelText("icon: edit"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "resource/fetchItem",
      payload: { id: "alpha" },
    }),
  );
});

it("does not offer deletion for a plugin menu", () => {
  setup();
  fireEvent.click(screen.getByText("Divide", { exact: true }));
  expect(screen.queryByLabelText("icon: delete")).toBeNull();
  expect(
    screen.queryByRole("button", {
      name: "SHENYU.BUTTON.RESOURCE.MENU.DELETE",
    }),
  ).toBeNull();
});

it("uses the currently selected menu when adding a button", async () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getByText("Beta", { exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.BUTTON.RESOURCE.BUTTON.ADD" }),
  );
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.SYSTEM.RESOURCENAME.INPUT"),
    { target: { value: "New action" } },
  );
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.SYSTEM.RESOURCE.PERMS.INPUT"),
    { target: { value: "test:new" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "resource/add",
        payload: expect.objectContaining({
          parentId: "beta",
          resourceType: 2,
          perms: "test:new",
        }),
      }),
    ),
  );
});

it("does not let a slow previous menu overwrite the current button list", async () => {
  const { callbacks } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  fireEvent.click(screen.getByText("Beta", { exact: true }));
  act(() => callbacks.beta([row("Beta action")]));
  act(() => callbacks.alpha([row("Alpha action")]));
  expect(await screen.findByText("Beta action", { exact: true })).toBeTruthy();
  expect(screen.queryByText("Alpha action", { exact: true })).toBeNull();
});

it("keeps the button table empty when a parent replaces a pending leaf", () => {
  const { callbacks } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  fireEvent.click(screen.getByText("Config", { exact: true }));
  act(() => callbacks.alpha([row("Alpha action")]));
  expect(screen.queryByText("Alpha action", { exact: true })).toBeNull();
});

it("does not mutate the shared server menu tree", () => {
  const { menuTree } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  expect(menuTree).toEqual(tree());
});

it("uses server metadata titles in the parent selector without tree mutations", async () => {
  setup();
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.BUTTON.RESOURCE.MENU.ADD" }),
  );
  fireEvent.click(
    screen.getByText("SHENYU.SYSTEM.RESOURCE.PARENT.INPUT", { exact: true }),
  );
  expect(await screen.findByRole("option", { name: /Config$/ })).toBeTruthy();
});

it("respects edit permissions on parent menus too", () => {
  mockDenied.add("system:resource:editMenu");
  setup();
  fireEvent.click(screen.getByText("Config", { exact: true }));
  expect(
    screen.queryByRole("button", { name: "SHENYU.BUTTON.RESOURCE.MENU.EDIT" }),
  ).toBeNull();
  expect(screen.queryByLabelText("icon: edit")).toBeNull();
});

it("does not interpret an action button's Enter key as menu selection", () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  dispatch.mockClear();
  const button = screen.getByRole("button", {
    name: "SHENYU.BUTTON.RESOURCE.MENU.EDIT",
  });
  fireEvent.keyDown(button, { key: "Enter", keyCode: 13 });
  fireEvent.keyPress(button, { key: "Enter", charCode: 13 });
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(dispatch).toHaveBeenCalledTimes(1);
});

it("clears checked button IDs when switching menus", () => {
  const { dispatch, callbacks } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  act(() => callbacks.alpha([row("Alpha action")]));
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  fireEvent.click(screen.getByText("Beta", { exact: true }));
  expect(screen.queryByText("Alpha action", { exact: true })).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(
    dispatch.mock.calls.some(([action]) => action.type === "resource/delete"),
  ).toBe(false);
});

it("clears the current menu after deleting it", () => {
  const { dispatch, callbacks } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.BUTTON.RESOURCE.MENU.DELETE" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "resource/delete",
      payload: { list: ["alpha"] },
    }),
  );
  act(() => callbacks.delete());
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.BUTTON.RESOURCE.BUTTON.ADD" }),
  );
  expect(
    screen.queryByPlaceholderText("SHENYU.SYSTEM.RESOURCENAME.INPUT"),
  ).toBeNull();
});

it("provides keyboard focusable menu labels without duplicate Enter selection", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  const button = screen.getByRole("button", { name: "Alpha", exact: true });
  button.focus();
  expect(document.activeElement).toBe(button);
  fireEvent.keyDown(button, { key: "Enter", keyCode: 13 });
  fireEvent.keyPress(button, { key: "Enter", charCode: 13 });
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "resource/fetchButtons",
      payload: { id: "alpha" },
    }),
  );
});

it("uses the application translation for an empty menu search", () => {
  setup();
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.SYSTEM.RESOURCE.MENU.INPUT.NAME"),
    { target: { value: "missing-menu" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }));
  expect(screen.getByText("SHENYU.SYSTEM.RESOURCE.NO_MATCH")).toBeTruthy();
  expect(screen.queryByText("Alpha", { exact: true })).toBeNull();
});

it("removes confirmed deletions even when the subsequent refresh cannot return data", () => {
  const { callbacks } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  act(() => callbacks.alpha([row("Alpha action")]));
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  act(() => callbacks.delete());
  expect(screen.queryByText("Alpha action", { exact: true })).toBeNull();
});

it("keeps a newer checkbox selection while an earlier deletion finishes", () => {
  const { callbacks, dispatch } = setup();
  fireEvent.click(screen.getByText("Alpha", { exact: true }));
  act(() => callbacks.alpha([row("Alpha action"), row("Other action")]));
  fireEvent.click(
    within(screen.getByText("Alpha action").closest("tr")).getByRole(
      "checkbox",
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "resource/delete",
      payload: { list: ["Alpha action"] },
    }),
  );
  fireEvent.click(
    within(screen.getByText("Other action").closest("tr")).getByRole(
      "checkbox",
    ),
  );
  act(() => callbacks.delete());
  expect(screen.queryByText("Alpha action")).toBeNull();
  expect(
    within(screen.getByText("Other action").closest("tr")).getByRole("checkbox")
      .checked,
  ).toBe(true);
});
