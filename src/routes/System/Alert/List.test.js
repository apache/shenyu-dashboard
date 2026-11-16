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
  act,
  waitFor,
} from "@testing-library/react";
import { AlertComponent } from "./index";

jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      typeof children === "function" ? children({}) : children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));
jest.mock("../../../components/ui/feedback", () => ({
  message: { warn: jest.fn(), destroy: jest.fn() },
}));
jest.mock("./AddModal", () => (props) => (
  <div>
    <button
      type="button"
      onClick={() => props.handleOk({ name: "new", type: 1, enable: false })}
    >
      Save receiver
    </button>
    <button type="button" onClick={props.handleCancel}>
      Cancel receiver
    </button>
  </div>
));
const receiver = {
  id: "receiver-1",
  name: "Receiver",
  type: 1,
  email: "test@example.invalid",
  enable: true,
  dateUpdated: "2026-11-14 12:00:00",
};
function setup() {
  const dispatch = jest.fn();
  render(
    <AlertComponent
      alert={{ alertList: [receiver], total: 30 }}
      dispatch={dispatch}
      currentNamespaceId="ns-1"
      language="en-US"
      loading={false}
    />,
  );
  return dispatch;
}
it("loads and changes pages in the active namespace", () => {
  const dispatch = setup();
  expect(dispatch).toHaveBeenCalledWith({
    type: "alert/fetch",
    payload: { currentPage: 1, pageSize: 12, namespaceId: "ns-1" },
  });
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({
    type: "alert/fetch",
    payload: { currentPage: 2, pageSize: 12, namespaceId: "ns-1" },
  });
});
it("retains the receiver and namespace in a boolean status update", () => {
  const dispatch = setup();
  fireEvent.click(screen.getByRole("switch"));
  const action = dispatch.mock.calls.at(-1)[0];
  expect(action.type).toBe("alert/update");
  expect(action.payload).toEqual({
    ...receiver,
    enable: false,
    namespaceId: "ns-1",
  });
  dispatch.mockClear();
  act(() => action.callback());
  expect(dispatch).toHaveBeenCalledTimes(1);
});
it("opens the correct receiver and preserves detail fields on edit", () => {
  const dispatch = setup();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.EDITOR"));
  const fetch = dispatch.mock.calls.at(-1)[0];
  expect(fetch.payload).toEqual({ id: receiver.id });
  act(() => fetch.callback({ ...receiver, labels: { team: "gateway" } }));
  fireEvent.click(screen.getByText("Save receiver"));
  const update = dispatch.mock.calls.at(-1)[0];
  expect(update.type).toBe("alert/update");
  expect(update.payload).toEqual(
    expect.objectContaining({
      id: receiver.id,
      name: "new",
      labels: { team: "gateway" },
      namespaceId: "ns-1",
    }),
  );
});
it("adds in the active namespace and cancels without fetching", () => {
  const dispatch = setup();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.ADDDATA"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Cancel receiver"));
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.ADDDATA"));
  fireEvent.click(screen.getByText("Save receiver"));
  expect(dispatch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: "alert/add",
      payload: { name: "new", type: 1, enable: false, namespaceId: "ns-1" },
    }),
  );
});
it("selects without fetching and deletes only the chosen ID", () => {
  const dispatch = setup();
  dispatch.mockClear();
  fireEvent.click(
    within(screen.getByText("Receiver").closest("tr")).getByRole("checkbox"),
  );
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.DELETEDATA"));
  fireEvent.click(screen.getByText("SHENYU.COMMON.SURE"));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "alert/delete",
      payload: { list: [receiver.id] },
      fetchValue: { currentPage: 1, pageSize: 12, namespaceId: "ns-1" },
    }),
  );
});

it("resets page size to page one with one namespaced request", async () => {
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
    type: "alert/fetch",
    payload: { currentPage: 1, pageSize: 20, namespaceId: "ns-1" },
  });
});
