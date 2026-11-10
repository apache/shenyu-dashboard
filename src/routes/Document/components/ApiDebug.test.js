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
import {
  createOrUpdateMockRequest,
  deleteMockRequest,
  getApiMockRequest,
} from "../../../services/api";
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
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const contextValue = {
  apiDetail: { id: "api-1", apiPath: "/orders", httpMethod: 0 },
  apiMock: {
    id: null,
    host: "",
    port: "",
    url: "https://api.example.test/orders",
    pathVariable: "",
    query: "[]",
    header: '[{"index":0,"key":"X-Test","value":"value"}]',
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

it("renders a non-JSON response body as literal text instead of HTML", async () => {
  const body =
    '<img id="injected" src="x"><b>upstream</b>\n  <form id="fake"></form>';
  fetch.mockResolvedValue({
    text: async () => body,
    headers: { get: () => null },
  });
  jest.spyOn(console, "error").mockImplementation(() => {});

  const requestUrl = "https://api.example.test/orders";
  const { container } = render(
    <ApiContext.Provider
      value={{
        ...contextValue,
        apiDetail: { ...contextValue.apiDetail, apiPath: requestUrl },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.submit(container.querySelector("form"));

  await waitFor(() => expect(container.querySelector("pre")).not.toBeNull());
  const pre = container.querySelector("pre");
  expect(pre.textContent).toBe(body);
  expect(pre.children).toHaveLength(0);
  expect(container.querySelector("#injected")).toBeNull();
  expect(container.querySelector("#fake")).toBeNull();
});

it("renders primitive JSON responses as plain text", async () => {
  fetch.mockResolvedValue({
    text: async () => "true",
    headers: { get: () => null },
  });
  jest.spyOn(console, "error").mockImplementation(() => {});

  const { container } = render(
    <ApiContext.Provider value={contextValue}>
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.submit(container.querySelector("form"));

  await waitFor(() => expect(container.querySelector("pre")).not.toBeNull());
  expect(container.querySelector("pre").textContent).toBe("true");
});

it("submits the saved mock url without re-picking an environment", async () => {
  const { container } = render(
    <ApiContext.Provider
      value={{
        ...contextValue,
        apiDetail: { ...contextValue.apiDetail, apiPath: "/orders" },
        apiMock: {
          ...contextValue.apiMock,
          host: "api.example.test",
          url: "https://api.example.test/orders",
        },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.submit(container.querySelector("form"));

  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(fetch.mock.calls[0][1].body).toContain(
    "https://api.example.test/orders",
  );
});

it("saves the mock target as an origin and a path", async () => {
  createOrUpdateMockRequest.mockResolvedValue({ code: 200, message: "ok" });
  getApiMockRequest.mockResolvedValue({
    code: 200,
    message: "ok",
    data: { id: "mock-1" },
  });

  const { getByText } = render(
    <ApiContext.Provider value={contextValue}>
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.click(getByText("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.SAVE"));

  await waitFor(() =>
    expect(createOrUpdateMockRequest).toHaveBeenCalledTimes(1),
  );
  expect(createOrUpdateMockRequest.mock.calls[0][0]).toMatchObject({
    host: "https://api.example.test",
    url: "/orders",
  });
});

it("submits query-tab rows as bizParam", async () => {
  const { container, getByText } = render(
    <ApiContext.Provider
      value={{
        ...contextValue,
        apiMock: {
          ...contextValue.apiMock,
          query: '[{"index":0,"key":"q","value":"1"}]',
        },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.click(getByText("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.QUERY"));
  fireEvent.submit(container.querySelector("form"));

  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(JSON.parse(fetch.mock.calls[0][1].body).bizParam).toEqual({
    q: "1",
  });
});

it("keeps the saved configuration when mock deletion fails", async () => {
  deleteMockRequest.mockResolvedValue({ code: 500, message: "failed" });

  const { container, getByText } = render(
    <ApiContext.Provider
      value={{
        ...contextValue,
        apiMock: { ...contextValue.apiMock, id: "mock-1" },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  const pathInput = Array.from(container.querySelectorAll("input")).find(
    (i) => i.value === "/orders",
  );
  expect(pathInput).toBeDefined();

  fireEvent.click(getByText("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.RESET"));

  await waitFor(() => expect(deleteMockRequest).toHaveBeenCalledWith("mock-1"));
  expect(pathInput.value).toBe("/orders");
});
