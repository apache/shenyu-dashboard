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
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import DashboardLocale from "./DashboardLocale";
import Select from "./Select";

function renderSelect(language = "") {
  const store = createStore((state, action) =>
    action.type === "language"
      ? { global: { language: action.value } }
      : state || { global: { language } },
  );
  render(
    <Provider store={store}>
      <DashboardLocale>
        <Select />
      </DashboardLocale>
    </Provider>,
  );
  fireEvent.click(screen.getByRole("combobox"));
  return store;
}

afterEach(() => localStorage.removeItem("locale"));

it("updates empty Select text when the dashboard language changes", () => {
  const store = renderSelect("en-US");
  expect(screen.getByText("No Result")).toBeTruthy();
  act(() => store.dispatch({ type: "language", value: "zh-CN" }));
  expect(screen.getByText("暂无数据")).toBeTruthy();
});

it("uses the saved language before the model initializes", () => {
  localStorage.setItem("locale", "zh-CN");
  renderSelect();
  expect(screen.getByText("暂无数据")).toBeTruthy();
});
