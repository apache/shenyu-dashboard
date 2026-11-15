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
import ConnectedDict from "./index";

jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children, noAuth, perms }) =>
      mockDenied.has(perms)
        ? noAuth || null
        : typeof children === "function"
          ? children({})
          : children,
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
          type: "custom",
          dictCode: "zero",
          dictName: "Zero",
          dictValue: "0",
          sort: 0,
          enabled: false,
        })
      }
    >
      Save dictionary
    </button>
    <button type="button" onClick={props.handleCancel}>
      Cancel dictionary
    </button>
  </div>
));
const mockDenied = new Set();
beforeEach(() => mockDenied.clear());
const Dict = ConnectedDict.WrappedComponent;
const record = {
  id: "row-1",
  type: "custom",
  dictCode: "zero",
  dictName: "Zero",
  dictValue: "0",
  sort: 0,
  enabled: true,
};
function setup() {
  const dispatch = jest.fn();
  render(
    <Dict
      dispatch={dispatch}
      language="en-US"
      loading={false}
      shenyuDict={{ shenyuDictList: [record], total: 30 }}
    />,
  );
  return dispatch;
}
it("filters and pages with all query fields", () => {
  const dispatch = setup();
  dispatch.mockClear();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.DIC.INPUTTYPE"), {
    target: { value: "custom" },
  });
  fireEvent.change(screen.getByPlaceholderText("SHENYU.DIC.INPUTCODE"), {
    target: { value: "zero" },
  });
  fireEvent.change(screen.getByPlaceholderText("SHENYU.DIC.INPUTNAME"), {
    target: { value: "Zero" },
  });
  dispatch.mockClear();
  fireEvent.click(
    screen.queryByTitle("Next Page") || screen.getByLabelText("Next"),
  );
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({
    type: "shenyuDict/fetch",
    payload: {
      type: "custom",
      dictCode: "zero",
      dictName: "Zero",
      currentPage: 2,
      pageSize: 12,
    },
  });
});
it.each([
  ["SHENYU.SYSTEM.EDITOR", "update", true],
  ["SHENYU.COMMON.COPY", "add", false],
])(
  "preserves zero/false values and identity for %s",
  (label, effect, hasId) => {
    const dispatch = setup();
    fireEvent.click(screen.getAllByText(label)[0]);
    const fetch = dispatch.mock.calls.at(-1)[0];
    expect(fetch.payload).toEqual({ id: "row-1" });
    act(() => fetch.callback(record));
    fireEvent.click(screen.getByText("Save dictionary"));
    const action = dispatch.mock.calls.at(-1)[0];
    expect(action.type).toBe(`shenyuDict/${effect}`);
    expect(action.payload).toEqual(
      expect.objectContaining({ dictValue: "0", sort: 0, enabled: false }),
    );
    expect(Object.prototype.hasOwnProperty.call(action.payload, "id")).toBe(
      hasId,
    );
  },
);
it("cancels without fetching and disables the selected row by boolean", () => {
  const dispatch = setup();
  fireEvent.click(screen.getByText("SHENYU.COMMON.ADD"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Cancel dictionary"));
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("switch"));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "shenyuDict/updateEn",
      payload: { list: ["row-1"], enabled: false },
    }),
  );
});
it("keeps status read-only without disable permission", () => {
  mockDenied.add("system:dict:disable");
  setup();
  expect(screen.queryByRole("switch")).toBeNull();
  expect(screen.getByText("SHENYU.COMMON.OPEN")).toBeTruthy();
});

it("selects without fetching and lets the model own filtered delete refresh", () => {
  const dispatch = setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.DIC.INPUTTYPE"), {
    target: { value: "custom" },
  });
  dispatch.mockClear();
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  expect(dispatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.DELETEDATA"));
  fireEvent.click(screen.getByText("SHENYU.COMMON.SURE"));
  const action = dispatch.mock.calls.at(-1)[0];
  expect(action.payload).toEqual({ list: ["row-1"] });
  expect(action.fetchValue).toEqual({
    type: "custom",
    dictCode: "",
    dictName: "",
    currentPage: 1,
    pageSize: 12,
  });
  dispatch.mockClear();
  act(() => action.callback());
  expect(dispatch).not.toHaveBeenCalled();
});
it("changes page size once and resets page one", async () => {
  const dispatch = setup();
  fireEvent.click(screen.getByLabelText("Next"));
  dispatch.mockClear();
  fireEvent.click(screen.getByText("Items per page: 12", { exact: true }));
  const option = await screen.findByRole("option", {
    name: /Items per page: 20$/,
  });
  fireEvent.click(option);
  fireEvent.animationEnd(option.closest("[x-placement]"));
  await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
  expect(dispatch.mock.calls[0][0].payload).toEqual(
    expect.objectContaining({ currentPage: 1, pageSize: 20 }),
  );
});
it("preserves filters in add refresh and avoids a second callback fetch", () => {
  const dispatch = setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.DIC.INPUTTYPE"), {
    target: { value: "custom" },
  });
  fireEvent.click(screen.getByText("SHENYU.COMMON.ADD"));
  fireEvent.click(screen.getByText("Save dictionary"));
  const action = dispatch.mock.calls.at(-1)[0];
  expect(action.fetchValue).toEqual({
    type: "custom",
    dictCode: "",
    dictName: "",
    currentPage: 1,
    pageSize: 12,
  });
  dispatch.mockClear();
  act(() => action.callback());
  expect(dispatch).not.toHaveBeenCalled();
});
it("batch toggles only selected IDs and reloads the first filtered page once", () => {
  const dispatch = setup();
  fireEvent.change(screen.getByPlaceholderText("SHENYU.DIC.INPUTTYPE"), {
    target: { value: "custom" },
  });
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  fireEvent.click(screen.getByText("SHENYU.PLUGIN.BATCH"));
  const detail = dispatch.mock.calls.at(-1)[0];
  expect(detail.payload).toEqual({ id: "row-1" });
  act(() => detail.callback(record));
  const action = dispatch.mock.calls.at(-1)[0];
  expect(action.type).toBe("shenyuDict/updateEn");
  expect(action.payload).toEqual({ list: ["row-1"], enabled: false });
  expect(action.fetchValue).toEqual(
    expect.objectContaining({ type: "custom", currentPage: 1 }),
  );
  dispatch.mockClear();
  act(() => action.callback());
  expect(dispatch).not.toHaveBeenCalled();
});
