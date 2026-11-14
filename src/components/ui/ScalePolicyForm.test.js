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
import Policy from "../../routes/System/Scale/PolicyModal";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const begin = "2026-07-01 10:20:30";
const end = "2026-07-01 12:30:40";

it.each(["1", "3"])(
  "does not render or submit dates for policy %s",
  async (id) => {
    const handleOk = jest.fn();
    render(<Policy id={id} num={0} sort={0} status={0} handleOk={handleOk} />);
    expect(
      screen.queryByPlaceholderText("SHENYU.SYSTEM.SCALE.BEGIN_TIME.INPUT"),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
    await waitFor(() =>
      expect(handleOk).toHaveBeenCalledWith({ id, num: 0, sort: 0, status: 0 }),
    );
  },
);

it("keeps local wall-clock fields and the existing literal Z wire format", async () => {
  const handleOk = jest.fn();
  render(
    <Policy
      id="2"
      num={2}
      sort={0}
      status={0}
      beginTime={begin}
      endTime={end}
      handleOk={handleOk}
    />,
  );
  expect(
    screen.getByPlaceholderText("SHENYU.SYSTEM.SCALE.BEGIN_TIME.INPUT").value,
  ).toBe(begin);
  expect(
    screen.getByPlaceholderText("SHENYU.SYSTEM.SCALE.END_TIME.INPUT").value,
  ).toBe(end);
  fireEvent.click(screen.getByRole("switch"));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "2",
      num: 2,
      sort: 0,
      status: 1,
      beginTime: "2026-07-01T10:20:30Z",
      endTime: "2026-07-01T12:30:40Z",
    }),
  );
});

it("validates required scaling values and cancels without saving", async () => {
  const handleOk = jest.fn();
  const handleCancel = jest.fn();
  render(
    <Policy
      id="1"
      num=""
      sort={0}
      handleOk={handleOk}
      handleCancel={handleCancel}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("SHENYU.SYSTEM.SCALE.POLICY_NUMBER.INPUT");
  expect(handleOk).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  expect(handleCancel).toHaveBeenCalledTimes(1);
});

it("submits a changed calendar day without changing the clock time", async () => {
  const handleOk = jest.fn();
  render(
    <Policy
      id="2"
      num={2}
      sort={0}
      status={0}
      beginTime={begin}
      endTime={end}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(
    screen.getByPlaceholderText("SHENYU.SYSTEM.SCALE.BEGIN_TIME.INPUT"),
  );
  fireEvent.click(
    await screen.findByRole("gridcell", { name: "2026-07-02", exact: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Confirm", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith(
      expect.objectContaining({ beginTime: "2026-07-02T10:20:30Z" }),
    ),
  );
});

it("commits a manually entered time with seconds", async () => {
  const handleOk = jest.fn();
  render(
    <Policy
      id="2"
      num={2}
      sort={0}
      beginTime={begin}
      endTime={end}
      handleOk={handleOk}
    />,
  );
  const input = screen.getByPlaceholderText(
    "SHENYU.SYSTEM.SCALE.BEGIN_TIME.INPUT",
  );
  fireEvent.change(input, { target: { value: "2026-07-01 09:08:07" } });
  fireEvent.blur(input);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith(
      expect.objectContaining({ beginTime: "2026-07-01T09:08:07Z" }),
    ),
  );
});

it.each([null, "bad-time"])(
  "does not submit a missing or malformed initial time: %p",
  async (beginTime) => {
    const handleOk = jest.fn();
    render(
      <Policy
        id="2"
        num={2}
        sort={0}
        beginTime={beginTime}
        endTime={end}
        handleOk={handleOk}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
    await waitFor(() =>
      expect(
        document.querySelector(".semi-form-field-error-message"),
      ).not.toBeNull(),
    );
    expect(handleOk).not.toHaveBeenCalled();
  },
);

it("does not silently submit an old time after invalid text is entered", async () => {
  const handleOk = jest.fn();
  render(
    <Policy
      id="2"
      num={2}
      sort={0}
      beginTime={begin}
      endTime={end}
      handleOk={handleOk}
    />,
  );
  const input = screen.getByPlaceholderText(
    "SHENYU.SYSTEM.SCALE.BEGIN_TIME.INPUT",
  );
  fireEvent.change(input, { target: { value: "2026-02-31 10:00:00" } });
  fireEvent.blur(input);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(
      document.querySelector(".semi-form-field-error-message"),
    ).not.toBeNull(),
  );
  expect(handleOk).not.toHaveBeenCalled();
});
