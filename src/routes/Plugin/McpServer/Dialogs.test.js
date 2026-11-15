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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JsonEditModal from "./JsonEditModal";
import McpConfigModal from "./McpConfigModal";
import SwaggerImportModal from "./SwaggerImportModal";
import { clipboardCopy } from "../../../utils/utils";
import { message } from "../../../components/ui/feedback";

jest.mock("@microlink/react-json-view", () => () => (
  <div data-testid="json-view">JSON preview</div>
));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../../../utils/utils", () => ({
  clipboardCopy: jest.fn(() => Promise.resolve(true)),
}));
jest.mock("../../../components/ui/feedback", () => ({
  message: { success: jest.fn(), error: jest.fn() },
}));
const handle = {
  parameters: [{ name: "limit", defaultValue: 0, required: false }],
  requestConfig: '{"method":"GET","url":"https://example.invalid","retries":0}',
  description: "fixture description",
};
const data = {
  id: "tool-fixture",
  selectorId: "selector-fixture",
  name: "fixture",
  enabled: false,
  handle: JSON.stringify(handle),
};
it("keeps rule identity and zero/false values in separate JSON editing", () => {
  const onOk = jest.fn();
  render(<JsonEditModal visible data={data} onOk={onOk} />);
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.MCP.JSON.EDIT.TOOL.NAME.PLACEHOLDER"),
    { target: { value: "renamed" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  const value = onOk.mock.calls[0][0];
  expect(value).toEqual(
    expect.objectContaining({
      id: data.id,
      selectorId: data.selectorId,
      enabled: false,
      name: "renamed",
    }),
  );
  expect(JSON.parse(value.handle)).toEqual(handle);
});
it("supports unified JSON editing and the preview tab", () => {
  const onOk = jest.fn();
  render(<JsonEditModal visible data={data} onOk={onOk} />);
  fireEvent.click(screen.getByLabelText("SHENYU.MCP.JSON.EDIT.MODE.UNIFIED"));
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.MCP.JSON.EDIT.UNIFIED.PLACEHOLDER"),
    { target: { value: JSON.stringify({ name: "unified", ...handle }) } },
  );
  fireEvent.click(
    screen.getByRole("tab", { name: "SHENYU.MCP.JSON.EDIT.TAB.PREVIEW" }),
  );
  expect(screen.getByTestId("json-view")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(onOk.mock.calls[0][0].name).toBe("unified");
  expect(JSON.parse(onOk.mock.calls[0][0].handle)).toEqual(handle);
});
it("blocks invalid JSON submission", () => {
  const onOk = jest.fn();
  render(<JsonEditModal visible data={data} onOk={onOk} />);
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.MCP.JSON.EDIT.UNIFIED.PLACEHOLDER"),
    { target: { value: "{" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  expect(onOk).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalled();
});
it("validates Swagger fields and keeps the URL/project payload", async () => {
  const handleOk = jest.fn();
  render(<SwaggerImportModal handleOk={handleOk} />);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("SHENYU.MCP.SWAGGER.SWAGGER_URL.INPUT");
  expect(handleOk).not.toHaveBeenCalled();
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.MCP.SWAGGER.SWAGGER_URL"),
    { target: { value: "https://example.invalid/openapi.json" } },
  );
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.MCP.SWAGGER.PROJECT_NAME"),
    { target: { value: "fixture-project" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      swaggerUrl: "https://example.invalid/openapi.json",
      projectName: "fixture-project",
    }),
  );
});
it.each([
  ["sse", "sse"],
  ["streamable", "streamableHttp"],
])(
  "preserves %s URL generation and clipboard contents",
  async (configType, transport) => {
    clipboardCopy.mockClear();
    render(
      <McpConfigModal
        visible
        configType={configType}
        selectorList={[
          {
            id: "selector-fixture",
            name: "fixture",
            enabled: true,
            handle: '{"description":"fixture"}',
            selectorConditions: [
              { paramType: "uri", paramValue: "/orders/**" },
            ],
          },
        ]}
      />,
    );
    fireEvent.change(
      screen.getByPlaceholderText("SHENYU.MCP.CONFIG.GATEWAY.PLACEHOLDER"),
      { target: { value: "gateway.example.invalid:9195" } },
    );
    const textarea = screen
      .getAllByRole("textbox")
      .find((node) => node.tagName === "TEXTAREA");
    const config = JSON.parse(textarea.value);
    const server = Object.values(config.mcpServers)[0];
    expect(server.transport).toBe(transport);
    expect(server.url).toBe(
      `http://gateway.example.invalid:9195/orders/${configType === "sse" ? "sse" : "streamablehttp"}`,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "SHENYU.MCP.CONFIG.COPY.JSON" }),
    );
    await waitFor(() => expect(clipboardCopy).toHaveBeenCalledTimes(1));
    expect(
      Object.values(JSON.parse(clipboardCopy.mock.calls[0][0]).mcpServers)[0]
        .url,
    ).toBe(server.url);
  },
);

it("reports copy failure when the clipboard utility returns false", async () => {
  message.error.mockClear();
  clipboardCopy.mockResolvedValueOnce(false);
  render(<JsonEditModal visible data={data} onOk={jest.fn()} />);
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.MCP.JSON.EDIT.COPY" }),
  );
  await waitFor(() =>
    expect(message.error).toHaveBeenCalledWith(
      "SHENYU.MCP.JSON.EDIT.COPY.FAILED",
    ),
  );
});
