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

import { Modal, Form, Input, Select } from "antd";
import React, { Component } from "react";
import { Method } from "./globalData";
import { getIntlContent } from "../../../utils/IntlUtils";

class AddAndUpdateApiDoc extends Component {
  render() {
    const RPCTYPE = [
      "http",
      "dubbo",
      "sofa",
      "tars",
      "websocket",
      "springCloud",
      "motan",
      "grpc"
    ];
    const API_SOURCE_TYPE = [
      "swagger",
      "annotation generation",
      "create manuallym",
      "import swagger",
      "import yapi"
    ];
    const {
      onCancel,
      form,
      contextPath = "",
      apiPath = "",
      httpMethod = "",
      consume = "",
      produce = "",
      version = "",
      rpcType = "",
      state = "",
      ext = "",
      apiOwner = "",
      apiDesc = "",
      apiSource = "",
      document = ""
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
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.CONTEXTPATH")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("contextPath", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.CONTEXTPATH")
                }
              ],
              initialValue: contextPath
            })(
              <Input
                placeholder={getIntlContent(
                  "SHENYU.DOCUMENT.APIDOC.CONTEXTPATH"
                )}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.APIPATH")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("apiPath", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APIPATH")
                }
              ],
              initialValue: apiPath
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIPATH")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.HTTPMETHOD")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("httpMethod", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.HTTPMETHOD")
                }
              ],
              initialValue: httpMethod
            })(
              <Select>
                {Object.values(Method).map((e, i) => {
                  return (
                    <Select.Option key={`${e} ${i}`} value={i}>
                      {e}
                    </Select.Option>
                  );
                })}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.CONSUME")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("consume", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.CONSUME")
                }
              ],
              initialValue: consume
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.CONSUME")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.PRODUCE")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("produce", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.PRODUCE")
                }
              ],
              initialValue: produce
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.PRODUCE")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.VERSION")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("version", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.VERSION")
                }
              ],
              initialValue: version
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.VERSION")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.RPCTYPE")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("rpcType", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.RPCTYPE")
                }
              ],
              initialValue: rpcType
            })(
              <Select>
                {Object.values(RPCTYPE).map((e, i) => {
                  return (
                    <Select.Option key={`${e} ${i}`} value={e}>
                      {e}
                    </Select.Option>
                  );
                })}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.STATE")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("state", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.STATE")
                }
              ],
              initialValue: state
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.STATE")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.EXT")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("ext", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.EXT")
                }
              ],
              initialValue: ext
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.EXT")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.APIOWNER")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("apiOwner", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APIOWNER")
                }
              ],
              initialValue: apiOwner
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIOWNER")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.APIDESC")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("apiDesc", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APIDESC")
                }
              ],
              initialValue: apiDesc
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIDESC")}
              />
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.APISOURCE")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("apiSource", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APISOURCE")
                }
              ],
              initialValue: apiSource
            })(
              <Select>
                {Object.values(API_SOURCE_TYPE).map((e, i) => {
                  return (
                    <Select.Option key={`${e} ${i}`} value={i}>
                      {e}
                    </Select.Option>
                  );
                })}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            label={`${getIntlContent("SHENYU.DOCUMENT.APIDOC.DOCUMENT")}`}
            {...formItemLayout}
          >
            {getFieldDecorator("document", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.DOCUMENT")
                }
              ],
              initialValue: document
            })(
              <Input
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.DOCUMENT")}
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddAndUpdateApiDoc);
