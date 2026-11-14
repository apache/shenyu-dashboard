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
import moment from "moment";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { act, fireEvent, render, screen } from "@testing-library/react";
import PolicyTimePicker from "./PolicyTimePicker";

it("updates an open calendar when the application language changes", async () => {
  const store = createStore(
    (state, action) =>
      action.type === "language"
        ? { global: { language: action.language } }
        : state,
    { global: { language: "en-US" } },
  );
  render(
    <Provider store={store}>
      <PolicyTimePicker
        placeholder="Policy time"
        value={moment("2026-07-01 10:20:30", "YYYY-MM-DD HH:mm:ss")}
      />
    </Provider>,
  );
  fireEvent.click(screen.getByPlaceholderText("Policy time"));
  expect(
    await screen.findByRole("button", { name: "Confirm", exact: true }),
  ).toBeTruthy();
  act(() => {
    store.dispatch({ type: "language", language: "zh-CN" });
  });
  expect(
    await screen.findByRole("button", { name: "确定", exact: true }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Confirm", exact: true }),
  ).toBeNull();
  expect(screen.getByPlaceholderText("Policy time").value).toBe(
    "2026-07-01 10:20:30",
  );
});

it("renders a disabled policy time without opening a calendar", () => {
  const store = createStore(() => ({ global: { language: "en-US" } }));
  render(
    <Provider store={store}>
      <PolicyTimePicker
        disabled
        placeholder="Policy time"
        value={moment("2026-07-01 10:20:30", "YYYY-MM-DD HH:mm:ss")}
      />
    </Provider>,
  );
  const input = screen.getByPlaceholderText("Policy time");
  expect(input.disabled).toBe(true);
  expect(input.value).toBe("2026-07-01 10:20:30");
  fireEvent.click(input);
  expect(screen.queryByRole("grid")).toBeNull();
});
