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
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import ConnectedRole from "./index";

jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children, perms }) =>
      mockDenied.has(perms)
        ? null
        : typeof children === "function"
          ? children({})
          : children,
);
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../../../components/ui/feedback", () => ({
  message: { warn: jest.fn(), destroy: jest.fn() },
}));
jest.mock("./AddModal", () => (props) => (
  <div>
    <button
      type="button"
      onClick={() =>
        props.handleOk({
          id: props.sysRole?.id,
          roleName: "Reader",
          description: "read only",
          currentPermissionIds: ["menu", "read"],
        })
      }
    >
      Save role
    </button>
    <button type="button" onClick={props.handleCancel}>
      Cancel role
    </button>
  </div>
));
const Role = ConnectedRole.WrappedComponent;
const mockDenied = new Set();
beforeEach(() => mockDenied.clear());
function setup() {
  const dispatch = jest.fn();
  render(
    <Role
      role={{
        roleList: [
          {
            id: "role-1",
            key: "role-1",
            roleName: "Reader",
            description: "read only",
          },
        ],
        total: 30,
      }}
      resource={{}}
      dispatch={dispatch}
      language="en-US"
      loading={false}
    />,
  );
  return dispatch;
}
it("queries only on submit and requests the next page once", () => {
  const dispatch = setup();
  dispatch.mockClear();
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.SYSTEM.ROLE.INPUT.NAME"),
    { target: { value: "Reader" } },
  );
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.SEARCH"));
  expect(dispatch).toHaveBeenLastCalledWith({
    type: "role/fetch",
    payload: { roleName: "Reader", currentPage: 1, pageSize: 12 },
  });
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch.mock.calls[0][0].payload.currentPage).toBe(2);
});
it("keeps edit identity and permission IDs and leaves refresh to the model", () => {
  const dispatch = setup();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.EDITOR"));
  const fetch = dispatch.mock.calls.at(-1)[0];
  expect(fetch.payload).toEqual({ id: "role-1" });
  act(() =>
    fetch.callback({
      sysRole: { id: "role-1" },
      allPermissionInfo: {},
      rolePermissionList: [],
    }),
  );
  fireEvent.click(screen.getByText("Save role"));
  const update = dispatch.mock.calls.at(-1)[0];
  expect(update.type).toBe("role/update");
  expect(update.payload).toEqual({
    id: "role-1",
    roleName: "Reader",
    description: "read only",
    currentPermissionIds: ["menu", "read"],
  });
  dispatch.mockClear();
  act(() => update.callback());
  expect(dispatch).not.toHaveBeenCalled();
});
it("creates only the role definition and cancels without fetching", () => {
  const dispatch = setup();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.ADDDATA"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Cancel role"));
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.ADDDATA"));
  fireEvent.click(screen.getByText("Save role"));
  expect(dispatch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: "role/add",
      payload: { roleName: "Reader", description: "read only" },
    }),
  );
});
it("selects without querying and deletes only chosen IDs", () => {
  const dispatch = setup();
  dispatch.mockClear();
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.DELETEDATA"));
  fireEvent.click(screen.getByText("SHENYU.COMMON.SURE"));
  const action = dispatch.mock.calls.at(-1)[0];
  expect(action.type).toBe("role/delete");
  expect(action.payload).toEqual({ list: ["role-1"] });
  dispatch.mockClear();
  act(() => action.callback());
  expect(dispatch).not.toHaveBeenCalled();
});
it("hides edit without its permission", () => {
  mockDenied.add("system:role:edit");
  setup();
  expect(screen.queryByText("SHENYU.SYSTEM.EDITOR")).toBeNull();
});

it("resets page size once and keeps the role-name filter", async () => {
  const dispatch = setup();
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.SYSTEM.ROLE.INPUT.NAME"),
    { target: { value: "Reader" } },
  );
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.SEARCH"));
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
    type: "role/fetch",
    payload: { roleName: "Reader", currentPage: 1, pageSize: 20 },
  });
});
