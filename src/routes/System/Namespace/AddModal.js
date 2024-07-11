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
import { Modal, Form, Input } from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;

class AddModal extends Component {
  handleSubmit = (e) => {
    const { form, handleOk, id = "" } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({ ...values, id });
      }
    });
  };

  render() {
    let {
      handleCancel,
      form,
      name = "",
      description = "",
      namespaceId = "",
    } = this.props;

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
        width={450}
        centered
        title={getIntlContent("SHENYU.SYSTEM.NAMESPACE")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.NAMESPACE.NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.NAMESPACE.INPUTNAME"),
                },
              ],
              initialValue: name,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.NAMESPACE.INPUTNAME")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.NAMESPACE.DESC")}
            {...formItemLayout}
          >
            {getFieldDecorator("description", {
              rules: [
                {
                  required: false,
                  message: getIntlContent("SHENYU.NAMESPACE.INPUTDESC"),
                },
              ],
              initialValue: description,
            })(
              <Input.TextArea
                autoSize
                allowClear
                placeholder={getIntlContent("SHENYU.NAMESPACE.INPUTDESC")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.NAMESPACE.NAMESPACEID")}
            {...formItemLayout}
          >
            {getFieldDecorator("namespaceId", {
              rules: [
                {
                  required: false,
                  message: getIntlContent("SHENYU.NAMESPACE.ALERTNAMESPACEID"),
                },
              ],
              initialValue: namespaceId,
            })(
              <Input
                allowClear
                disabled={true}
                placeholder={getIntlContent(
                  "SHENYU.NAMESPACE.ALERTNAMESPACEID",
                )}
              />,
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
