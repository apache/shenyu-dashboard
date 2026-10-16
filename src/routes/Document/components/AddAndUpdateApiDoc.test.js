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
import AddAndUpdateApiDoc from "./AddAndUpdateApiDoc";

jest.mock("../../../services/api", () => ({
  addApi: jest.fn(),
  updateApi: jest.fn(),
}));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("react-json-view", () => (props) => (
  <div data-testid="json-view">{JSON.stringify(props.src)}</div>
));

it("renders stored ext and document objects with the JSON editor", () => {
  render(<AddAndUpdateApiDoc visible ext='{"a":1}' document='{"b":[2]}' />);
  const views = screen.getAllByTestId("json-view");
  expect(views.map((view) => view.textContent)).toEqual([
    '{"a":1}',
    '{"b":[2]}',
  ]);
  expect(screen.queryByText("SHENYU.DOCUMENT.APIDOC.EXT.INFO")).toBeNull();
});

it("shows ext and document that are not JSON objects as raw text with an error", () => {
  render(<AddAndUpdateApiDoc visible ext="{bad" document="[1, 2]" />);
  expect(screen.queryByTestId("json-view")).toBeNull();
  expect(screen.getByText("{bad").tagName).toBe("PRE");
  expect(screen.getByText("[1, 2]").tagName).toBe("PRE");
  expect(screen.getByText("SHENYU.DOCUMENT.APIDOC.EXT.INFO")).toBeTruthy();
  expect(screen.getByText("SHENYU.PLUGIN.RULE.JSON.INVALID")).toBeTruthy();
});
