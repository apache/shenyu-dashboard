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
import {
  Modal,
  Form,
  Select,
  Input,
  Table,
  Button,
  Popconfirm,
  Switch,
  message,
} from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { Option } = Select;

export const getNextPathRowKey = (rows) =>
  rows.reduce(
    (maxKey, item) =>
      Number.isInteger(item.key) ? Math.max(maxKey, item.key) : maxKey,
    -1,
  ) + 1;

export const normalizePathRows = (rows) => {
  const usedKeys = new Set();
  let nextKey = getNextPathRowKey(rows);

  return rows.map((item) => {
    if (Number.isInteger(item.key) && !usedKeys.has(item.key)) {
      usedKeys.add(item.key);
      return item;
    }

    while (usedKeys.has(nextKey)) {
      nextKey += 1;
    }
    const normalized = { ...item, key: nextKey };
    usedKeys.add(nextKey);
    nextKey += 1;
    return normalized;
  });
};

export class AddTableComponent extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      {
        title: getIntlContent("SHENYU.AUTH.RESOUCE.PATH"),
        dataIndex: "path",
        editable: "true",
        render: (text, record) => (
          <Input
            allowClear
            placeholder="/"
            value={text}
            onChange={(e) =>
              this.handleTableInput({ path: e.target.value }, record)
            }
          />
        ),
      },
      /* {
        title: getIntlContent("SHENYU.AUTH.PATH.DESCRIBE"),
        dataIndex: 'pathDesc',
        editable: 'true',
        render: (text, record) => (
          <Input
            value={text}
            onChange={(e) => this.handleTableInput({ pathDesc: e.target.value }, record)}
          />
        )
      }, */
      {
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operation",
        render: (text, record) =>
          this.state.allData.length > 1 ? (
            <Popconfirm
              title={getIntlContent("SHENYU.COMMON.DELETE")}
              onConfirm={() => this.handleDelete(record.key)}
            >
              <a>{getIntlContent("SHENYU.COMMON.DELETE.NAME")}</a>
            </Popconfirm>
          ) : null,
      },
    ];
    this.state = {
      allData: [],
      newSelectInput: [],
      pathTableVisible: true,
    };
  }

  //   下拉框事件
  handleChange = (value) => {
    this.props.form.setFieldsValue({ appName: value });
    this.setState({
      allData: normalizePathRows(
        this.props.metaGroup[value] === undefined ||
          this.props.metaGroup[value] === null
          ? [
              {
                key: 0,
                path: "",
                pathDesc: "",
              },
            ]
          : this.props.metaGroup[value],
      ),
    });
  };

  handleSubmit = (e) => {
    const { form, handleOk } = this.props;
    const { allData } = this.state;
    const pathList = allData.map((item) => {
      return item.path;
    });
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (values.open) {
        if (!pathList || pathList.length < 1) {
          message.destroy();
          message.error("At least one app path when open path");
          return;
        } else if (pathList.some((p) => !p || p.trim().length === 0)) {
          message.error("App path can not be empty when open path");
          return;
        }
      }
      if (!err) {
        handleOk({ pathList, ...values });
      }
    });
  };

  handleTableInput = (value, record) => {
    this.setState((prev) => ({
      allData: prev.allData.map((item) =>
        item.key === record.key ? { ...item, ...value } : item,
      ),
    }));
  };

  handleAddTd = () => {
    this.setState((prev) => ({
      allData: [
        ...prev.allData,
        {
          key: getNextPathRowKey(prev.allData),
          path: "",
          pathDesc: "",
        },
      ],
    }));
  };

  handleDelete = (key) => {
    this.setState((prev) => ({
      allData: prev.allData.filter((item) => item.key !== key),
    }));
  };

  onSearchSelect = (value, index) => {
    const { newSelectInput } = this.state;
    const flag = !!value;
    if (flag) {
      newSelectInput[index] = value || "";
      this.setState({ newSelectInput });
    }
  };

  onBlurSelect = (index) => {
    const { newSelectInput } = this.state;
    const value = newSelectInput[index];
    const flag = !!value;
    if (flag) {
      this.handleChange(value);
      delete newSelectInput[index]; // 在onBlur后将对应的key删除，防止当从下拉框中选择后再次触发onBlur时经过此处恢复成原来的值
    }
  };

  handleOpenChange = (checked) => {
    this.setState({ pathTableVisible: checked });
  };

  handleTableChange = (paginationObj) => {
    this.setState({
      pagination: paginationObj.current,
    });
  };

  render() {
    let { handleCancel, form, metaGroup } = this.props;
    // 下拉框数据
    const appNameGroup = Object.getOwnPropertyNames(metaGroup);
    // 表格数据
    const { pathTableVisible } = this.state;
    const columns = this.columns;
    //   根据下拉框选项自动更换数据
    const data = this.state.allData;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 },
      },
      wrapperCol: {
        sm: { span: 18 },
      },
    };

    return (
      <Modal
        width={550}
        centered
        title={getIntlContent("SHENYU.AUTH.AUTH")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.AUTH.APPNAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("appName", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.AUTH.SELECT.APP"),
                },
              ],
            })(
              <Select
                showSearch
                placeholder={getIntlContent("SHENYU.AUTH.SELECT.APP")}
                onChange={this.handleChange}
                onSearch={(value) => this.onSearchSelect(value, "0")}
                onBlur={() => this.onBlurSelect("0")}
              >
                {appNameGroup.map((item, index) => {
                  return (
                    <Option key={index} value={item}>
                      {item}
                    </Option>
                  );
                })}
              </Select>,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.PHONE")}
            {...formItemLayout}
          >
            {getFieldDecorator("phone", {
              rules: [
                {
                  required: true,
                  message: `${getIntlContent("SHENYU.AUTH.INPUT")}Phone`,
                },
              ],
            })(<Input allowClear placeholder="Phone" />)}
          </FormItem>
          <FormItem
            label={`App${getIntlContent("SHENYU.AUTH.PARAMS")}`}
            {...formItemLayout}
          >
            {getFieldDecorator(
              "appParam",
              {},
            )(<Input allowClear placeholder="AppParams" />)}
          </FormItem>
          <FormItem
            label={`${getIntlContent("SHENYU.SYSTEM.USER")}Id`}
            {...formItemLayout}
          >
            {getFieldDecorator("userId", {
              rules: [
                {
                  required: true,
                  message: `${getIntlContent("SHENYU.AUTH.INPUT")}UserId`,
                },
              ],
            })(<Input allowClear placeholder="UserId" />)}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.EXPANDINFO")}
            {...formItemLayout}
          >
            {getFieldDecorator(
              "extInfo",
              {},
            )(<Input allowClear placeholder="ExpandInfo" />)}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.OPENPATH")}
            {...formItemLayout}
          >
            {getFieldDecorator("open", {
              initialValue: true,
              valuePropName: "checked",
            })(<Switch onChange={this.handleOpenChange} />)}
          </FormItem>
          {/* 下拉框关联表格 */}
          {pathTableVisible && (
            <div>
              {data.length < 1 ? (
                <Button
                  disabled
                  onClick={this.handleAddTd}
                  type="primary"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  {getIntlContent("SHENYU.AUTH.ADD")}
                </Button>
              ) : (
                <Button
                  onClick={this.handleAddTd}
                  type="primary"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  {getIntlContent("SHENYU.AUTH.ADD")}
                </Button>
              )}
              <Table
                bordered
                columns={columns}
                dataSource={data}
                onChange={this.handleTableChange}
                rowKey={(record) => record.key}
                pagination={{ current: this.state.pagination, pageSize: 10 }}
              />
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddTableComponent);
