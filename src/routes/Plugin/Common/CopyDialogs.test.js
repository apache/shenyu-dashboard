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
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SelectorCopy from "./SelectorCopy";
import RuleCopy from "./RuleCopy";
import {
  findRule,
  findSelector,
  getAllRules,
  getAllSelectors,
  getPluginDropDownListByNamespace,
} from "../../../services/api";

jest.mock("../../../services/api", () => ({
  findRule: jest.fn(),
  findSelector: jest.fn(),
  getAllRules: jest.fn(),
  getAllSelectors: jest.fn(),
  getPluginDropDownListByNamespace: jest.fn(),
}));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "source-ns",
}));
const page = (dataList) => ({
  code: 200,
  data: { dataList, page: { totalCount: dataList.length } },
});
beforeEach(() => {
  getPluginDropDownListByNamespace.mockResolvedValue({
    code: 200,
    data: [{ id: "p", name: "Plugin parent" }],
  });
  getAllSelectors.mockResolvedValue(
    page([{ id: "s", name: "Source selector", pluginId: "p" }]),
  );
  getAllRules.mockResolvedValue(
    page([{ id: "r", name: "Source rule", selectorId: "s" }]),
  );
  findRule.mockResolvedValue({ code: 200, data: { id: "r", enabled: false } });
  findSelector.mockResolvedValue({
    code: 200,
    data: { id: "s", enabled: false },
  });
});
it.each([
  [SelectorCopy, "SELECTOR", "Source selector", "s"],
  [RuleCopy, "RULE", "Source rule", "r"],
])(
  "selects only a source leaf in the native copy dialog %#",
  async (Connected, kind, label, id) => {
    const Component = Connected.WrappedComponent;
    const onOk = jest.fn();
    render(
      <Component
        visible
        currentNamespaceId="source-ns"
        namespaces={[{ namespaceId: "source-ns", name: "Source namespace" }]}
        onOk={onOk}
      />,
    );
    await waitFor(() => expect(getAllSelectors).toHaveBeenCalled());
    fireEvent.click(screen.getByText(`SHENYU.${kind}.SOURCE.PLACEHOLDER`));
    fireEvent.click(await screen.findByText("Plugin parent"));
    expect(
      screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }).disabled,
    ).toBe(true);
    fireEvent.click(await screen.findByText(label));
    fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
    await waitFor(() =>
      expect(onOk).toHaveBeenCalledWith({ id, enabled: false }),
    );
  },
);
