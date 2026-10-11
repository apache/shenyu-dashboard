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

import { AlertComponent, getAlertPageAfterDelete } from "./index";

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

it("moves back when deleting the final row on a later page", () => {
  expect(getAlertPageAfterDelete(13, 1, 2, 12)).toBe(1);
  expect(getAlertPageAfterDelete(25, 1, 3, 12)).toBe(2);
  expect(getAlertPageAfterDelete(30, 1, 2, 12)).toBe(2);
});

it("passes namespace and the existing page to the delete reload", () => {
  const dispatch = jest.fn();
  const component = new AlertComponent({
    dispatch,
    currentNamespaceId: "namespace-1",
    alert: {
      alertList: [{ id: "receiver-13" }],
      total: 13,
    },
  });
  component.state = {
    ...component.state,
    currentPage: 2,
    pageSize: 12,
    selectedRowKeys: ["receiver-13"],
  };
  component.setState = (update) => {
    component.state = { ...component.state, ...update };
  };

  component.deleteClick();

  const action = dispatch.mock.calls[0][0];
  expect(action.type).toBe("alert/delete");
  expect(action.fetchValue).toEqual({
    currentPage: 1,
    pageSize: 12,
    namespaceId: "namespace-1",
  });

  action.callback();
  expect(component.state.currentPage).toBe(1);
  expect(component.state.selectedRowKeys).toEqual([]);
});
