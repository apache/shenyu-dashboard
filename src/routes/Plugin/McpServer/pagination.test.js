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
import { Table } from "antd";
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

const findElement = (node, predicate) => {
  if (!React.isValidElement(node)) {
    return null;
  }
  if (predicate(node)) {
    return node;
  }
  return React.Children.toArray(node.props.children).reduce(
    (match, child) => match || findElement(child, predicate),
    null,
  );
};

it("uses common.ruleTotal for tool table pagination", () => {
  const ruleList = [{ id: "tool-1" }];
  const component = new McpServer({
    currentSelector: null,
    dispatch: jest.fn(),
    plugins: [],
    ruleList,
    ruleTotal: 37,
    selectorList: [],
    selectorTotal: 0,
  });

  const tree = component.render();
  const toolTable = findElement(
    tree,
    (element) =>
      element.type === Table && element.props.dataSource === ruleList,
  );

  expect(toolTable).not.toBeNull();
  expect(toolTable.props.pagination.total).toBe(37);
});
