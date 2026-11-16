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
import { render, screen } from "@testing-library/react";
import Exception from "./index";

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
it.each(["403", "404", "500"])(
  "retains the %s message and home link",
  (type) => {
    render(<Exception type={type} />);
    expect(screen.getByRole("heading", { name: type })).toBeTruthy();
    expect(screen.getByText(`SHENYU.EXCEPTION.${type}.DESC`)).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/");
  },
);
it("retains fallback and caller supplied content/actions", () => {
  const view = render(<Exception type="unknown" />);
  expect(screen.getByRole("heading", { name: "404" })).toBeTruthy();
  view.rerender(
    <Exception
      title="Custom"
      desc="Explanation"
      actions={<button type="button">Retry</button>}
    />,
  );
  expect(screen.getByRole("heading", { name: "Custom" })).toBeTruthy();
  expect(screen.getByText("Explanation")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
});
