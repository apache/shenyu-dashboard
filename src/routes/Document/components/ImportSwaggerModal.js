/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-unused-expressions */
/* eslint-disable react/static-property-placement */
import { Modal, Form, Input, message } from "antd";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { getIntlContent } from "../../../utils/IntlUtils";
import { importSwagger } from "../../../services/api";

class ImportSwaggerModal extends Component {
  static propTypes = {
    form: PropTypes.object,
    visible: PropTypes.bool,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    currentProjectName: PropTypes.string,
  };

  static defaultProps = {
    visible: false,
    currentProjectName: "",
    form: null,
    onOk: null,
    onCancel: null,
  };

  componentDidMount() {
    // Component mounted
  }

  handleSubmit = () => {
    const {
      onOk,
      form: { validateFieldsAndScroll },
    } = this.props;
    validateFieldsAndScroll(async (err, values) => {
      if (!err) {
        try {
          const res = await importSwagger(values);
          if (res.code !== 200) {
            message.error(
              res.message ||
                getIntlContent("SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.FAILED"),
            );
          } else {
            message.success(
              res.message ||
                getIntlContent("SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.SUCCESS"),
            );
            onOk?.(values);
          }
        } catch (error) {
          message.error(
            getIntlContent(
              "SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.NETWORK.ERROR",
            ),
          );
        }
      }
    });
  };

  render() {
    const { onCancel, form, visible, currentProjectName } = this.props;
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
        visible={visible}
        onCancel={onCancel}
        onOk={this.handleSubmit}
        forceRender
        title={getIntlContent("SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.TITLE")}
        width={600}
      >
        <Form className="login-form" {...formItemLayout}>
          <Form.Item
            label={getIntlContent(
              "SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.PROJECT.NAME",
            )}
          >
            {getFieldDecorator("projectName", {
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.PROJECT.NAME.PLACEHOLDER",
                  ),
                },
              ],
              initialValue: currentProjectName,
            })(
              <Input
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.PROJECT.NAME.PLACEHOLDER",
                )}
              />,
            )}
          </Form.Item>

          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.URL")}
          >
            {getFieldDecorator("swaggerUrl", {
              rules: [
                {
                  required: true,
                  message: getIntlContent(
                    "SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.URL.REQUIRED",
                  ),
                },
                {
                  type: "url",
                  message: getIntlContent(
                    "SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.URL.INVALID",
                  ),
                },
              ],
            })(
              <Input
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER.URL.PLACEHOLDER",
                )}
              />,
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(ImportSwaggerModal);
