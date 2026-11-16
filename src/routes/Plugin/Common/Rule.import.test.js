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

import WrappedRule from "./Rule";
import { message } from "../../../components/ui/feedback";
import {
  buildConditionDrafts,
  toConditions,
} from "../../../utils/conditionDraft";
import { parseRequestSample } from "../../../utils/requestSample";

jest.mock("react-redux", () => ({ connect: () => (Component) => Component }));
jest.mock("./RuleCopy", () => () => null);
jest.mock("../../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));
jest.mock("../../../components/ui/feedback", () => ({
  message: { destroy: jest.fn(), error: jest.fn() },
}));

const Rule = WrappedRule.WrappedComponent;

function createRule(ruleConditions) {
  const handleOk = jest.fn();
  const values = {
    name: "Imported rule",
    matchMode: 0,
    logged: false,
    enabled: true,
    matchRestful: false,
    sort: "0",
    handleType: "2",
    handleJSON: "{}",
  };
  const component = new Rule({
    pluginName: "divide",
    ruleConditions,
    handleOk,
    form: {
      validateFieldsAndScroll: (callback) => callback(null, values),
    },
  });
  component.setState = (update) => {
    const next =
      typeof update === "function" ? update(component.state) : update;
    component.state = { ...component.state, ...next };
  };
  component.setState({ pluginHandleList: [] });
  return { component, handleOk };
}

function sampleConditions() {
  const drafts = buildConditionDrafts(
    parseRequestSample("curl 'https://api.example.com/orders/*?id=1&id=2'"),
  );
  return toConditions(drafts, ["path", "method", "query:0"]);
}

it("replaces the untouched condition and submits the reviewed request fields", () => {
  const { component, handleOk } = createRule();
  const conditions = sampleConditions();
  component.setState({ importVisible: true });
  component.handleImportApply(conditions);

  expect(component.state.importVisible).toBe(false);
  expect(component.state.ruleConditions).toEqual(conditions);
  expect(component.state.paramTypeValueEn0).toBe(true);
  expect(component.state.paramTypeValueEn1).toBe(true);
  expect(component.state.paramTypeValueEn2).toBe(false);
  component.handleSubmit({ preventDefault: jest.fn() });

  expect(handleOk).toHaveBeenCalledWith({
    name: "Imported rule",
    matchMode: 0,
    logged: false,
    enabled: true,
    matchRestful: false,
    sort: 0,
    handle: "{}",
    ruleConditions: [
      {
        paramType: "uri",
        operator: "=",
        paramName: "/",
        paramValue: "/orders/*",
      },
      {
        paramType: "req_method",
        operator: "=",
        paramName: "/",
        paramValue: "GET",
      },
      { paramType: "query", operator: "=", paramName: "id", paramValue: "1" },
    ],
  });
});

it("appends reviewed conditions without discarding an existing condition", () => {
  const existing = {
    paramType: "header",
    operator: "=",
    paramName: "X-Tenant",
    paramValue: "gray",
  };
  const { component } = createRule([existing]);
  const additions = sampleConditions();
  component.handleImportApply(additions);
  expect(component.state.ruleConditions).toEqual([existing, ...additions]);
  expect(component.state.paramTypeValueEn0).toBe(false);
  expect(component.state.paramTypeValueEn1).toBe(true);
});

it("keeps invalid-condition feedback on the shared dashboard feedback API", () => {
  const { component, handleOk } = createRule();
  component.handleSubmit({ preventDefault: jest.fn() });
  expect(handleOk).not.toHaveBeenCalled();
  expect(message.destroy).toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledWith("Line 1 condition is incomplete");
});
