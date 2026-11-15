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
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import Registry from "./index";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
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
const data = [
  {
    id: "row-a",
    key: "row-a",
    registryId: "alpha",
    protocol: "zookeeper",
    address: "127.0.0.1:2181",
    username: "reader",
    namespace: "ns",
    group: "group",
    password: "not-rendered-password",
  },
  {
    id: "row-b",
    key: "row-b",
    registryId: "beta",
    protocol: "nacos",
    address: "127.0.0.1:8848",
  },
];
function setup() {
  const dispatch = jest.fn();
  const ref = React.createRef();
  render(
    <Registry
      ref={ref}
      registry={{ registryList: data, total: 40 }}
      language="en-US"
      loading={false}
      dispatch={dispatch}
    />,
  );
  return { dispatch, ref };
}

it("renders protocol and configuration fields without exposing a password", () => {
  setup();
  expect(screen.getByText("ZOOKEEPER")).toBeTruthy();
  expect(screen.getByText("127.0.0.1:2181")).toBeTruthy();
  expect(screen.getByText("reader")).toBeTruthy();
  expect(screen.queryByText("not-rendered-password")).toBeNull();
});

it("applies ID and address filters on query", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.REGISTRY.REGISTRY_ID"), {
    target: { value: "alpha" },
  });
  fireEvent.change(screen.getByPlaceholderText("SHENYU.REGISTRY.ADDRESS"), {
    target: { value: "2181" },
  });
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }));
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({
    type: "registry/fetch",
    payload: {
      registryId: "alpha",
      address: "2181",
      currentPage: 1,
      pageSize: 12,
    },
  });
});

it("looks up edit details using the row ID", () => {
  const { dispatch } = setup();
  const row = screen.getByText("alpha", { exact: true }).closest("tr");
  fireEvent.click(within(row).getByText("SHENYU.SYSTEM.EDITOR"));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "registry/getDetail",
      payload: { id: "row-a" },
    }),
  );
});

it("confirms only selected registry row IDs", () => {
  const { dispatch } = setup();
  fireEvent.click(
    within(screen.getByText("beta", { exact: true }).closest("tr")).getByRole(
      "checkbox",
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.COMMON.DELETE.NAME" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "registry/delete",
      payload: { list: ["row-b"] },
    }),
  );
});

it("requests the next server page once", () => {
  const { dispatch } = setup();
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "registry/fetch",
      payload: expect.objectContaining({ currentPage: 2, pageSize: 12 }),
    }),
  );
});

it("resets a size change to page one with one request", async () => {
  const { dispatch } = setup();
  fireEvent.click(screen.getByLabelText("Next"));
  fireEvent.click(screen.getByLabelText("Next"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "registry/fetch",
      payload: expect.objectContaining({ currentPage: 1, pageSize: 20 }),
    }),
  );
});

it("cancels a dialog without an unrelated refresh", () => {
  const { dispatch, ref } = setup();
  dispatch.mockClear();
  act(() => ref.current.closeModal());
  expect(dispatch).not.toHaveBeenCalled();
});

it("lets the model reload the cleared first-page query after creation", () => {
  const { dispatch, ref } = setup();
  act(() =>
    ref.current.setState({
      currentPage: 3,
      registryId: "filtered",
      address: "localhost",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.SYSTEM.ADDDATA" }),
  );
  dispatch.mockClear();
  ref.current.state.popup.props.handleOk({
    registryId: "new",
    protocol: "zookeeper",
    address: "localhost:2181",
  });
  const action = dispatch.mock.calls[0][0];
  expect(action.fetchValue).toEqual({
    registryId: "",
    address: "",
    currentPage: 1,
    pageSize: 12,
  });
  act(() => action.callback());
  expect(
    dispatch.mock.calls.some(([item]) => item.type === "registry/fetch"),
  ).toBe(false);
  expect(ref.current.state.currentPage).toBe(1);
});

it("retains filters for the post-deletion refresh", () => {
  const { dispatch } = setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.REGISTRY.REGISTRY_ID"), {
    target: { value: "beta" },
  });
  fireEvent.change(screen.getByPlaceholderText("SHENYU.REGISTRY.ADDRESS"), {
    target: { value: "8848" },
  });
  fireEvent.click(
    within(screen.getByText("beta", { exact: true }).closest("tr")).getByRole(
      "checkbox",
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.COMMON.DELETE.NAME" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "registry/delete",
      fetchValue: {
        registryId: "beta",
        address: "8848",
        currentPage: 1,
        pageSize: 12,
      },
    }),
  );
});
