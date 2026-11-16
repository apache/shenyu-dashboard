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
  act,
  waitFor,
} from "@testing-library/react";
import ConnectedHandle, { getHandleDetails } from "./index";

jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      typeof children === "function" ? children({}) : children,
);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
  getCurrentLocale: jest.fn(),
}));
jest.mock("../../../components/ui/feedback", () => ({
  message: { warn: jest.fn(), destroy: jest.fn() },
}));
jest.mock("./AddModal", () => (props) => (
  <div>
    <button
      type="button"
      onClick={() =>
        props.handleOk({
          ...props,
          pluginId: "plugin-1",
          field: "timeout",
          label: "Timeout",
          dataType: "1",
          type: "2",
          sort: 0,
          required: "0",
          defaultValue: "0",
          placeholder: "value",
          rule: "",
        })
      }
    >
      Save field
    </button>
    <button type="button" onClick={props.handleCancel}>
      Cancel field
    </button>
    <span data-testid="plugin-options">
      {props.pluginDropDownList.map((p) => p.name).join(",")}
    </span>
  </div>
));
const Handle = ConnectedHandle.WrappedComponent;
const record = () => ({
  id: "row-1",
  key: "row-1",
  pluginId: "plugin-1",
  field: "timeout",
  type: 2,
  dataType: 1,
  sort: 0,
  extObj: '{"required":"0","defaultValue":"0","placeholder":"value","rule":""}',
});
async function setup() {
  const dispatch = jest.fn();
  const view = render(
    <Handle
      dispatch={dispatch}
      language="en-US"
      loading={false}
      pluginHandle={{
        pluginHandleList: [record()],
        pluginDropDownList: [{ id: "plugin-1", name: "divide" }],
        total: 30,
      }}
    />,
  );
  await waitFor(() =>
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "pluginHandle/fetch" }),
    ),
  );
  return { ...view, dispatch };
}
it("loads plugins and queries the initial page", async () => {
  const { dispatch } = await setup();
  expect(dispatch).toHaveBeenCalledWith({
    type: "pluginHandle/fetchPluginList",
  });
  expect(dispatch).toHaveBeenCalledWith({
    type: "pluginHandle/fetch",
    payload: { pluginId: "", field: "", currentPage: 1, pageSize: 12 },
  });
});
it("filters fields on page one and paginates once", async () => {
  const { dispatch } = await setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.PLUGIN.FIELDNAME"), {
    target: { value: "timeout" },
  });
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({
    type: "pluginHandle/fetch",
    payload: { pluginId: "", field: "timeout", currentPage: 2, pageSize: 12 },
  });
});
it.each([
  ["SHENYU.SYSTEM.EDITOR", "update", true],
  ["SHENYU.COMMON.COPY", "add", false],
])(
  "preserves extension values and identity for %s",
  async (label, effect, hasId) => {
    const { dispatch } = await setup();
    await act(async () => {
      fireEvent.click(screen.getAllByText(label)[0]);
    });
    const fetch = dispatch.mock.calls
      .map(([a]) => a)
      .find((a) => a.type === "pluginHandle/fetchItem");
    expect(fetch.payload).toEqual({ id: "row-1" });
    act(() => fetch.callback(record()));
    expect(screen.getByTestId("plugin-options").textContent).toBe("divide");
    fireEvent.click(screen.getByText("Save field"));
    const action = dispatch.mock.calls.at(-1)[0];
    expect(action.type).toBe(`pluginHandle/${effect}`);
    expect(Object.prototype.hasOwnProperty.call(action.payload, "id")).toBe(
      hasId,
    );
    expect(action.fetchValue).toEqual({
      pluginId: "",
      field: "",
      currentPage: 1,
      pageSize: 12,
    });
    dispatch.mockClear();
    act(() => action.callback());
    expect(dispatch).not.toHaveBeenCalled();
    expect(action.payload.sort).toBe(0);
    expect(JSON.parse(action.payload.extObj)).toEqual({
      required: "0",
      defaultValue: "0",
      placeholder: "value",
      rule: "",
    });
  },
);

it("cancels without fetching and waits for the plugin list before opening", async () => {
  const { dispatch } = await setup();
  let resolve;
  dispatch.mockImplementation((action) =>
    action.type === "pluginHandle/fetchPluginList"
      ? new Promise((done) => {
          resolve = done;
        })
      : undefined,
  );
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.ADDDATA"));
  expect(screen.queryByText("Cancel field")).toBeNull();
  await act(async () => resolve());
  expect(screen.getByTestId("plugin-options").textContent).toBe("divide");
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Cancel field"));
  expect(dispatch).not.toHaveBeenCalled();
});
it("ignores delayed plugin loads after unmount", async () => {
  let resolve;
  const dispatch = jest.fn(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const view = render(
    <Handle
      dispatch={dispatch}
      language="en-US"
      pluginHandle={{ pluginHandleList: [], pluginDropDownList: [], total: 0 }}
    />,
  );
  view.unmount();
  await act(async () => resolve());
  expect(dispatch).toHaveBeenCalledTimes(1);
});
it("decodes fields once without changing source rows or their identity", () => {
  const source = Object.freeze({
    ...record(),
    extObj:
      '{"id":"wrong-id","required":"0","defaultValue":0,"placeholder":"","rule":""}',
  });
  const row = getHandleDetails(source);
  expect(row.id).toBe("row-1");
  expect(row.defaultValue).toBe(0);
  expect(row.required).toBe("0");
  expect(source.defaultValue).toBeUndefined();
  expect(getHandleDetails({ ...source, extObj: "invalid" }).id).toBe("row-1");
});
it("changes page size once with field filter retained", async () => {
  const { dispatch } = await setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.PLUGIN.FIELDNAME"), {
    target: { value: "timeout" },
  });
  fireEvent.click(screen.getByLabelText("Next"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
  expect(dispatch.mock.calls[0][0].payload).toEqual({
    pluginId: "",
    field: "timeout",
    currentPage: 1,
    pageSize: 20,
  });
});
it("deletes only selected IDs and leaves filtered refresh to the model", async () => {
  const { dispatch } = await setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.PLUGIN.FIELDNAME"), {
    target: { value: "timeout" },
  });
  dispatch.mockClear();
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("SHENYU.COMMON.DELETE.NAME"));
  fireEvent.click(screen.getByText("SHENYU.COMMON.SURE"));
  const action = dispatch.mock.calls.at(-1)[0];
  expect(action.type).toBe("pluginHandle/delete");
  expect(action.payload).toEqual({ list: ["row-1"] });
  expect(action.fetchValue).toEqual({
    pluginId: "",
    field: "timeout",
    currentPage: 1,
    pageSize: 12,
  });
  dispatch.mockClear();
  act(() => action.callback());
  expect(dispatch).not.toHaveBeenCalled();
});
