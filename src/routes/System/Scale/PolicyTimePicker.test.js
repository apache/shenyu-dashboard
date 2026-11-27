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
import DashboardLocale from "../../../components/ui/DashboardLocale";

jest.mock("../../../services/api", () => ({}));
jest.mock("../../../components/ui/feedback", () => ({ message: {} }));
jest.mock("../../../utils/IntlUtils", () => ({}));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "default-namespace",
}));

afterEach(() => localStorage.removeItem("locale"));

it.each([
  ["zh-CN", "确定", "en-US", "Confirm"],
  ["en-US", "Confirm", "zh-CN", "确定"],
  [null, "Confirm", "zh-CN", "确定"],
  ["", "Confirm", "zh-CN", "确定"],
  ["unsupported", "Confirm", "zh-CN", "确定"],
])(
  "initializes the nested calendar from saved locale %s and updates an open calendar",
  async (savedLocale, initialConfirm, nextLanguage, nextConfirm) => {
    if (savedLocale !== null) localStorage.setItem("locale", savedLocale);
    let model;
    jest.isolateModules(() => {
      // Import after setting storage, as on application startup.
      // eslint-disable-next-line global-require
      model = require("../../../models/global").default;
    });
    const store = createStore(
      (state, action) =>
        action.type === "global/changeLanguage"
          ? { global: model.reducers.changeLanguage(state.global, action) }
          : state,
      { global: model.state },
    );
    render(
      <Provider store={store}>
        <DashboardLocale>
          <PolicyTimePicker
            placeholder="Policy time"
            value={moment("2026-07-01 10:20:30", "YYYY-MM-DD HH:mm:ss")}
          />
        </DashboardLocale>
      </Provider>,
    );
    fireEvent.click(screen.getByPlaceholderText("Policy time"));
    expect(
      await screen.findByRole("button", { name: initialConfirm, exact: true }),
    ).toBeTruthy();
    act(() => {
      store.dispatch({ type: "global/changeLanguage", payload: nextLanguage });
    });
    expect(
      await screen.findByRole("button", { name: nextConfirm, exact: true }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: initialConfirm, exact: true }),
    ).toBeNull();
    expect(screen.getByPlaceholderText("Policy time").value).toBe(
      "2026-07-01 10:20:30",
    );
  },
);

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
