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
    ReactModule.createElement("div", {
      ref,
      "data-input-group": Boolean(props),
    }),
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
jest.mock("react-html-parser", () => jest.fn(() => null));
jest.mock("react-json-view", () => () => null);
jest.mock("./HeadersEditor", () => {
  const ReactModule = jest.requireActual("react");
  return ReactModule.forwardRef((props, ref) =>
    ReactModule.createElement("div", {
      ref,
      "data-headers-editor": Boolean(props),
    }),
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
          header: { "X-Test": "value" },
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
