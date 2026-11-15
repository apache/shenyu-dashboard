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

import ConnectedSelectorCopy from "./SelectorCopy";
import {
  findSelector,
  getAllSelectors,
  getPluginDropDownListByNamespace,
} from "../../../services/api";

jest.mock("../../../services/api", () => ({
  findSelector: jest.fn(),
  getAllSelectors: jest.fn(),
  getPluginDropDownListByNamespace: jest.fn(),
}));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "default",
}));
function make() {
  const c = new ConnectedSelectorCopy.WrappedComponent({
    currentNamespaceId: "destination",
    namespaces: [],
    onOk: jest.fn(),
    onCancel: jest.fn(),
  });
  c.setState = (patch, cb) => {
    c.state = { ...c.state, ...patch };
    if (cb) cb();
  };
  return c;
}
beforeEach(() => {
  getPluginDropDownListByNamespace.mockResolvedValue({ code: 200, data: [] });
  getAllSelectors.mockResolvedValue({
    code: 200,
    data: { dataList: [], page: { totalCount: 0 } },
  });
  findSelector.mockResolvedValue({ code: 200, data: { id: "source" } });
});
it("clears old tree and selection when changing source namespace", () => {
  const c = make();
  c.state.value = "old";
  c.state.selectorTree = [{ title: "Old" }];
  c.getAllSelectors = jest.fn();
  c.handleNamespacesValueChange({ key: "source-ns" });
  expect(c.state.value).toBeUndefined();
  expect(c.state.selectorTree).toEqual([]);
});
it("fetches details in the selected source namespace rather than destination", async () => {
  const c = make();
  c.state.currentNamespaceId = "source-ns";
  c.state.value = "source";
  await c.handleOk();
  expect(findSelector).toHaveBeenCalledWith({
    id: "source",
    namespaceId: "source-ns",
  });
  expect(c.props.onOk).toHaveBeenCalledWith({ id: "source" });
});
it("does not submit a detail response after cancel", async () => {
  let resolve;
  findSelector.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const c = make();
  c.state.value = "source";
  const request = c.handleOk();
  c.handleCancel();
  resolve({ code: 200, data: { id: "source" } });
  await request;
  expect(c.props.onOk).not.toHaveBeenCalled();
});
it("does not fetch details without a selection", async () => {
  const c = make();
  await c.handleOk();
  expect(findSelector).not.toHaveBeenCalled();
});
it("ignores an obsolete source list", async () => {
  let resolve;
  getPluginDropDownListByNamespace.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const c = make();
  const first = c.getAllSelectors();
  c.state.currentNamespaceId = "next";
  await c.getAllSelectors();
  resolve({ code: 200, data: [{ id: "p", name: "old" }] });
  await first;
  expect(getAllSelectors).toHaveBeenCalledTimes(1);
});
