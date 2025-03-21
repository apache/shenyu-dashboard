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

import React, { Component, Fragment } from "react";
import { Divider, Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { connect } from "dva";
import ReactJson from "react-json-view";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Option } = Select;
const FormItem = Form.Item;

@connect(({ global }) => ({
  platform: global.platform,
}))
class AddModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      jsonKey: null,
      jsonValue: {},
    };
    this.parseJson();
  }

  parseJson = () => {
    let { config, data } = this.props;
    try {
      const jsonData = data.find((i) => i.dataType === 4);
      if (config) {
        config = JSON.parse(config);
      }
      const fieldName = jsonData?.field;
      this.state.jsonKey = fieldName;
      this.state.jsonValue = config[fieldName] || {};
    } catch (e) {
      this.state.jsonValue = {};
    }
  };

  updateJson = (obj, fieldName) => {
    const { form } = this.props;
    let fieldsValue = form.getFieldsValue();
    this.state.jsonValue = obj.updated_src;
    const value = { [fieldName]: this.state.jsonValue };
    if (!fieldsValue[fieldName]) {
      form.setFields({ [fieldName]: { value } });
    } else {
      form.setFieldsValue(value);
    }
  };

  handleSubmit = (e) => {
    const { form, handleOk, id = "", data } = this.props;
    const { jsonKey, jsonValue } = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { name, enabled, config, sort } = values;
        if (data && data.length > 0) {
          config = {};
          data.forEach((item) => {
            let fieldName = `__${item.field}__`;
            if (values[fieldName]) {
              config[item.field] = values[fieldName];
            }
          });
          if (data.some((i) => i.dataType === 4)) {
            config[jsonKey] = jsonValue;
          }
          config = JSON.stringify(config);
          if (config === "{}") {
            config = "";
          }
        }
        handleOk({ name, enabled, config, id, sort });
      }
    });
  };

  render() {
    const { jsonValue } = this.state;
    let {
      handleCancel,
      form,
      config,
      name,
      enabled = true,
      id,
      data,
      sort,
    } = this.props;
    let disable = id !== undefined;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 7 },
      },
      wrapperCol: {
        sm: { span: 17 },
      },
    };
    if (config) {
      config = JSON.parse(config);
    }
    return (
      <Modal
        width={520}
        centered
        title={getIntlContent("SHENYU.PLUGIN")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SHENYU.PLUGIN")} {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.PLUGIN.SELECT"),
                },
              ],
              initialValue: name,
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.PLUGIN.PLUGIN.NAME")}
                disabled={disable}
              />,
            )}
          </FormItem>
          {data && data.length > 0 && (
            <>
              <Divider>
                {name} {getIntlContent("SHENYU.COMMON.SETTING")}
              </Divider>
              {data.map((eachField, index) => {
                let fieldInitialValue = config
                  ? config[eachField.field]
                  : undefined;
                // Add prefixes to prevent naming conflicts
                let fieldName = `__${eachField.field}__`;
                let dataType = eachField.dataType;
                let required = "";
                let checkRule;
                if (eachField.extObj) {
                  let extObj = JSON.parse(eachField.extObj);
                  required = extObj.required === "0" ? "" : extObj.required;
                  if (!fieldInitialValue) {
                    fieldInitialValue = extObj.defaultValue;
                  }
                  if (extObj.rule) {
                    checkRule = extObj.rule;
                  }
                }
                let rules = [];
                if (required) {
                  rules.push({
                    required: { required },
                    message: getIntlContent("SHENYU.COMMON.PLEASEINPUT"),
                  });
                }
                if (checkRule) {
                  rules.push({
                    // eslint-disable-next-line no-eval
                    pattern: eval(checkRule),
                    message: `${getIntlContent(
                      "SHENYU.PLUGIN.RULE.INVALID",
                    )}:(${checkRule})`,
                  });
                }
                if (dataType === 1) {
                  return (
                    <FormItem
                      label={eachField.label}
                      name={fieldName}
                      {...formItemLayout}
                      key={index}
                    >
                      {getFieldDecorator(fieldName, {
                        rules,
                        initialValue: fieldInitialValue,
                      })(
                        <InputNumber
                          precision={0}
                          placeholder={eachField.label}
                        />,
                      )}
                    </FormItem>
                  );
                } else if (dataType === 3 && eachField.dictOptions) {
                  return (
                    <FormItem
                      label={eachField.label}
                      name={fieldName}
                      {...formItemLayout}
                      key={index}
                    >
                      {getFieldDecorator(fieldName, {
                        rules,
                        initialValue: fieldInitialValue,
                      })(
                        <Select placeholder={eachField.label}>
                          {eachField.dictOptions.map((option) => {
                            return (
                              <Option
                                key={option.dictValue}
                                value={option.dictValue}
                              >
                                {option.dictName} ({eachField.label})
                              </Option>
                            );
                          })}
                        </Select>,
                      )}
                    </FormItem>
                  );
                } else if (dataType === 4) {
                  return (
                    <FormItem
                      label={eachField.label}
                      name={fieldName}
                      {...formItemLayout}
                      key={index}
                    >
                      <ReactJson
                        src={jsonValue}
                        theme="monokai"
                        displayDataTypes={false}
                        name={false}
                        onAdd={(obj) => this.updateJson(obj, fieldName)}
                        onEdit={(obj) => this.updateJson(obj, fieldName)}
                        onDelete={(obj) => this.updateJson(obj, fieldName)}
                        style={{ borderRadius: 4, padding: 16 }}
                      />
                    </FormItem>
                  );
                } else {
                  return (
                    <FormItem
                      label={eachField.label}
                      name={fieldName}
                      {...formItemLayout}
                      key={index}
                    >
                      {getFieldDecorator(fieldName, {
                        rules,
                        initialValue: fieldInitialValue,
                      })(<Input allowClear placeholder={eachField.label} />)}
                    </FormItem>
                  );
                }
              })}
              <Divider />
            </>
          )}
          <FormItem
            label={getIntlContent("SHENYU.PLUGIN.SORT")}
            {...formItemLayout}
          >
            {getFieldDecorator("sort", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.PLUGIN.INPUTSORT"),
                },
              ],
              initialValue: sort,
            })(<InputNumber precision={0} style={{ width: "100%" }} />)}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={getIntlContent("SHENYU.SYSTEM.STATUS")}
          >
            {getFieldDecorator("enabled", {
              initialValue: enabled,
              valuePropName: "checked",
            })(<Switch />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
