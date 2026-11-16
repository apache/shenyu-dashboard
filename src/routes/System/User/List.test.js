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
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import Manage from "./index";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children, perms, noAuth }) =>
      mockDenied.has(perms)
        ? noAuth || null
        : typeof children === "function"
          ? children({})
          : children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));
jest.mock("../../../components/ui/feedback", () => ({
  message: { warn: jest.fn(), destroy: jest.fn() },
}));
jest.mock("./DataPermModal", () => (props) => (
  <div data-testid="permissions">{props.userId}</div>
));
const mockDenied = new Set();
beforeEach(() => mockDenied.clear());

const users = [
  { id: "root", key: "root", userName: "admin", enabled: true },
  { id: "member", key: "member", userName: "member", enabled: true },
];
function setup() {
  const dispatch = jest.fn();
  render(
    <Manage
      manage={{ userList: users, total: 30 }}
      role={{ allRoles: [{ id: "reader", roleName: "Reader" }] }}
      loading={false}
      language="en-US"
      dispatch={dispatch}
    />,
  );
  return dispatch;
}

it("protects the admin checkbox, status and action controls", () => {
  const dispatch = setup();
  const row = screen.getByText("admin", { exact: true }).closest("tr");
  expect(within(row).getByRole("checkbox").disabled).toBe(true);
  expect(within(row).getByRole("switch").disabled).toBe(true);
  expect(within(row).queryByText("SHENYU.SYSTEM.EDITOR")).toBeNull();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.DELETEDATA" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "manage/delete",
      payload: { list: ["member"] },
    }),
  );
});

it("dispatches a boolean status change for the chosen user", () => {
  const dispatch = setup();
  fireEvent.click(
    within(screen.getByText("member", { exact: true }).closest("tr")).getByRole(
      "switch",
    ),
  );
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "manage/updateUserStatus",
      payload: { id: "member", userName: "member", enabled: false },
    }),
  );
});

it("opens edit and permission configuration for the correct user", () => {
  const dispatch = setup();
  const row = screen.getByText("member", { exact: true }).closest("tr");
  fireEvent.click(within(row).getByText("SHENYU.SYSTEM.EDITOR"));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "manage/fetchItem",
      payload: { id: "member" },
    }),
  );
  fireEvent.click(
    within(row).getByText("SHENYU.BUTTON.DATA.PERMISSION.CONFIG"),
  );
  expect(screen.getByTestId("permissions").textContent).toBe("member");
});

it("queries by user name on submit and changes pages once", () => {
  const dispatch = setup();
  dispatch.mockClear();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.SYSTEM.USER.NAME"), {
    target: { value: "member" },
  });
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }));
  expect(dispatch).toHaveBeenLastCalledWith({
    type: "manage/fetch",
    payload: { userName: "member", currentPage: 1, pageSize: 12 },
  });
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "manage/fetch",
      payload: expect.objectContaining({ currentPage: 2 }),
    }),
  );
});

it("resets a page-size change once", async () => {
  const dispatch = setup();
  fireEvent.click(screen.getByLabelText("Next"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
  expect(dispatch).toHaveBeenCalledWith({
    type: "manage/fetch",
    payload: { userName: "", currentPage: 1, pageSize: 20 },
  });
});

it("renders read-only status without edit permission", () => {
  mockDenied.add("system:manager:edit");
  setup();
  const row = screen.getByText("member", { exact: true }).closest("tr");
  expect(within(row).queryByRole("switch")).toBeNull();
  expect(within(row).getByText("SHENYU.COMMON.OPEN")).toBeTruthy();
  expect(within(row).queryByText("SHENYU.SYSTEM.EDITOR")).toBeNull();
});
