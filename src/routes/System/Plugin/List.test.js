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
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import Connected from "./index";
import { getUpdateModal, updatePluginsEnabled } from "../../../utils/plugin";
import { refreshAuthMenus } from "../../../utils/AuthRoute";

jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children, perms, noAuth }) =>
      mockDenied.has(perms)
        ? noAuth || null
        : typeof children === "function"
          ? children({})
          : children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
  getCurrentLocale: jest.fn(),
}));
jest.mock("../../../utils/AuthRoute", () => ({ refreshAuthMenus: jest.fn() }));
jest.mock("../../../utils/plugin", () => ({
  getUpdateModal: jest.fn(),
  updatePluginsEnabled: jest.fn(),
}));
jest.mock("../../../runtime/router", () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
const mockDenied = new Set();
beforeEach(() => {
  mockDenied.clear();
  getUpdateModal.mockClear();
  updatePluginsEnabled.mockClear();
  refreshAuthMenus.mockClear();
});
jest.mock("./AddModal", () => () => null);
const Page = Connected.WrappedComponent;
const record = () => ({
  id: "row-1",
  key: "row-1",
  name: "divide",
  role: "Proxy",
  sort: 0,
  enabled: true,
  config: '{"timeout":0}',
  namespaceId: "ns-1",
});
function setup() {
  const dispatch = jest.fn(),
    ref = React.createRef();
  const props = {
    dispatch,
    language: "en-US",
    currentNamespaceId: "ns-1",
    loading: false,
    authMenu: [],
    namespaces: [
      { id: "ns-db", namespaceId: "target-uuid", name: "Target namespace" },
    ],
    plugin: { pluginList: [record()], total: 30 },
  };
  const view = render(<Page ref={ref} {...props} />);
  return { ...view, dispatch, ref, props };
}
it("loads and filters the first page in its current context", () => {
  const { dispatch } = setup();
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "plugin/fetch",
      payload: expect.objectContaining({ currentPage: 1, pageSize: 12 }),
    }),
  );
  dispatch.mockClear();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.PLUGIN.INPUTNAME"), {
    target: { value: "divide" },
  });
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch.mock.calls[0][0].payload).toEqual(
    expect.objectContaining({ name: "divide", currentPage: 1 }),
  );
});
it("opens the correct edit helper and cancels without fetching", () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getAllByText("SHENYU.SYSTEM.EDITOR")[0]);
  expect(getUpdateModal).toHaveBeenCalledTimes(1);
  expect(getUpdateModal.mock.calls[0][0]).toEqual(
    expect.objectContaining({ pluginId: "row-1" }),
  );
  dispatch.mockClear();
  act(() => getUpdateModal.mock.calls[0][0].canceledCallback());
  expect(dispatch).not.toHaveBeenCalled();
});
it("changes one row's status with a boolean and preserved identity", () => {
  setup();
  fireEvent.click(screen.getAllByRole("switch")[0]);
  expect(updatePluginsEnabled).toHaveBeenCalledWith(
    expect.objectContaining({ list: ["row-1"], enabled: false }),
  );
});
it("hides status control without disable permission", () => {
  mockDenied.add("system:plugin:disable");
  setup();
  expect(screen.queryByRole("switch")).toBeNull();
  expect(screen.getByText("SHENYU.COMMON.OPEN")).toBeTruthy();
});
it("retains deletion context and refreshes authorization", () => {
  const { dispatch, ref } = setup();
  act(() => ref.current.onSelectChange(["row-1"]));
  dispatch.mockClear();
  act(() => ref.current.deleteClick());
  const deletion = dispatch.mock.calls[0][0];
  expect(deletion.type).toBe("plugin/delete");
  expect(deletion.payload.list).toEqual(["row-1"]);
  expect(deletion.fetchValue).toEqual(
    expect.objectContaining({ namespaceId: "ns-1", pageSize: 12 }),
  );
  act(() => deletion.callback());
  expect(refreshAuthMenus).toHaveBeenCalledWith({ dispatch });
});

it("lets the model own the edit refresh on page one", () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getAllByText("SHENYU.SYSTEM.EDITOR")[0]);
  const edit = getUpdateModal.mock.calls[0][0];
  dispatch.mockClear();
  act(() => edit.updatedCallback());
  expect(dispatch).not.toHaveBeenCalled();
  expect(edit.fetchValue.currentPage).toBe(1);
});

it("changes page size once and does not query for checkbox selection", async () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText("Next"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
  expect(dispatch.mock.calls[0][0].payload).toEqual(
    expect.objectContaining({ currentPage: 1, pageSize: 20 }),
  );
});
it("derives permission links without mutating backend rows", () => {
  const { props, rerender } = setup();
  const row = Object.freeze(record());
  rerender(
    <Page
      {...props}
      authMenu={[{ id: "row-1", path: "/plug/Proxy/divide" }]}
      plugin={{ pluginList: [row], total: 1 }}
    />,
  );
  expect(
    screen.getByRole("link", { name: "divide" }).getAttribute("href"),
  ).toBe("/plug/Proxy/divide");
  expect(row.url).toBeUndefined();
});

it("generates into the chosen namespace UUID without resetting page size", async () => {
  const { dispatch, ref } = setup();
  act(() => ref.current.setState({ pageSize: 20 }));
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.BUTTON.SYSTEM.GENERATE" }),
  );
  fireEvent.click(await screen.findByText("Target namespace"));
  const action = dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "plugin/generate");
  expect(action.payload).toEqual({
    pluginId: "row-1",
    namespaceId: "target-uuid",
  });
  expect(action.fetchValue.pageSize).toBe(20);
});
