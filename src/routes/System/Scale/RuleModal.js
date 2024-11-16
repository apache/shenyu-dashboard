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
import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";
import { ConfigType } from "./globalData";

const FormItem = Form.Item;
const { Option } = Select;

class RuleModal extends Component {
  handleSubmit = (e) => {
    const { form, handleOk, id = "" } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({
          ...values,
          id,
          status: values.status ? 1 : 0,
        });
      }
    });
  };

  render() {
    let {
      handleCancel,
      form,
      metricName = null,
      type = 0,
      sort = null,
      status = 0,
      minimum = null,
      maximum = null,
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
            label={getIntlContent("SHENYU.SYSTEM.SCALE.CONFIG_NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("metricName", {
              initialValue: metricName,
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.SYSTEM.SCALE.CONFIG_NAME.INPUT",
                  ),
                },
              ],
            })(
              <Input
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.SYSTEM.SCALE.CONFIG_NAME.INPUT",
                )}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.SCALE.CONFIG_TYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator("type", {
              initialValue: type,
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.SYSTEM.SCALE.CONFIG_TYPE.INPUT",
                  ),
                },
              ],
            })(
              <Select>
                {Object.entries(ConfigType).map(([v, k]) => {
                  return (
                    <Option key={v} value={Number(v)}>
                      {getIntlContent(k)}
                    </Option>
                  );
                })}
              </Select>,
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
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.SCALE.MINIMUM")}
            {...formItemLayout}
          >
            {getFieldDecorator("minimum", {
              initialValue: minimum,
            })(
              <InputNumber
                min={0}
                type="number"
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.SYSTEM.SCALE.MINIMUM.INPUT",
                )}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.SCALE.MAXIMUM")}
            {...formItemLayout}
          >
            {getFieldDecorator("maximum", {
              initialValue: maximum,
            })(
              <InputNumber
                min={0}
                type="number"
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.SYSTEM.SCALE.MAXIMUM.INPUT",
                )}
              />,
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(RuleModal);
