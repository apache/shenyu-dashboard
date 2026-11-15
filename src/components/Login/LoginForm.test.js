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
import Login from "./index";

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../_utils/utils", () => ({
  originalCharacter: ["A"],
  randomNum: () => 0,
}));

it("validates required account/password before submitting exact values", async () => {
  const submit = jest.fn();
  render(
    <Login onSubmit={submit}>
      <div>
        <Login.UserName name="userName" placeholder="Account" />
        <Login.Password name="password" placeholder="Password" />
      </div>
      <Login.Submit>Login</Login.Submit>
    </Login>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Login" }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][0]).toBeTruthy();
  submit.mockClear();
  fireEvent.change(screen.getByPlaceholderText("Account"), {
    target: { value: "fixture-user" },
  });
  fireEvent.change(screen.getByPlaceholderText("Password"), {
    target: { value: "Synthetic-only-1!" },
  });
  fireEvent.submit(screen.getByPlaceholderText("Account").closest("form"));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][0]).toBeFalsy();
  expect(submit.mock.calls[0][1]).toEqual({
    userName: "fixture-user",
    password: "Synthetic-only-1!",
  });
});
it("includes a conditionally mounted verification field", async () => {
  const submit = jest.fn();
  const make = (code) => (
    <Login onSubmit={submit}>
      <Login.UserName name="userName" defaultValue="fixture" />
      {code && <Login.VerifyCode name="verifyCode" placeholder="Code" />}
      <Login.Submit>Login</Login.Submit>
    </Login>
  );
  const view = render(make(false));
  view.rerender(make(true));
  fireEvent.change(screen.getByPlaceholderText("Code"), {
    target: { value: "AB12" },
  });
  fireEvent.submit(screen.getByPlaceholderText("Code").closest("form"));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][1]).toEqual({
    userName: "fixture",
    verifyCode: "AB12",
  });
});

it("validates only the active tab and common fields while retaining the other tab", async () => {
  const submit = jest.fn();
  render(
    <Login defaultActiveKey="account" onSubmit={submit}>
      <Login.Tab key="account" tab="Account tab">
        <Login.UserName name="userName" placeholder="Account" />
      </Login.Tab>
      <Login.Tab key="mobile" tab="Mobile tab">
        <Login.Mobile name="mobile" placeholder="Phone" />
      </Login.Tab>
      <Login.Submit>Continue</Login.Submit>
    </Login>,
  );
  fireEvent.change(screen.getByPlaceholderText("Account"), {
    target: { value: "fixture" },
  });
  fireEvent.click(screen.getByRole("tab", { name: "Mobile tab" }));
  fireEvent.change(screen.getByPlaceholderText("Phone"), {
    target: { value: "13800000000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][0]).toBeFalsy();
  expect(submit.mock.calls[0][1]).toEqual({ mobile: "13800000000" });
  submit.mockClear();
  fireEvent.click(screen.getByRole("tab", { name: "Account tab" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][1]).toEqual({ userName: "fixture" });
});
