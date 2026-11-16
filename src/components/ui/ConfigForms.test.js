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
import Dict from "../../routes/System/Dict/AddModal";
import Plugin from "../../routes/System/NamespacePlugin/AddModal";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

it("preserves disabled dictionary entries, zero sort and empty description", async () => {
  const handleOk = jest.fn();
  render(
    <Dict
      id="dict"
      type="type"
      dictCode="code"
      dictName="Name"
      dictValue="value"
      sort={0}
      enabled={false}
      desc=""
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "dict",
      type: "type",
      dictCode: "code",
      dictName: "Name",
      dictValue: "value",
      sort: 0,
      enabled: false,
      desc: "",
    }),
  );
});

it("validates dictionary required fields before saving", async () => {
  const handleOk = jest.fn();
  render(<Dict handleOk={handleOk} />);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("SHENYU.AUTH.INPUTSHENYU.DIC.TYPE");
  expect(handleOk).not.toHaveBeenCalled();
});

it("retains plugin config types and unknown keys through dynamic controls", async () => {
  const handleOk = jest.fn();
  const config = {
    retries: 0,
    mode: "roundRobin",
    note: "",
    unknown: { keep: true },
  };
  render(
    <Plugin
      id="plugin"
      name="divide"
      sort={0}
      enabled={false}
      config={JSON.stringify(config)}
      data={[
        { field: "retries", label: "Retries", dataType: 1 },
        {
          field: "mode",
          label: "Mode",
          dataType: 3,
          dictOptions: [{ dictValue: "roundRobin", dictName: "Round robin" }],
        },
        { field: "note", label: "Note", dataType: 2 },
      ]}
      handleOk={handleOk}
    />,
  );
  expect(
    screen.getByPlaceholderText("SHENYU.PLUGIN.PLUGIN.NAME").disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0]).toEqual({
    id: "plugin",
    name: "divide",
    sort: 0,
    enabled: false,
    config: expect.any(String),
  });
  expect(JSON.parse(handleOk.mock.calls[0][0].config)).toEqual(config);
});
