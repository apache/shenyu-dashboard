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

function Fields({ form, onSave, initialKeys = ["first"] }) {
  const { getFieldDecorator, getFieldValue, setFieldsValue } = form;
  getFieldDecorator("keys", { initialValue: initialKeys });
  const keys = getFieldValue("keys");
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        form.validateFields((error, values) => {
          if (!error) onSave(values);
        });
      }}
    >
      {keys.map((key) => (
        <Form.Item key={key} label={key}>
          {getFieldDecorator(`rows.${key}`, { initialValue: key })(<Input />)}
        </Form.Item>
      ))}
      <button
        type="button"
        onClick={() =>
          setFieldsValue({ keys: [...getFieldValue("keys"), "second"] })
        }
      >
        Add row
      </button>
      <button
        type="button"
        onClick={() =>
          setFieldsValue({
            keys: getFieldValue("keys").filter((key) => key !== "first"),
          })
        }
      >
        Remove first
      </button>
      <button type="button" onClick={() => form.resetFields()}>
        Reset
      </button>
      <button type="submit">Save</button>
    </Form>
  );
}
const Wrapped = Form.create()(Fields);

it("retains virtual key fields while adding and removing nested rows", async () => {
  const onSave = jest.fn();
  render(<Wrapped onSave={onSave} />);
  fireEvent.click(screen.getByText("Add row"));
  fireEvent.change(await screen.findByLabelText("second"), {
    target: { value: "edited" },
  });
  fireEvent.click(screen.getByText("Remove first"));
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      keys: ["second"],
      rows: { second: "edited" },
    }),
  );
});

it("resets virtual keys and drops added rows", async () => {
  const onSave = jest.fn();
  render(<Wrapped onSave={onSave} />);
  fireEvent.click(screen.getByText("Add row"));
  await screen.findByLabelText("second");
  fireEvent.click(screen.getByText("Reset"));
  expect(screen.queryByLabelText("second")).toBeNull();
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      keys: ["first"],
      rows: { first: "first" },
    }),
  );
});

it("does not carry virtual fields into another record", async () => {
  const onSave = jest.fn();
  const { rerender } = render(<Wrapped id="one" onSave={onSave} />);
  fireEvent.click(screen.getByText("Add row"));
  await screen.findByLabelText("second");
  rerender(<Wrapped id="two" initialKeys={["fresh"]} onSave={onSave} />);
  expect(screen.queryByLabelText("second")).toBeNull();
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      keys: ["fresh"],
      rows: { fresh: "fresh" },
    }),
  );
});
