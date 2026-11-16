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
import { fireEvent, render, screen } from "@testing-library/react";
import { DiscoveryCard } from "./DiscoveryCard";

let mockAllowed = true;
jest.mock(
  "../../../utils/AuthButton",
  () =>
    ({ children }) =>
      mockAllowed ? children({}) : null,
);
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const data = {
  id: "selector",
  name: "Fixture",
  props: "{}",
  forwardPort: 9000,
  createTime: 0,
  updateTime: 0,
  discoveryHandlerId: "handler",
  discovery: { type: "local" },
};
beforeEach(() => {
  mockAllowed = true;
});
it("routes refresh, edit and confirmed delete to their exact identities", async () => {
  const updateSelector = jest.fn(),
    handleDelete = jest.fn(),
    handleRefresh = jest.fn();
  render(
    <DiscoveryCard
      data={data}
      updateSelector={updateSelector}
      handleDelete={handleDelete}
      handleRefresh={handleRefresh}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.COMMON.REFRESH" }),
  );
  expect(handleRefresh).toHaveBeenCalledWith("handler");
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CHANGE" }));
  expect(updateSelector).toHaveBeenCalledWith("selector");
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.COMMON.DELETE.NAME" }),
  );
  expect(handleDelete).not.toHaveBeenCalled();
  fireEvent.click(
    await screen.findByRole("button", { name: "SHENYU.COMMON.YES" }),
  );
  expect(handleDelete).toHaveBeenCalledWith("selector");
});
it("does not expose action controls without permission", () => {
  mockAllowed = false;
  render(<DiscoveryCard data={data} />);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});
