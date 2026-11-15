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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExportModal from "./ExportModal";
import ImportModal from "./ImportModal";
import ImportResultModal from "./ImportResultModal";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));
jest.mock("../_utils/utils", () => ({ defaultNamespaceId: "default-ns" }));
const namespaces = [
  { namespaceId: "default-ns", name: "Default" },
  { namespaceId: "alternate-ns", name: "Alternate" },
];
it("exports the default namespace", async () => {
  const handleOk = jest.fn();
  render(<ExportModal namespaces={namespaces} handleOk={handleOk} />);
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({ namespace: "default-ns" }),
  );
});
it("preserves the native file object and namespace on import", async () => {
  const handleOk = jest.fn();
  render(<ImportModal namespaces={namespaces} handleOk={handleOk} />);
  const file = new File(['{"fixture":true}'], "config.json", {
    type: "application/json",
  });
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [file] },
  });
  expect(screen.getByText("config.json")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() => expect(handleOk).toHaveBeenCalledTimes(1));
  expect(handleOk.mock.calls[0][0].file).toBe(file);
  expect(handleOk.mock.calls[0][0].namespace).toBe("default-ns");
});
it("does not submit without a file and allows cancellation", async () => {
  const handleOk = jest.fn(),
    handleCancel = jest.fn();
  render(
    <ImportModal
      namespaces={namespaces}
      handleOk={handleOk}
      handleCancel={handleCancel}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await screen.findByText("file is required");
  expect(handleOk).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  expect(handleCancel).toHaveBeenCalledTimes(1);
});
it("renders zero counts and truncates long failure messages without losing them", async () => {
  const text = "Failure ".repeat(12);
  const onOk = jest.fn();
  render(
    <ImportResultModal
      json={{ metaImportSuccessCount: 0, metaImportFailMessage: text }}
      onOk={onOk}
    />,
  );
  expect(screen.getByText("0", { exact: true })).toBeTruthy();
  expect(screen.getByText(`${text.substring(0, 50)}...`)).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: /^(OK|SHENYU.COMMON.SURE)$/ }),
  );
  expect(onOk).toHaveBeenCalledTimes(1);
});

async function chooseAlternate() {
  const legacy = screen.queryByRole("button", {
    name: /SHENYU.SYSTEM.NAMESPACE.*Default/,
  });
  if (legacy) fireEvent.mouseEnter(legacy);
  else fireEvent.click(screen.getByText("Default", { exact: true }));
  fireEvent.click(await screen.findByText("Alternate", { exact: true }));
}
it("exports the namespace chosen in the dialog", async () => {
  const handleOk = jest.fn();
  render(<ExportModal namespaces={namespaces} handleOk={handleOk} />);
  await chooseAlternate();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({ namespace: "alternate-ns" }),
  );
});
it("imports the selected namespace with the same file", async () => {
  const handleOk = jest.fn();
  render(<ImportModal namespaces={namespaces} handleOk={handleOk} />);
  const file = new File(["fixture"], "config.json");
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [file] },
  });
  await chooseAlternate();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
  await waitFor(() =>
    expect(handleOk).toHaveBeenCalledWith({ namespace: "alternate-ns", file }),
  );
});
it("opens its own file input when another form has the same field ID", () => {
  const other = document.createElement("input");
  other.type = "file";
  other.id = "file";
  document.body.appendChild(other);
  const wrong = jest.spyOn(other, "click").mockImplementation(() => {});
  try {
    render(<ImportModal namespaces={namespaces} handleOk={jest.fn()} />);
    const own = [...document.querySelectorAll('input[type="file"]')].find(
      (node) => node !== other,
    );
    const chosen = jest.spyOn(own, "click").mockImplementation(() => {});
    fireEvent.click(
      screen.getByRole("button", { name: "SHENYU.COMMON.UPLOAD" }),
    );
    expect(chosen).toHaveBeenCalledTimes(1);
    expect(wrong).not.toHaveBeenCalled();
  } finally {
    other.remove();
  }
});
it("shows the complete failure message on hover", async () => {
  const text = "Detailed failure ".repeat(8).trim();
  render(<ImportResultModal json={{ metaImportFailMessage: text }} />);
  fireEvent.mouseOver(screen.getByText(`${text.substring(0, 50)}...`));
  expect(await screen.findByText(text)).toBeTruthy();
});
it("reopens import with the default namespace and no stale file", async () => {
  const view = render(
    <ImportModal namespaces={namespaces} handleOk={jest.fn()} />,
  );
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [new File(["fixture"], "old.json")] },
  });
  await chooseAlternate();
  view.unmount();
  render(<ImportModal namespaces={namespaces} handleOk={jest.fn()} />);
  expect(screen.queryByText("old.json")).toBeNull();
  expect(screen.getByText("Default", { exact: true })).toBeTruthy();
});
it("does not switch the dashboard namespace when choosing a transfer target", async () => {
  window.sessionStorage.setItem("currentNamespaceId", "dashboard-ns");
  try {
    render(<ExportModal namespaces={namespaces} handleOk={jest.fn()} />);
    await chooseAlternate();
    expect(window.sessionStorage.getItem("currentNamespaceId")).toBe(
      "dashboard-ns",
    );
  } finally {
    window.sessionStorage.removeItem("currentNamespaceId");
  }
});
