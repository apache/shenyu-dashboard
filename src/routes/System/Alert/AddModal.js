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
import { Modal, Form, Select, Input, Switch, Row, Col, Button } from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";
import { Type } from "./globalData";

const FormItem = Form.Item;
const { Option } = Select;

class AddModal extends Component {
  constructor(props) {
    super(props);
    const labelList = Object.entries(props.labels || {}).map(
      ([name, value], key) => ({ key, name, value }),
    );
    if (!labelList.length) {
      labelList.push({ key: 0, name: "", value: "" });
    }
    this.state = {
      labelList,
    };
  }

  handleSubmit = (e) => {
    const { form, handleOk, id = "" } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({
          ...values,
          id,
          labels: Object.fromEntries(
            this.state.labelList
              .filter(({ name, value }) => name && value)
              .map(({ name, value }) => [name, value]),
          ),
        });
      }
    });
  };

  sendTest = (e) => {
    const { form, handleSendTest, id = "" } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleSendTest({
          ...values,
          id,
          labels: Object.fromEntries(
            this.state.labelList.map(({ name, value }) => [name, value]),
          ),
        });
      }
    });
  };

  render() {
    let {
      handleCancel,
      form,
      name = null,
      enable = true,
      type = null,
      email = null,
      accessToken = null,
      matchAll = true,
      levels = [],
    } = this.props;
    const { labelList } = this.state;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 5 },
      },
      wrapperCol: {
        sm: { span: 19 },
      },
    };

    const renderConfiguration = () => {
      const t = form.getFieldValue("type");
      switch (t) {
        case "1":
          return (
            <FormItem
              label={getIntlContent("SHENYU.SYSTEM.ALERT.EMAIL")}
              {...formItemLayout}
            >
              {getFieldDecorator("email", {
                rules: [
                  {
                    required: true,
                    message: getIntlContent("SHENYU.SYSTEM.ALERT.EMAIL.INPUT"),
                  },
                ],
                initialValue: email,
              })(
                <Input
                  allowClear
                  placeholder={getIntlContent(
                    "SHENYU.SYSTEM.ALERT.EMAIL.INPUT",
                  )}
                />,
              )}
            </FormItem>
          );
        case "5":
          return (
            <FormItem
              label={getIntlContent("SHENYU.SYSTEM.ALERT.ACCESS_TOKEN")}
              {...formItemLayout}
            >
              {getFieldDecorator("accessToken", {
                rules: [
                  {
                    required: true,
                    message: getIntlContent(
                      "SHENYU.SYSTEM.ALERT.ACCESS_TOKEN.INPUT",
                    ),
                  },
                ],
                initialValue: accessToken,
              })(
                <Input
                  allowClear
                  placeholder={getIntlContent(
                    "SHENYU.SYSTEM.ALERT.ACCESS_TOKEN.INPUT",
                  )}
                />,
              )}
            </FormItem>
          );
        default:
          return null;
      }
    };

    return (
      <Modal
        width={600}
        centered
        title={getIntlContent("SHENYU.SYSTEM.ALERT")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ALERT.NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SYSTEM.ALERT.NAME.INPUT"),
                },
              ],
              initialValue: name,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.SYSTEM.ALERT.NAME.INPUT")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ALERT.ENABLE")}
            {...formItemLayout}
          >
            {getFieldDecorator("enable", {
              rules: [{ required: true }],
              initialValue: enable,
            })(
              <Switch
                checked={form.getFieldValue("enable")}
                checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
                unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
                onChange={(v) => {
                  form.setFieldsValue({ enable: v });
                }}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ALERT.TYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator("type", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SYSTEM.ALERT.TYPE.SELECT"),
                },
              ],
              initialValue: type?.toString(),
            })(
              <Select
                placeholder={getIntlContent("SHENYU.SYSTEM.ALERT.TYPE.SELECT")}
                style={{ width: "100%" }}
                onChange={(v) => form.setFieldsValue({ type: v })}
              >
                {Object.entries(Type).map(([k, v]) => (
                  <Option value={k} key={k}>
                    {getIntlContent(v)}
                  </Option>
                ))}
              </Select>,
            )}
          </FormItem>
          {renderConfiguration()}
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ALERT.MATCH_ALL")}
            {...formItemLayout}
          >
            {getFieldDecorator("matchAll", {
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.SYSTEM.ALERT.MATCH_ALL.SELECT",
                  ),
                },
              ],
              initialValue: matchAll,
            })(
              <Switch
                checked={form.getFieldValue("matchAll")}
                onChange={(v) => form.setFieldsValue({ matchAll: v })}
              />,
            )}
          </FormItem>
          {form.getFieldValue("matchAll") || (
            <>
              <FormItem
                label={getIntlContent("SHENYU.SYSTEM.ALERT.LABELS")}
                {...formItemLayout}
              >
                {labelList.map((label) => (
                  <Row
                    key={label.key}
                    type="flex"
                    style={{ flexFlow: "initial" }}
                  >
                    <Col>
                      <Input
                        allowClear
                        value={label.name}
                        placeholder={getIntlContent(
                          "SHENYU.SYSTEM.ALERT.LABELS.NAME",
                        )}
                        onChange={(e) => {
                          const index = labelList.findIndex(
                            (l) => l.key === label.key,
                          );
                          labelList.splice(index, 1, {
                            ...label,
                            name: e.target.value,
                          });
                          this.setState({ labelList });
                        }}
                      />
                    </Col>
                    <Col style={{ marginLeft: 10 }}>
                      <Input
                        allowClear
                        value={label.value}
                        placeholder={getIntlContent(
                          "SHENYU.SYSTEM.ALERT.LABELS.VALUE",
                        )}
                        onChange={(e) => {
                          const index = labelList.findIndex(
                            (l) => l.key === label.key,
                          );
                          labelList.splice(index, 1, {
                            ...label,
                            value: e.target.value,
                          });
                          this.setState({ labelList });
                        }}
                      />
                    </Col>
                    <Col
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginLeft: 10,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div
                        className="edit"
                        onClick={() => {
                          const index = labelList.findIndex(
                            (l) => l.key === label.key,
                          );
                          let key =
                            labelList.reduce(
                              (max, l) => Math.max(max, l.key),
                              0,
                            ) + 1;
                          labelList.splice(index + 1, 0, {
                            key,
                            name: "",
                            value: "",
                          });
                          this.setState({ labelList });
                        }}
                      >
                        {getIntlContent("SHENYU.SYSTEM.ALERT.LABELS.ADD")}
                      </div>
                      {labelList.length !== 1 && (
                        <span
                          className="edit"
                          style={{ marginLeft: 10 }}
                          onClick={() => {
                            const index = labelList.findIndex(
                              (l) => l.key === label.key,
                            );
                            if (labelList.length > 1) {
                              labelList.splice(index, 1);
                            } else {
                              labelList[0].name = "";
                              labelList[0].value = "";
                            }
                            this.setState({ labelList });
                          }}
                        >
                          {getIntlContent("SHENYU.SYSTEM.ALERT.LABELS.DELETE")}
                        </span>
                      )}
                    </Col>
                  </Row>
                ))}
              </FormItem>
              <FormItem
                label={getIntlContent("SHENYU.SYSTEM.ALERT.LEVELS")}
                {...formItemLayout}
              >
                {getFieldDecorator("levels", {
                  initialValue: levels?.map((i) => i.toString()),
                })(
                  <Select
                    mode="tags"
                    placeholder={getIntlContent(
                      "SHENYU.SYSTEM.ALERT.LEVELS.SELECT",
                    )}
                    style={{ width: "100%" }}
                    onChange={(v) =>
                      form.setFieldsValue({
                        levels: v.sort(
                          (l, r) => parseInt(l, 10) - parseInt(r, 10),
                        ),
                      })
                    }
                  >
                    <Option value="0">
                      {getIntlContent("SHENYU.SYSTEM.ALERT.LEVELS.HIGH")}
                    </Option>
                    <Option value="1">
                      {getIntlContent("SHENYU.SYSTEM.ALERT.LEVELS.MIDDLE")}
                    </Option>
                    <Option value="2">
                      {getIntlContent("SHENYU.SYSTEM.ALERT.LEVELS.LOW")}
                    </Option>
                  </Select>,
                )}
              </FormItem>
            </>
          )}
          <FormItem {...formItemLayout} wrapperCol={{ offset: 5 }}>
            <Button onClick={this.sendTest} type="primary">
              {getIntlContent("SHENYU.SYSTEM.ALERT.BUTTON.SEND_TEST")}
            </Button>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
