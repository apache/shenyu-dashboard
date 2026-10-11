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

import { message } from "antd";
import {
  getAllRules,
  getAllSelectors,
  getPluginDropDownListByNamespace,
} from "../../../services/api";
import ConnectedRuleCopy from "./RuleCopy";

jest.mock("../../../services/api", () => ({
  findRule: jest.fn(),
  getAllRules: jest.fn(),
  getAllSelectors: jest.fn(),
  getPluginDropDownListByNamespace: jest.fn(),
}));
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "default-namespace",
}));

const RuleCopy = ConnectedRuleCopy.WrappedComponent;

const pageResponse = (dataList, totalCount = dataList.length) => ({
  code: 200,
  data: {
    dataList,
    page: { totalCount },
  },
});

const makeComponent = (currentNamespaceId = "namespace-1") => {
  const component = new RuleCopy({
    currentNamespaceId,
    namespaces: [],
  });
  component.setState = (update, callback) => {
    const next =
      typeof update === "function"
        ? update(component.state, component.props)
        : update;
    component.state = { ...component.state, ...next };
    if (callback) callback();
  };
  return component;
};

const mockEmptyResponses = () => {
  getPluginDropDownListByNamespace.mockResolvedValue({ code: 200, data: [] });
  getAllSelectors.mockResolvedValue(pageResponse([]));
  getAllRules.mockResolvedValue(pageResponse([]));
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(message, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("uses the active namespace for the initial query", async () => {
  mockEmptyResponses();
  const component = makeComponent("namespace-current");

  expect(component.state.currentNamespaceId).toBe("namespace-current");

  await component.getAllRule();

  expect(getPluginDropDownListByNamespace).toHaveBeenCalledWith({
    namespace: "namespace-current",
  });
  expect(getAllSelectors).toHaveBeenCalledWith({
    currentPage: 1,
    pageSize: 9999,
    namespaceId: "namespace-current",
  });
  expect(getAllRules).toHaveBeenCalledWith({
    currentPage: 1,
    pageSize: 9999,
    namespaceId: "namespace-current",
  });
});

it("switches the source namespace and clears the old selection", () => {
  const component = makeComponent("namespace-1");
  component.state.value = "rule-1";
  component.state.ruleTree = [{ title: "Old" }];
  component.getAllRule = jest.fn();

  component.handleNamespacesValueChange({ key: "namespace-2" });

  expect(component.state.currentNamespaceId).toBe("namespace-2");
  expect(component.state.value).toBeUndefined();
  expect(component.state.ruleTree).toEqual([]);
  expect(component.getAllRule).toHaveBeenCalledTimes(1);
});

it("skips a rule whose selector is missing instead of throwing", async () => {
  getPluginDropDownListByNamespace.mockResolvedValue({
    code: 200,
    data: [{ id: "plugin-1", name: "Plugin" }],
  });
  getAllSelectors.mockResolvedValue(pageResponse([]));
  getAllRules.mockResolvedValue(
    pageResponse([{ id: "rule-1", name: "Rule", selectorId: "missing" }]),
  );
  const component = makeComponent();

  await expect(component.getAllRule()).resolves.toBeUndefined();

  expect(component.state.ruleTree).toEqual([]);
  expect(message.warn).toHaveBeenCalled();
});

it("skips a selector whose plugin is missing instead of throwing", async () => {
  getPluginDropDownListByNamespace.mockResolvedValue({ code: 200, data: [] });
  getAllSelectors.mockResolvedValue(
    pageResponse([
      { id: "selector-1", name: "Selector", pluginId: "missing-plugin" },
    ]),
  );
  getAllRules.mockResolvedValue(
    pageResponse([{ id: "rule-1", name: "Rule", selectorId: "selector-1" }]),
  );
  const component = makeComponent();

  await expect(component.getAllRule()).resolves.toBeUndefined();

  expect(component.state.ruleTree).toEqual([]);
  expect(message.warn).toHaveBeenCalled();
});

it("warns when the fetched page is truncated", async () => {
  getPluginDropDownListByNamespace.mockResolvedValue({
    code: 200,
    data: [{ id: "plugin-1", name: "Plugin" }],
  });
  getAllSelectors.mockResolvedValue(
    pageResponse(
      [{ id: "selector-1", name: "Selector", pluginId: "plugin-1" }],
      10000,
    ),
  );
  getAllRules.mockResolvedValue(
    pageResponse([{ id: "rule-1", name: "Rule", selectorId: "selector-1" }]),
  );
  const component = makeComponent();

  await component.getAllRule();

  expect(component.state.ruleTree[0].title).toBe("Plugin");
  expect(message.warn).toHaveBeenCalled();
});

it("ignores an older response after the namespace changes", async () => {
  let resolveOldPlugins;
  getPluginDropDownListByNamespace
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOldPlugins = resolve;
        }),
    )
    .mockResolvedValueOnce({
      code: 200,
      data: [{ id: "plugin-2", name: "Plugin 2" }],
    });
  getAllSelectors.mockResolvedValue(
    pageResponse([
      { id: "selector-2", name: "Selector 2", pluginId: "plugin-2" },
    ]),
  );
  getAllRules.mockResolvedValue(
    pageResponse([{ id: "rule-2", name: "Rule 2", selectorId: "selector-2" }]),
  );

  const component = makeComponent("namespace-1");
  const oldRequest = component.getAllRule();

  component.state.currentNamespaceId = "namespace-2";
  const latestRequest = component.getAllRule();
  await latestRequest;

  expect(component.state.ruleTree[0].title).toBe("Plugin 2");

  resolveOldPlugins({
    code: 200,
    data: [{ id: "plugin-1", name: "Plugin 1" }],
  });
  await oldRequest;

  expect(component.state.ruleTree[0].title).toBe("Plugin 2");
  expect(getAllSelectors).toHaveBeenCalledTimes(1);
  expect(getAllRules).toHaveBeenCalledTimes(1);
});
