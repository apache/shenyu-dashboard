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

const fields = [
  { field: "timeout", label: "Timeout", dataType: 2 },
  { field: "mode", label: "Mode", dataType: 2 },
];

const baseProps = {
  name: "divide",
  role: "Proxy",
  sort: 0,
  id: "plugin-1",
  data: fields,
};

const renderModal = (props) =>
  render(<AddModal {...baseProps} handleOk={jest.fn()} {...props} />);

const save = () =>
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));

it("renders schema fields from a stored JSON object", async () => {
  const handleOk = jest.fn();
  renderModal({ config: '{"timeout":5,"unknown":"keep"}', handleOk });
  expect(screen.getByPlaceholderText("Timeout").value).toBe("5");
  expect(
    screen.queryByDisplayValue('{"timeout":5,"unknown":"keep"}'),
  ).toBeNull();
  save();
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(handleOk.mock.calls[0][0].config)).toEqual({
    timeout: 5,
    unknown: "keep",
  });
});

it.each([undefined, null, ""])(
  "treats a %p config as empty and still saves",
  async (config) => {
    const handleOk = jest.fn();
    renderModal({ config, handleOk });
    expect(screen.getByPlaceholderText("Timeout").value).toBe("");
    expect(
      screen.queryByRole("textbox", { name: "SHENYU.COMMON.SETTING" }),
    ).toBeNull();
    save();
    await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  },
);

beforeEach(() => {
  // validateFieldsAndScroll scrolls to the first error; jsdom has no scrollTo
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
});

it.each(["{not json", "[1, 2]", '"text"'])(
  "shows a stored config %p as raw text and blocks saving until it is a JSON object",
  async (config) => {
    const handleOk = jest.fn();
    renderModal({ config, handleOk });
    const raw = screen.getByDisplayValue(config);
    expect(raw.tagName).toBe("TEXTAREA");
    expect(screen.queryByPlaceholderText("Timeout")).toBeNull();
    expect(
      await screen.findByText("SHENYU.PLUGIN.RULE.JSON.INVALID"),
    ).toBeTruthy();

    save();
    await waitFor(() =>
      expect(screen.getByText("SHENYU.PLUGIN.RULE.JSON.INVALID")).toBeTruthy(),
    );
    expect(handleOk).not.toHaveBeenCalled();

    fireEvent.change(raw, { target: { value: '{"timeout": 5}' } });
    save();
    await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
    expect(handleOk.mock.calls[0][0].config).toBe('{"timeout": 5}');
  },
);

it("renders a field whose handle metadata is not a JSON object without its rules", async () => {
  const handleOk = jest.fn();
  renderModal({
    config: '{"timeout":5}',
    data: [
      { field: "timeout", label: "Timeout", dataType: 2, extObj: "{bad" },
      {
        field: "mode",
        label: "Mode",
        dataType: 2,
        extObj: '{"required":"1","defaultValue":"sync"}',
      },
    ],
    handleOk,
  });
  expect(screen.getByPlaceholderText("Timeout").value).toBe("5");
  expect(screen.getByPlaceholderText("Mode").value).toBe("sync");
  save();
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(JSON.parse(handleOk.mock.calls[0][0].config)).toEqual({
    timeout: 5,
    mode: "sync",
  });
});

it("does not save a stored config that was cleared in the raw text field", async () => {
  const handleOk = jest.fn();
  renderModal({ config: "{not json", handleOk });
  const raw = screen.getByDisplayValue("{not json");
  fireEvent.change(raw, { target: { value: "" } });
  save();
  await waitFor(() =>
    expect(screen.getByText("SHENYU.PLUGIN.RULE.JSON.INVALID")).toBeTruthy(),
  );
  expect(handleOk).not.toHaveBeenCalled();
});
