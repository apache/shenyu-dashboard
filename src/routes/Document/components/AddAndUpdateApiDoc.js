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
/* eslint-disable radix */
/* eslint-disable react/static-property-placement */
import { Modal, Form, Input, Select, message, Radio } from "antd";
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactJson from "react-json-view";
import { Method, RPCTYPE, API_SOURCE_TYPE, STATE_TYPE } from "./globalData";
import { getIntlContent } from "../../../utils/IntlUtils";
import { addApi, updateApi } from "../../../services/api";

class AddAndUpdateApiDoc extends Component {
  static defaultProps = {
    form: PropTypes.object,
    visible: PropTypes.bool,
    formLoaded: PropTypes.func,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
  };

  componentDidMount() {
    const { form, formLoaded } = this.props;
    formLoaded?.(form);
  }

  handleSubmit = () => {
    const { form, onOk, document, ext } = this.props;
    form.validateFieldsAndScroll(async (err, values) => {
      function isJsonStr(str) {
        try {
          let obj = JSON.parse(str);
          return !!(typeof obj === "object" && obj);
        } catch (e) {
          return false;
        }
      }
      if (!err) {
        const { id } = values;
        let res = {};
        values.state = parseInt(values.state);
        values.apiSource = parseInt(values.apiSource);
        values.httpMethod = parseInt(values.httpMethod);
        values.document = document;
        values.ext = ext;
        // validate ext
        if (!isJsonStr(values.ext)) {
          message.error(getIntlContent("SHENYU.DOCUMENT.APIDOC.EXT.INFO"));
          return;
        }
        if (!id) {
          res = await addApi({
            ...values,
          });
        } else {
          res = await updateApi({
            ...values,
          });
        }

        if (res.code !== 200) {
          message.error(res.message);
        } else {
          message.success(res.message);
          onOk?.(values);
        }
      }
    });
  };

  render() {
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
      ext = "{}",
      apiOwner = "",
      apiDesc = "",
      apiSource = "",
      document = "{}",
      visible = false,
      updateDocument = () => {},
      updateExt = () => {},
    } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
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
        width="100%"
        title="Api"
      >
        <Form className="login-form">
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.CONTEXTPATH")}
            {...formItemLayout}
          >
            {getFieldDecorator("contextPath", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.CONTEXTPATH"),
                },
              ],
              initialValue: contextPath,
            })(
              <Input
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.DOCUMENT.APIDOC.CONTEXTPATH",
                )}
              />,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIPATH")}
            {...formItemLayout}
          >
            {getFieldDecorator("apiPath", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APIPATH"),
                },
              ],
              initialValue: apiPath,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIPATH")}
              />,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.HTTPMETHOD")}
            {...formItemLayout}
          >
            {getFieldDecorator("httpMethod", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.HTTPMETHOD"),
                },
              ],
              initialValue: httpMethod,
            })(
              <Select>
                {Object.values(Method).map((e, i) => {
                  return (
                    <Select.Option key={`${e} ${i}`} value={i}>
                      {e}
                    </Select.Option>
                  );
                })}
              </Select>,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.CONSUME")}
            {...formItemLayout}
          >
            {getFieldDecorator("consume", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.CONSUME"),
                },
              ],
              initialValue: consume,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.CONSUME")}
              />,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.PRODUCE")}
            {...formItemLayout}
          >
            {getFieldDecorator("produce", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.PRODUCE"),
                },
              ],
              initialValue: produce,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.PRODUCE")}
              />,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.VERSION")}
            {...formItemLayout}
          >
            {getFieldDecorator("version", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.VERSION"),
                },
              ],
              initialValue: version,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.VERSION")}
              />,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.RPCTYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator("rpcType", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.RPCTYPE"),
                },
              ],
              initialValue: rpcType,
            })(
              <Select>
                {RPCTYPE.map((e, i) => {
                  return (
                    <Select.Option key={`${e} ${i}`} value={e}>
                      {e}
                    </Select.Option>
                  );
                })}
              </Select>,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.STATE")}
            {...formItemLayout}
          >
            {getFieldDecorator("state", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.STATE"),
                },
              ],
              initialValue: state,
            })(
              <Radio.Group buttonStyle="solid">
                {STATE_TYPE.map((e, i) => {
                  return (
                    <Radio.Button
                      key={`${e} ${i}`}
                      value={i}
                      disabled={!getFieldValue("id") && e === "offline"}
                    >
                      {e}
                    </Radio.Button>
                  );
                })}
              </Radio.Group>,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.EXT")}
            {...formItemLayout}
          >
            <ReactJson
              src={JSON.parse(ext)}
              theme="monokai"
              displayDataTypes={false}
              name={false}
              onAdd={updateExt}
              onEdit={updateExt}
              onDelete={updateExt}
              style={{ borderRadius: 4, padding: 16, overflow: "auto" }}
            />
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIOWNER")}
            {...formItemLayout}
          >
            {getFieldDecorator("apiOwner", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APIOWNER"),
                },
              ],
              initialValue: apiOwner,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIOWNER")}
              />,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIDESC")}
            {...formItemLayout}
          >
            {getFieldDecorator("apiDesc", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APIDESC"),
                },
              ],
              initialValue: apiDesc,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.DOCUMENT.APIDOC.APIDESC")}
              />,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.APISOURCE")}
            {...formItemLayout}
          >
            {getFieldDecorator("apiSource", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.DOCUMENT.APIDOC.APISOURCE"),
                },
              ],
              initialValue: apiSource,
            })(
              <Select>
                {API_SOURCE_TYPE.map((e, i) => {
                  return (
                    <Select.Option key={`${e} ${i}`} value={i}>
                      {e}
                    </Select.Option>
                  );
                })}
              </Select>,
            )}
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.DOCUMENT.APIDOC.DOCUMENT")}
            {...formItemLayout}
          >
            <ReactJson
              src={JSON.parse(document)}
              theme="monokai"
              displayDataTypes={false}
              name={false}
              onAdd={updateDocument}
              onEdit={updateDocument}
              onDelete={updateDocument}
              style={{ borderRadius: 4, padding: 16, overflow: "auto" }}
            />
          </Form.Item>

          <Form.Item hidden>
            {getFieldDecorator("tagIds")(<Input allowClear />)}
          </Form.Item>

          <Form.Item hidden>
            {getFieldDecorator("id")(<Input allowClear />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddAndUpdateApiDoc);
