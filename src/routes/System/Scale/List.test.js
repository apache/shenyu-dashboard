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
import ConnectedScale from "./index";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
  getCurrentLocale: jest.fn(),
}));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children, perms, noAuth }) =>
      mockDenied.has(perms)
        ? noAuth || null
        : typeof children === "function"
          ? children({ icon: "edit" })
          : children,
);
const mockDenied = new Set();
beforeEach(() => mockDenied.clear());
const Scale = ConnectedScale.WrappedComponent;
const rule = {
  id: "rule-1",
  metricName: "fixture",
  type: 0,
  status: 0,
  sort: 0,
  minimum: 0,
  maximum: 0,
};
function mount() {
  const dispatch = jest.fn();
  render(
    <Scale
      dispatch={dispatch}
      scale={{ ruleList: [rule], total: 30, policyList: [] }}
    />,
  );
  dispatch.mockClear();
  return dispatch;
}
it("toggles a rule with the same identity and numeric status", () => {
  const dispatch = mount();
  fireEvent.click(screen.getByRole("switch"));
  expect(dispatch.mock.calls[0][0]).toMatchObject({
    type: "scale/updateRule",
    payload: { ...rule, status: 1 },
  });
});
it("selecting a row does not fetch or update anything", () => {
  const dispatch = mount();
  const row = screen.getByText("fixture").closest("tr");
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(dispatch).not.toHaveBeenCalled();
});
it("shows numeric zero bounds rather than the missing-value label", () => {
  mount();
  const row = screen.getByText("fixture").closest("tr");
  expect(within(row).getAllByText("0")).toHaveLength(3);
});
it("preserves active filters when deleting selected rules", () => {
  const dispatch = jest.fn();
  const c = new Scale({
    dispatch,
    scale: { ruleList: [rule], total: 1, policyList: [] },
  });
  c.state = {
    ...c.state,
    metricName: "cpu",
    type: "0",
    status: "0",
    selectedRowKeys: ["rule-1"],
  };
  c.deleteClick();
  expect(dispatch.mock.calls[0][0].fetchValue).toMatchObject({
    metricName: "cpu",
    type: "0",
    status: "0",
  });
});

it("changes page size with one query and searches on Enter", async () => {
  const dispatch = mount();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  expect(dispatch.mock.calls).toHaveLength(1);
  expect(dispatch.mock.calls[0][0].payload).toMatchObject({
    currentPage: 1,
    pageSize: 20,
  });
  dispatch.mockClear();
  const input = screen.getByPlaceholderText(
    "SHENYU.SYSTEM.SCALE.SEARCH.CONFIG_NAME",
  );
  fireEvent.change(input, { target: { value: "cpu" } });
  fireEvent.submit(input.closest("form"));
  expect(dispatch.mock.calls).toHaveLength(1);
  expect(dispatch.mock.calls[0][0].payload).toMatchObject({
    metricName: "cpu",
    currentPage: 1,
    pageSize: 20,
  });
});
it("returns the pager to the preceding page only after successful deletion", () => {
  const dispatch = jest.fn();
  const c = new Scale({
    dispatch,
    scale: { ruleList: [rule], total: 13, policyList: [] },
  });
  c.state = { ...c.state, currentPage: 2, selectedRowKeys: ["rule-1"] };
  c.setState = (patch) => {
    c.state = { ...c.state, ...patch };
  };
  c.deleteClick();
  expect(c.state.currentPage).toBe(2);
  expect(dispatch.mock.calls[0][0].fetchValue.currentPage).toBe(1);
  act(() => dispatch.mock.calls[0][0].callback());
  expect(c.state.currentPage).toBe(1);
  expect(c.state.selectedRowKeys).toEqual([]);
});

it("keeps rule status read-only without edit permission", () => {
  mockDenied.add("system:scale:edit");
  const dispatch = mount();
  expect(screen.getByRole("switch").disabled).toBe(true);
  fireEvent.click(screen.getByRole("switch"));
  expect(dispatch).not.toHaveBeenCalled();
});

it("renders complete policy times and keeps their existing status-update format", () => {
  const dispatch = jest.fn();
  const policy = {
    id: "2",
    num: 0,
    sort: 0,
    status: 0,
    beginTime: "2026-11-15 12:00:00",
    endTime: "2026-11-15 13:00:00",
  };
  render(
    <Scale
      dispatch={dispatch}
      scale={{ ruleList: [], total: 0, policyList: [policy] }}
    />,
  );
  expect(screen.getByText(policy.beginTime)).toBeTruthy();
  expect(screen.getByText(policy.endTime)).toBeTruthy();
  dispatch.mockClear();
  fireEvent.click(screen.getByRole("switch"));
  expect(dispatch.mock.calls[0][0]).toMatchObject({
    type: "scale/updatePolicy",
    payload: {
      id: "2",
      num: 0,
      status: 1,
      beginTime: "2026-11-15T12:00:00Z",
      endTime: "2026-11-15T13:00:00Z",
    },
  });
});
