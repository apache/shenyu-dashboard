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
import { fireEvent, render, waitFor } from "@testing-library/react";
import fetch from "dva/fetch";
import ApiContext from "./ApiContext";
import ApiDebug from "./ApiDebug";
import { buildEnvironmentHost, isValidHttpUrl } from "../../../utils/UrlUtils";

jest.mock("dva/fetch", () => jest.fn());
jest.mock("../../../services/api", () => ({
  createOrUpdateMockRequest: jest.fn(),
  deleteMockRequest: jest.fn(),
  getApiMockRequest: jest.fn(),
  sandboxProxyGateway: jest.fn(() => "/sandbox"),
}));
jest.mock("./HeadersEditor", () => () => <div />);
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      children,
);
jest.mock("react-json-view", () => () => <div />);

const contextValue = {
  apiDetail: { id: "api-1", apiPath: "/orders", httpMethod: 0 },
  apiMock: {
    id: null,
    host: "",
    port: "",
    url: "https://api.example.test/orders",
    pathVariable: "",
    query: "[]",
    header: {},
    body: "{}",
  },
  apiData: { envProps: [] },
};

beforeEach(() => {
  fetch.mockResolvedValue({
    text: async () => "{}",
    headers: { get: () => null },
  });
});

it("does not add port 80 to an HTTPS environment without an explicit port", () => {
  expect(buildEnvironmentHost("https://api.example.test")).toBe(
    "https://api.example.test",
  );
});

it("preserves an explicitly configured environment port", () => {
  expect(buildEnvironmentHost("http://api.example.test:8080")).toBe(
    "http://api.example.test:8080",
  );
});

it.each([
  "https://api.example.test/orders",
  "http://api.example.test/orders",
  "https://api.example.test:8443/orders",
  "http://api.example.test:8080/orders",
])(
  "submits a request URL without requiring an explicit port: %s",
  async (requestUrl) => {
    const { container } = render(
      <ApiContext.Provider
        value={{
          ...contextValue,
          apiDetail: { ...contextValue.apiDetail, apiPath: requestUrl },
          apiMock: { ...contextValue.apiMock, url: requestUrl },
        }}
      >
        <ApiDebug />
      </ApiContext.Provider>,
    );

    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch.mock.calls[0][1].body).toContain(requestUrl);
  },
);

it("rejects a non-HTTP request URL before submission", async () => {
  const { container } = render(
    <ApiContext.Provider
      value={{
        ...contextValue,
        apiDetail: {
          ...contextValue.apiDetail,
          apiPath: "ftp://api.example.test/orders",
        },
        apiMock: {
          ...contextValue.apiMock,
          url: "ftp://api.example.test/orders",
        },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.submit(container.querySelector("form"));

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  expect(fetch).not.toHaveBeenCalled();
});

it("validates HTTP(S) URLs with or without an explicit port", () => {
  expect(isValidHttpUrl("https://api.example.test/orders")).toBe(true);
  expect(isValidHttpUrl("http://api.example.test:8080/orders")).toBe(true);
  expect(isValidHttpUrl("ftp://api.example.test/orders")).toBe(false);
});
