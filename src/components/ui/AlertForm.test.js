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
import Alert from "../../routes/System/Alert/AddModal";

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const base = {
  id: "alert",
  name: "Ops",
  type: 1,
  email: "ops@example.test",
  enable: false,
  matchAll: false,
  levels: [0, 2],
  labels: { service: "gateway" },
};

it("preserves false switches, string levels and labels in the save payload", async () => {
  const handleOk = jest.fn();
  render(<Alert {...base} handleOk={handleOk} />);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      ...base,
      type: "1",
      levels: ["0", "2"],
    }),
  );
});

it("sends test requests through its separate callback", async () => {
  const handleOk = jest.fn();
  const handleSendTest = jest.fn();
  render(
    <Alert {...base} handleOk={handleOk} handleSendTest={handleSendTest} />,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "SHENYU.SYSTEM.ALERT.BUTTON.SEND_TEST",
    }),
  );
  await waitFor(() =>
    expect(handleSendTest).toHaveBeenCalledWith({
      ...base,
      type: "1",
      levels: ["0", "2"],
    }),
  );
  expect(handleOk).not.toHaveBeenCalled();
});

it("replaces email fields when the delivery type changes", async () => {
  const handleOk = jest.fn();
  render(<Alert {...base} handleOk={handleOk} />);
  fireEvent.click(screen.getAllByText("SHENYU.SYSTEM.ALERT.EMAIL")[0]);
  fireEvent.click(await screen.findByText("SHENYU.SYSTEM.ALERT.DING_TALK"));
  const token = await screen.findByPlaceholderText(
    "SHENYU.SYSTEM.ALERT.ACCESS_TOKEN.INPUT",
  );
  expect(
    screen.queryByPlaceholderText("SHENYU.SYSTEM.ALERT.EMAIL.INPUT"),
  ).toBeNull();
  fireEvent.change(token, { target: { value: "test-token" } });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0]).toEqual({
    id: "alert",
    name: "Ops",
    type: "5",
    enable: false,
    matchAll: false,
    levels: ["0", "2"],
    labels: { service: "gateway" },
    accessToken: "test-token",
  });
});

it("adds and removes label rows without leaking deleted labels", async () => {
  const handleOk = jest.fn();
  render(<Alert {...base} handleOk={handleOk} />);
  fireEvent.click(screen.getByText("SHENYU.SYSTEM.ALERT.LABELS.ADD"));
  fireEvent.change(
    screen.getAllByPlaceholderText("SHENYU.SYSTEM.ALERT.LABELS.NAME")[1],
    { target: { value: "region" } },
  );
  fireEvent.change(
    screen.getAllByPlaceholderText("SHENYU.SYSTEM.ALERT.LABELS.VALUE")[1],
    { target: { value: "test" } },
  );
  fireEvent.click(screen.getAllByText("SHENYU.SYSTEM.ALERT.LABELS.DELETE")[0]);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith(
      expect.objectContaining({ labels: { region: "test" } }),
    ),
  );
});

it("updates both switches and omits unmounted level filters", async () => {
  const handleOk = jest.fn();
  render(<Alert {...base} handleOk={handleOk} />);
  fireEvent.click(screen.getAllByRole("switch")[0]);
  fireEvent.click(screen.getAllByRole("switch")[1]);
  expect(
    screen.queryByPlaceholderText("SHENYU.SYSTEM.ALERT.LABELS.NAME"),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "alert",
      name: "Ops",
      type: "1",
      email: "ops@example.test",
      enable: true,
      matchAll: true,
      labels: { service: "gateway" },
    }),
  );
});
