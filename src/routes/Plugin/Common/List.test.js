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
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { runSaga } from "redux-saga";
import { call, put } from "redux-saga/effects";
import common from "../../../models/common";
import { deleteSelector } from "../../../services/api";
import ConnectedCommon from "./index";

jest.mock("../../../services/api", () => ({ deleteSelector: jest.fn() }));

jest.mock("./Selector", () => () => null);
jest.mock("./Rule", () => () => null);
jest.mock("../AiProxy/ApiKeys", () => () => null);
jest.mock("../../../utils/namespacePlugin", () => ({
  getUpdateModal: jest.fn(),
  updateNamespacePluginsEnabledByNamespace: jest.fn(),
}));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      typeof children === "function" ? children({ icon: "edit" }) : children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
  getCurrentLocale: jest.fn(),
}));
const Common = ConnectedCommon.WrappedComponent;
function mount() {
  const dispatch = jest.fn();
  const selectors = [
    { id: "s1", name: "Selector One", sort: 1, enabled: true },
    { id: "s2", name: "Selector Two", sort: 2, enabled: false },
  ];
  render(
    <Common
      dispatch={dispatch}
      plugins={[{ pluginId: "5", name: "divide", config: "{}", enabled: true }]}
      currentNamespaceId="ns"
      match={{ params: { id: "divide", index: "Proxy" } }}
      selectorList={selectors}
      selectorTotal={30}
      ruleList={[
        { id: "r1", name: "Rule One", sort: 1, enabled: false, handle: "{}" },
      ]}
      ruleTotal={30}
      currentSelector={selectors[0]}
    />,
  );
  dispatch.mockClear();
  return dispatch;
}
it("checkbox and status controls do not activate a selector row", () => {
  const dispatch = mount();
  const row = screen.getByText("Selector Two").closest("tr");
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(within(row).getByRole("switch"));
  expect(dispatch.mock.calls.map((c) => c[0].type)).toEqual([
    "common/enableSelector",
  ]);
});
it("row activation fetches rules, while the edit button only fetches detail", () => {
  const dispatch = mount();
  const row = screen.getByText("Selector Two").closest("tr");
  fireEvent.click(screen.getByText("Selector Two"));
  expect(dispatch.mock.calls.map((c) => c[0].type)).toEqual([
    "common/saveCurrentSelector",
    "common/fetchRule",
  ]);
  dispatch.mockClear();
  fireEvent.click(
    within(row).getByRole("button", { name: "SHENYU.COMMON.CHANGE" }),
  );
  expect(dispatch.mock.calls).toHaveLength(1);
  expect(dispatch.mock.calls[0][0].type).toBe("common/fetchSeItem");
});
it("changes selector page size with one query and keeps namespace", async () => {
  const dispatch = mount();
  fireEvent.click(
    screen.getAllByText("Items per page: 12", { exact: true })[0],
  );
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  expect(dispatch.mock.calls).toHaveLength(1);
  expect(dispatch.mock.calls[0][0]).toMatchObject({
    type: "common/fetchSelector",
    payload: { currentPage: 1, pageSize: 20, namespaceId: "ns" },
  });
});
it("submits the current rule search on Enter", () => {
  const dispatch = mount();
  const search = screen.getByPlaceholderText("SHENYU.PLUGIN.SEARCH.RULE.NAME");
  fireEvent.change(search, { target: { value: "needle" } });
  fireEvent.submit(search.closest("form"));
  expect(dispatch).toHaveBeenCalledWith({
    type: "common/fetchRule",
    payload: {
      selectorId: "s1",
      currentPage: 1,
      pageSize: 12,
      name: "needle",
      namespaceId: "ns",
    },
  });
});

it.each([
  { result: "accepted", code: 200, whenSelected: "before" },
  { result: "rejected", code: 400, whenSelected: "before" },
  { result: "accepted", code: 200, whenSelected: "during" },
  { result: "rejected", code: 400, whenSelected: "during" },
])(
  "keeps the selection made $whenSelected a delete request that is $result",
  async ({ code, whenSelected }) => {
    const dispatch = mount();
    let finishDelete;
    deleteSelector.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishDelete = resolve;
        }),
    );
    let deletion;
    dispatch.mockImplementation((action) => {
      if (action.type === "common/deleteSelector") {
        deletion = runSaga(
          { dispatch: jest.fn() },
          common.effects.deleteSelector,
          action,
          { call, put },
        );
      }
    });

    const first = within(screen.getByText("Selector One").closest("tr"));
    const second = within(screen.getByText("Selector Two").closest("tr"));
    const firstCheckbox = first.getByRole("checkbox");
    const secondCheckbox = second.getByRole("checkbox");
    fireEvent.click(firstCheckbox);
    if (whenSelected === "before") {
      fireEvent.click(secondCheckbox);
    }
    fireEvent.click(
      first.getByRole("button", { name: "SHENYU.COMMON.DELETE.NAME" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
    expect(deleteSelector).toHaveBeenCalledWith({
      list: ["s1"],
      namespaceId: "ns",
    });
    expect(firstCheckbox.checked).toBe(true);
    expect(secondCheckbox.checked).toBe(whenSelected === "before");

    if (whenSelected === "during") {
      fireEvent.click(secondCheckbox);
    }
    await act(async () => {
      finishDelete({ code, message: "test result" });
      await deletion.done;
    });
    expect(firstCheckbox.checked).toBe(code !== 200);
    expect(secondCheckbox.checked).toBe(true);
  },
);
