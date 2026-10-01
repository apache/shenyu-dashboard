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

import ConnectedPlugin from "./Plugin";
import ConnectedNamespacePlugin from "./NamespacePlugin";
import ConnectedInstance from "./Instance";
import ConnectedRole from "./Role";
import ConnectedUser from "./User";
import ConnectedScale from "./Scale";
import ConnectedNamespace from "./Namespace";

jest.mock("./Plugin/AddModal", () => () => null);
jest.mock("./Role/AddModal", () => () => null);
jest.mock("./User/AddModal", () => () => null);
jest.mock("./User/DataPermModal", () => () => null);
jest.mock("./Scale/PolicyModal", () => () => null);
jest.mock("./Scale/RuleModal", () => () => null);
jest.mock("./Namespace/AddModal", () => () => null);
jest.mock(
  "../../utils/AuthButton",
  () =>
    ({ children }) =>
      children,
);
jest.mock("../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));
jest.mock("../../utils/AuthRoute", () => ({ refreshAuthMenus: jest.fn() }));
jest.mock("../../components/_utils/utils", () => ({
  defaultNamespaceId: "default",
}));

const makeComponent = (Connected) => {
  const dispatch = jest.fn();
  const component = new Connected.WrappedComponent({
    dispatch,
    currentNamespaceId: "namespace-1",
    namespace: { namespaceList: [] },
  });
  component.state = {
    ...component.state,
    currentPage: 3,
    pageSize: 50,
    selectedRowKeys: ["row-1"],
  };
  component.setState = (update, callback) => {
    component.state = { ...component.state, ...update };
    if (callback) callback();
  };
  return { component, dispatch };
};

it.each([
  [
    ConnectedPlugin,
    "searchOnNamechange",
    "name",
    { target: { value: "demo" } },
  ],
  [
    ConnectedPlugin,
    "searchOnRolechange",
    "role",
    { target: { value: "demo" } },
  ],
  [ConnectedPlugin, "enabledOnchange", "enabled", false],
  [
    ConnectedNamespacePlugin,
    "searchOnchange",
    "name",
    { target: { value: "demo" } },
  ],
  [ConnectedNamespacePlugin, "enabledOnchange", "enabled", false],
  [
    ConnectedInstance,
    "instanceIpOnchange",
    "instanceIp",
    { target: { value: "demo" } },
  ],
  [ConnectedInstance, "instanceTypeOnchange", "instanceType", "bootstrap"],
])(
  "resets page before querying (case %#)",
  (Connected, handler, field, input) => {
    const { component, dispatch } = makeComponent(Connected);
    component[handler](input);
    expect(component.state.currentPage).toBe(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({
        currentPage: 1,
        pageSize: 50,
        [field]: input && input.target ? input.target.value : input,
      }),
    );
  },
);

it.each([
  [ConnectedRole, "searchOnchange", "roleName"],
  [ConnectedUser, "searchOnchange", "userName"],
  [ConnectedScale, "searchMetricNameOnchange", "metricName"],
])(
  "queries page one when Search is clicked (case %#)",
  (Connected, handler, field) => {
    const { component, dispatch } = makeComponent(Connected);
    component[handler]({ target: { value: "demo" } });
    expect(dispatch).not.toHaveBeenCalled();
    component.searchClick();
    expect(component.state.currentPage).toBe(1);
    expect(dispatch.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({
        currentPage: 1,
        pageSize: 50,
        [field]: "demo",
      }),
    );
  },
);

it.each([ConnectedPlugin, ConnectedNamespacePlugin, ConnectedNamespace])(
  "preserves the selected page size and filters after deletion (case %#)",
  (Connected) => {
    const { component, dispatch } = makeComponent(Connected);
    component.state = {
      ...component.state,
      name: "demo",
      namespaceId: "filter-namespace",
    };
    component.deleteClick();
    expect(dispatch.mock.calls[0][0].fetchValue).toEqual(
      expect.objectContaining({
        currentPage: 3,
        pageSize: 50,
        name: "demo",
      }),
    );
  },
);
