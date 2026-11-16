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
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import Table from "./DiscoveryUpstreamTable";

jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key.split(".").pop(),
}));
const row = (key = 1) => ({
  key,
  id: `server-${key}`,
  protocol: "http://",
  url: `server-${key}:8080`,
  status: 0,
  weight: 50,
  startupTime: 0,
  warmupTime: 10,
  gray: false,
});
function mount(data = [row()], isLocal = true) {
  const onTableChange = jest.fn(),
    onCountChange = jest.fn();
  const view = render(
    <LocaleProvider locale={enUS}>
      <Table
        dataSource={data}
        recordCount={data.length}
        isLocal={isLocal}
        onTableChange={onTableChange}
        onCountChange={onCountChange}
      />
    </LocaleProvider>,
  );
  return { ...view, onTableChange, onCountChange };
}
it("edits an upstream without losing server identity, zero or false", async () => {
  const h = mount();
  fireEvent.click(screen.getByText("EDIT"));
  fireEvent.change(screen.getByDisplayValue("server-1:8080"), {
    target: { value: "edited:8080" },
  });
  fireEvent.click(screen.getByText("SAVE"));
  await waitFor(() => expect(h.onTableChange).toHaveBeenCalledTimes(1));
  expect(h.onTableChange.mock.calls[0][0]).toEqual([
    { ...row(), url: "edited:8080" },
  ]);
});
it("validates required protocol and does not emit partial rows", async () => {
  const h = mount();
  fireEvent.click(screen.getByText("EDIT"));
  fireEvent.change(screen.getByDisplayValue("http://"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByText("SAVE"));
  await screen.findByText("Please Input protocol!");
  expect(h.onTableChange).not.toHaveBeenCalled();
});
it("adds a local upstream using the existing defaults", () => {
  const h = mount();
  fireEvent.click(screen.getByText("ADD"));
  expect(h.onTableChange.mock.calls[0][0][1]).toEqual({
    key: 2,
    protocol: "http://",
    url: "localhost:",
    status: 0,
    weight: 50,
    startupTime: 0,
    warmupTime: 10,
    gray: false,
  });
  expect(h.onCountChange).toHaveBeenCalledWith(2);
});
it("keeps discovered address and startup time read-only", () => {
  mount([row()], false);
  expect(screen.queryByText("ADD")).toBeNull();
  fireEvent.click(screen.getByText("EDIT"));
  expect(screen.queryByDisplayValue("server-1:8080")).toBeNull();
  fireEvent.click(screen.getByText("SAVE"));
});
it("cancels row edits without writing", async () => {
  const h = mount();
  fireEvent.click(screen.getByText("EDIT"));
  fireEvent.change(screen.getByDisplayValue("server-1:8080"), {
    target: { value: "discard" },
  });
  fireEvent.click(screen.getByText("CANCEL"));
  fireEvent.click(await screen.findByText("SURE"));
  await waitFor(() => expect(screen.queryByDisplayValue("discard")).toBeNull());
  expect(h.onTableChange).not.toHaveBeenCalled();
});
it("toggles gray without mutating the upstream received from the parent", () => {
  const original = row();
  const h = mount([original]);
  fireEvent.click(screen.getByRole("switch"));
  expect(original.gray).toBe(false);
  expect(h.onTableChange).toHaveBeenCalledWith([{ ...original, gray: true }]);
});

it("edits a later-page upstream by its key rather than page index", async () => {
  const rows = Array.from({ length: 12 }, (_, i) => row(i + 1));
  const h = mount(rows);
  fireEvent.click(screen.getByLabelText("Next"));
  const target = (await screen.findByText("server-11:8080")).closest("tr");
  fireEvent.click(within(target).getByRole("button", { name: "EDIT" }));
  fireEvent.change(screen.getByDisplayValue("server-11:8080"), {
    target: { value: "later:8080" },
  });
  fireEvent.click(screen.getByText("SAVE"));
  expect(h.onTableChange.mock.calls[0][0][10]).toEqual({
    ...rows[10],
    url: "later:8080",
  });
  expect(h.onTableChange.mock.calls[0][0][0]).toEqual(rows[0]);
});
it("does not convert large server IDs into client row counters", () => {
  const existing = { ...row(), key: "2123456789012345678" };
  const h = mount([existing]);
  fireEvent.click(screen.getByText("ADD"));
  expect(h.onTableChange.mock.calls[0][0][1].key).toBe(2);
  expect(h.onTableChange.mock.calls[0][0][0].key).toBe(existing.key);
});
