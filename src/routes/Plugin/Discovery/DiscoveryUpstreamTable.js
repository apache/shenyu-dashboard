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

/* eslint-disable max-classes-per-file */
import React, { Component } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Switch,
  Table,
} from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";

import UpstreamLabels, { UpstreamLabelSummary } from "./UpstreamLabels";

const EditableContext = React.createContext();
const { Option } = Select;

class EditableCell extends Component {
  getInput = () => {
    if (this.props.inputType === "number") {
      return <InputNumber />;
    } else if (this.props.inputType === "dropdown") {
      // return <Select />;
      return (
        <Select>
          <Option value={0}>{getIntlContent("SHENYU.COMMON.OPEN")}</Option>
          <Option value={1}>{getIntlContent("SHENYU.COMMON.CLOSE")}</Option>
        </Select>
      );
    } else if (this.props.inputType === "switch") {
      return <Switch />;
    }
    return <Input />;
  };

  renderCell = ({ getFieldDecorator }) => {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item style={{ margin: 0 }}>
            {dataIndex === "gray"
              ? getFieldDecorator(dataIndex, {
                  rules: [
                    {
                      required: true,
                      message: `Please Input ${title}!`,
                    },
                  ],
                  valuePropName: "checked",
                  initialValue:
                    record[dataIndex] === "true" || record[dataIndex] === true,
                })(this.getInput())
              : getFieldDecorator(dataIndex, {
                  rules: [
                    {
                      required: true,
                      message: `Please Input ${title}!`,
                    },
                  ],
                  initialValue:
                    dataIndex === "status"
                      ? Number(record[dataIndex])
                      : record[dataIndex],
                })(this.getInput())}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  render() {
    return (
      <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
    );
  }
}

class EditableTable extends Component {
  tableRef = React.createRef();

  labelsRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      editingKey: "",
      editorWidth: undefined,
      isLocal: this.props.isLocal,
    };
    this.columns = [
      {
        title: "protocol",
        dataIndex: "protocol",
        editable: true,
        width: 110,
        align: "center",
      },
      {
        title: "url",
        dataIndex: "url",
        editable: this.state.isLocal,
        width: 200,
        align: "center",
      },
      {
        title: "status",
        dataIndex: "status",
        editable: true,
        width: 90,
        align: "center",
        render: (text) => {
          const statusMap = {
            0: getIntlContent("SHENYU.COMMON.OPEN"),
            1: getIntlContent("SHENYU.COMMON.CLOSE"),
            false: getIntlContent("SHENYU.COMMON.OPEN"),
            true: getIntlContent("SHENYU.COMMON.CLOSE"),
          };
          return statusMap[text] || getIntlContent("SHENYU.COMMON.CLOSE");
        },
      },
      {
        title: "weight",
        dataIndex: "weight",
        width: 100,
        editable: true,
        align: "center",
      },
      {
        title: "startupTime",
        dataIndex: "startupTime",
        width: 130,
        editable: this.state.isLocal,
        align: "center",
      },
      {
        title: "warmupTime",
        dataIndex: "warmupTime",
        width: 130,
        editable: true,
        align: "center",
      },
      {
        title: "gray",
        dataIndex: "gray",
        width: 80,
        editable: true,
        align: "center",
        render: (text, record) => {
          return (
            <Switch
              disabled
              checked={record.gray === "true" || record.gray === true}
            />
          );
        },
      },
      {
        title: getIntlContent("SHENYU.UPSTREAM.LABELS.TITLE"),
        key: "labels",
        width: 280,
        render: (value, record) => <UpstreamLabelSummary record={record} />,
      },
      {
        title: getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.OPERATION"),
        dataIndex: "operation",
        width: 160,
        align: "center",
        render: (text, record) => {
          const { editingKey } = this.state;
          const editable = this.isEditing(record);
          return (
            <span>
              {editable ? (
                <span>
                  <Button
                    type="link"
                    onClick={() => this.save(this.props.form, record.key)}
                  >
                    {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.SAVE")}
                  </Button>
                  <Button type="link" onClick={this.cancel}>
                    {getIntlContent(
                      "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.CANCEL",
                    )}
                  </Button>
                </span>
              ) : (
                <span>
                  <Button
                    type="link"
                    disabled={editingKey !== ""}
                    onClick={() => this.edit(record.key)}
                  >
                    {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.EDIT")}
                  </Button>{" "}
                  {this.props.dataSource.length >= 1 && this.state.isLocal ? (
                    <Popconfirm
                      title={getIntlContent(
                        "SHENYU.DISCOVERY.SELECTOR.UPSTREAM.DELETE.CONFIRM",
                      )}
                      onConfirm={() => this.handleDelete(record.key)}
                      okText={getIntlContent("SHENYU.COMMON.SURE")}
                      cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                    >
                      <Button
                        type="link"
                        disabled={this.state.editingKey !== ""}
                      >
                        {getIntlContent("SHENYU.BUTTON.SYSTEM.DELETE")}
                      </Button>
                    </Popconfirm>
                  ) : null}
                </span>
              )}
            </span>
          );
        },
      },
    ];
  }

  componentDidMount() {
    this.resizeEditor();
    window.addEventListener("resize", this.resizeEditor);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeEditor);
  }

  resizeEditor = () => {
    if (this.tableRef.current)
      this.setState({ editorWidth: this.tableRef.current.offsetWidth - 34 });
  };

  renderLabels = (record) =>
    this.isEditing(record) ? (
      <UpstreamLabels
        ref={this.labelsRef}
        record={record}
        width={this.state.editorWidth}
      />
    ) : null;

  isEditing = (record) => record.key === this.state.editingKey;

  cancel = () => {
    this.setState({ editingKey: "" });
    this.props.form.resetFields();
    if (this.props.onEditingChange) this.props.onEditingChange(false);
  };

  handleDelete = (key) => {
    const { dataSource } = this.props;
    const newData = dataSource.filter((item) => item.key !== key);
    this.props.onTableChange(newData);
  };

  handleAdd = () => {
    const { dataSource, recordCount } = this.props;
    const newRecordCount = recordCount + 1;
    const newData = {
      key: newRecordCount,
      protocol: "http://",
      url: "localhost:",
      status: 0,
      weight: 50,
      startupTime: 0,
      warmupTime: 10,
      gray: false,
    };
    this.props.onTableChange([...dataSource, newData]);
    this.props.onCountChange(newRecordCount);
  };

  save(form, key) {
    const labels = this.labelsRef.current && this.labelsRef.current.validate();
    form.validateFields((error, row) => {
      if (error || !labels) return;
      const newData = this.props.dataSource.map((item) =>
        item.key === key ? { ...item, ...row, ...labels } : item,
      );
      this.props.onTableChange(newData);
      this.cancel();
    });
  }

  edit(key) {
    this.props.form.resetFields();
    this.resizeEditor();
    this.setState({ editingKey: key });
    if (this.props.onEditingChange) this.props.onEditingChange(true);
  }

  render() {
    const components = {
      body: {
        cell: EditableCell,
      },
    };

    const columns = this.columns.map((col) => {
      if (!col.editable) {
        return col;
      }

      let inputType = "text";
      if (
        col.dataIndex === "weight" ||
        col.dataIndex === "startupTime" ||
        col.dataIndex === "warmupTime"
      ) {
        inputType = "number";
      } else if (col.dataIndex === "status") {
        inputType = "dropdown";
      } else if (col.dataIndex === "gray") {
        inputType = "switch";
      }
      return {
        ...col,
        onCell: (record) => ({
          record,
          inputType,
          dataIndex: col.dataIndex,
          title: col.title,
          editing: this.isEditing(record),
        }),
      };
    });

    return (
      <div ref={this.tableRef}>
        {this.state.isLocal && (
          <Button
            disabled={this.state.editingKey !== ""}
            onClick={this.handleAdd}
            type="primary"
            style={{ marginBottom: 16 }}
          >
            {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.ADD")}
          </Button>
        )}
        <EditableContext.Provider value={this.props.form}>
          <Table
            components={components}
            bordered
            scroll={{ x: 1280 }}
            expandedRowKeys={
              this.state.editingKey === "" ? [] : [this.state.editingKey]
            }
            expandIconAsCell={false}
            expandIconColumnIndex={-1}
            expandIcon={() => null}
            expandedRowRender={this.renderLabels}
            dataSource={this.props.dataSource}
            columns={columns}
            rowClassName="editable-row"
            pagination={{
              onChange: this.cancel,
            }}
          />
        </EditableContext.Provider>
      </div>
    );
  }
}

const EditableFormTable = Form.create()(EditableTable);
export default EditableFormTable;
