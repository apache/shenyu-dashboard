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
import { Form } from "antd";
import { act, render } from "@testing-library/react";
import CommonRuleHandle, {
  isValidHandleJSON,
  validateHandleJSON,
} from "./CommonRuleHandle";
import { initIntl } from "../../../utils/IntlUtils";

beforeAll(() => {
  initIntl("en-US");
});

describe("isValidHandleJSON", () => {
  it("accepts values while the structured form is active", () => {
    expect(isValidHandleJSON("1", undefined)).toBe(true);
  });

  it("accepts JSON objects", () => {
    expect(isValidHandleJSON("2", '{"enabled":true}')).toBe(true);
  });

  it.each([undefined, null, "", "null", "[]", "true", "not-json"])(
    "rejects non-object JSON input %p",
    (value) => {
      expect(isValidHandleJSON("2", value)).toBe(false);
    },
  );
});

describe("validateHandleJSON", () => {
  it.each([
    ["1", undefined, undefined],
    ["2", '{"enabled":true}', undefined],
    ["2", "[]", "Invalid JSON object"],
  ])("calls back once for handle type %s", (handleType, value, error) => {
    const callback = jest.fn();

    validateHandleJSON(handleType, value, callback, "Invalid JSON object");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(error);
  });

  it("rejects an untouched JSON textarea in the actual form", async () => {
    let form;
    const Harness = Form.create()((props) => {
      form = props.form;
      return (
        <Form>
          <CommonRuleHandle
            form={props.form}
            pluginHandleList={[]}
            multiRuleHandle={false}
          />
        </Form>
      );
    });

    render(<Harness />);

    let errors;
    await act(
      () =>
        new Promise((resolve) => {
          form.validateFields((validationErrors) => {
            errors = validationErrors;
            resolve();
          });
        }),
    );

    expect(form.getFieldValue("handleType")).toBe("2");
    expect(form.getFieldValue("handleJSON")).toBeUndefined();
    expect(errors.handleJSON.errors).toHaveLength(1);
  });
});
