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
import Namespace from "./index";

jest.mock("react-redux", () => ({
  connect: () => (Component) => Component,
  batch: (callback) => callback(),
}));
const mockDenied = new Set();
beforeEach(() => mockDenied.clear());
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children, perms }) =>
      mockDenied.has(perms)
        ? null
        : typeof children === "function"
          ? children({ perms })
          : children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));
jest.mock("../../../utils/AuthRoute", () => ({
  refreshAuthMenus: jest.fn(({ dispatch }) =>
    dispatch({ type: "test/refreshAuthMenus" }),
  ),
}));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "default",
}));
jest.mock("../../../components/ui/feedback", () => ({
  message: { warn: jest.fn(), destroy: jest.fn() },
}));
const rows = () => [
  {
    id: "default-row",
    key: "default-row",
    namespaceId: "default",
    name: "Default namespace",
    description: "Base",
  },
  {
    id: "row-a",
    key: "row-a",
    namespaceId: "ns-a",
    name: "Alpha namespace",
    description: "First",
  },
  {
    id: "row-b",
    key: "row-b",
    namespaceId: "ns-b",
    name: "Beta namespace",
    description: "Second",
  },
];
function setup(overrides = {}) {
  const callbacks = {};
  const dispatch = jest.fn((action) => {
    if (action.type === "namespace/delete") callbacks.deleted = action.callback;
    if (action.type === "namespace/fetchItem")
      action.callback(
        rows().find((row) => row.namespaceId === action.payload.id),
      );
  });
  const props = {
    namespace: { namespaceList: rows(), total: 40 },
    namespaces: rows(),
    authMenu: [],
    language: "en-US",
    currentNamespaceId: "ns-b",
    loading: false,
    dispatch,
    ...overrides,
  };
  const result = render(<Namespace {...props} />);
  return { ...result, props, dispatch, callbacks };
}
function confirmBulk() {
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
}

it("protects the default namespace during select-all", () => {
  const { dispatch } = setup();
  const row = screen
    .getByText("Default namespace", { exact: true })
    .closest("tr");
  expect(within(row).getByRole("checkbox").disabled).toBe(true);
  expect(within(row).queryByText("SHENYU.SYSTEM.EDITOR")).toBeNull();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  confirmBulk();
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "namespace/delete",
      payload: { list: ["row-a", "row-b"] },
    }),
  );
});

it("uses namespace UUIDs for detail and row IDs for update", async () => {
  const { dispatch } = setup();
  const row = screen
    .getByText("Alpha namespace", { exact: true })
    .closest("tr");
  fireEvent.click(within(row).getByText("SHENYU.SYSTEM.EDITOR"));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "namespace/fetchItem",
      payload: { id: "ns-a" },
    }),
  );
  fireEvent.change(
    within(document.querySelector(".semi-modal")).getByPlaceholderText(
      "SHENYU.NAMESPACE.INPUTNAME",
    ),
    { target: { value: "Changed Alpha" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "namespace/update",
        payload: {
          id: "row-a",
          namespaceId: "ns-a",
          name: "Changed Alpha",
          description: "First",
        },
      }),
    ),
  );
});

it("keeps the requested namespace filter distinct from the current namespace", () => {
  const { dispatch } = setup();
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.NAMESPACE.INPUTNAMESPACEID"),
    { target: { value: "searched-namespace" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }));
  expect(dispatch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: "namespace/fetch",
      payload: expect.objectContaining({
        namespaceId: "searched-namespace",
        currentPage: 1,
        pageSize: 12,
      }),
    }),
  );
});

it("issues one server request for a page change", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "namespace/fetch",
      payload: expect.objectContaining({ currentPage: 2, pageSize: 12 }),
    }),
  );
});

it("does not delete when bulk confirmation is cancelled", () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  expect(
    dispatch.mock.calls.some(([action]) => action.type === "namespace/delete"),
  ).toBe(false);
});

it("resets the active namespace even when it is not the first batch item", () => {
  const { dispatch, callbacks } = setup();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  confirmBulk();
  act(() => callbacks.deleted({ currentNamespaceId: "ns-b" }));
  expect(dispatch).toHaveBeenCalledWith({
    type: "global/saveCurrentNamespaceId",
    payload: "default",
  });
  const actions = dispatch.mock.calls.map(([action]) => action.type);
  expect(actions.indexOf("global/saveCurrentNamespaceId")).toBeLessThan(
    actions.indexOf("test/refreshAuthMenus"),
  );
});

it("does not request the list just because checkbox selection changes", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  expect(dispatch).not.toHaveBeenCalled();
});

it("uses namespace grants rather than plugin grants for its toolbar", () => {
  ["list", "add", "delete"].forEach((action) =>
    mockDenied.add(`system:plugin:${action}`),
  );
  setup();
  [
    "SHENYU.SYSTEM.SEARCH",
    "SHENYU.SYSTEM.ADDDATA",
    "SHENYU.SYSTEM.DELETEDATA",
  ].forEach((name) =>
    expect(screen.getByRole("button", { name })).toBeTruthy(),
  );
});

it("resets a page-size change to page one with one server request", async () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getByLabelText("Next"));
  fireEvent.click(screen.getByLabelText("Next"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const sizeOption = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(sizeOption);
  // The native size selector commits after its CSS exit animation.
  fireEvent.animationEnd(sizeOption.closest("[x-placement]"));
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "namespace/fetch",
      payload: expect.objectContaining({ currentPage: 1, pageSize: 20 }),
    }),
  );
});

it("uses the full catalog for a selected active namespace on another page", () => {
  const { props, rerender, dispatch, callbacks } = setup();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.click(screen.getByLabelText("Next"));
  rerender(
    <Namespace
      {...props}
      namespace={{
        namespaceList: [
          { id: "row-c", namespaceId: "ns-c", name: "Gamma namespace" },
        ],
        total: 40,
      }}
    />,
  );
  confirmBulk();
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "namespace/delete",
      payload: { list: ["row-a", "row-b"] },
    }),
  );
  act(() => callbacks.deleted({ currentNamespaceId: "ns-b" }));
  expect(dispatch).toHaveBeenCalledWith({
    type: "global/saveCurrentNamespaceId",
    payload: "default",
  });
});

it("does not replace a valid namespace switched to while deletion is pending", () => {
  const { props, rerender, dispatch, callbacks } = setup();
  fireEvent.click(
    within(screen.getByText("Beta namespace").closest("tr")).getByRole(
      "checkbox",
    ),
  );
  confirmBulk();
  rerender(<Namespace {...props} currentNamespaceId="ns-c" />);
  act(() => callbacks.deleted({ currentNamespaceId: "ns-c" }));
  expect(
    dispatch.mock.calls.some(
      ([action]) => action.type === "global/saveCurrentNamespaceId",
    ),
  ).toBe(false);
});

it("does not mutate the namespace records while rendering", () => {
  const { props } = setup();
  expect(props.namespace.namespaceList).toStrictEqual(rows());
});

it("does not expose namespace toolbar actions to plugin-only grants", () => {
  ["list", "add", "delete"].forEach((action) =>
    mockDenied.add(`system:namespace:${action}`),
  );
  setup();
  [
    "SHENYU.SYSTEM.SEARCH",
    "SHENYU.SYSTEM.ADDDATA",
    "SHENYU.SYSTEM.DELETEDATA",
  ].forEach((name) =>
    expect(screen.queryByRole("button", { name })).toBeNull(),
  );
});
