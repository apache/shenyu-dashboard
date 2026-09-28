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

import { AddModal } from "./ToolsModal";

jest.mock("react-json-view", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const ToolsModalComponent = AddModal.WrappedComponent || AddModal;

const createComponent = (props = {}) => {
  const component = new ToolsModalComponent({
    form: {
      getFieldsValue: jest.fn(() => ({})),
      validateFieldsAndScroll: jest.fn(),
      setFieldsValue: jest.fn(),
      getFieldDecorator: () => (node) => node,
    },
    handleOk: jest.fn(),
    onCancel: jest.fn(),
    ...props,
  });

  component.setState = (update, callback) => {
    const next =
      typeof update === "function"
        ? update(component.state, component.props)
        : update;
    component.state = { ...component.state, ...next };
    if (callback) callback();
  };

  return component;
};

describe("ToolsModal JSON mode submit rule-level values", () => {
  it("preserves existing tool rule values (sort, loged, matchMode, matchRestful, ruleConditions) when submitting in JSON mode", () => {
    const handleOk = jest.fn();
    const existingRuleConditions = [
      {
        paramType: "uri",
        operator: "pathPattern",
        paramName: "/",
        paramValue: "/api/**",
      },
    ];

    const component = createComponent({
      name: "existingTool",
      description: "Existing tool description",
      enabled: true,
      sort: 5,
      loged: false,
      matchMode: "1",
      matchRestful: true,
      ruleConditions: existingRuleConditions,
      handle: JSON.stringify({
        parameters: [],
        requestConfig: "{}",
      }),
      handleOk,
    });

    component.state.jsonText = JSON.stringify({
      name: "existingTool",
      description: "Updated description via JSON",
      enabled: true,
      parameters: [],
      requestConfig: "{}",
    });

    component.handleJsonSubmit();

    expect(handleOk).toHaveBeenCalledTimes(1);
    const payload = handleOk.mock.calls[0][0];
    expect(payload.name).toBe("existingTool");
    expect(payload.description).toBe("Updated description via JSON");
    expect(payload.sort).toBe(5);
    expect(payload.loged).toBe(false);
    expect(payload.matchMode).toBe("1");
    expect(payload.matchRestful).toBe(true);
    expect(payload.ruleConditions).toEqual(existingRuleConditions);
  });

  it("applies default rule values when creating a new tool without existing rule values", () => {
    const handleOk = jest.fn();
    const component = createComponent({
      handleOk,
    });

    component.state.jsonText = JSON.stringify({
      name: "newTool",
      description: "Brand new tool",
      enabled: true,
      parameters: [],
      requestConfig: "{}",
    });

    component.handleJsonSubmit();

    expect(handleOk).toHaveBeenCalledTimes(1);
    const payload = handleOk.mock.calls[0][0];
    expect(payload.name).toBe("newTool");
    expect(payload.sort).toBe(1);
    expect(payload.loged).toBe(true);
    expect(payload.matchMode).toBe("0");
    expect(payload.matchRestful).toBe(false);
    expect(payload.ruleConditions).toEqual([
      {
        paramType: "uri",
        operator: "pathPattern",
        paramName: "/",
        paramValue: "/**",
      },
    ]);
  });

  it("preserves updated form rule values when switching from form mode to JSON mode", () => {
    const handleOk = jest.fn();
    const form = {
      getFieldsValue: jest.fn(() => ({
        name: "toolWithEditedForm",
        description: "Edited form description",
        enabled: true,
        sort: "15",
        loged: false,
        matchMode: "1",
        matchRestful: true,
      })),
    };

    const component = createComponent({
      name: "toolWithEditedForm",
      sort: 1,
      loged: true,
      matchMode: "0",
      matchRestful: false,
      form,
      handleOk,
    });

    // Simulate switching mode: syncFormToJson is called
    component.syncFormToJson();

    component.handleJsonSubmit();

    expect(handleOk).toHaveBeenCalledTimes(1);
    const payload = handleOk.mock.calls[0][0];
    expect(payload.sort).toBe(15);
    expect(payload.loged).toBe(false);
    expect(payload.matchMode).toBe("1");
    expect(payload.matchRestful).toBe(true);
  });

  it("respects rule values specified directly in the JSON editor", () => {
    const handleOk = jest.fn();
    const component = createComponent({
      name: "toolFromJson",
      sort: 1,
      loged: true,
      matchMode: "0",
      matchRestful: false,
      handleOk,
    });

    component.state.jsonText = JSON.stringify({
      name: "toolFromJson",
      description: "Tool with custom rule values in JSON",
      sort: 99,
      loged: false,
      matchMode: "1",
      matchRestful: true,
    });

    component.handleJsonSubmit();

    expect(handleOk).toHaveBeenCalledTimes(1);
    const payload = handleOk.mock.calls[0][0];
    expect(payload.sort).toBe(99);
    expect(payload.loged).toBe(false);
    expect(payload.matchMode).toBe("1");
    expect(payload.matchRestful).toBe(true);
  });
});
