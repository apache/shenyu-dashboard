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
  waitFor,
} from "@testing-library/react";
import Header from "./index";
import { encryptCredentials } from "../../utils/passwordEncryption";
import { message } from "../ui/feedback";

jest.mock("../../utils/passwordEncryption", () => ({
  encryptCredentials: jest.fn(),
}));
jest.mock("../ui/feedback", () => ({
  message: { error: jest.fn(), warn: jest.fn(), success: jest.fn() },
}));

const envelope = {
  version: 1,
  keyId: "fixture-key",
  wrappedKey: "wrapped",
  iv: "iv",
  ciphertext: "ciphertext",
};
beforeEach(() => {
  encryptCredentials.mockReset().mockResolvedValue(envelope);
  message.error.mockClear();
});

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../runtime/router", () => ({
  withRouter: (Component) => Component,
}));
jest.mock("../../services/api", () => ({
  checkUserPassword: jest.fn().mockResolvedValue({ code: 200 }),
}));
jest.mock("../_utils/utils", () => ({ defaultNamespaceId: "default" }));
jest.mock("../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
  getCurrentLocale: jest.fn(),
}));
jest.mock("../../utils/emit", () => ({ emit: { emit: jest.fn() } }));
jest.mock("../../utils/AuthRoute", () => ({ resetAuthMenuCache: jest.fn() }));
function mount(extraProps = {}) {
  sessionStorage.removeItem("token");
  const ref = React.createRef(),
    dispatch = jest.fn(),
    changeLocalName = jest.fn();
  render(
    <Header
      wrappedComponentRef={ref}
      dispatch={dispatch}
      permissions={{ button: [] }}
      namespaces={[]}
      currentNamespaceId="default"
      location={{ pathname: "/home" }}
      changeLocalName={changeLocalName}
      onLogout={jest.fn()}
      {...extraProps}
    />,
  );
  return { ref, dispatch, changeLocalName };
}
it("switches namespace with matching plugin/permission refresh", () => {
  const h = mount();
  act(() => h.ref.current.handleNamespacesValueChange({ key: "next" }));
  expect(h.dispatch.mock.calls.map(([a]) => a.type)).toEqual([
    "global/saveCurrentNamespaceId",
    "global/fetchPlugins",
    "global/fetchPermission",
  ]);
  expect(h.dispatch.mock.calls[2][0].payload.namespaceId).toBe("next");
});

it("labels the native namespace select and switches by ID rather than its display label", async () => {
  const h = mount({
    namespaces: [
      { namespaceId: "default", name: "Default" },
      { namespaceId: "next-id", name: "Alternative" },
    ],
  });
  const select = screen.getByRole("combobox", {
    name: "SHENYU.SYSTEM.NAMESPACE",
  });
  expect(screen.getByText("Default (default)")).toBeTruthy();
  fireEvent.click(select);
  const option = await screen.findByRole("option", {
    name: /Alternative \(next-id\)$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() =>
    expect(h.dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "global/saveCurrentNamespaceId",
      "global/fetchPlugins",
      "global/fetchPermission",
    ]),
  );
  expect(h.dispatch.mock.calls[0][0].payload).toBe("next-id");
  expect(h.dispatch.mock.calls[2][0].payload.namespaceId).toBe("next-id");
});
it("keeps password validation and confirmation rules", async () => {
  const h = mount();
  act(() => h.ref.current.setState({ visible: true }));
  const form = h.ref.current.props.form;
  const validate = () =>
    new Promise((resolve) => {
      form.validateFields((err, values) => resolve({ err, values }));
    });
  act(() =>
    form.setFieldsValue({
      oldPassword: "old-fixture",
      password: "short",
      confirmPassword: "short",
    }),
  );
  let result;
  await act(async () => {
    result = await validate();
  });
  expect(result.err).toBeTruthy();
  act(() =>
    form.setFieldsValue({
      password: "Synthetic-Only1!",
      confirmPassword: "different",
    }),
  );
  await act(async () => {
    result = await validate();
  });
  expect(result.err.confirmPassword).toBeTruthy();
  act(() => form.setFieldsValue({ confirmPassword: "Synthetic-Only1!" }));
  await act(async () => {
    result = await validate();
  });
  expect(result.err).toBeFalsy();
  expect(result.values.oldPassword).toBe("old-fixture");
});

it("uses the canonical English locale from the native language menu", async () => {
  const h = mount();
  expect(
    screen.getByRole("button", { name: "Language" }).querySelector("svg"),
  ).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Language" }));
  fireEvent.click(await screen.findByText("English"));
  expect(h.changeLocalName).toHaveBeenCalledWith("en-US");
  expect(sessionStorage.getItem("locale")).toBe("en-US");
});
it("submits a validated password change and logs out only after success", async () => {
  sessionStorage.setItem("userId", "fixture-id");
  sessionStorage.setItem("userName", "fixture-user");
  const h = mount();
  act(() => {
    h.ref.current.setState({ visible: true });
  });
  act(() =>
    h.ref.current.props.form.setFieldsValue({
      oldPassword: "old-fixture",
      password: "Synthetic-Only1!",
      confirmPassword: "Synthetic-Only1!",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.dispatch).toHaveBeenCalled());
  const action = h.dispatch.mock.calls[0][0];
  expect(action.type).toBe("manage/updatePassword");
  expect(action.payload).toEqual({
    id: "fixture-id",
    envelope,
  });
  expect(encryptCredentials).toHaveBeenCalledWith(
    {
      userName: "fixture-user",
      password: "Synthetic-Only1!",
      oldPassword: "old-fixture",
    },
    "change-password",
    "fixture-id",
  );
  expect(JSON.stringify(action)).not.toContain("Synthetic-Only1!");
  expect(JSON.stringify(action)).not.toContain("old-fixture");
  expect(h.ref.current.props.onLogout).not.toHaveBeenCalled();
  act(() => action.callback());
  expect(h.ref.current.props.onLogout).toHaveBeenCalledTimes(1);
});

it("does not submit a pending encrypted password change after cancellation", async () => {
  let resolve;
  encryptCredentials.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const h = mount();
  act(() => {
    h.ref.current.setState({ visible: true });
    h.ref.current.props.form.setFieldsValue({
      oldPassword: "old-fixture",
      password: "Synthetic-Only1!",
      confirmPassword: "Synthetic-Only1!",
    });
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(encryptCredentials).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  await act(async () => {
    resolve(envelope);
  });
  expect(h.dispatch).not.toHaveBeenCalled();
  expect(h.ref.current.props.onLogout).not.toHaveBeenCalled();
});

it("does not log out a newer session when an older password update completes", async () => {
  const h = mount();
  act(() => {
    h.ref.current.setState({ visible: true });
    h.ref.current.props.form.setFieldsValue({
      oldPassword: "old-fixture",
      password: "Synthetic-Only1!",
      confirmPassword: "Synthetic-Only1!",
    });
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(h.dispatch).toHaveBeenCalled());
  window.sessionStorage.setItem("token", "replacement-session-token");
  window.sessionStorage.setItem("userId", "replacement-user");
  act(() => h.dispatch.mock.calls[0][0].callback());
  expect(h.ref.current.props.onLogout).not.toHaveBeenCalled();
});

it("keeps the password dialog open without sending plaintext when encryption fails", async () => {
  encryptCredentials.mockRejectedValueOnce(new Error("unavailable"));
  const h = mount();
  act(() => {
    h.ref.current.setState({ visible: true });
    h.ref.current.props.form.setFieldsValue({
      oldPassword: "old-fixture",
      password: "Synthetic-Only1!",
      confirmPassword: "Synthetic-Only1!",
    });
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(message.error).toHaveBeenCalled());
  expect(h.dispatch).not.toHaveBeenCalled();
  expect(h.ref.current.state.visible).toBe(true);
});
