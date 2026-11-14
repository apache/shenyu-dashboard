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
import AddModal from "./AddModal";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("../../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

const requiredFields = [
  ["appName", "SHENYU.AUTH.INPUTSHENYU.AUTH.APPNAME"],
  ["methodName", "SHENYU.AUTH.INPUTSHENYU.META.FUNC.NAME"],
  ["path", "SHENYU.AUTH.INPUTSHENYU.META.PATH"],
  ["serviceName", "SHENYU.META.INPUTSERVICEINTERFACE"],
  ["rpcType", "SHENYU.META.SELECTRPCTYPE"],
];

function setup(overrides = {}) {
  const props = {
    platform: { rpcTypeEnums: [{ name: "http" }, { name: "grpc" }] },
    isShow: true,
    appName: "example-app",
    methodName: "getExample",
    path: "/example",
    serviceName: "org.example.Service",
    rpcType: "http",
    handleOk: jest.fn(),
    handleCancel: jest.fn(),
    ...overrides,
  };
  return { ...render(<AddModal {...props} />), props };
}

function confirm() {
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.SURE" }));
}

it("submits the existing create DTO and keeps closing under the caller's control", async () => {
  const { props } = setup();
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual({
    appName: "example-app",
    methodName: "getExample",
    path: "/example",
    serviceName: "org.example.Service",
    rpcType: "http",
    pathDesc: undefined,
    parameterTypes: "",
    rpcExt: "",
    enabled: true,
    id: "",
  });
  expect(props.handleCancel).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }),
  ).not.toBeNull();
});

it("preserves edit values, optional JSON text and id while submitting a changed path", async () => {
  const { props } = setup({
    id: "metadata-1",
    pathDesc: "description",
    parameterTypes: "java.lang.String",
    rpcExt: '{"timeout":3000}',
    enabled: false,
    isShow: false,
  });
  expect(
    screen.getByPlaceholderText("SHENYU.AUTH.PARAMSSHENYU.COMMON.TYPE").value,
  ).toBe("java.lang.String");
  expect(
    screen.getByPlaceholderText("RpcSHENYU.META.EXPAND.PARAMS").value,
  ).toBe('{"timeout":3000}');
  fireEvent.change(screen.getByPlaceholderText("SHENYU.META.PATH"), {
    target: { value: "/changed" },
  });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual({
    appName: "example-app",
    methodName: "getExample",
    path: "/changed",
    serviceName: "org.example.Service",
    rpcType: "http",
    pathDesc: "description",
    parameterTypes: "java.lang.String",
    rpcExt: '{"timeout":3000}',
    enabled: false,
    id: "metadata-1",
  });
});

it.each(requiredFields)(
  "blocks an empty required %s with the existing message",
  async (field, message) => {
    const { props } = setup({ [field]: "" });
    confirm();
    await screen.findByText(message);
    expect(props.handleOk).not.toHaveBeenCalled();
  },
);

it("preserves untouched nullable optional fields", async () => {
  const { props } = setup({
    pathDesc: null,
    parameterTypes: null,
    rpcExt: null,
  });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      pathDesc: null,
      parameterTypes: null,
      rpcExt: null,
    }),
  );
});

it("allows changing enabled during creation", async () => {
  const { props } = setup();
  fireEvent.click(screen.getByRole("switch"));
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0].enabled).toBe(false);
});

it("keeps the edit enabled switch disabled", () => {
  setup({ isShow: false, enabled: false });
  expect(screen.getByRole("switch").disabled).toBe(true);
});

it("uses the RPC choices from platform configuration", async () => {
  const { props } = setup();
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(await screen.findByText("grpc"));
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0].rpcType).toBe("grpc");
});

it("cancels through the caller without submitting", () => {
  const { props } = setup();
  fireEvent.click(screen.getByRole("button", { name: "SHENYU.COMMON.CALCEL" }));
  expect(props.handleCancel).toHaveBeenCalledTimes(1);
  expect(props.handleOk).not.toHaveBeenCalled();
});

it("submits valid form data through the keyboard form-submit path", async () => {
  const { props } = setup();
  fireEvent.submit(document.querySelector("form"));
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0].path).toBe("/example");
});

it("reopens with the next record rather than retaining the previous edit", async () => {
  const first = setup({ id: "old", appName: "old-app" });
  first.unmount();
  const { props } = setup({ id: "new", appName: "new-app" });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({ id: "new", appName: "new-app" }),
  );
});

it("submits cleared optional fields as empty strings", async () => {
  const { props } = setup({
    parameterTypes: "java.lang.String",
    rpcExt: "{}",
    pathDesc: "description",
  });
  [
    "SHENYU.AUTH.PARAMSSHENYU.COMMON.TYPE",
    "RpcSHENYU.META.EXPAND.PARAMS",
    "SHENYU.AUTH.PATH.DESCRIBE",
  ].forEach((placeholder) => {
    fireEvent.change(screen.getByPlaceholderText(placeholder), {
      target: { value: "" },
    });
  });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0]).toEqual(
    expect.objectContaining({ parameterTypes: "", rpcExt: "", pathDesc: "" }),
  );
});

it("allows correcting a required field after a failed submit", async () => {
  const { props } = setup({ path: "" });
  confirm();
  await screen.findByText("SHENYU.AUTH.INPUTSHENYU.META.PATH");
  fireEvent.change(screen.getByPlaceholderText("SHENYU.META.PATH"), {
    target: { value: "/corrected" },
  });
  confirm();
  await waitFor(() => expect(props.handleOk).toHaveBeenCalledTimes(1));
  expect(props.handleOk.mock.calls[0][0].path).toBe("/corrected");
});

it.each(["en-US", "en-Us"])(
  "updates Semi's %s locale without resetting edited values",
  async (language) => {
    const { props, rerender } = setup({
      language,
      platform: { rpcTypeEnums: [] },
    });
    fireEvent.change(screen.getByPlaceholderText("SHENYU.META.PATH"), {
      target: { value: "/unsaved" },
    });
    fireEvent.click(screen.getByRole("combobox"));
    await screen.findByText("No Result");
    rerender(<AddModal {...props} language="zh-CN" />);
    await screen.findByText("暂无数据");
    expect(screen.getByPlaceholderText("SHENYU.META.PATH").value).toBe(
      "/unsaved",
    );
  },
);

it("uses the saved locale before a global language has been selected", async () => {
  window.sessionStorage.setItem("locale", "zh-CN");
  try {
    setup({ platform: { rpcTypeEnums: [] } });
    fireEvent.click(screen.getByRole("combobox"));
    await screen.findByText("暂无数据");
  } finally {
    window.sessionStorage.removeItem("locale");
  }
});
