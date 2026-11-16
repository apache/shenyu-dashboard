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
import { render, waitFor } from "@testing-library/react";
import AddAndUpdateApiDoc from "./AddAndUpdateApiDoc";
import { addApi, updateApi } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  addApi: jest.fn(),
  updateApi: jest.fn(),
}));

const requiredFields = {
  contextPath: "/ctx",
  apiPath: "/api",
  httpMethod: 2,
  consume: "*/*",
  produce: "*/*",
  version: "1.0.0",
  rpcType: "http",
  state: 1,
  apiOwner: "owner",
  apiDesc: "desc",
  apiSource: 3,
};

const renderModal = () => {
  const handles = {};
  render(
    <AddAndUpdateApiDoc
      visible
      document="{}"
      ext="{}"
      formLoaded={(form) => {
        handles.form = form;
      }}
      wrappedComponentRef={(ref) => {
        handles.instance = ref;
      }}
    />,
  );
  return handles;
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("creates an API via addApi when submitting without an id", async () => {
  addApi.mockResolvedValue({ code: 200, message: "ok" });

  const { form, instance } = renderModal();
  form.setFieldsValue({ ...requiredFields });
  instance.handleSubmit();

  await waitFor(() => expect(addApi).toHaveBeenCalledTimes(1));
  expect(addApi.mock.calls[0][0]).toMatchObject({
    contextPath: "/ctx",
    state: 1,
    apiSource: 3,
  });
  expect(updateApi).not.toHaveBeenCalled();
});

it("updates an API via updateApi when an id is present", async () => {
  updateApi.mockResolvedValue({ code: 200, message: "ok" });

  const { form, instance } = renderModal();
  form.setFieldsValue({ ...requiredFields, id: "api-1" });
  instance.handleSubmit();

  await waitFor(() => expect(updateApi).toHaveBeenCalledTimes(1));
  expect(updateApi.mock.calls[0][0]).toMatchObject({ id: "api-1" });
  expect(addApi).not.toHaveBeenCalled();
});

it("renders without crashing when document or ext is not valid JSON", () => {
  render(<AddAndUpdateApiDoc visible document="not-json" ext="not-json" />);

  // the modal renders through a portal into document.body
  expect(document.querySelector("form")).not.toBeNull();
});

it("locks the api source selector once an API id exists", async () => {
  const { form } = renderModal();
  expect(document.querySelectorAll(".ant-select-disabled")).toHaveLength(0);

  form.setFieldsValue({ id: "api-1" });

  await waitFor(() =>
    expect(document.querySelectorAll(".ant-select-disabled")).toHaveLength(1),
  );
});
