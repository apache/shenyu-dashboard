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

import React, { Component } from "react";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Input from "../../../components/ui/Input";
import InputNumber from "../../../components/ui/InputNumber";
import Select from "../../../components/ui/Select";
import Switch from "../../../components/ui/Switch";
import { getIntlContent } from "../../../utils/IntlUtils";

const fields = [
  "protocol",
  "url",
  "status",
  "weight",
  "startupTime",
  "warmupTime",
  "gray",
];
const numericFields = ["weight", "startupTime", "warmupTime"];

export class EditableTable extends Component {
  constructor(props) {
    super(props);
    this.state = { editingKey: "", draft: {}, errors: {} };
  }

  componentDidUpdate() {
    const { editingKey } = this.state;
    if (
      editingKey !== "" &&
      !this.props.dataSource.some((row) => row.key === editingKey)
    )
      this.cancel();
  }

  cancel = () => this.setState({ editingKey: "", draft: {}, errors: {} });

  editable = (field) =>
    this.props.isLocal || !["url", "startupTime"].includes(field);

  edit = (row) =>
    this.setState({
      editingKey: row.key,
      draft: {
        ...row,
        status: Number(row.status),
        gray: row.gray === "true" || row.gray === true,
      },
      errors: {},
    });

  change = (field, value) =>
    this.setState((previous) => ({
      draft: { ...previous.draft, [field]: value },
      errors: { ...previous.errors, [field]: undefined },
    }));

  handleDelete = (key) =>
    this.props.onTableChange(
      this.props.dataSource.filter((row) => row.key !== key),
    );

  handleAdd = () => {
    const { dataSource, recordCount, onTableChange, onCountChange } =
      this.props;
    let key = (Number(recordCount) || 0) + 1;
    const keys = new Set(dataSource.map((row) => String(row.key)));
    while (keys.has(String(key))) key += 1;
    onTableChange([
      ...dataSource,
      {
        key,
        protocol: "http://",
        url: "localhost:",
        status: 0,
        weight: 50,
        startupTime: 0,
        warmupTime: 10,
        gray: false,
      },
    ]);
    onCountChange(key);
  };

  save = () => {
    const { editingKey, draft } = this.state;
    const errors = {};
    fields.filter(this.editable).forEach((field) => {
      if (
        draft[field] === undefined ||
        draft[field] === null ||
        draft[field] === ""
      )
        errors[field] = `Please Input ${field}!`;
    });
    if (Object.keys(errors).length) {
      this.setState({ errors });
      return;
    }
    const patch = {};
    fields.filter(this.editable).forEach((field) => {
      patch[field] = draft[field];
    });
    this.props.onTableChange(
      this.props.dataSource.map((row) =>
        row.key === editingKey ? { ...row, ...patch } : row,
      ),
    );
    this.cancel();
  };

  renderInput = (field) => {
    const { draft, errors } = this.state;
    const props = {
      "aria-label": field,
      "aria-invalid": Boolean(errors[field]),
      value: draft[field],
      onChange: (value) => this.change(field, value),
      style: { width: "100%" },
    };
    let input;
    if (field === "gray")
      input = (
        <Switch
          aria-label={field}
          checked={draft.gray}
          onChange={(value) => this.change(field, value)}
        />
      );
    else if (field === "status")
      input = (
        <Select {...props}>
          <Select.Option value={0}>
            {getIntlContent("SHENYU.COMMON.OPEN")}
          </Select.Option>
          <Select.Option value={1}>
            {getIntlContent("SHENYU.COMMON.CLOSE")}
          </Select.Option>
        </Select>
      );
    else if (numericFields.includes(field)) input = <InputNumber {...props} />;
    else
      input = (
        <Input
          {...props}
          onChange={(event) => this.change(field, event.target.value)}
        />
      );
    return (
      <div>
        {input}
        {errors[field] && (
          <div role="alert" style={{ color: "var(--semi-color-danger)" }}>
            {errors[field]}
          </div>
        )}
      </div>
    );
  };

  render() {
    const { dataSource, isLocal } = this.props;
    const { editingKey } = this.state;
    const columns = fields.map((field) => ({
      title: field,
      dataIndex: field,
      width: field === "url" ? 220 : 120,
      render: (value, row) => {
        if (row.key === editingKey && this.editable(field))
          return this.renderInput(field);
        if (field === "status")
          return getIntlContent(
            Number(value) === 0 ? "SHENYU.COMMON.OPEN" : "SHENYU.COMMON.CLOSE",
          );
        if (field === "gray")
          return (
            <Switch
              aria-label="gray"
              disabled={Number(row.status) === 1 || editingKey !== ""}
              checked={value === "true" || value === true}
              onChange={(gray) =>
                this.props.onTableChange(
                  dataSource.map((item) =>
                    item.key === row.key ? { ...item, gray } : item,
                  ),
                )
              }
            />
          );
        return value;
      },
    }));
    columns.push({
      title: getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.OPERATION"),
      dataIndex: "operation",
      width: 180,
      render: (_, row) => {
        if (row.key === editingKey)
          return (
            <div>
              <Button theme="borderless" onClick={this.save}>
                {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.SAVE")}
              </Button>
              <Popconfirm
                motion={false}
                title={getIntlContent(
                  "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.CANCEL.CONFIRM",
                )}
                onConfirm={this.cancel}
                okText={getIntlContent("SHENYU.COMMON.SURE")}
                cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
              >
                <Button theme="borderless">
                  {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.CANCEL")}
                </Button>
              </Popconfirm>
            </div>
          );
        return (
          <div>
            <Button
              theme="borderless"
              disabled={editingKey !== ""}
              onClick={() => this.edit(row)}
            >
              {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.EDIT")}
            </Button>
            {isLocal && (
              <Popconfirm
                motion={false}
                title={getIntlContent(
                  "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.DELETE.CONFIRM",
                )}
                onConfirm={() => this.handleDelete(row.key)}
                okText={getIntlContent("SHENYU.COMMON.SURE")}
                cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
              >
                <Button
                  theme="borderless"
                  type="danger"
                  disabled={editingKey !== ""}
                >
                  {getIntlContent("SHENYU.BUTTON.SYSTEM.DELETE")}
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    });
    return (
      <div>
        {isLocal && (
          <Button
            onClick={this.handleAdd}
            disabled={editingKey !== ""}
            style={{ marginBottom: 16 }}
          >
            {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.ADD")}
          </Button>
        )}
        <Table
          rowKey="key"
          dataSource={dataSource}
          columns={columns}
          scroll={{ x: 1120 }}
          pagination={{ pageSize: 10 }}
          onChange={({ extra }) => {
            if (extra.changeType === "pagination") this.cancel();
          }}
        />
      </div>
    );
  }
}

export default function DiscoveryUpstreamTable({
  wrappedComponentRef,
  ...props
}) {
  return <EditableTable {...props} ref={wrappedComponentRef} />;
}
