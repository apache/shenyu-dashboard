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
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { getDiscovery } from "../../../services/api";
import { DiscoveryLookupModalComponent as DiscoveryLookupModal } from "./DiscoveryLookupModal";

jest.mock("../../../services/api", () => ({ getDiscovery: jest.fn() }));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

const defaults = {
  pluginName: "divide",
  namespaceId: "ns-1",
  typeEnums: ["nacos", "zookeeper"],
  title: "SHENYU.DISCOVERY.SELECTOR.CONFIG.IMPORT.CONFIRM",
  onCancel: jest.fn(),
};
const importButton = () =>
  screen.getByRole("button", {
    name: "SHENYU.DISCOVERY.SELECTOR.CONFIG.IMPORT.SURE",
  });
beforeEach(() => getDiscovery.mockReset());

it("waits for a type, then imports only the most recent selection", async () => {
  let finishFirst;
  getDiscovery.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
  );
  const config = {
    discoveryType: "zookeeper",
    discoveryName: "ZooKeeper registry",
    id: "zk-id",
    serverList: "zk-host",
    props: "{}",
  };
  getDiscovery.mockResolvedValueOnce({ code: 200, data: config });
  const onOk = jest.fn();
  render(<DiscoveryLookupModal {...defaults} onOk={onOk} />);
  expect(getDiscovery).not.toHaveBeenCalled();
  expect(importButton().disabled).toBe(true);
  const selectType = async (type) => {
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText(type));
    expect(getDiscovery).toHaveBeenLastCalledWith({
      pluginName: "divide",
      level: "1",
      namespaceId: "ns-1",
      discoveryType: type,
    });
  };
  await selectType("nacos");
  await selectType("zookeeper");
  await screen.findByText("zk-host");
  await act(async () =>
    finishFirst({ code: 200, data: { type: "nacos", id: "nacos-id" } }),
  );
  fireEvent.click(importButton());
  expect(onOk).toHaveBeenCalledWith(
    { ...config, type: "zookeeper", name: "ZooKeeper registry" },
    "zookeeper",
  );
});

it("clears the previous namespace and permits creation only after a successful empty lookup", async () => {
  getDiscovery
    .mockResolvedValueOnce({ code: 200, data: { type: "nacos", id: "old" } })
    .mockResolvedValueOnce({ code: 400, message: "Duplicate definitions" })
    .mockResolvedValueOnce({ code: 200, data: null });
  const onOk = jest.fn();
  const props = {
    ...defaults,
    initialType: "nacos",
    canCreate: () => true,
    onOk,
  };
  const view = render(<DiscoveryLookupModal {...props} />);
  const confirm = () =>
    screen.getByRole("button", { name: "SHENYU.COMMON.SURE" });
  await waitFor(() => expect(confirm().disabled).toBe(false));
  view.rerender(<DiscoveryLookupModal {...props} namespaceId="ns-2" />);
  expect(confirm().disabled).toBe(true);
  await screen.findByText("Duplicate definitions");
  expect(confirm().disabled).toBe(true);
  view.rerender(<DiscoveryLookupModal {...props} namespaceId="ns-3" />);
  await waitFor(() => expect(confirm().disabled).toBe(false));
  fireEvent.click(confirm());
  expect(onOk).toHaveBeenCalledWith(null, "nacos");
});

it.each([
  [{ code: 200, data: null }, "SHENYU.DISCOVERY.CONFIGURATION.NO.MATCH"],
  [
    { code: 200, data: { discoveryType: "zookeeper", id: "wrong-type" } },
    "SHENYU.DISCOVERY.CONFIGURATION.LOAD.ERROR",
  ],
])(
  "keeps import disabled without a matching record",
  async (response, hint) => {
    getDiscovery.mockResolvedValue(response);
    render(<DiscoveryLookupModal {...defaults} initialType="nacos" />);
    await screen.findByText(hint);
    expect(importButton().disabled).toBe(true);
  },
);
