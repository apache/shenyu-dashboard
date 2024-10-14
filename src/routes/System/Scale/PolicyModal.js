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
import { Modal, Form, Input, Switch, DatePicker } from "antd";
import moment from "moment";
import { getIntlContent } from "../../../utils/IntlUtils";
import { PolicyType } from "./globalData";

const FormItem = Form.Item;

class AddModal extends Component {
  handleSubmit = (e) => {
    const { form, handleOk, id = "" } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({
          ...values,
          id,
          status: values.status ? 1 : 0,
          beginTime: values.beginTime.format("YYYY-MM-DDTHH:mm:ss[Z]"),
          endTime: values.endTime.format("YYYY-MM-DDTHH:mm:ss[Z]"),
        });
      }
    });
  };

  render() {
    let {
      handleCancel,
      form,
      id = null,
      num = null,
      sort = null,
      status = 0,
      beginTime = null,
      endTime = null,
    } = this.props;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 5 },
      },
      wrapperCol: {
        sm: { span: 19 },
      },
    };

    return (
      <Modal
        width={600}
        centered
        title={getIntlContent("SHENYU.SYSTEM.SCALE.POLICY")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.SCALE.POLICY_TYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator("id", {
              initialValue: getIntlContent(PolicyType[id]),
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.SYSTEM.SCALE.POLICY_TYPE.INPUT",
                  ),
                },
              ],
            })(
              <Input
                disabled
                placeholder={getIntlContent(
                  "SHENYU.SYSTEM.SCALE.POLICY_TYPE.INPUT",
                )}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.SCALE.POLICY_NUMBER")}
            {...formItemLayout}
          >
            {getFieldDecorator("num", {
              initialValue: num,
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.SYSTEM.SCALE.POLICY_NUMBER.INPUT",
                  ),
                },
              ],
            })(
              <Input
                type="number"
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.SYSTEM.SCALE.POLICY_NUMBER.INPUT",
                )}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.SCALE.SORT")}
            {...formItemLayout}
          >
            {getFieldDecorator("sort", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SYSTEM.SCALE.SORT.INPUT"),
                },
              ],
              initialValue: sort,
            })(
              <Input
                type="number"
                allowClear
                placeholder={getIntlContent("SHENYU.SYSTEM.SCALE.SORT.INPUT")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.SCALE.STATUS")}
            {...formItemLayout}
          >
            {getFieldDecorator("status", {
              rules: [{ required: true }],
              initialValue: status,
            })(
              <Switch
                checked={Boolean(form.getFieldValue("status"))}
                checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
                unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
                onChange={(v) => {
                  form.setFieldsValue({ status: v });
                }}
              />,
            )}
          </FormItem>
          {id === "2" && (
            <FormItem
              label={getIntlContent("SHENYU.SYSTEM.SCALE.BEGIN_TIME")}
              {...formItemLayout}
            >
              {getFieldDecorator("beginTime", {
                rules: [{ required: true }],
                initialValue: moment(beginTime, "YYYY-MM-DD HH:mm:ss"),
              })(
                <DatePicker
                  showTime
                  placeholder={getIntlContent(
                    "SHENYU.SYSTEM.SCALE.BEGIN_TIME.INPUT",
                  )}
                  onChange={(_, v) => {
                    form.setFieldsValue({
                      beginTime: moment(v, "YYYY-MM-DD HH:mm:ss"),
                    });
                  }}
                  format="YYYY-MM-DD HH:mm:ss"
                  allowClear={false}
                />,
              )}
            </FormItem>
          )}
          {id === "2" && (
            <FormItem
              label={getIntlContent("SHENYU.SYSTEM.SCALE.END_TIME")}
              {...formItemLayout}
            >
              {getFieldDecorator("endTime", {
                rules: [{ required: true }],
                initialValue: moment(endTime, "YYYY-MM-DD HH:mm:ss"),
              })(
                <DatePicker
                  showTime
                  placeholder={getIntlContent(
                    "SHENYU.SYSTEM.SCALE.END_TIME.INPUT",
                  )}
                  onChange={(_, v) => {
                    form.setFieldsValue({
                      endTime: moment(v, "YYYY-MM-DD HH:mm:ss"),
                    });
                  }}
                  format="YYYY-MM-DD HH:mm:ss"
                  allowClear={false}
                />,
              )}
            </FormItem>
          )}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
