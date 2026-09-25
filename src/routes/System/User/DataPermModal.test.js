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
import { act, render, screen } from "@testing-library/react";
import ConnectedDataPermModal from "./DataPermModal";

jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../../../components/_utils/utils", () => ({
  defaultNamespaceId: "A",
}));

const DataPermModal = ConnectedDataPermModal.WrappedComponent;
const plugin = (name) => ({ name, role: "0", pluginId: name });

function setup() {
  const dispatch = jest.fn();
  const ref = React.createRef();
  const view = render(
    <DataPermModal
      ref={ref}
      dispatch={dispatch}
      global={{ plugins: [plugin("global")] }}
      resource={{
        menuTree: [
          {
            url: "/plug",
            children: ["global", "divide", "dubbo"].map((name) => ({
              name,
              meta: { icon: "api" },
              sort: 0,
            })),
          },
        ],
      }}
      namespaces={[
        { namespaceId: "A", name: "A" },
        { namespaceId: "B", name: "B" },
      ]}
    />,
  );
  function requests() {
    return dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === "global/fetchPluginsByNamespace");
  }
  function switchNamespace(key) {
    act(() => ref.current.handleNamespacesValueChange({ key }));
  }
  function respond(index, name) {
    const { callback } = requests()[index].payload;
    expect(callback).toEqual(expect.any(Function));
    act(() => callback([plugin(name)]));
  }
  return { ...view, requests, switchNamespace, respond };
}

it("displays its own namespace plugins and discards delayed responses", () => {
  const modal = setup();
  expect(screen.queryByText("Global")).toBeNull();
  expect(modal.requests()[0].payload.namespaceId).toBe("A");
  modal.switchNamespace("B");
  modal.respond(1, "dubbo");
  expect(screen.getByText("Dubbo")).toBeTruthy();
  modal.respond(0, "divide");
  expect(screen.queryByText("Divide")).toBeNull();
  expect(screen.getByText("Dubbo")).toBeTruthy();
});

it("clears the previous plugin list when switching namespaces", () => {
  const modal = setup();
  modal.respond(0, "divide");
  expect(screen.getByText("Divide")).toBeTruthy();
  modal.switchNamespace("B");
  expect(screen.queryByText("Divide")).toBeNull();
  modal.switchNamespace("A");
  modal.respond(2, "dubbo");
  modal.respond(1, "divide");
  expect(screen.queryByText("Divide")).toBeNull();
  expect(screen.getByText("Dubbo")).toBeTruthy();
});

it("ignores plugin responses after the modal is unmounted", () => {
  const modal = setup();
  const { callback } = modal.requests()[0].payload;
  expect(callback).toEqual(expect.any(Function));
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  modal.unmount();
  act(() => callback([plugin("divide")]));
  expect(error).not.toHaveBeenCalled();
});

it("ignores an earlier response from the same namespace after switching back", () => {
  const modal = setup();
  modal.switchNamespace("B");
  modal.switchNamespace("A");
  modal.respond(2, "dubbo");
  modal.respond(0, "divide");
  expect(screen.queryByText("Divide")).toBeNull();
  expect(screen.getByText("Dubbo")).toBeTruthy();
});
