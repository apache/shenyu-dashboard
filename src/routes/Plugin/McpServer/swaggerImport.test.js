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

it("passes the active selector context to Swagger import refresh", () => {
  const dispatch = jest.fn();
  const component = new McpServer({
    dispatch,
    currentNamespaceId: "namespace-1",
    plugins: [
      {
        name: "mcpServer",
        pluginId: "plugin-1",
      },
    ],
  });

  component.state = {
    ...component.state,
    selectorPage: 3,
    selectorPageSize: 20,
    selectorName: "orders",
  };
  component.setState = (update) => {
    const next =
      typeof update === "function"
        ? update(component.state, component.props)
        : update;
    component.state = { ...component.state, ...next };
  };

  component.swaggerImportClick();
  component.state.popup.props.handleOk({
    swaggerUrl: "https://example.test/openapi.json",
    projectName: "example",
  });

  expect(dispatch).toHaveBeenCalledWith({
    type: "mcpServer/swaggerImport",
    payload: {
      swaggerUrl: "https://example.test/openapi.json",
      projectName: "example",
      namespaceId: "namespace-1",
    },
    fetchValue: {
      pluginId: "plugin-1",
      currentPage: 3,
      pageSize: 20,
      name: "orders",
      namespaceId: "namespace-1",
    },
    callback: expect.any(Function),
  });

  dispatch.mock.calls[0][0].callback();
  expect(component.state.popup).toBe("");
});
