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

import ImportConditionsModal from "./ImportConditionsModal";

function createModal() {
  const onApply = jest.fn();
  const onCancel = jest.fn();
  const component = new ImportConditionsModal({ onApply, onCancel });
  component.setState = (update) => {
    const next =
      typeof update === "function" ? update(component.state) : update;
    component.state = { ...component.state, ...next };
  };
  return { component, onApply, onCancel };
}

it("selects the path and method after parsing", () => {
  const { component } = createModal();
  component.setState({ text: "curl 'https://api.example.com/orders/123'" });
  component.handleParse();
  expect(component.state.selected).toEqual(["path", "method"]);
  expect(component.state.drafts).toHaveLength(3);
});

it("applies only the conditions the user kept selected", () => {
  const { component, onApply } = createModal();
  component.setState({
    text: "curl 'https://api.example.com/orders?tenant=gray'",
  });
  component.handleParse();
  component.handleToggle("query:0", true);
  component.handleApply();
  expect(onApply).toHaveBeenCalledWith([
    expect.objectContaining({ paramType: "uri", paramValue: "/orders" }),
    expect.objectContaining({ paramType: "req_method", paramValue: "GET" }),
    expect.objectContaining({ paramType: "query", paramValue: "gray" }),
  ]);
});

it("does not apply when nothing is selected", () => {
  const { component, onApply } = createModal();
  component.setState({ text: "curl https://api.example.com/a" });
  component.handleParse();
  component.handleToggle("path", false);
  component.handleToggle("method", false);
  component.handleApply();
  expect(onApply).not.toHaveBeenCalled();
});

it("clears the parsed state on cancel", () => {
  const { component, onCancel } = createModal();
  component.setState({ text: "curl https://api.example.com/a" });
  component.handleParse();
  component.handleCancel();
  expect(onCancel).toHaveBeenCalled();
  expect(component.state.drafts).toEqual([]);
  expect(component.state.text).toBe("");
});

it("keeps the parsed sample when the input is unsupported", () => {
  const { component, onApply } = createModal();
  component.setState({ text: "curl -I https://api.example.com/a" });
  component.handleParse();
  expect(component.state.sample.issues[0].code).toBe("HEAD_REQUEST");
  component.handleToggle("path", true);
  component.handleApply();
  expect(onApply).toHaveBeenCalled();
});
