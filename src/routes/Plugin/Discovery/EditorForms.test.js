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
import Form from "../../../components/ui/Form";
import { ProxySelectorModalComponent } from "./ProxySelectorModal";
import ConnectedConfig from "./DiscoveryConfigModal";

jest.mock("./ProxySelectorCopy", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
const Proxy = Form.create()(ProxySelectorModalComponent);
const Config = Form.create()(ConnectedConfig.WrappedComponent);
it("submits proxy selector with original upstream identity and disabled gray", async () => {
  let callback;
  const handleOk = jest.fn();
  const row = {
    key: 1,
    id: "upstream",
    url: "example.invalid:8080",
    protocol: "tcp://",
    status: 0,
    weight: 0,
    startupTime: 0,
    warmupTime: 0,
    gray: false,
  };
  render(
    <Proxy
      discoveryDicts={[]}
      discoveryType="local"
      chosenType="local"
      typeEnums={["local"]}
      dispatch={({ payload }) => {
        if (payload?.callBack) callback = payload.callBack;
      }}
      isAdd={false}
      data={{
        name: "fixture",
        forwardPort: 9000,
        props: {},
        discovery: { type: "local", props: "{}" },
      }}
      discoveryUpstreams={[row]}
      recordCount={1}
      handleOk={handleOk}
      handleCancel={jest.fn()}
    />,
  );
  act(() => callback([]));
  fireEvent.click(
    screen.getByRole("tab", {
      name: "SHENYU.DISCOVERY.SELECTOR.CONFIG.DISCOVERY",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.EDIT",
    }),
  );
  fireEvent.change(screen.getByDisplayValue("example.invalid:8080"), {
    target: { value: "changed.invalid:8080" },
  });
  fireEvent.click(
    screen.getByRole("button", {
      name: "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.SAVE",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0]).toMatchObject({
    name: "fixture",
    forwardPort: 9000,
    selectedDiscoveryType: "local",
    upstreams: [{ ...row, url: "changed.invalid:8080" }],
  });
});
it("keeps registry connection fields readonly while renaming configuration", async () => {
  const handleOk = jest.fn();
  render(
    <Config
      dispatch={jest.fn()}
      isSetConfig
      discoveryDicts={[]}
      typeEnums={["local", "zookeeper"]}
      data={{
        id: "registry",
        type: "zookeeper",
        name: "old",
        serverList: "example.invalid:2181",
        props: '{"timeout":0,"enabled":false}',
      }}
      handleOk={handleOk}
      handleCancel={jest.fn()}
      handleConfigDelete={jest.fn()}
    />,
  );
  expect(screen.getByDisplayValue("example.invalid:2181").disabled).toBe(true);
  fireEvent.change(screen.getByDisplayValue("old"), {
    target: { value: "renamed" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0]).toMatchObject({
    name: "renamed",
    serverList: "example.invalid:2181",
    discoveryType: "zookeeper",
  });
  expect(JSON.parse(handleOk.mock.calls[0][0].props)).toEqual({
    timeout: 0,
    enabled: false,
  });
});
