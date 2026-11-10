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
import { render, screen, waitFor } from "@testing-library/react";
import ConnectedApiDoc from "./ApiDoc";

// render the raw component so tests can inject a dispatch without a dva store
const ApiDoc = ConnectedApiDoc.WrappedComponent;

jest.mock("../../services/api", () => ({
  getApi: jest.fn(),
  getApiDetail: jest.fn(),
  getApiMockRequest: jest.fn(),
  getTagDetail: jest.fn(),
  deleteApi: jest.fn(),
  deleteTag: jest.fn(),
}));

jest.mock("./components/SearchApi", () => {
  // eslint-disable-next-line global-require
  const mockReact = require("react");
  // eslint-disable-next-line global-require
  const mockApiContext = require("./components/ApiContext").default;

  return mockReact.forwardRef(() => {
    const { apiData } = mockReact.useContext(mockApiContext);
    return mockReact.createElement(
      "div",
      { "data-testid": "env-props" },
      JSON.stringify(apiData.envProps || []),
    );
  });
});

const readEnvProps = (getByTestId) =>
  JSON.parse(getByTestId("env-props").textContent);

const renderWithDict = (dics) => {
  const dispatch = jest.fn((action) => {
    if (action.type === "shenyuDict/fetchByType" && dics) {
      action.payload.callBack(dics);
    }
  });
  render(<ApiDoc dispatch={dispatch} />);
  return dispatch;
};

it("maps enabled apidoc env entries to envProps", async () => {
  const dispatch = renderWithDict([
    {
      dictName: "dev",
      dictValue: "http://dev.example.test",
      desc: "dev env",
      enabled: true,
    },
    {
      dictName: "test",
      dictValue: "http://test.example.test",
      desc: "test env",
      enabled: false,
    },
  ]);

  await waitFor(() =>
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "shenyuDict/fetchByType",
        payload: expect.objectContaining({ type: "apidocEnv" }),
      }),
    ),
  );
  await waitFor(() =>
    expect(readEnvProps(screen.getByTestId)).toEqual([
      {
        envLabel: "dev",
        addressUrl: "http://dev.example.test",
        envDesc: "dev env",
      },
    ]),
  );
});

it("keeps an empty env list when the dict request fails", async () => {
  const dispatch = renderWithDict(null);

  await waitFor(() => expect(dispatch).toHaveBeenCalled());
  expect(readEnvProps(screen.getByTestId)).toEqual([]);
});
