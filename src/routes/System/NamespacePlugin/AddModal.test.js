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
import AddModal from "./AddModal";

jest.mock("dva", () => ({ connect: () => (Component) => Component }));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("react-json-view", () => (props) => (
  <button
    type="button"
    onClick={() => props.onEdit({ updated_src: { edited: true } })}
  >
    Edit JSON
  </button>
));

it.each([null, false, 0, "", { existing: [1, 2] }])(
  "preserves untouched JSON configuration %p on a form save",
  async (value) => {
    const handleOk = jest.fn();
    render(
      <AddModal
        name="divide"
        sort={0}
        id="plugin-1"
        config={JSON.stringify({ settings: value, unknown: "keep" })}
        data={[{ field: "settings", label: "Settings", dataType: 4 }]}
        handleOk={handleOk}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
    await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
    expect(JSON.parse(handleOk.mock.calls[0][0].config)).toEqual({
      settings: value,
      unknown: "keep",
    });
  },
);

it("saves actual JSON edits while preserving other stored fields", async () => {
  const handleOk = jest.fn();
  render(
    <AddModal
      name="divide"
      sort={0}
      id="plugin-1"
      config={JSON.stringify({ settings: null, unknown: "keep" })}
      data={[{ field: "settings", label: "Settings", dataType: 4 }]}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit JSON" }));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(handleOk.mock.calls[0][0].config)).toEqual({
    settings: { edited: true },
    unknown: "keep",
  });
});

beforeEach(() => {
  // validateFieldsAndScroll scrolls to the first error; jsdom has no scrollTo
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
});

it.each(["{not json", "[1, 2]"])(
  "shows a stored config %p as raw text and blocks saving until it is a JSON object",
  async (config) => {
    const handleOk = jest.fn();
    render(
      <AddModal
        name="divide"
        sort={0}
        id="plugin-1"
        config={config}
        data={[
          { field: "timeout", label: "Timeout", dataType: 2 },
          { field: "settings", label: "Settings", dataType: 4 },
        ]}
        handleOk={handleOk}
      />,
    );
    const raw = screen.getByDisplayValue(config);
    expect(raw.tagName).toBe("TEXTAREA");
    expect(screen.queryByPlaceholderText("Timeout")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit JSON" })).toBeNull();
    expect(
      await screen.findByText("SHENYU.PLUGIN.RULE.JSON.INVALID"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
    await waitFor(() =>
      expect(screen.getByText("SHENYU.PLUGIN.RULE.JSON.INVALID")).toBeTruthy(),
    );
    expect(handleOk).not.toHaveBeenCalled();

    fireEvent.change(raw, { target: { value: '{"timeout": 5}' } });
    fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
    await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
    expect(handleOk.mock.calls[0][0].config).toBe('{"timeout": 5}');
  },
);

it("renders a field whose handle metadata is not a JSON object", () => {
  render(
    <AddModal
      name="divide"
      sort={0}
      id="plugin-1"
      config='{"timeout":5}'
      data={[
        { field: "timeout", label: "Timeout", dataType: 2, extObj: "{bad" },
      ]}
      handleOk={jest.fn()}
    />,
  );
  expect(screen.getByPlaceholderText("Timeout").value).toBe("5");
});

it("does not save a stored config that was cleared in the raw text field", async () => {
  const handleOk = jest.fn();
  render(
    <AddModal
      name="divide"
      sort={0}
      id="plugin-1"
      config="{not json"
      data={[{ field: "timeout", label: "Timeout", dataType: 2 }]}
      handleOk={handleOk}
    />,
  );
  const raw = screen.getByDisplayValue("{not json");
  fireEvent.change(raw, { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(screen.getByText("SHENYU.PLUGIN.RULE.JSON.INVALID")).toBeTruthy(),
  );
  expect(handleOk).not.toHaveBeenCalled();
});
