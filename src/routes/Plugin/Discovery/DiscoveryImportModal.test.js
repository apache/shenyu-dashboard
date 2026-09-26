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

import ConnectedDiscoveryImportModal, {
  mapStateToProps,
} from "./DiscoveryImportModal";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const DiscoveryImportModal = ConnectedDiscoveryImportModal.WrappedComponent;

it("maps the active namespace from global state", () => {
  expect(
    mapStateToProps({
      discovery: { list: [] },
      global: { currentNamespaceId: "namespace-1" },
    }),
  ).toEqual({
    discovery: { list: [] },
    currentNamespaceId: "namespace-1",
  });
});

it("fetches discovery config in the active namespace", () => {
  const dispatch = jest.fn();
  const component = new DiscoveryImportModal({
    dispatch,
    pluginName: "divide",
    currentNamespaceId: "namespace-1",
  });
  component.setState = jest.fn();

  component.componentDidMount();

  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "discovery/fetchDiscovery",
      payload: {
        pluginName: "divide",
        level: "1",
        namespaceId: "namespace-1",
      },
      callback: expect.any(Function),
    }),
  );
});
