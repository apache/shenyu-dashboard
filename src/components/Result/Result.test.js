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
import Result from "./index";
import ErrorPage from "../../routes/Result/Error";

it.each([
  ["success", "check-circle"],
  ["error", "close-circle"],
])("keeps %s content and icon semantics", (type, icon) => {
  render(
    <Result
      type={type}
      title="Result title"
      description="Details"
      extra={<span>Context</span>}
      actions={<button type="button">Continue</button>}
    />,
  );
  expect(screen.getByLabelText(`icon: ${icon}`)).toBeTruthy();
  expect(screen.getByText("Result title")).toBeTruthy();
  expect(screen.getByText("Details")).toBeTruthy();
  expect(screen.getByText("Context")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
});
it("retains the error example contents", () => {
  render(<ErrorPage />);
  expect(screen.getByText("提交失败")).toBeTruthy();
  expect(screen.getByRole("button", { name: "返回修改" })).toBeTruthy();
});
