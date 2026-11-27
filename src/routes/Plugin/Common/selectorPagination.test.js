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

import ConnectedCommon from "./index";

jest.mock("./Selector", () => () => null);
jest.mock("./Rule", () => () => null);
jest.mock("../AiProxy/ApiKeys", () => () => null);
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));
jest.mock("../../../utils/namespacePlugin", () => ({
  getUpdateModal: jest.fn(),
  updateNamespacePluginsEnabledByNamespace: jest.fn(),
}));

const Common = ConnectedCommon.WrappedComponent;

it("resets rule pagination and uses rule page size when selecting a selector", () => {
  const dispatch = jest.fn();
  const component = new Common({
    dispatch,
    currentNamespaceId: "namespace-1",
  });
  component.state = {
    ...component.state,
    selectorPageSize: 12,
    rulePage: 3,
    rulePageSize: 20,
  };
  component.setState = (update) => {
    component.state = { ...component.state, ...update };
  };

  component.rowClick({ id: "selector-1" });

  expect(component.state.rulePage).toBe(1);
  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: "common/fetchRule",
    payload: {
      currentPage: 1,
      pageSize: 20,
      selectorId: "selector-1",
      namespaceId: "namespace-1",
    },
  });
});

const makeSearchComponent = (plugins = [{ name: "divide", pluginId: "5" }]) => {
  const dispatch = jest.fn();
  const component = new Common({
    dispatch,
    plugins,
    match: { params: { id: "divide" } },
    currentNamespaceId: "namespace-1",
  });
  component.state = {
    ...component.state,
    selectorPage: 3,
    selectorPageSize: 50,
    selectorName: "demo",
  };
  component.setState = (update, callback) => {
    component.state = { ...component.state, ...update };
    if (callback) callback();
  };
  return { component, dispatch };
};

it("searches selectors from page one while preserving the filter and page size", () => {
  const { component, dispatch } = makeSearchComponent();
  component.searchSelector();
  expect(component.state.selectorPage).toBe(1);
  expect(dispatch).toHaveBeenCalledWith({
    type: "common/fetchSelector",
    payload: {
      currentPage: 1,
      pageSize: 50,
      pluginId: "5",
      name: "demo",
      rulePageSize: 12,
      namespaceId: "namespace-1",
    },
  });
});

it.each([true, false])(
  "resets selector pagination when switching plugins (cached: %s)",
  (cached) => {
    const plugins = [{ name: "divide", pluginId: "5" }];
    const { component, dispatch } = makeSearchComponent(cached ? plugins : []);
    component.componentDidUpdate({
      ...component.props,
      match: { params: { id: "old-plugin" } },
    });
    if (!cached) {
      const fetch = dispatch.mock.calls.find(
        ([action]) => action.type === "global/fetchPlugins",
      );
      expect(fetch).toBeDefined();
      fetch[0].payload.callback(plugins);
    }
    expect(component.state.selectorPage).toBe(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "common/fetchSelector",
        payload: expect.objectContaining({
          currentPage: 1,
          pageSize: 50,
          pluginId: "5",
        }),
      }),
    );
  },
);

it.each([[[]], [[{ name: "divide", pluginId: "stale-id" }]]])(
  "uses the current plugin list when navigation and a store update occur together (case %#)",
  (previousPlugins) => {
    const { component, dispatch } = makeSearchComponent();
    component.componentDidUpdate({
      ...component.props,
      plugins: previousPlugins,
      match: { params: { id: "old-plugin" } },
    });
    expect(component.state.selectorPage).toBe(1);
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "global/fetchPlugins" }),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "common/fetchSelector",
      payload: {
        currentPage: 1,
        pageSize: 50,
        pluginId: "5",
        name: "demo",
        rulePageSize: 12,
        namespaceId: "namespace-1",
      },
    });
  },
);

it("clears old rule selection and search when activating another selector", () => {
  const { component } = makeSearchComponent();
  component.state.ruleSelectedRowKeys = ["old-rule"];
  component.state.ruleName = "old-filter";
  component.rowClick({ id: "new-selector" });
  expect(component.state.ruleSelectedRowKeys).toEqual([]);
  expect(component.state.ruleName).toBeUndefined();
});
it("starts rule search from page one", () => {
  const { component } = makeSearchComponent();
  component.state.rulePage = 4;
  component.getAllRules = jest.fn();
  component.searchRule();
  expect(component.state.rulePage).toBe(1);
  expect(component.getAllRules).toHaveBeenCalledWith(1, 12);
});

it("carries the displayed child page size when reloading selectors", () => {
  const { component, dispatch } = makeSearchComponent();
  component.state.rulePageSize = 50;
  component.getAllSelectors(1, 20, component.props.plugins);
  expect(dispatch.mock.calls[0][0].payload.rulePageSize).toBe(50);
});

it("opens each divide selector with the upstreams from its own detail response", () => {
  const { component, dispatch } = makeSearchComponent();
  for (const id of ["selector-a", "selector-b"]) {
    dispatch.mockClear();
    component.editSelector({ id });
    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe("common/fetchSeItem");
    expect(action.payload).toEqual({ id, namespaceId: "namespace-1" });
    const url = `${id}.example:8080`;
    action.callback({
      id,
      discoveryVO: { discoveryType: "local" },
      discoveryUpstreams: [{ id: `upstream-${id}`, url, props: "{}" }],
    });
    expect(component.state.popup.props.discoveryUpstreams).toEqual([
      expect.objectContaining({ url }),
    ]);
    expect(dispatch).toHaveBeenCalledTimes(1);
  }
});

it("closes the selector editor when the active namespace changes", () => {
  const { component } = makeSearchComponent();
  component.state.popup = "open";
  component.componentDidUpdate({
    ...component.props,
    currentNamespaceId: "old-namespace",
  });
  expect(component.state.popup).toBe("");
});

it("keeps the latest selector open when edit responses arrive out of order", () => {
  const { component, dispatch } = makeSearchComponent();
  component.editSelector({ id: "first" });
  component.editSelector({ id: "second" });
  const [first, second] = dispatch.mock.calls.map(([action]) => action);
  second.callback({ id: "second" });
  first.callback({ id: "first" });
  expect(component.state.popup.props.id).toBe("second");
});

it.each([
  { match: { params: { id: "grpc" } } },
  { currentNamespaceId: "namespace-2" },
])(
  "doesn't reopen a pending selector after leaving and returning to its scope (%j)",
  (change) => {
    const { component, dispatch } = makeSearchComponent();
    component.editSelector({ id: "first" });
    const { callback } = dispatch.mock.calls[0][0];
    const initial = component.props;
    const other = { ...initial, ...change };
    component.props = other;
    component.componentDidUpdate(initial);
    component.props = initial;
    component.componentDidUpdate(other);
    callback({ id: "first" });
    expect(component.state.popup).toBe("");
  },
);
