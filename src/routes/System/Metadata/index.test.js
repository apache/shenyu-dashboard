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
import { Provider } from "react-redux";
import { createStore } from "redux";
import Select from "@douyinfe/semi-ui/lib/es/select";
import ConnectedMetadata from "./index";

jest.mock("./AddModalLoader", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));
jest.mock(
  "./MetadataTableLoader",
  () => jest.requireActual("./MetadataTable"),
  { virtual: true },
);

// Disable popup motion in jsdom; browser smoke checks retain the default animation.
const selectMotion = Select.defaultProps.motion;
beforeAll(() => {
  Select.defaultProps.motion = false;
});
afterAll(() => {
  Select.defaultProps.motion = selectMotion;
});

const Metadata = ConnectedMetadata.WrappedComponent;
const actions = ["list", "add", "edit", "delete", "disable", "modify"];
const first = {
  id: "row-1",
  appName: "alpha-app",
  path: "/alpha",
  pathDesc: "Alpha description",
  rpcType: "http",
  enabled: true,
  serviceName: "org.example.Alpha",
  methodName: "getAlpha",
  parameterTypes: "String",
  rpcExt: "{}",
};
const second = {
  ...first,
  id: "row-2",
  appName: "beta-app",
  path: "/beta",
  rpcType: "grpc",
  enabled: false,
};

function setup(overrides = {}, allowed = actions) {
  const props = {
    metadata: { userList: [first, second], total: 36 },
    currentNamespaceId: "namespace-1",
    language: "en-US",
    loading: false,
    dispatch: jest.fn(),
    ...overrides,
  };
  const store = createStore(
    (
      state = {
        global: {
          permissions: {
            button: allowed.map((action) => ({
              perms: `system:meta:${action}`,
            })),
            menu: [],
          },
        },
      },
    ) => state,
  );
  const ref = React.createRef();
  const view = (nextProps) => (
    <Provider store={store}>
      <Metadata ref={ref} {...nextProps} />
    </Provider>
  );
  const result = render(view(props));
  return {
    ...result,
    props,
    ref,
    update: (patch) => result.rerender(view({ ...props, ...patch })),
  };
}

function selectRow(appName) {
  fireEvent.click(
    within(screen.getByText(appName).closest("tr")).getByRole("checkbox"),
  );
}

function fetches(dispatch) {
  return dispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => action.type === "metadata/fetch");
}

it("fetches the first server page in the active namespace and renders backend rows", () => {
  const { props } = setup();
  expect(fetches(props.dispatch)).toEqual([
    {
      type: "metadata/fetch",
      payload: {
        path: "",
        currentPage: 1,
        pageSize: 12,
        namespaceId: "namespace-1",
      },
    },
  ]);
  expect(screen.getByText("alpha-app")).not.toBeNull();
  expect(screen.getByText("beta-app")).not.toBeNull();
  expect(screen.getByText("36", { exact: true })).not.toBeNull();
});

it("queries the requested server page with the existing page size and namespace", () => {
  const { props } = setup();
  fireEvent.click(screen.getByText("2", { exact: true }));
  expect(fetches(props.dispatch).slice(-1)[0].payload).toEqual({
    path: "",
    currentPage: 2,
    pageSize: 12,
    namespaceId: "namespace-1",
  });
});

it("starts page one when the page size changes", () => {
  const { props, ref } = setup();
  act(() => {
    ref.current.pageOnchange(3);
  });
  act(() => {
    ref.current.onShowSizeChange(3, 20);
  });
  expect(fetches(props.dispatch).slice(-1)[0].payload).toEqual({
    path: "",
    currentPage: 1,
    pageSize: 20,
    namespaceId: "namespace-1",
  });
});

it("keeps the path filter when moving to another server page", () => {
  const { props } = setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.META.INPUTPATH"), {
    target: { value: "/alpha" },
  });
  fireEvent.click(screen.getByText("2", { exact: true }));
  expect(fetches(props.dispatch).slice(-1)[0].payload).toEqual({
    path: "/alpha",
    currentPage: 2,
    pageSize: 12,
    namespaceId: "namespace-1",
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }));
  expect(fetches(props.dispatch).slice(-1)[0].payload.currentPage).toBe(1);
});

it("keeps selected IDs across server pages for a bulk delete", async () => {
  const { props, update } = setup();
  selectRow("alpha-app");
  fireEvent.click(screen.getByText("2", { exact: true }));
  update({
    metadata: {
      userList: [{ ...second, id: "row-3", appName: "gamma-app" }],
      total: 36,
    },
  });
  selectRow("gamma-app");
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "SHENYU.COMMON.SURE" }),
  );
  const deletion = props.dispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "metadata/delete");
  expect(deletion.payload).toEqual({
    list: ["row-1", "row-3"],
    namespaceId: "namespace-1",
  });
});

it("updates one row's status with its ID and active namespace", () => {
  const { props } = setup();
  fireEvent.click(
    within(screen.getByText("alpha-app").closest("tr")).getByRole("switch"),
  );
  const update = props.dispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "metadata/updateEn");
  expect(update.payload).toEqual({
    list: ["row-1"],
    enabled: false,
    namespaceId: "namespace-1",
  });
});

it("resolves the first selected record before changing a batch's status", () => {
  const { props } = setup();
  selectRow("alpha-app");
  selectRow("beta-app");
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.PLUGIN.BATCH" }));
  const fetch = props.dispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "metadata/fetchItem");
  expect(fetch.payload).toEqual({ id: "row-1", namespaceId: "namespace-1" });
  act(() => {
    fetch.callback(first);
  });
  const update = props.dispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "metadata/updateEn");
  expect(update.payload).toEqual({
    list: ["row-1", "row-2"],
    enabled: false,
    namespaceId: "namespace-1",
  });
});

it("requires edit permission to open a record and add permission to copy", () => {
  const { props } = setup({}, ["list", "edit"]);
  expect(
    screen.queryByRole("button", { name: "SHENYU.COMMON.ADD" }),
  ).toBeNull();
  expect(screen.queryByText("SHENYU.COMMON.COPY")).toBeNull();
  fireEvent.click(screen.getAllByText("SHENYU.SYSTEM.EDITOR")[0]);
  const fetch = props.dispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "metadata/fetchItem");
  expect(fetch.payload).toEqual({ id: "row-1", namespaceId: "namespace-1" });
});

it("keeps status read-only without the disable permission", () => {
  setup({}, ["list"]);
  expect(screen.queryAllByRole("switch")).toHaveLength(0);
  expect(screen.getByText("SHENYU.COMMON.OPEN")).not.toBeNull();
  expect(screen.getByText("SHENYU.COMMON.CLOSE")).not.toBeNull();
  expect(
    screen.queryByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  ).toBeNull();
});

it("keeps the sync permission and existing sync action", () => {
  const { props } = setup();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.AUTH.SYNCDATA" }));
  expect(props.dispatch).toHaveBeenCalledWith({ type: "metadata/syncDa" });
});

it("sorts the loaded rows locally without changing the server query", async () => {
  const { props } = setup({
    metadata: { userList: [second, first], total: 36 },
  });
  props.dispatch.mockClear();
  fireEvent.click(
    screen.getByRole("columnheader", { name: /SHENYU.AUTH.APPNAME/ }),
  );
  await waitFor(() => {
    const rows = screen
      .getAllByRole("row")
      .filter((row) => row.textContent.includes("-app"));
    expect(rows[0].textContent).toContain("alpha-app");
  });
  expect(fetches(props.dispatch)).toHaveLength(0);
});

it("clears page and selected IDs when the namespace changes", () => {
  const { props, ref, update } = setup();
  selectRow("alpha-app");
  fireEvent.click(screen.getByText("2", { exact: true }));
  update({
    currentNamespaceId: "namespace-2",
    metadata: { userList: [second], total: 12 },
  });
  expect(ref.current.state.selectedRowKeys).toEqual([]);
  expect(fetches(props.dispatch).slice(-1)[0].payload).toEqual({
    path: "",
    currentPage: 1,
    pageSize: 12,
    namespaceId: "namespace-2",
  });
});

it("clears the old selection when a path filter changes", () => {
  const { ref } = setup();
  selectRow("alpha-app");
  fireEvent.change(screen.getByPlaceholderText("SHENYU.META.INPUTPATH"), {
    target: { value: "/beta" },
  });
  expect(ref.current.state.selectedRowKeys).toEqual([]);
});

it("does not refetch the server page just to change row selection", () => {
  const { props } = setup();
  props.dispatch.mockClear();
  selectRow("alpha-app");
  expect(fetches(props.dispatch)).toEqual([]);
});

it("ignores an edit response from the previous namespace", () => {
  const { props, ref, update } = setup();
  fireEvent.click(screen.getAllByText("SHENYU.SYSTEM.EDITOR")[0]);
  const request = props.dispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "metadata/fetchItem");
  update({ currentNamespaceId: "namespace-2" });
  act(() => {
    request.callback(first);
  });
  expect(ref.current.state.popup).toBe("");
});

it("ignores an old namespace's status lookup instead of updating its IDs in the new namespace", () => {
  const { props, update } = setup();
  selectRow("alpha-app");
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.PLUGIN.BATCH" }));
  const request = props.dispatch.mock.calls
    .map(([action]) => action)
    .find((action) => action.type === "metadata/fetchItem");
  update({ currentNamespaceId: "namespace-2" });
  props.dispatch.mockClear();
  act(() => {
    request.callback(first);
  });
  expect(
    props.dispatch.mock.calls.map(([action]) => action.type),
  ).not.toContain("metadata/updateEn");
});

it("sends exactly one page-one query when the visible page-size selector changes", async () => {
  const { props } = setup();
  fireEvent.click(screen.getByText("2", { exact: true }));
  props.dispatch.mockClear();
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(
    await screen.findByText("Items per page: 20", { exact: true }),
  );
  await waitFor(() => expect(fetches(props.dispatch)).toHaveLength(1));
  expect(fetches(props.dispatch)[0].payload).toEqual({
    path: "",
    currentPage: 1,
    pageSize: 20,
    namespaceId: "namespace-1",
  });
});

it("preserves controlled selected IDs when rows are sorted", async () => {
  const { ref } = setup();
  selectRow("alpha-app");
  fireEvent.click(
    screen.getByRole("columnheader", { name: /SHENYU.AUTH.APPNAME/ }),
  );
  await waitFor(() =>
    expect(ref.current.state.selectedRowKeys).toEqual(["row-1"]),
  );
  expect(
    within(screen.getByText("alpha-app").closest("tr")).getByRole("checkbox")
      .checked,
  ).toBe(true);
});

it.each(["en-US", "en-Us"])("localizes an empty table for %s", (language) => {
  setup({ metadata: { userList: [], total: 0 }, language });
  expect(screen.getByText("No Result")).not.toBeNull();
});
