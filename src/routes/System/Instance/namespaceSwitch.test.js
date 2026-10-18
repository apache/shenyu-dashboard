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

import ConnectedInstance from "./index";

jest.mock("echarts", () => ({ init: jest.fn() }));
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

const Instance = ConnectedInstance.WrappedComponent;

it("refreshes the table and the analysis when the namespace changes", () => {
  const dispatch = jest.fn();
  const instance = { pieData: [], lineData: [] };
  const prevProps = {
    dispatch,
    instance,
    language: "en-US",
    currentNamespaceId: "namespace-a",
  };
  const component = new Instance({
    ...prevProps,
    currentNamespaceId: "namespace-b",
  });

  component.componentDidUpdate(prevProps);

  expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
    {
      type: "instance/fetch",
      payload: expect.objectContaining({ namespaceId: "namespace-b" }),
    },
    {
      type: "instance/fetchAnalysis",
      payload: { namespaceId: "namespace-b" },
    },
  ]);
});
