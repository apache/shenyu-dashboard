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
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import ApiKeys from "./index";
import * as api from "../../../../services/api";
import { clipboardCopy } from "../../../../utils/utils";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));
jest.mock(
  "../../../../utils/AuthButton",
  () =>
    ({ children }) =>
      typeof children === "function" ? children({}) : children,
);
jest.mock("../../../../components/ui/feedback", () => ({
  message: { success: jest.fn(), warn: jest.fn(), destroy: jest.fn() },
}));
jest.mock("../../../../utils/utils", () => ({
  clipboardCopy: jest.fn(() => Promise.resolve(true)),
}));
jest.mock("../../../../services/api", () => ({
  getAiProxyApiKeys: jest.fn(),
  addAiProxyApiKey: jest.fn(),
  updateAiProxyApiKey: jest.fn(),
  batchDeleteAiProxyApiKeys: jest.fn(),
  batchEnableAiProxyApiKeys: jest.fn(),
}));
const row = {
  id: "key-one",
  proxyApiKey: "synthetic-proxy-one",
  description: "fixture description",
  enabled: true,
};
const props = {
  initialSelectorId: "selector-one",
  initialNamespaceId: "ns-one",
  currentSelector: { handle: '{"realApiKey":"synthetic-real-key"}' },
};
beforeEach(() => {
  Object.values(api)
    .filter(jest.isMockFunction)
    .forEach((fn) => fn.mockReset().mockResolvedValue({ code: 200 }));
  api.getAiProxyApiKeys.mockResolvedValue({
    code: 200,
    data: { dataList: [row], totalCount: 30 },
  });
});
async function setup(overrides = {}) {
  const view = render(<ApiKeys {...props} {...overrides} />);
  await screen.findByText(row.proxyApiKey, { exact: true });
  return view;
}
it("queries the selector and namespace without a filter", async () => {
  await setup();
  expect(api.getAiProxyApiKeys).toHaveBeenCalledWith({
    selectorId: "selector-one",
    namespaceId: "ns-one",
    currentPage: 1,
    pageSize: 10,
    proxyApiKey: undefined,
  });
});
it("toggles the selected key using a boolean", async () => {
  await setup();
  fireEvent.click(
    within(
      screen.getByText(row.proxyApiKey, { exact: true }).closest("tr"),
    ).getByRole("switch"),
  );
  await waitFor(() =>
    expect(api.batchEnableAiProxyApiKeys).toHaveBeenCalledWith({
      selectorId: "selector-one",
      ids: ["key-one"],
      enabled: false,
    }),
  );
});
it("edits the current ID while retaining the namespace and false status", async () => {
  await setup();
  fireEvent.click(screen.getByText("SHENYU.COMMON.CHANGE"));
  fireEvent.change(document.getElementById("description"), {
    target: { value: "updated" },
  });
  fireEvent.click(document.getElementById("enabled"));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SAVE" }));
  await waitFor(() =>
    expect(api.updateAiProxyApiKey).toHaveBeenCalledWith({
      selectorId: "selector-one",
      id: "key-one",
      description: "updated",
      enabled: false,
      namespaceId: "ns-one",
    }),
  );
});
function search() {
  const legacy = document.querySelector(".ant-input-search-icon");
  fireEvent.click(
    legacy || screen.getByRole("button", { name: "SHENYU.SYSTEM.SEARCH" }),
  );
}
it("searches using the submitted current key rather than the previous filter", async () => {
  await setup();
  api.getAiProxyApiKeys.mockClear();
  fireEvent.change(screen.getByPlaceholderText("proxyApiKey"), {
    target: { value: " synthetic-filter " },
  });
  search();
  await waitFor(() => expect(api.getAiProxyApiKeys).toHaveBeenCalledTimes(1));
  expect(api.getAiProxyApiKeys.mock.calls[0][0].proxyApiKey).toBe(
    "synthetic-filter",
  );
});
it("refresh clears the committed filter in its request", async () => {
  await setup();
  fireEvent.change(screen.getByPlaceholderText("proxyApiKey"), {
    target: { value: "synthetic-filter" },
  });
  search();
  await waitFor(() => expect(api.getAiProxyApiKeys).toHaveBeenCalledTimes(2));
  api.getAiProxyApiKeys.mockClear();
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.COMMON.REFRESH" }),
  );
  await waitFor(() => expect(api.getAiProxyApiKeys).toHaveBeenCalledTimes(1));
  expect(api.getAiProxyApiKeys.mock.calls[0][0].proxyApiKey).toBeUndefined();
});
it("ignores a previous selector's delayed response", async () => {
  const replies = [];
  api.getAiProxyApiKeys.mockImplementation(
    () =>
      new Promise((resolve) => {
        replies.push(resolve);
      }),
  );
  const view = render(<ApiKeys {...props} />);
  view.rerender(<ApiKeys {...props} initialSelectorId="selector-two" />);
  await waitFor(() => expect(replies).toHaveLength(2));
  await act(async () =>
    replies[1]({
      code: 200,
      data: {
        dataList: [{ ...row, id: "new", proxyApiKey: "synthetic-new" }],
        totalCount: 1,
      },
    }),
  );
  await act(async () =>
    replies[0]({ code: 200, data: { dataList: [row], totalCount: 1 } }),
  );
  expect(screen.getByText("synthetic-new", { exact: true })).toBeTruthy();
  expect(screen.queryByText(row.proxyApiKey, { exact: true })).toBeNull();
});
it("changes page size with one first-page request", async () => {
  await setup();
  fireEvent.click(screen.getByLabelText("Next"));
  await waitFor(() => expect(api.getAiProxyApiKeys).toHaveBeenCalledTimes(2));
  api.getAiProxyApiKeys.mockClear();
  fireEvent.click(screen.getByText("Items per page: 10", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() => expect(api.getAiProxyApiKeys).toHaveBeenCalledTimes(1));
  expect(api.getAiProxyApiKeys.mock.calls[0][0]).toEqual(
    expect.objectContaining({ currentPage: 1, pageSize: 20 }),
  );
});
it("creates a disabled key without submitting the real key preset", async () => {
  api.addAiProxyApiKey.mockResolvedValue({
    code: 200,
    data: { proxyApiKey: "synthetic-created" },
  });
  await setup();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.ADD" }));
  expect(screen.getByDisplayValue("synthetic-real-key").disabled).toBe(true);
  fireEvent.change(document.getElementById("description"), {
    target: { value: "created description" },
  });
  fireEvent.click(document.getElementById("enabled"));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SAVE" }));
  await screen.findByText("synthetic-created", { exact: true });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.COPY" }));
  await waitFor(() =>
    expect(clipboardCopy).toHaveBeenCalledWith("synthetic-created"),
  );
  expect(api.addAiProxyApiKey).toHaveBeenCalledWith({
    selectorId: "selector-one",
    description: "created description",
    enabled: false,
    namespaceId: "ns-one",
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(screen.queryByText("synthetic-created", { exact: true })).toBeNull();
});
it("keeps the form open when create fails", async () => {
  api.addAiProxyApiKey.mockResolvedValue({
    code: 500,
    message: "fixture failure",
  });
  await setup();
  api.getAiProxyApiKeys.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.ADD" }));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SAVE" }));
  await waitFor(() => expect(api.addAiProxyApiKey).toHaveBeenCalledTimes(1));
  expect(
    screen.getByRole("button", { name: "SHENYU.COMMON.SAVE" }),
  ).toBeTruthy();
  expect(api.getAiProxyApiKeys).not.toHaveBeenCalled();
});
it("does not refresh an obsolete selector after a delayed mutation", async () => {
  let done;
  api.batchEnableAiProxyApiKeys.mockImplementation(
    () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  );
  const view = await setup();
  fireEvent.click(
    within(
      screen.getByText(row.proxyApiKey, { exact: true }).closest("tr"),
    ).getByRole("switch"),
  );
  view.rerender(<ApiKeys {...props} initialSelectorId="selector-two" />);
  await waitFor(() =>
    expect(api.getAiProxyApiKeys.mock.calls.at(-1)[0].selectorId).toBe(
      "selector-two",
    ),
  );
  api.getAiProxyApiKeys.mockClear();
  await act(async () => done({ code: 200 }));
  expect(api.getAiProxyApiKeys).not.toHaveBeenCalled();
});
