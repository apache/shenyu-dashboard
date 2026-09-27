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

import ConnectedDiscoveryProxy from "./index";

jest.mock("./ProxySelectorModal", () => () => null);
jest.mock("./DiscoveryCard", () => () => null);
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

const DiscoveryProxy = ConnectedDiscoveryProxy.WrappedComponent;

it("includes the active namespace when refreshing after delete", () => {
  const dispatch = jest.fn();
  const component = new DiscoveryProxy({
    currentNamespaceId: "namespace-1",
    currentPage: 3,
    pageSize: 20,
    dispatch,
  });

  component.handleDelete("selector-1");

  expect(dispatch).toHaveBeenCalledWith({
    type: "discovery/delete",
    payload: {
      list: ["selector-1"],
    },
    fetchValue: {
      currentPage: 3,
      pageSize: 20,
      namespaceId: "namespace-1",
    },
  });
});

it("includes the active namespace when refreshing after add", () => {
  const dispatch = jest.fn();
  const component = new DiscoveryProxy({
    currentNamespaceId: "namespace-1",
    currentPage: 2,
    pageSize: 12,
    dispatch,
    plugins: [{ name: "tcp", id: "plugin-1" }],
    typeEnums: [],
  });
  component.setState = (update) => {
    component.state = { ...component.state, ...update };
  };

  component.addSelector();

  const fetchAction = dispatch.mock.calls[0][0];
  fetchAction.callback(null);
  component.state.popup.props.handleOk({
    name: "selector",
    forwardPort: 9000,
    props: {},
    listenerNode: "",
    handler: {},
    discoveryProps: "{}",
    serverList: "",
    selectedDiscoveryType: "local",
    upstreams: [],
  });

  const addAction = dispatch.mock.calls[1][0];
  expect(addAction.fetchValue).toEqual({
    currentPage: 2,
    pageSize: 12,
    namespaceId: "namespace-1",
  });
});
