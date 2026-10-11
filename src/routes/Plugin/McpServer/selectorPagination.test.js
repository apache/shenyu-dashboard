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

import ConnectedMcpServer from "./index";

jest.mock("react-json-view", () => () => null);
jest.mock("../Common/Selector", () => () => null);
jest.mock("./ToolsModal", () => () => null);
jest.mock("./JsonEditModal", () => () => null);
jest.mock("./McpConfigModal", () => () => null);
jest.mock("./SwaggerImportModal", () => () => null);
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

const McpServer = ConnectedMcpServer.WrappedComponent;

it("resets tool pagination and uses tool page size when selecting a selector", () => {
  const dispatch = jest.fn();
  const component = new McpServer({
    dispatch,
    currentNamespaceId: "namespace-1",
  });
  component.state = {
    ...component.state,
    selectorPageSize: 12,
    toolPage: 3,
    toolPageSize: 20,
  };
  component.setState = (update) => {
    component.state = { ...component.state, ...update };
  };

  component.rowClick({ id: "selector-1" });

  expect(component.state.toolPage).toBe(1);
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
