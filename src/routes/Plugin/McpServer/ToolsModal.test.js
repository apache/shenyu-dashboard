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
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { message } from "antd";
import ToolsModal from "./ToolsModal";
import { clipboardCopy } from "../../../utils/utils";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../../../utils/utils", () => ({ clipboardCopy: jest.fn() }));
jest.mock("@microlink/react-json-view", () => ({ src, onEdit }) => (
  <div>
    <pre>{JSON.stringify(src)}</pre>
    {onEdit && (
      <button
        type="button"
        onClick={() =>
          onEdit({
            updated_src: {
              requestTemplate: { url: "/changed", method: "POST" },
            },
          })
        }
      >
        Change request configuration
      </button>
    )}
  </div>
));

// jsdom has no layout observer; Chromium checks use the browser's real observer.
const originalResizeObserver = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = class {
    observe = () => {};

    unobserve = () => {};

    disconnect = () => {};
  };
});
afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});

const parameter = {
  name: "orderId",
  type: "string",
  description: "Order ID",
  required: true,
};
const requestConfig = {
  requestTemplate: { url: "/orders/{orderId}", method: "GET" },
  argsPosition: { orderId: "url.path" },
};
const ruleConditions = [
  {
    paramType: "uri",
    operator: "pathPattern",
    paramName: "/",
    paramValue: "/**",
  },
];

function setup(overrides = {}) {
  const props = {
    name: "getOrder",
    description: "Order tool",
    handle: JSON.stringify({
      parameters: [parameter],
      requestConfig: JSON.stringify(requestConfig),
    }),
    onCancel: jest.fn(),
    handleOk: jest.fn(),
    ...overrides,
  };
  return { ...render(<ToolsModal {...props} />), props };
}

function confirm() {
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
}
function jsonMode() {
  fireEvent.click(
    screen.getByRole("radio", { name: "SHENYU.MCP.TOOLS.ADD.MODE.JSON" }),
  );
}
function jsonInput() {
  return screen.getByPlaceholderText("SHENYU.MCP.TOOLS.ADD.JSON.PLACEHOLDER");
}
async function choose(index, text) {
  const control = screen.getAllByRole("combobox")[index];
  fireEvent.click(control);
  const list = await waitFor(() => {
    const element = document.getElementById(
      control.getAttribute("aria-controls"),
    );
    expect(element).not.toBeNull();
    return element;
  });
  fireEvent.click(
    within(list)
      .getAllByRole("option")
      .find((option) => option.textContent.trim() === text),
  );
}

beforeEach(() => {
  ["error", "warning", "success"].forEach((key) =>
    jest.spyOn(message, key).mockImplementation(() => {}),
  );
});

it("preserves the form DTO, requestConfig string and caller-controlled closing", async () => {
  const { props } = setup();
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual({
    name: "getOrder",
    description: "Order tool",
    handle: JSON.stringify({
      parameters: [parameter],
      requestConfig: JSON.stringify(requestConfig),
      description: "Order tool",
    }),
    sort: 1,
    enabled: true,
    logged: true,
    matchMode: "0",
    matchRestful: false,
    ruleConditions,
  });
  expect(props.onCancel).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }),
  ).not.toBeNull();
});

it("prefers the saved handle description and retains edited rule-level values", async () => {
  const { props } = setup({
    sort: 27,
    logged: false,
    enabled: false,
    matchMode: "1",
    matchRestful: true,
    handle: JSON.stringify({
      parameters: [],
      requestConfig: "{}",
      description: "Saved handle description",
    }),
  });
  expect(
    screen.getByPlaceholderText(
      "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.DESCRIPTION",
    ).value,
  ).toBe("Saved handle description");
  fireEvent.change(screen.getByPlaceholderText("SHENYU.SELECTOR.INPUTORDER"), {
    target: { value: "12" },
  });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      sort: 12,
      logged: false,
      enabled: false,
      matchMode: "1",
      matchRestful: true,
      description: "Saved handle description",
    }),
  );
});

it.each([
  ["name", "SHENYU.COMMON.INPUTNAME"],
  ["description", "SHENYU.COMMON.INPUTDESCRIPTION"],
  ["sort", "SHENYU.SELECTOR.INPUTNUMBER"],
  ["matchMode", "SHENYU.COMMON.INPUTMATCHTYPE"],
])("blocks the missing required %s field", async (field, error) => {
  const { props } = setup({ [field]: "" });
  confirm();
  if (field === "matchMode")
    await waitFor(() => expect(screen.getAllByText(error)).toHaveLength(2));
  else await screen.findByText(error);
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("keeps boolean switches and match mode as their existing DTO types", async () => {
  const { props } = setup();
  screen.getAllByRole("switch").forEach((control) => fireEvent.click(control));
  await choose(0, "or");
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      logged: false,
      matchRestful: true,
      enabled: false,
      matchMode: "1",
    }),
  );
});

it("adds and deletes top-level parameters without submitting a deleted row", async () => {
  const { props } = setup();
  fireEvent.click(
    screen.getByRole("button", {
      name: "SHENYU.COMMON.ADD SHENYU.COMMON.PARAMETER",
    }),
  );
  fireEvent.change(
    screen.getAllByPlaceholderText("SHENYU.COMMON.PARAMETER.NAME")[1],
    { target: { value: "anotherId" } },
  );
  fireEvent.click(
    screen.getAllByRole("button", { name: "SHENYU.COMMON.DELETE.NAME" })[0],
  );
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(props.handleOk.mock.calls[0][0].handle).parameters).toEqual(
    [{ ...parameter, name: "anotherId", description: "" }],
  );
});

it("creates an array parameter with a fixed items name", async () => {
  const { props } = setup();
  await choose(1, "Array");
  const items = screen.getByPlaceholderText(
    "SHENYU.COMMON.PARAMETER.SUBTYPE.NAME",
  );
  expect(items.value).toBe("items");
  expect(items.disabled).toBe(true);
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(props.handleOk.mock.calls[0][0].handle).parameters).toEqual(
    [
      {
        ...parameter,
        type: "array",
        parameters: [
          { name: "items", type: "string", description: "", required: true },
        ],
      },
    ],
  );
});

it("edits nested fields of an array of objects and normalizes its items name", async () => {
  const { props } = setup({
    handle: JSON.stringify({
      parameters: [
        {
          ...parameter,
          type: "array",
          parameters: [
            {
              name: "oldName",
              type: "object",
              description: "",
              required: true,
              parameters: [],
            },
          ],
        },
      ],
      requestConfig: "{}",
    }),
  });
  expect(
    screen.getByPlaceholderText("SHENYU.COMMON.PARAMETER.SUBTYPE.NAME").value,
  ).toBe("items");
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.COMMON.PARAMETER.SUBTYPE.ADD" }),
  );
  fireEvent.change(
    screen.getAllByPlaceholderText("SHENYU.COMMON.PARAMETER.SUBTYPE.NAME")[1],
    { target: { value: "id" } },
  );
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(props.handleOk.mock.calls[0][0].handle).parameters).toEqual(
    [
      {
        ...parameter,
        type: "array",
        parameters: [
          {
            name: "items",
            type: "object",
            description: "",
            required: true,
            parameters: [
              { name: "id", type: "string", description: "", required: true },
            ],
          },
        ],
      },
    ],
  );
});

it("removes child parameters when an object changes to a primitive type", async () => {
  const { props } = setup({
    handle: JSON.stringify({
      parameters: [
        {
          ...parameter,
          type: "object",
          parameters: [{ ...parameter, name: "child" }],
        },
      ],
      requestConfig: "{}",
    }),
  });
  await choose(1, "String");
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(
    JSON.parse(props.handleOk.mock.calls[0][0].handle).parameters[0].parameters,
  ).toBeUndefined();
});

it("blocks an incomplete parameter row", async () => {
  const { props } = setup({
    handle: JSON.stringify({
      parameters: [{ ...parameter, name: "" }],
      requestConfig: "{}",
    }),
  });
  confirm();
  await waitFor(() => expect(message.error).toHaveBeenCalled());
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("blocks a tree exceeding the existing nesting limit", async () => {
  let nested = { ...parameter };
  for (let i = 0; i < 8; i += 1)
    nested = { ...parameter, type: "object", parameters: [nested] };
  const { props } = setup({
    handle: JSON.stringify({ parameters: [nested], requestConfig: "{}" }),
  });
  confirm();
  await waitFor(() =>
    expect(message.error).toHaveBeenCalledWith(
      expect.stringContaining("SHENYU.MCP.TOOLS.PARAM.DEPTH.EXCEEDED"),
    ),
  );
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("serializes request configuration updates from the JSON editor", async () => {
  const { props } = setup();
  fireEvent.click(
    screen.getByRole("button", { name: "Change request configuration" }),
  );
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(props.handleOk.mock.calls[0][0].handle).requestConfig).toBe(
    JSON.stringify({ requestTemplate: { url: "/changed", method: "POST" } }),
  );
});

it("synchronizes the current form into the flattened JSON mode", () => {
  setup();
  fireEvent.change(
    screen.getByPlaceholderText("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME"),
    { target: { value: "renamedTool" } },
  );
  jsonMode();
  expect(JSON.parse(jsonInput().value)).toEqual({
    name: "renamedTool",
    description: "Order tool",
    enabled: true,
    parameters: [parameter],
    requestConfig: JSON.stringify(requestConfig),
  });
});

it("submits JSON mode with the existing rule-level defaults", () => {
  const { props } = setup({
    sort: 27,
    logged: false,
    matchMode: "1",
    matchRestful: true,
  });
  jsonMode();
  const tool = {
    name: "jsonTool",
    description: "JSON description",
    enabled: false,
    parameters: [parameter],
    requestConfig: JSON.stringify(requestConfig),
  };
  fireEvent.change(jsonInput(), { target: { value: JSON.stringify(tool) } });
  confirm();
  expect(props.handleOk).toHaveBeenCalledWith({
    name: tool.name,
    description: tool.description,
    enabled: false,
    handle: JSON.stringify({
      parameters: tool.parameters,
      requestConfig: tool.requestConfig,
      description: tool.description,
    }),
    sort: 1,
    logged: true,
    matchMode: "0",
    matchRestful: false,
    ruleConditions,
  });
});

it("keeps malformed JSON editable and blocks submission", () => {
  const { props } = setup();
  jsonMode();
  fireEvent.change(jsonInput(), { target: { value: "{bad" } });
  confirm();
  expect(message.error).toHaveBeenCalledWith(
    expect.stringContaining("SHENYU.MCP.JSON.EDIT.FORMAT.ERROR"),
  );
  expect(props.handleOk).not.toHaveBeenCalled();
  expect(jsonInput().value).toBe("{bad");
});

it.each(["", "   "])("blocks an empty JSON tool name (%s)", (name) => {
  const { props } = setup();
  jsonMode();
  fireEvent.change(jsonInput(), {
    target: { value: JSON.stringify({ name }) },
  });
  confirm();
  expect(message.error).toHaveBeenCalledWith(
    "SHENYU.MCP.JSON.EDIT.TOOL.NAME.ERROR",
  );
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("generates, formats, compresses and copies the JSON template", async () => {
  clipboardCopy.mockResolvedValue();
  setup();
  jsonMode();
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.MCP.TOOLS.ADD.JSON.TEMPLATE" }),
  );
  const template = JSON.parse(jsonInput().value);
  expect(template.name).toBe("getOrderById");
  expect(template.parameters[0].name).toBe("orderId");
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.MCP.JSON.EDIT.COMPRESS" }),
  );
  expect(jsonInput().value).toBe(JSON.stringify(template));
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.MCP.JSON.EDIT.FORMAT" }),
  );
  expect(jsonInput().value).toBe(JSON.stringify(template, null, 2));
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.MCP.JSON.EDIT.COPY" }),
  );
  await waitFor(() =>
    expect(clipboardCopy).toHaveBeenCalledWith(jsonInput().value),
  );
});

it("returns JSON edits to the form before submission", async () => {
  const { props } = setup();
  jsonMode();
  fireEvent.change(jsonInput(), {
    target: {
      value: JSON.stringify({
        name: "fromJson",
        description: "Changed",
        enabled: false,
        parameters: [{ ...parameter, name: "newId" }],
        requestConfig: '{"timeout":1000}',
      }),
    },
  });
  fireEvent.click(
    screen.getByRole("radio", { name: "SHENYU.MCP.TOOLS.ADD.MODE.FORM" }),
  );
  await waitFor(() =>
    expect(
      screen.getByPlaceholderText("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME")
        .value,
    ).toBe("fromJson"),
  );
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(props.handleOk.mock.calls[0][0].handle)).toEqual({
    description: "Changed",
    parameters: [{ ...parameter, name: "newId" }],
    requestConfig: '{"timeout":1000}',
  });
});

it("cancels without submitting", () => {
  const { props } = setup();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  expect(props.onCancel).toHaveBeenCalledTimes(1);
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("keeps unsaved rule fields when JSON mode changes only the tool metadata", async () => {
  const { props } = setup({ sort: 7 });
  fireEvent.change(screen.getByPlaceholderText("SHENYU.SELECTOR.INPUTORDER"), {
    target: { value: "41" },
  });
  fireEvent.click(screen.getAllByRole("switch")[0]);
  await choose(0, "or");
  jsonMode();
  const json = JSON.parse(jsonInput().value);
  json.name = "changedInJson";
  fireEvent.change(jsonInput(), { target: { value: JSON.stringify(json) } });
  fireEvent.click(
    screen.getByRole("radio", { name: "SHENYU.MCP.TOOLS.ADD.MODE.FORM" }),
  );
  expect(screen.getByPlaceholderText("SHENYU.SELECTOR.INPUTORDER").value).toBe(
    "41",
  );
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      name: "changedInJson",
      sort: 41,
      logged: false,
      matchMode: "1",
    }),
  );
});

it("submits the form through its native submit event", async () => {
  const { props } = setup();
  fireEvent.submit(document.querySelector("form"));
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
});

it("retains malformed JSON when the user requests form mode", () => {
  const { props } = setup();
  jsonMode();
  fireEvent.change(jsonInput(), { target: { value: "{unfinished" } });
  fireEvent.click(
    screen.getByRole("radio", { name: "SHENYU.MCP.TOOLS.ADD.MODE.FORM" }),
  );
  expect(
    screen.getByRole("radio", { name: "SHENYU.MCP.TOOLS.ADD.MODE.JSON" })
      .checked,
  ).toBe(true);
  expect(jsonInput().value).toBe("{unfinished");
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("normalizes array items recursively inside an array's object element", async () => {
  const nested = {
    ...parameter,
    type: "array",
    parameters: [
      {
        name: "oldOuter",
        type: "object",
        parameters: [
          {
            name: "children",
            type: "array",
            parameters: [{ ...parameter, name: "oldInner" }],
          },
        ],
      },
    ],
  };
  const { props } = setup({
    handle: JSON.stringify({ parameters: [nested], requestConfig: "{}" }),
  });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  const tree = JSON.parse(props.handleOk.mock.calls[0][0].handle).parameters;
  expect(tree[0].parameters[0].name).toBe("items");
  expect(tree[0].parameters[0].parameters[0].parameters[0].name).toBe("items");
});

it.each([
  { parameters: {} },
  { parameters: [null] },
  { parameters: [{ name: "x", type: "object", parameters: {} }] },
])(
  "keeps malformed parameter structures in JSON mode for correction (%j)",
  (structure) => {
    const { props } = setup();
    jsonMode();
    const value = JSON.stringify({ name: "invalid", ...structure });
    fireEvent.change(jsonInput(), { target: { value } });
    fireEvent.click(
      screen.getByRole("radio", { name: "SHENYU.MCP.TOOLS.ADD.MODE.FORM" }),
    );
    expect(
      screen.getByRole("radio", { name: "SHENYU.MCP.TOOLS.ADD.MODE.JSON" })
        .checked,
    ).toBe(true);
    expect(jsonInput().value).toBe(value);
    confirm();
    expect(props.handleOk).not.toHaveBeenCalled();
  },
);

it("reopens structured request configuration without discarding parameters or defaults", async () => {
  const savedParameter = { ...parameter, defaultValue: "fallback" };
  const { props } = setup({
    handle: JSON.stringify({ parameters: [savedParameter], requestConfig }),
  });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(props.handleOk.mock.calls[0][0].handle)).toEqual({
    parameters: [savedParameter],
    requestConfig: JSON.stringify(requestConfig),
    description: "Order tool",
  });
});
