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
import RuleModal from "../../routes/System/Scale/RuleModal";

jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

it("retains numeric type, zero bounds and disabled status", async () => {
  const handleOk = jest.fn();
  render(
    <RuleModal
      id="rule"
      metricName="cpu"
      type={0}
      sort="0"
      status={0}
      minimum={0}
      maximum={0}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({
      id: "rule",
      metricName: "cpu",
      type: 0,
      sort: "0",
      status: 0,
      minimum: 0,
      maximum: 0,
    }),
  );
});

it("maps a toggled status back to the numeric API value", async () => {
  const handleOk = jest.fn();
  render(
    <RuleModal
      metricName="cpu"
      type={0}
      sort="1"
      status={0}
      minimum={0}
      maximum={100}
      handleOk={handleOk}
    />,
  );
  fireEvent.click(screen.getByRole("switch"));
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith(
      expect.objectContaining({ status: 1, minimum: 0, maximum: 100 }),
    ),
  );
});

it("rejects an empty metric and cancels without saving", async () => {
  const handleOk = jest.fn();
  const handleCancel = jest.fn();
  render(
    <RuleModal
      metricName=""
      sort="1"
      handleOk={handleOk}
      handleCancel={handleCancel}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("SHENYU.SYSTEM.SCALE.CONFIG_NAME.INPUT");
  expect(handleOk).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  expect(handleCancel).toHaveBeenCalledTimes(1);
});
