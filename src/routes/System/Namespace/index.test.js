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

it("uses the namespaceId filter stored in component state", () => {
  const component = new Namespace({
    currentNamespaceId: "active-namespace",
  });

  component.state = {
    ...component.state,
    name: "demo",
    namespaceId: "searched-namespace",
    currentPage: 2,
    pageSize: 20,
  };

  expect(component.currentQueryPayload()).toEqual({
    name: "demo",
    namespaceId: "searched-namespace",
    currentPage: 2,
    pageSize: 20,
  });
});
