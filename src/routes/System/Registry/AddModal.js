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
    const { form, handleOk } = this.props;
    const { id } = this.props?.detail || {};
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let {
          registryId,
          protocol,
          address,
          username,
          password,
          namespace,
          group,
        } = values;
        handleOk({
          registryId,
          protocol,
          address,
          username,
          password,
          namespace,
          group,
          id,
        });
      }
    });
  };

  render() {
    let { handleCancel, form } = this.props;

    const {
      registryId = "",
      protocol = "",
      address = "",
      username = "",
      password = "",
      namespace = "",
      group = "",
      id = "",
    } = this.props?.detail || {};

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
        title={getIntlContent("SHENYU.REGISTRY.MODAL.TITLE")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.REGISTRY.REGISTRY_ID")}
            {...formItemLayout}
          >
            {getFieldDecorator("registryId", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.REGISTRY.REGISTRY_ID.INPUT"),
                },
                {
                  max: 20,
                  message: getIntlContent("SHENYU.REGISTRY.REGISTRY_ID.LENGTH"),
                },
              ],
              initialValue: registryId,
            })(
              <Input
                placeholder={getIntlContent(
                  "SHENYU.REGISTRY.REGISTRY_ID.INPUT",
                )}
                disabled={id}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.REGISTRY.PROTOCOL")}
            {...formItemLayout}
          >
            {getFieldDecorator("protocol", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.REGISTRY.PROTOCOL.INPUT"),
                },
              ],
              initialValue: protocol,
            })(
              <Input
                placeholder={getIntlContent("SHENYU.REGISTRY.PROTOCOL.INPUT")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.REGISTRY.ADDRESS")}
            {...formItemLayout}
          >
            {getFieldDecorator("address", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.REGISTRY.ADDRESS.INPUT"),
                },
                {
                  max: 256,
                  message: getIntlContent("SHENYU.REGISTRY.REGISTRY_ID.LENGTH"),
                },
              ],
              initialValue: address,
            })(
              <Input
                placeholder={getIntlContent("SHENYU.REGISTRY.ADDRESS.INPUT")}
              />,
            )}
          </FormItem>

          <FormItem
            label={getIntlContent("SHENYU.REGISTRY.USERNAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("username", {
              initialValue: username,
            })(
              <Input
                placeholder={getIntlContent("SHENYU.REGISTRY.USERNAME.INPUT")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.REGISTRY.PASSPORT")}
            {...formItemLayout}
          >
            {getFieldDecorator("password", {
              initialValue: password,
            })(
              <Input
                placeholder={getIntlContent("SHENYU.REGISTRY.PASSPORT.INPUT")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.REGISTRY.NAMESPACE")}
            {...formItemLayout}
          >
            {getFieldDecorator("namespace", {
              rules: [
                {
                  max: 128,
                  message: getIntlContent("SHENYU.REGISTRY.DESCRIPTION.LENGTH"),
                },
              ],
              initialValue: namespace,
            })(
              <Input
                placeholder={getIntlContent(
                  "SHENYU.REGISTRY.DESCRIPTION.INPUT",
                )}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.REGISTRY.GROUP")}
            {...formItemLayout}
          >
            {getFieldDecorator("group", {
              initialValue: group,
            })(
              <Input
                placeholder={getIntlContent(
                  "SHENYU.REGISTRY.DESCRIPTION.INPUT",
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
