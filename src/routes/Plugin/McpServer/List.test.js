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
  within,
  act,
  waitFor,
} from "@testing-library/react";
import Connected from "./index";

jest.mock("@microlink/react-json-view", () => () => <span>Preview JSON</span>);
jest.mock("../Common/Selector", () => () => null);
jest.mock("./ToolsModalLoader", () => () => null);
jest.mock("./JsonEditModal", () => () => null);
jest.mock("./McpConfigModal", () => () => null);
jest.mock("./SwaggerImportModal", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
  getCurrentLocale: jest.fn(),
}));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      typeof children === "function" ? children({}) : children,
);
jest.mock("../../../utils/namespacePlugin", () => ({
  getUpdateModal: jest.fn(),
  updateNamespacePluginsEnabledByNamespace: jest.fn(),
}));
const Page = Connected.WrappedComponent;
const selector = {
  id: "selector-fixture",
  key: "selector-fixture",
  pluginId: "plugin-fixture",
  name: "Fixture server",
  sort: 0,
  enabled: true,
  handle: "{}",
  selectorConditions: [],
};
const tool = {
  id: "tool-fixture",
  key: "tool-fixture",
  name: "Fixture tool",
  sort: 0,
  enabled: false,
  handle: '{"parameters":[],"requestConfig":"{}","description":"fixture"}',
};
function setup() {
  const dispatch = jest.fn(),
    ref = React.createRef();
  const props = {
    dispatch,
    language: "en-US",
    currentNamespaceId: "ns-fixture",
    match: { params: { id: "mcpServer" } },
    plugins: [
      {
        id: "binding-fixture",
        pluginId: "plugin-fixture",
        name: "mcpServer",
        enabled: true,
        config: "{}",
      },
    ],
    selectorList: [selector],
    selectorTotal: 30,
    ruleList: [tool],
    ruleTotal: 30,
    currentSelector: selector,
  };
  const view = render(<Page {...props} ref={ref} />);
  return { ...view, dispatch, ref, props };
}
it("loads selectors in the active namespace and shows both lists", () => {
  const { dispatch } = setup();
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "common/fetchSelector",
      payload: expect.objectContaining({
        pluginId: "plugin-fixture",
        namespaceId: "ns-fixture",
        currentPage: 1,
      }),
    }),
  );
  expect(screen.getByText(selector.name)).toBeTruthy();
  expect(screen.getByText(tool.name)).toBeTruthy();
});
it("uses the selected selector ID when the row is activated", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.click(screen.getByText(selector.name));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "common/fetchRule",
      payload: expect.objectContaining({
        selectorId: selector.id,
        namespaceId: "ns-fixture",
        currentPage: 1,
      }),
    }),
  );
});
it("changes a tool's enabled flag with the original ID and namespace", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.click(
    within(screen.getByText(tool.name).closest("tr")).getByRole("switch"),
  );
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "common/enableRule",
      payload: { list: [tool.id], enabled: true, namespaceId: "ns-fixture" },
    }),
  );
});
it("starts selector search on page one", () => {
  const { dispatch, ref } = setup();
  act(() => ref.current.setState({ selectorPage: 3 }));
  dispatch.mockClear();
  act(() => ref.current.searchSelector());
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "common/fetchSelector",
      payload: expect.objectContaining({ currentPage: 1 }),
    }),
  );
});
it("preserves the tool page size and resets its pager when selector pages change", () => {
  const { dispatch, ref } = setup();
  act(() => ref.current.setState({ toolPageSize: 20, toolPage: 3 }));
  dispatch.mockClear();
  act(() => ref.current.pageSelectorChange(2));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "common/fetchSelector",
      payload: expect.objectContaining({ rulePageSize: 20 }),
    }),
  );
  expect(ref.current.state.toolPage).toBe(1);
});
it("does not issue a second tool query after JSON save", () => {
  const { dispatch, ref } = setup();
  act(() => ref.current.handleJsonEditOk(tool));
  const action = dispatch.mock.calls
    .map(([a]) => a)
    .find((a) => a.type === "common/updateRule");
  dispatch.mockClear();
  act(() => action.callback());
  expect(dispatch).not.toHaveBeenCalled();
});

it.each([
  [0, "common/fetchSelector"],
  [1, "common/fetchRule"],
])(
  "changes pager %s with one correctly scoped request",
  async (index, actionType) => {
    const { dispatch } = setup();
    dispatch.mockClear();
    fireEvent.click(
      screen.getAllByText("Items per page: 12", { exact: true })[index],
    );
    const option = await screen.findByRole("option", {
      name: /Items per page: 20$/,
    });
    fireEvent.click(option);
    fireEvent.animationEnd(option.closest("[x-placement]"));
    await waitFor(() =>
      expect(
        dispatch.mock.calls.filter(([action]) => action.type === actionType),
      ).toHaveLength(1),
    );
    expect(
      dispatch.mock.calls.find(([action]) => action.type === actionType)[0]
        .payload,
    ).toEqual(
      expect.objectContaining({
        currentPage: 1,
        pageSize: 20,
        namespaceId: "ns-fixture",
      }),
    );
  },
);
it("does not activate a selector when its checkbox or status is clicked", () => {
  const { dispatch } = setup();
  const row = screen.getByText(selector.name).closest("tr");
  dispatch.mockClear();
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(within(row).getByRole("switch"));
  expect(dispatch.mock.calls.map(([a]) => a.type)).toEqual([
    "common/enableSelector",
  ]);
});
it("drops a late JSON editor response after selector context changes", () => {
  const { dispatch, ref, rerender, props } = setup();
  act(() => ref.current.editToolByJson(tool));
  const request = dispatch.mock.calls.find(
    ([a]) => a.type === "common/fetchRuleItem",
  )[0];
  rerender(
    <Page
      {...props}
      ref={ref}
      currentSelector={{ ...selector, id: "other-selector" }}
    />,
  );
  act(() => request.callback(tool));
  expect(ref.current.state.jsonEditVisible).toBe(false);
});
it("aligns the child pager and clears its search when a selector page arrives", () => {
  const { ref, rerender, props } = setup();
  act(() => ref.current.setState({ toolPage: 3, toolName: "old-filter" }));
  rerender(<Page {...props} ref={ref} selectorList={[{ ...selector }]} />);
  expect(ref.current.state.toolPage).toBe(1);
  expect(ref.current.state.toolName).toBeUndefined();
});
it("moves the tool pager back only after a last-row delete succeeds", () => {
  const { dispatch, ref } = setup();
  act(() =>
    ref.current.setState({ toolPage: 3, toolSelectedRowKeys: [tool.id] }),
  );
  act(() => ref.current.deleteTool(tool));
  const action = dispatch.mock.calls.find(
    ([a]) => a.type === "common/deleteRule",
  )[0];
  expect(action.fetchValue.currentPage).toBe(2);
  expect(ref.current.state.toolPage).toBe(3);
  act(() => action.callback());
  expect(ref.current.state.toolPage).toBe(2);
  expect(ref.current.state.toolSelectedRowKeys).toEqual([]);
});

it("clears selected tools when activating another server", () => {
  const { dispatch, ref } = setup();
  act(() =>
    ref.current.setState({
      toolSelectedRowKeys: [tool.id],
      toolName: "old-search",
      toolPage: 2,
    }),
  );
  act(() => ref.current.rowClick({ ...selector, id: "selector-two" }));
  expect(ref.current.state.toolSelectedRowKeys).toEqual([]);
  expect(ref.current.state.toolName).toBeUndefined();
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "common/fetchRule",
      payload: expect.objectContaining({
        selectorId: "selector-two",
        currentPage: 1,
      }),
    }),
  );
});
