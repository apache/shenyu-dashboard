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
  waitFor,
  within,
} from "@testing-library/react";
import AddModal from "./AddModal";
import AddTable from "./AddTable";
import SearchContent from "./SearchContent";

jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      typeof children === "function" ? children({}) : children,
);
jest.mock("../../../components/ui/feedback", () => ({
  message: { error: jest.fn(), destroy: jest.fn() },
}));
const editProps = {
  id: "auth-fixture",
  appKey: "synthetic-app-key",
  appSecret: "synthetic-app-secret",
  userId: "fixture-user",
  phone: "000000",
  open: false,
  enabled: false,
  authParamList: [{ appName: "fixture-app", appParam: "0" }],
  authPathList: [{ id: "path-one", path: "/one", enabled: false }],
};
it("preserves readonly identity, false flags, parameter values and path status", async () => {
  const handleOk = jest.fn();
  render(<AddModal {...editProps} handleOk={handleOk} />);
  expect(screen.getByDisplayValue("synthetic-app-key").disabled).toBe(true);
  expect(screen.getByDisplayValue("synthetic-app-secret").disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      id: "auth-fixture",
      open: false,
      enabled: false,
      authParamList: editProps.authParamList,
      authPathList: editProps.authPathList,
    }),
  );
});
it("edits the intended path on a later client page without changing other flags", async () => {
  const paths = Array.from({ length: 12 }, (_, i) => ({
    id: `path-${i}`,
    path: `/p${i}`,
    enabled: i % 2 === 0,
  }));
  const handleOk = jest.fn();
  render(
    <AddModal
      {...editProps}
      open={true}
      authPathList={paths}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByText("2", { exact: true }));
  fireEvent.change(screen.getByDisplayValue("/p10"), {
    target: { value: "/changed" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  const rows = handleOk.mock.calls[0][0].authPathList;
  expect(rows[10]).toEqual({ id: "path-10", path: "/changed", enabled: true });
  expect(rows[0].path).toBe("/p0");
  expect(rows[11].enabled).toBe(false);
});
it("submits auth search only when requested", async () => {
  const onClick = jest.fn();
  render(<SearchContent onClick={onClick} />);
  fireEvent.change(screen.getByPlaceholderText("SHENYU.AUTH.INPUTAPPKEY"), {
    target: { value: "synthetic" },
  });
  fireEvent.change(screen.getByPlaceholderText("SHENYU.AUTH.TELPHONE"), {
    target: { value: "000" },
  });
  expect(onClick).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }));
  await waitFor(() =>
    expect(onClick).toHaveBeenCalledWith({ appKey: "synthetic", phone: "000" }),
  );
});
it("creates from grouped metadata with retained path strings and a false open flag", async () => {
  const handleOk = jest.fn();
  render(
    <AddTable
      metaGroup={{ FixtureApp: [{ path: "/from-group" }] }}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByText("SHENYU.AUTH.SELECT.APP", { exact: true }));
  fireEvent.click(await screen.findByText("FixtureApp", { exact: true }));
  fireEvent.change(screen.getByPlaceholderText("Phone"), {
    target: { value: "000" },
  });
  fireEvent.change(screen.getByPlaceholderText("UserId"), {
    target: { value: "fixture-user" },
  });
  fireEvent.click(screen.getByRole("switch"));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      appName: "FixtureApp",
      open: false,
      pathList: ["/from-group"],
    }),
  );
});
it("does not mutate loaded auth objects while editing a path", async () => {
  const paths = [
    Object.freeze({ id: "path-one", path: "/one", enabled: false }),
  ];
  const params = [Object.freeze({ appName: "fixture-app", appParam: "0" })];
  const handleOk = jest.fn();
  render(
    <AddModal
      {...editProps}
      open={true}
      authPathList={paths}
      authParamList={params}
      handleOk={handleOk}
    />,
  );
  fireEvent.change(screen.getByDisplayValue("/one"), {
    target: { value: "/changed" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(paths[0].path).toBe("/one");
  expect(handleOk.mock.calls[0][0].authPathList).toEqual([
    { id: "path-one", path: "/changed", enabled: false },
  ]);
});
it("accepts a typed custom app name on blur", async () => {
  const handleOk = jest.fn();
  render(<AddTable metaGroup={{}} handleOk={handleOk} />);
  fireEvent.click(screen.getByText("SHENYU.AUTH.SELECT.APP", { exact: true }));
  const search = document.querySelector(".semi-select-input input");
  fireEvent.change(search, { target: { value: "CustomApp" } });
  fireEvent.mouseDown(screen.getByPlaceholderText("Phone"));
  fireEvent.click(screen.getByPlaceholderText("Phone"));
  fireEvent.blur(search, {
    relatedTarget: screen.getByPlaceholderText("Phone"),
  });
  fireEvent.change(screen.getByPlaceholderText("Phone"), {
    target: { value: "000" },
  });
  fireEvent.change(screen.getByPlaceholderText("UserId"), {
    target: { value: "fixture-user" },
  });
  fireEvent.click(screen.getByRole("switch"));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({ appName: "CustomApp", open: false }),
  );
});

it("deletes the intended later-page path and keeps surviving IDs and flags", async () => {
  const paths = Array.from({ length: 12 }, (_, i) => ({
    id: `path-${i}`,
    path: `/p${i}`,
    enabled: i % 2 === 0,
  }));
  const handleOk = jest.fn();
  render(
    <AddModal
      {...editProps}
      open={true}
      authPathList={paths}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByText("2", { exact: true }));
  fireEvent.click(
    within(screen.getByDisplayValue("/p10").closest("tr")).getByText(
      "SHENYU.COMMON.DELETE.NAME",
    ),
  );
  fireEvent.click(
    (await screen.findAllByRole("button", { name: "SHENYU.COMMON.SURE" })).at(
      -1,
    ),
  );
  await waitFor(() => expect(screen.queryByDisplayValue("/p10")).toBeNull());
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "SHENYU.COMMON.SURE",
    }),
  );
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  const rows = handleOk.mock.calls[0][0].authPathList;
  expect(rows).toHaveLength(11);
  expect(rows.some((r) => r.id === "path-10")).toBe(false);
  expect(rows.find((r) => r.id === "path-11")).toEqual({
    id: "path-11",
    path: "/p11",
    enabled: false,
  });
  expect(paths).toHaveLength(12);
});
