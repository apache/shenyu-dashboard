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
import ToolsModalLoader from "./ToolsModalLoader";
import loadToolsModal from "./loadToolsModal";

jest.mock("./loadToolsModal");
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

beforeEach(() => {
  loadToolsModal.mockReset();
});

it("shows cancellable loading without allowing an early submit", () => {
  loadToolsModal.mockReturnValue(new Promise(() => {}));
  const onCancel = jest.fn();
  const handleOk = jest.fn();
  render(<ToolsModalLoader onCancel={onCancel} handleOk={handleOk} />);
  expect(screen.getByRole("status").getAttribute("aria-label")).toBe(
    "SHENYU.MCP.TOOLS.EDITOR.LOADING",
  );
  expect(
    screen.queryByRole("button", { name: "SHENYU.COMMON.SURE" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(handleOk).not.toHaveBeenCalled();
});

it("passes the caller's record and callbacks to the loaded editor", async () => {
  const Editor = jest.fn(() => <div>MCP tools editor</div>);
  loadToolsModal.mockResolvedValue({ default: Editor });
  const props = {
    id: "record-1",
    enabled: false,
    onCancel: jest.fn(),
    handleOk: jest.fn(),
  };
  render(<ToolsModalLoader {...props} />);
  await screen.findByText("MCP tools editor");
  expect(Editor.mock.calls[0][0]).toEqual(props);
  expect(screen.queryByRole("status")).toBeNull();
});

it("shows a load failure and retries the chunk without losing the record", async () => {
  const Editor = jest.fn(() => <div>MCP tools editor</div>);
  loadToolsModal.mockRejectedValueOnce(new Error("Chunk unavailable"));
  loadToolsModal.mockResolvedValueOnce({ default: Editor });
  render(<ToolsModalLoader id="retry-record" />);
  await screen.findByRole("alert");
  fireEvent.click(
    screen.getByRole("button", { name: "SHENYU.META.EDITOR.RETRY" }),
  );
  await screen.findByText("MCP tools editor");
  expect(loadToolsModal).toHaveBeenCalledTimes(2);
  expect(Editor.mock.calls[0][0].id).toBe("retry-record");
  expect(screen.queryByRole("alert")).toBeNull();
});

it("does not reopen the editor when a cancelled load completes", async () => {
  let completeLoad;
  loadToolsModal.mockReturnValue(
    new Promise((resolve) => {
      completeLoad = resolve;
    }),
  );
  const Editor = jest.fn(() => <div>MCP tools editor</div>);
  const { unmount } = render(<ToolsModalLoader />);
  unmount();
  await act(async () => {
    completeLoad({ default: Editor });
  });
  await waitFor(() => expect(Editor).not.toHaveBeenCalled());
});
