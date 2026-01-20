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
import { Form, Input, Modal } from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;

class SwaggerImportModal extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleSubmit = (e) => {
    const { form, handleOk } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { swaggerUrl, projectName } = values;
        handleOk({ swaggerUrl, projectName });
      }
    });
  };

  render() {
    let { handleCancel, form } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 7 },
      },
      wrapperCol: {
        sm: { span: 17 },
      },
    };
    return (
      <Modal
        width={520}
        centered
        title={getIntlContent("SHENYU.MCP.SWAGGER.IMPORT")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.MCP.SWAGGER.SWAGGER_URL")}
            {...formItemLayout}
          >
            {getFieldDecorator("swaggerUrl", {
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.MCP.SWAGGER.SWAGGER_URL.INPUT",
                  ),
                },
              ],
              initialValue: "",
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.MCP.SWAGGER.SWAGGER_URL")}
              />,
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.MCP.SWAGGER.PROJECT_NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("projectName", {
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.MCP.SWAGGER.PROJECT_NAME.INPUT",
                  ),
                },
              ],
              initialValue: "",
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.MCP.SWAGGER.PROJECT_NAME")}
              />,
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(SwaggerImportModal);
