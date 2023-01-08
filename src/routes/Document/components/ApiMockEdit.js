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

import { Modal, Form, Input } from "antd";
import React, { Component } from "react";
import { getIntlContent } from "../../../utils/IntlUtils";

class ApiMockEdit extends Component {
  render() {
    const {
      onCancel,
      form,
      host = "",
      port = "",
      url = "",
      pathVariable = "",
      query = "",
      header = "",
      body = ""
    } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 5 }
      },
      wrapperCol: {
        sm: { span: 19 }
      }
    };
    const handleSubmit = () => {
      const { handleOk } = this.props;
      let newValues = "";
      form.validateFieldsAndScroll((err, values) => {
        if (!err) {
          // eslint-disable-next-line radix
          values.state = parseInt(values.state);
          // eslint-disable-next-line radix
          values.apiSource = parseInt(values.apiSource);
          // eslint-disable-next-line radix
          values.httpMethod = parseInt(values.httpMethod);
          newValues = values;
        }
      });
      handleOk(newValues);
    };
    return (
      <Modal visible onCancel={onCancel} onOk={handleSubmit}>
        <Form onSubmit={handleSubmit} className="login-form">
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.HOST")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("host", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.HOST")
                }
              ],
              initialValue: host
            })(
              <Input
                placeholder={getIntlContent(
                  "SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.HOST"
                )}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.PORT")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("port", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.PORT")
                }
              ],
              initialValue: port
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.PORT")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.URL")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("url", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.URL")
                }
              ],
              initialValue: url
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.PORT")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.PATH_VARIABLE")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("pathVariable", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.PATH_VARIABLE")
                }
              ],
              initialValue: pathVariable
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.PATH_VARIABLE")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.QUERY")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("query", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.QUERY")
                }
              ],
              initialValue: query
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.QUERY")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.HEADER")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("header", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.HEADER")
                }
              ],
              initialValue: header
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.HEADER")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.BODY")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("body", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.BODY")
                }
              ],
              initialValue: body
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.DEBUG.MOCK.BODY")}
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(ApiMockEdit);
