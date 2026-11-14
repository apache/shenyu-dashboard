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
  waitFor,
  within,
} from "@testing-library/react";
import RelateMetadata from "./RelateMetadata";

jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

const alpha = {
  id: "meta-alpha",
  path: "/orders",
  appName: "orders-app",
  enabled: true,
};
const beta = {
  id: "grant-beta",
  path: "/billing",
  appName: "billing-app",
  enabled: true,
};
const gamma = {
  id: "meta-gamma",
  path: "/users",
  appName: "users-app",
  enabled: true,
};
function setup(overrides = {}) {
  const props = {
    id: "auth-1",
    authName: "appKey: demo-app",
    auth: [{ ...beta }],
    dataList: [{ ...alpha }, { ...gamma }, { ...beta }],
    handleOk: jest.fn(),
    handleCancel: jest.fn(),
    ...overrides,
  };
  return { ...render(<RelateMetadata {...props} />), props };
}
function source() {
  return screen.getByRole("region", { name: "SHENYU.AUTH.RESOURCE.AVAILABLE" });
}
function target() {
  return screen.getByRole("region", { name: "appKey: demo-app" });
}
function mark(panel, path) {
  fireEvent.click(
    within(panel)
      .getByText(path, { exact: true })
      .closest("tr")
      .querySelector('input[type="checkbox"]'),
  );
}
function grant() {
  fireEvent.click(
    screen.getByRole("button", { name: /^SHENYU.AUTH.RESOURCE.GRANT/ }),
  );
}
function revoke() {
  fireEvent.click(
    screen.getByRole("button", { name: /^SHENYU.AUTH.RESOURCE.REMOVE/ }),
  );
}
function confirm() {
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
}
function submittedPaths(props) {
  return props.handleOk.mock.calls[0][0].authPathDTOList
    .map((row) => row.path)
    .sort();
}

it("separates available and already granted resources by path", () => {
  setup();
  expect(within(source()).getByText("/orders", { exact: true })).not.toBeNull();
  expect(within(source()).queryByText("/billing", { exact: true })).toBeNull();
  expect(
    within(target()).getByText("/billing", { exact: true }),
  ).not.toBeNull();
});

it("adds a selected path and submits the full grant set with the app-auth ID", () => {
  const { props } = setup();
  mark(source(), "/orders");
  grant();
  confirm();
  expect(submittedPaths(props)).toEqual(["/billing", "/orders"]);
  expect(props.handleOk.mock.calls[0][0].id).toBe("auth-1");
  expect(props.handleCancel).not.toHaveBeenCalled();
});

it("removes only selected grants while retaining the remaining set", () => {
  const { props } = setup({
    auth: [{ ...beta }, { ...gamma }],
    dataList: [{ ...alpha }, { ...beta }, { ...gamma }],
  });
  mark(target(), "/billing");
  revoke();
  confirm();
  expect(submittedPaths(props)).toEqual(["/users"]);
});

it("filters available rows by application name without hiding unrelated grants", async () => {
  setup();
  fireEvent.change(within(source()).getByRole("textbox"), {
    target: { value: "orders-app" },
  });
  await waitFor(() =>
    expect(within(source()).queryByText("/users", { exact: true })).toBeNull(),
  );
  expect(within(source()).getByText("/orders", { exact: true })).not.toBeNull();
  expect(
    within(target()).getByText("/billing", { exact: true }),
  ).not.toBeNull();
});

it("keeps grants that are hidden by a target search when adding another resource", () => {
  const { props } = setup();
  fireEvent.change(within(target()).getByRole("textbox"), {
    target: { value: "not-found" },
  });
  mark(source(), "/orders");
  grant();
  confirm();
  expect(submittedPaths(props)).toEqual(["/billing", "/orders"]);
});

it("keeps row marks across client-side pages before transferring", () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: `meta-${i}`,
    path: `/resource-${String(i).padStart(2, "0")}`,
    appName: "bulk-app",
    enabled: true,
  }));
  const { props } = setup({ auth: [rows[24]], dataList: rows });
  mark(source(), "/resource-00");
  fireEvent.click(within(source()).getByText("2", { exact: true }));
  mark(source(), "/resource-10");
  grant();
  confirm();
  expect(submittedPaths(props)).toEqual([
    "/resource-00",
    "/resource-10",
    "/resource-24",
  ]);
});

it("does not select a disabled available resource by clicking its row", () => {
  setup({ dataList: [{ ...alpha, disabled: true }, { ...beta }] });
  const row = within(source())
    .getByText("/orders", { exact: true })
    .closest("tr");
  expect(row.querySelector('input[type="checkbox"]').disabled).toBe(true);
  fireEvent.click(within(source()).getByText("/orders", { exact: true }));
  expect(
    screen.getByRole("button", { name: /^SHENYU.AUTH.RESOURCE.GRANT/ })
      .disabled,
  ).toBe(true);
  expect(within(target()).queryByText("/orders", { exact: true })).toBeNull();
});

it("cancels local draft changes without saving", () => {
  const { props } = setup();
  mark(source(), "/orders");
  grant();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  expect(props.handleCancel).toHaveBeenCalledTimes(1);
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("closes unchanged confirmation without replacing backend grants", () => {
  const { props } = setup();
  confirm();
  expect(props.handleOk).not.toHaveBeenCalled();
  expect(props.handleCancel).toHaveBeenCalledTimes(1);
});

it("preserves existing paths absent from the available metadata catalog", () => {
  const { props } = setup({ dataList: [{ ...alpha }] });
  mark(source(), "/orders");
  grant();
  confirm();
  expect(submittedPaths(props)).toEqual(["/billing", "/orders"]);
});

it("does not mutate resource or grant props", () => {
  const grants = Object.freeze([Object.freeze({ ...beta })]);
  const data = Object.freeze([
    Object.freeze({ ...alpha }),
    Object.freeze({ ...beta }),
  ]);
  expect(() => setup({ auth: grants, dataList: data })).not.toThrow();
});

it("blocks an empty grant set because the current backend rejects it", () => {
  const { props } = setup();
  mark(target(), "/billing");
  revoke();
  confirm();
  expect(props.handleOk).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain(
    "SHENYU.AUTH.RESOURCE.REQUIRED",
  );
});

it("resets the draft and app-auth ID when the record changes", () => {
  const result = setup();
  result.rerender(
    <RelateMetadata
      {...result.props}
      id="auth-2"
      auth={[{ ...gamma }]}
      dataList={[{ ...alpha }, { ...gamma }]}
    />,
  );
  mark(source(), "/orders");
  grant();
  confirm();
  expect(result.props.handleOk.mock.calls[0][0].id).toBe("auth-2");
  expect(submittedPaths(result.props)).toEqual(["/orders", "/users"]);
});

it("searches paths even when application names are missing", () => {
  setup({ dataList: [{ ...alpha, appName: null }, { ...beta }] });
  expect(() =>
    fireEvent.change(within(source()).getByRole("textbox"), {
      target: { value: "/orders" },
    }),
  ).not.toThrow();
  expect(within(source()).getByText("/orders", { exact: true })).not.toBeNull();
});

it("keeps all existing grant objects when multiple rows share a path", () => {
  const duplicate = { ...beta, id: "grant-other", appName: "other-app" };
  const { props } = setup({
    auth: [{ ...beta }, duplicate],
    dataList: [{ ...alpha }],
  });
  mark(source(), "/orders");
  grant();
  confirm();
  expect(
    props.handleOk.mock.calls[0][0].authPathDTOList
      .filter((row) => row.path === "/billing")
      .map((row) => row.appName),
  ).toEqual(["billing-app", "other-app"]);
});

it("keeps selected revocations across right-side pages", () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: `grant-${i}`,
    path: `/granted-${String(i).padStart(2, "0")}`,
    appName: "bulk-app",
    enabled: true,
  }));
  const { props } = setup({ auth: rows, dataList: rows });
  mark(target(), "/granted-00");
  fireEvent.click(within(target()).getByText("2", { exact: true }));
  mark(target(), "/granted-10");
  revoke();
  confirm();
  expect(submittedPaths(props)).toEqual(
    rows
      .filter((_, i) => i !== 0 && i !== 10)
      .map((row) => row.path)
      .sort(),
  );
});

it("preserves a disabled granted path while removing another grant", () => {
  const { props } = setup({
    auth: [{ ...beta, disabled: true }, { ...gamma }],
    dataList: [{ ...beta, disabled: true }, { ...gamma }],
  });
  fireEvent.click(within(target()).getByText("/billing", { exact: true }));
  expect(
    screen.getByRole("button", { name: /^SHENYU.AUTH.RESOURCE.REMOVE/ })
      .disabled,
  ).toBe(true);
  mark(target(), "/users");
  revoke();
  confirm();
  expect(submittedPaths(props)).toEqual(["/billing"]);
});

it("blocks replacement that would re-enable a retained disabled grant", () => {
  const { props } = setup({
    auth: [{ ...beta, enabled: false }],
    dataList: [{ ...alpha }, { ...beta, enabled: false }],
  });
  expect(
    within(target()).getByText("SHENYU.AUTH.RESOURCE.CONTAINS.DISABLED"),
  ).not.toBeNull();
  mark(source(), "/orders");
  grant();
  confirm();
  expect(props.handleOk).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain(
    "SHENYU.AUTH.RESOURCE.DISABLED.REPLACEMENT",
  );
});

it("closes an unchanged disabled grant set without posting it", () => {
  const { props } = setup({
    auth: [{ ...beta, enabled: false }],
    dataList: [{ ...beta, enabled: false }],
  });
  confirm();
  expect(props.handleOk).not.toHaveBeenCalled();
  expect(props.handleCancel).toHaveBeenCalledTimes(1);
});
