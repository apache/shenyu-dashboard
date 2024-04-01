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

import React, { Component, forwardRef, Fragment } from "react";
import {
  Modal,
  Form,
  Switch,
  Input,
  Select,
  Divider,
  InputNumber,
  Button,
} from "antd";
import { connect } from "dva";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Option } = Select;
const FormItem = Form.Item;
const ChooseFile = forwardRef(({ onChange, file }, ref) => {
  const handleFileInput = (e) => {
    onChange(e.target.files[0]);
  };

  return (
    <>
      <Button
        onClick={() => {
          document.getElementById("file").click();
        }}
      >
        Upload
      </Button>{" "}
      {file?.name}
      <input
        ref={ref}
        type="file"
        onChange={handleFileInput}
        style={{ display: "none" }}
        id="file"
      />
    </>
  );
});
@connect(({ global }) => ({
  platform: global.platform,
}))
class AddModal extends Component {
  handleSubmit = (e) => {
    const { form, handleOk, id = "", data } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { name, role, enabled, config, sort, file } = values;
        if (data && data.length > 0) {
          config = {};
          data.forEach((item) => {
            let fieldName = `__${item.field}__`;
            if (values[fieldName]) {
              config[item.field] = values[fieldName];
            }
          });
          config = JSON.stringify(config);
          if (config === "{}") {
            config = "";
          }
        }
        handleOk({ name, role, enabled, config, id, sort, file });
      }
    });
  };

  render() {
    let {
      handleCancel,
      form,
      config,
      name,
      enabled = true,
      role,
      id,
      data,
      sort,
      file,
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
            label={getIntlContent("SHENYU.SYSTEM.ROLE")}
            {...formItemLayout}
          >
            {getFieldDecorator("role", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SYSTEM.SELECTROLE"),
                },
              ],
              initialValue: role,
            })(<Input allowClear maxLength={50} />)}
          </FormItem>
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
            label={getIntlContent("SHENYU.MENU.PLUGIN.JAR")}
          >
            {getFieldDecorator("file", {
              rules: [
                {
                  required: false,
                },
              ],
              initialValue: file,
              valuePropName: "file",
            })(<ChooseFile />)}
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
