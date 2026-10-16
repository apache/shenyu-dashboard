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
import {
  fetchShenYuDictByType,
  getApiDetail,
  getApiMockRequest,
} from "../../services/api";
import ApiDoc from "./ApiDoc";

jest.mock("../../services/api", () => ({
  fetchShenYuDictByType: jest.fn(),
  getApiDetail: jest.fn(),
  getApiMockRequest: jest.fn(),
}));

jest.mock("./components/SearchApi", () => {
  const ReactModule = jest.requireActual("react");
  return ReactModule.forwardRef(({ onSelect }, ref) => (
    <button
      type="button"
      ref={ref}
      onClick={() =>
        onSelect([], { node: { props: { id: "api-1", isLeaf: true } } })
      }
    >
      Select API
    </button>
  ));
});

jest.mock("./components/ApiInfo", () => {
  const { default: ApiContext } = jest.requireActual("./components/ApiContext");
  return () => (
    <ApiContext.Consumer>
      {(context) => (
        <pre data-testid="api-context">{JSON.stringify(context)}</pre>
      )}
    </ApiContext.Consumer>
  );
});
jest.mock("./components/TagInfo", () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
});

const selectApi = async () => {
  getApiDetail.mockResolvedValue({
    code: 200,
    data: { id: "api-1", apiPath: "/orders" },
  });
  getApiMockRequest.mockResolvedValue({ code: 200, data: { id: "mock-1" } });
  render(<ApiDoc />);
  fireEvent.click(screen.getByText("Select API"));
  await waitFor(() => {
    expect(
      JSON.parse(screen.getByTestId("api-context").textContent).apiMock.id,
    ).toBe("mock-1");
  });
  return JSON.parse(screen.getByTestId("api-context").textContent);
};

test("loads enabled debug environments from dictionaries while API details still load", async () => {
  fetchShenYuDictByType.mockResolvedValue({
    code: 200,
    data: [
      {
        enabled: true,
        dictName: "Offline",
        dictValue: "http://localhost:9195",
        desc: "Local gateway",
      },
      {
        enabled: false,
        dictName: "Disabled",
        dictValue: "http://localhost:9196",
        desc: "Hidden",
      },
      {
        enabled: true,
        dictName: "Online",
        dictValue: "https://gateway.example.com",
        desc: "Production",
      },
    ],
  });

  const context = await selectApi();

  expect(fetchShenYuDictByType).toHaveBeenCalledWith({ type: "apidocEnv" });
  expect(context.apiData.envProps).toEqual([
    {
      envLabel: "Offline",
      addressUrl: "http://localhost:9195",
      envDesc: "Local gateway",
    },
    {
      envLabel: "Online",
      addressUrl: "https://gateway.example.com",
      envDesc: "Production",
    },
  ]);
  expect(getApiDetail).toHaveBeenCalledWith("api-1");
  expect(getApiMockRequest).toHaveBeenCalledWith("api-1");
  expect(context.apiDetail.apiPath).toBe("/orders");
});

test("keeps API details available when there are no debug environments", async () => {
  fetchShenYuDictByType.mockResolvedValue({ code: 200, data: [] });

  const context = await selectApi();

  expect(context.apiData.envProps).toEqual([]);
  expect(context.apiDetail.id).toBe("api-1");
});

test.each([null, undefined, {}, "unexpected", 42])(
  "keeps API details available for non-array dictionary data: %p",
  async (data) => {
    fetchShenYuDictByType.mockResolvedValue({ code: 200, data });

    const context = await selectApi();

    expect(context.apiData.envProps).toEqual([]);
    expect(context.apiDetail.id).toBe("api-1");
    expect(fetchShenYuDictByType).toHaveBeenCalledTimes(1);
    expect(getApiDetail).toHaveBeenCalledTimes(1);
  },
);

test("keeps API details available when dictionary loading is unsuccessful", async () => {
  fetchShenYuDictByType.mockResolvedValue({ code: 500, data: null });

  const context = await selectApi();

  expect(context.apiData.envProps).toEqual([]);
  expect(context.apiDetail.id).toBe("api-1");
});
