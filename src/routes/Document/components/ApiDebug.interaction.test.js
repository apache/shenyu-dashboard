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
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import fetch from "../../../utils/fetch";
import ApiContext from "./ApiContext";
import ApiDebug from "./ApiDebug";

jest.mock("../../../utils/fetch", () => jest.fn());
jest.mock("../../../services/api", () => ({
  sandboxProxyGateway: () => "/sandbox",
}));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      children,
);
jest.mock("@microlink/react-json-view", () => () => null);

it("composes the selected environment and edited path while retaining real header edits", async () => {
  fetch.mockResolvedValue({
    text: async () => "{}",
    headers: { get: () => null },
  });
  render(
    <ApiContext.Provider
      value={{
        apiDetail: { id: "api", apiPath: "/orders", httpMethod: 0 },
        apiMock: {},
        apiData: {
          envProps: [
            { envLabel: "Secure", addressUrl: "https://api.example.test" },
          ],
        },
      }}
    >
      <ApiDebug />
    </ApiContext.Provider>,
  );

  fireEvent.click(
    screen.getByRole("combobox", { name: "SHENYU.COMMON.MAX.ENVIRONMENT" }),
  );
  fireEvent.click(await screen.findByText("Secure - https://api.example.test"));
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("SHENYU.DOCUMENT.APIDOC.APIPATH"), {
    target: { value: "/edited?limit=2" },
  });
  await act(async () => {});
  fireEvent.change(screen.getByDisplayValue("application/json"), {
    target: { value: "application/custom" },
  });
  await act(async () => {});
  fireEvent.click(screen.getByText("SHENYU.DOCUMENT.APIDOC.INFO.SEND.REQUEST"));

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    requestUrl: "https://api.example.test/edited?limit=2",
    headers: { "Content-Type": "application/custom" },
  });
});
