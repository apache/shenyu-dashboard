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
import { deleteMockRequest } from "../../../services/api";
import ApiContext from "./ApiContext";
import ApiDebug from "./ApiDebug";

jest.mock("antd", () => {
  const ReactModule = jest.requireActual("react");
  const antd = jest.requireActual("antd");
  antd.Input.Group = ReactModule.forwardRef((props, ref) =>
    ReactModule.createElement(
      "div",
      {
        ref,
        "data-input-group": Boolean(props),
      },
      props.children,
    ),
  );
  return {
    ...antd,
    message: {
      error: jest.fn(),
      success: jest.fn(),
      warn: jest.fn(),
    },
  };
});

jest.mock("dva/fetch", () => jest.fn());
jest.mock("react-json-view", () => (props) => {
  const ReactModule = jest.requireActual("react");
  return ReactModule.createElement("div", {
    "data-rjv-src": JSON.stringify(props.src ?? null),
  });
});
jest.mock("./HeadersEditor", () => {
  const ReactModule = jest.requireActual("react");
  return ReactModule.forwardRef((props, ref) =>
    ReactModule.createElement(
      "div",
      {
        ref,
        "data-headers-editor": Boolean(props),
        "data-button": props.buttonText,
        "data-value": props.value,
      },
      ReactModule.createElement("button", {
        "data-emit": "1",
        onClick: () =>
          props.onChange('[{"index":0,"key":"Residue","value":"1"}]'),
      }),
    ),
  );
});
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

jest.mock("../../../services/api", () => ({
  createOrUpdateMockRequest: jest.fn(),
  deleteMockRequest: jest.fn(),
  getApiMockRequest: jest.fn(),
  sandboxProxyGateway: jest.fn(() => "/sandbox"),
}));

it("keeps the saved mock id when the API path effect runs", async () => {
  deleteMockRequest.mockResolvedValue({ code: 200, message: "Deleted" });

  render(
    <ApiContext.Provider
      value={{
        apiData: { envProps: [] },
        apiDetail: {
          apiPath: "/users",
          httpMethod: 0,
          id: "api-1",
        },
        apiMock: {
          body: "{}",
          header: '[{"index":0,"key":"X-Test","value":"value"}]',
          host: "api.example.com",
          id: "mock-1",
          pathVariable: "",
          port: "443",
          query: "[]",
          url: "https://api.example.com/users",
        },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.click(screen.getByText("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.RESET"));

  await waitFor(() => {
    expect(deleteMockRequest).toHaveBeenCalledWith("mock-1");
  });
});

it("does not delete the previous API mock while the next API mock is loading", async () => {
  deleteMockRequest.mockResolvedValue({ code: 200, message: "Deleted" });

  const apiMock = {
    body: "{}",
    header: '[{"index":0,"key":"X-Test","value":"value"}]',
    host: "api.example.com",
    id: "mock-a",
    pathVariable: "",
    port: "443",
    query: "[]",
    url: "https://api.example.com/a",
  };
  const apiData = { envProps: [] };
  const { rerender } = render(
    <ApiContext.Provider
      value={{
        apiData,
        apiDetail: {
          apiPath: "/a",
          httpMethod: 0,
          id: "api-a",
        },
        apiMock,
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  rerender(
    <ApiContext.Provider
      value={{
        apiData,
        apiDetail: {
          apiPath: "/b",
          httpMethod: 0,
          id: "api-b",
        },
        apiMock,
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.click(screen.getByText("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.RESET"));

  await waitFor(() => {
    expect(deleteMockRequest).not.toHaveBeenCalled();
  });
});

const emptyMockVo = () => ({
  id: null,
  host: null,
  port: null,
  url: null,
  pathVariable: null,
  query: null,
  header: null,
  body: null,
});

const renderWithApi = (detail, mock) =>
  render(
    <ApiContext.Provider
      value={{ apiData: { envProps: [] }, apiDetail: detail, apiMock: mock }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

it("renders an empty object body when the backend returns a null body", () => {
  const { container } = renderWithApi(
    { apiPath: "/a", httpMethod: 0, id: "api-1" },
    emptyMockVo(),
  );

  expect(container.querySelector('[data-rjv-src="{}"]')).not.toBeNull();
});

it("clears unsaved headers when switching between APIs without saved mocks", () => {
  const detailA = { apiPath: "/a", httpMethod: 0, id: "api-a" };
  const detailB = { apiPath: "/b", httpMethod: 0, id: "api-b" };
  const { container, rerender } = renderWithApi(detailA, emptyMockVo());

  fireEvent.click(container.querySelector("[data-headers-editor] [data-emit]"));

  // real async order: clear mock, switch detail, then receive the empty VO
  rerender(
    <ApiContext.Provider
      value={{
        apiData: { envProps: [] },
        apiDetail: detailA,
        apiMock: {},
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );
  rerender(
    <ApiContext.Provider
      value={{
        apiData: { envProps: [] },
        apiDetail: detailB,
        apiMock: {},
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );
  rerender(
    <ApiContext.Provider
      value={{
        apiData: { envProps: [] },
        apiDetail: detailB,
        apiMock: emptyMockVo(),
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  const headerEditor = Array.from(
    container.querySelectorAll("[data-headers-editor]"),
  ).find(
    (el) =>
      el.getAttribute("data-button") ===
      "SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.ADD.HEADER",
  );
  // residue cleared and the default Content-Type restored
  expect(JSON.parse(headerEditor.getAttribute("data-value"))).toEqual([
    { index: 0, key: "Content-Type", value: "application/json" },
  ]);
});

it("applies the default Content-Type when no header was saved", () => {
  const { container } = renderWithApi(
    { apiPath: "/a", httpMethod: 0, id: "api-1" },
    emptyMockVo(),
  );
  const headerEditor = Array.from(
    container.querySelectorAll("[data-headers-editor]"),
  ).find(
    (el) =>
      el.getAttribute("data-button") ===
      "SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.ADD.HEADER",
  );
  expect(JSON.parse(headerEditor.getAttribute("data-value"))).toEqual([
    { index: 0, key: "Content-Type", value: "application/json" },
  ]);
});

it("clears query rows on every reset", () => {
  const { container } = renderWithApi(
    { apiPath: "/a", httpMethod: 0, id: "api-1" },
    emptyMockVo(),
  );
  // the query pane renders lazily: activate it before querying its editor
  fireEvent.click(screen.getByText("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.QUERY"));
  const queryEditor = () =>
    Array.from(container.querySelectorAll("[data-headers-editor]")).find(
      (el) =>
        el.getAttribute("data-button") ===
        "SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.ADD.QUERY",
    );
  const emit = queryEditor().querySelector("[data-emit]");
  const reset = screen.getByText("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.RESET");

  fireEvent.click(reset);
  fireEvent.click(emit);
  fireEvent.click(reset);

  expect(JSON.parse(queryEditor().getAttribute("data-value"))).toEqual([]);
});

it("keeps the request path when switching to an API without a saved mock", () => {
  const detailA = { apiPath: "/a", httpMethod: 0, id: "api-a" };
  const detailB = { apiPath: "/b", httpMethod: 0, id: "api-b" };
  const { container, rerender } = renderWithApi(detailA, emptyMockVo());

  rerender(
    <ApiContext.Provider
      value={{
        apiData: { envProps: [] },
        apiDetail: detailA,
        apiMock: {},
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );
  rerender(
    <ApiContext.Provider
      value={{
        apiData: { envProps: [] },
        apiDetail: detailB,
        apiMock: {},
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );
  rerender(
    <ApiContext.Provider
      value={{
        apiData: { envProps: [] },
        apiDetail: detailB,
        apiMock: emptyMockVo(),
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  const pathValues = Array.from(container.querySelectorAll("input")).map(
    (i) => i.value,
  );
  expect(pathValues).toContain("/b");
});

it("resets the debug form when switching to an API without a saved mock", async () => {
  const apiData = { envProps: [] };
  const savedMock = {
    body: "{}",
    header: '[{"index":0,"key":"X-Test","value":"value"}]',
    host: "api.example.com",
    id: null,
    pathVariable: "",
    port: "443",
    query: "[]",
    url: "https://api.example.com/a",
  };
  const { rerender, container } = render(
    <ApiContext.Provider
      value={{
        apiData,
        apiDetail: { apiPath: "/a", httpMethod: 0, id: "api-a" },
        apiMock: savedMock,
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  rerender(
    <ApiContext.Provider
      value={{
        apiData,
        apiDetail: { apiPath: "/b", httpMethod: 0, id: "api-b" },
        apiMock: { ...savedMock, header: null, host: null, url: null },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  await waitFor(() => {
    const headerEditor = Array.from(
      container.querySelectorAll("[data-headers-editor]"),
    ).find(
      (el) =>
        el.getAttribute("data-button") ===
        "SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.ADD.HEADER",
    );
    // the previous mock's X-Test header is gone and the default restored
    expect(JSON.parse(headerEditor.getAttribute("data-value"))).toEqual([
      { index: 0, key: "Content-Type", value: "application/json" },
    ]);
  });
});
