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
import Form from "./Form";
import Input from "./Input";
import InputNumber from "./InputNumber";
import Switch from "./Switch";

class Example extends React.Component {
  submit = (event) => {
    event.preventDefault();
    this.props.form.validateFieldsAndScroll((error, values) => {
      if (!error) this.props.onSave(values);
    });
  };

  render() {
    const {
      form,
      name = "Valid",
      showExtra,
      requireOther,
      onSubset,
    } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Form onSubmit={this.submit}>
        <Form.Item label="Name">
          {getFieldDecorator("name", {
            initialValue: name,
            rules: [{ required: true, message: "Name required" }],
          })(<Input />)}
        </Form.Item>
        <Form.Item label="Enabled">
          {getFieldDecorator("enabled", {
            initialValue: false,
            valuePropName: "checked",
          })(<Switch />)}
        </Form.Item>
        <Form.Item label="Count">
          {getFieldDecorator("count", { initialValue: 0 })(<InputNumber />)}
        </Form.Item>
        <Form.Item label="Description">
          {getFieldDecorator("description", { initialValue: "" })(<Input />)}
        </Form.Item>
        <Form.Item label="Path">
          {getFieldDecorator("node.path", { initialValue: "/start" })(
            <Input />,
          )}
        </Form.Item>
        {showExtra && (
          <Form.Item label="Extra">
            {getFieldDecorator("extra", { initialValue: "discard" })(<Input />)}
          </Form.Item>
        )}
        {requireOther && (
          <Form.Item label="Other">
            {getFieldDecorator("other", { rules: [{ required: true }] })(
              <Input />,
            )}
          </Form.Item>
        )}
        <button type="submit">Save</button>
        <button
          type="button"
          onClick={() =>
            form.setFieldsValue({
              name: "Updated",
              enabled: false,
              count: 0,
              description: "",
            })
          }
        >
          Set values
        </button>
        <button type="button" onClick={() => form.resetFields()}>
          Reset
        </button>
        <button
          type="button"
          onClick={() =>
            form.validateFields(["name"], { force: true }, onSubset)
          }
        >
          Validate name
        </button>
      </Form>
    );
  }
}
const Wrapped = Form.create()(Example);
const expected = {
  name: "Valid",
  enabled: false,
  count: 0,
  description: "",
  node: { path: "/start" },
};

it("validates required fields and preserves false, zero, empty and nested values", async () => {
  const onSave = jest.fn();
  render(<Wrapped name="" onSave={onSave} />);
  fireEvent.click(screen.getByText("Save"));
  await screen.findByText("Name required");
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Valid" },
  });
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expected));
});

it("supports imperative value updates and resetting initial values", async () => {
  const onSave = jest.fn();
  render(<Wrapped onSave={onSave} />);
  fireEvent.click(screen.getByText("Set values"));
  expect(screen.getByLabelText("Name").value).toBe("Updated");
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() =>
    expect(onSave).toHaveBeenLastCalledWith({ ...expected, name: "Updated" }),
  );
  fireEvent.click(screen.getByText("Reset"));
  expect(screen.getByLabelText("Name").value).toBe("Valid");
});

it("validates only requested fields and returns that subset", async () => {
  const onSubset = jest.fn();
  render(<Wrapped requireOther onSubset={onSubset} />);
  fireEvent.click(screen.getByText("Validate name"));
  await waitFor(() =>
    expect(onSubset).toHaveBeenCalledWith(null, { name: "Valid" }),
  );
});

it("omits unmounted fields", async () => {
  const onSave = jest.fn();
  const { rerender } = render(<Wrapped showExtra onSave={onSave} />);
  rerender(<Wrapped showExtra={false} onSave={onSave} />);
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expected));
});

it("resets dirty values when the dialog record changes", () => {
  const { rerender } = render(<Wrapped id="first" name="First" />);
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Old draft" },
  });
  rerender(<Wrapped id="second" name="Second" />);
  expect(screen.getByLabelText("Name").value).toBe("Second");
});
