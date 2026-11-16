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
import Plugin from "../../routes/System/Plugin/AddModal";
import PluginHandle from "../../routes/System/PluginHandle/AddModal";
import { message } from "./feedback";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("./feedback", () => ({ message: { warn: jest.fn() } }));

it("submits the original File and preserves plugin config types", async () => {
  const handleOk = jest.fn();
  const file = new File(["test jar bytes"], "example.jar", {
    type: "application/java-archive",
  });
  render(
    <Plugin
      name="example"
      {...{ role: "Proxy" }}
      sort={0}
      enabled={false}
      data={[{ field: "retries", label: "Retries", dataType: 1 }]}
      config='{"retries":0,"unknown":false}'
      handleOk={handleOk}
    />,
  );
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [file] },
  });
  expect(screen.getByText("example.jar")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  const values = handleOk.mock.calls[0][0];
  expect(values.file).toBe(file);
  expect(values).toEqual({
    id: "",
    name: "example",
    role: "Proxy",
    sort: 0,
    enabled: false,
    file,
    config: '{"retries":0,"unknown":false}',
  });
  const body = new FormData();
  body.append("file", values.file);
  expect(body.get("file").name).toBe("example.jar");
});

it("preserves plugin field configuration string flags and zero ordering", async () => {
  const handleOk = jest.fn();
  render(
    <PluginHandle
      id="handle"
      pluginId="divide"
      field="timeout"
      label="Timeout"
      dataType="1"
      type="2"
      sort={0}
      required="0"
      defaultValue="0"
      placeholder=""
      rule=""
      pluginDropDownList={[{ id: "divide", name: "Divide" }]}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "handle",
      pluginId: "divide",
      field: "timeout",
      label: "Timeout",
      dataType: "1",
      type: "2",
      sort: 0,
      required: "0",
      defaultValue: "0",
      placeholder: "",
      rule: "",
    }),
  );
});

it("rejects nonnumeric defaults for numeric plugin fields", async () => {
  const handleOk = jest.fn();
  render(
    <PluginHandle
      pluginId="divide"
      field="timeout"
      label="Timeout"
      defaultValue="bad-number"
      pluginDropDownList={[{ id: "divide", name: "Divide" }]}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(message.warn).toHaveBeenCalledWith(
      "SHENYU.PLUGIN.DEFAULTVALUESHENYU.COMMON.WARN.INPUT_NUMBER",
    ),
  );
  expect(handleOk).not.toHaveBeenCalled();
});

it("opens its own file picker even when another element has the same legacy id", () => {
  const other = document.createElement("input");
  other.id = "file";
  other.type = "file";
  document.body.appendChild(other);
  const otherClick = jest.spyOn(other, "click");
  const { unmount } = render(
    <Plugin name="example" {...{ role: "Proxy" }} sort={0} data={[]} />,
  );
  const own = document.querySelector(".semi-modal input[type=file]");
  const ownClick = jest.spyOn(own, "click").mockImplementation(() => {});
  fireEvent.click(screen.getByRole("button", { name: "Upload" }));
  expect(ownClick).toHaveBeenCalledTimes(1);
  expect(otherClick).not.toHaveBeenCalled();
  unmount();
  other.remove();
});
