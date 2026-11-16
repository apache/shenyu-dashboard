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
import ApiContext from "./ApiContext";
import ApiInfo from "./ApiInfo";

jest.mock("./ApiDebug", () => () => <div />);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const renderInfo = (apiDetail) =>
  render(
    <ApiContext.Provider value={{ apiDetail, apiData: { envProps: [] } }}>
      <ApiInfo handleUpdate={jest.fn()} handleDelete={jest.fn()} />
    </ApiContext.Provider>,
  );

it("prefers the custom error codes from the detail response", () => {
  renderInfo({
    id: "api-1",
    httpMethod: 0,
    apiPath: "/a",
    version: "1",
    tags: [],
    document: "{}",
    bizCustomCodeList: [
      { code: "1001", message: "boom", solution: "retry later" },
    ],
  });

  expect(screen.getByText("1001")).not.toBeNull();
  expect(screen.getByText("boom")).not.toBeNull();
  // the content column stringifies its value
  expect(screen.getByText('"retry later"')).not.toBeNull();
});

it("falls back to document responses for error codes", () => {
  renderInfo({
    id: "api-1",
    httpMethod: 0,
    apiPath: "/a",
    version: "1",
    tags: [],
    document: JSON.stringify({
      responses: { 500: { description: "server error", content: "" } },
    }),
  });

  expect(screen.getByText("500")).not.toBeNull();
  expect(screen.getByText("server error")).not.toBeNull();
});
