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

import ConnectedNamespace from "./index";

jest.mock("./AddModal", () => () => null);
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
jest.mock("../../../utils/AuthRoute", () => ({
  refreshAuthMenus: jest.fn(),
}));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "default",
}));

const Namespace = ConnectedNamespace.WrappedComponent;

const makeComponent = (props = {}) => {
  const component = new Namespace(props);
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

it("closes a cancelled modal without changing the current page", () => {
  const component = makeComponent({});
  component.state = {
    ...component.state,
    popup: "modal",
    currentPage: 4,
  };

  component.closeModal();

  expect(component.state.popup).toBe("");
  expect(component.state.currentPage).toBe(4);
});

it("deletes only the clicked namespace without mutating bulk selection", () => {
  const dispatch = jest.fn();
  const component = makeComponent({
    dispatch,
    currentNamespaceId: "active-namespace",
    namespace: {
      namespaceList: [
        { id: "row-1", namespaceId: "active-namespace" },
        { id: "bulk-1", namespaceId: "other-namespace" },
      ],
    },
  });
  component.state = {
    ...component.state,
    selectedRowKeys: ["bulk-1"],
    currentPage: 2,
    pageSize: 20,
  };

  component.deleteClick({ id: "row-1" });

  expect(component.state.selectedRowKeys).toEqual(["bulk-1"]);
  const action = dispatch.mock.calls[0][0];
  expect(action.type).toBe("namespace/delete");
  expect(action.payload.list).toEqual(["row-1"]);

  action.callback();

  expect(dispatch).toHaveBeenCalledWith({
    type: "global/saveCurrentNamespaceId",
    payload: "default",
  });
  expect(component.state.selectedRowKeys).toEqual([]);
});
