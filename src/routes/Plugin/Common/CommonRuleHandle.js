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
import { Button, Form, Input, Popconfirm, Select, Tooltip } from "antd";
import classnames from "classnames";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { Option } = Select;

const formItemLayout = {
  labelCol: {
    sm: { span: 4 },
  },
  wrapperCol: {
    sm: { span: 20 },
  },
};

export default class CommonRuleHandle extends Component {
  render() {
    const labelWidth = 160;
    const {
      pluginHandleList,
      multiRuleHandle,
      onAddPluginHandle,
      onDeletePluginHandle,
      form,
    } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    return (
      <FormItem
        required={true}
        label={getIntlContent("SHENYU.COMMON.DEAL.CUSTOM")}
        {...formItemLayout}
        className={styles.rootFormItem}
      >
        <FormItem style={{ display: "none" }}>
          {getFieldDecorator("handleType", {
            initialValue: pluginHandleList.length ? "1" : "2",
          })(<Input allowClear />)}
        </FormItem>
        <div
          className={styles.handleWrap}
          style={{
            display: getFieldValue("handleType") === "1" ? "flex" : "none",
            marginTop: 0,
          }}
        >
          <div>
            {pluginHandleList.map((handleList, index) => {
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "row",
                  }}
                >
                  <ul
                    className={classnames({
                      [styles.handleUl]: true,
                      [styles.springUl]: true,
                    })}
                    style={{ width: "100%", padding: 0, marginBottom: "-6px" }}
                  >
                    {handleList.map((item) => {
                      let required = item.required === "1";
                      let defaultValue =
                        item.value === 0 || item.value === false
                          ? item.value
                          : item.value || item.defaultValue;
                      let placeholder = item.placeholder || item.label;
                      let checkRule = item.checkRule;
                      let fieldName = item.field + index;
                      let rules = [];
                      if (required) {
                        rules.push({
                          required: { required },
                          message:
                            getIntlContent("SHENYU.COMMON.PLEASEINPUT") +
                            item.label,
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
                      if (item.dataType === 1) {
                        return (
                          <li key={fieldName}>
                            <Tooltip title={placeholder}>
                              <FormItem>
                                {getFieldDecorator(fieldName, {
                                  rules,
                                  initialValue: defaultValue,
                                })(
                                  <Input
                                    allowClear
                                    addonBefore={
                                      <div style={{ width: labelWidth }}>
                                        {item.label}
                                      </div>
                                    }
                                    placeholder={placeholder}
                                    key={fieldName}
                                  />,
                                )}
                              </FormItem>
                            </Tooltip>
                          </li>
                        );
                      } else if (item.dataType === 3 && item.dictOptions) {
                        return (
                          <li key={fieldName}>
                            <Tooltip title={placeholder}>
                              <FormItem>
                                {getFieldDecorator(fieldName, {
                                  rules,
                                  initialValue:
                                    defaultValue === true
                                      ? "true"
                                      : defaultValue === false
                                        ? "false"
                                        : defaultValue,
                                })(
                                  <Select
                                    placeholder={placeholder}
                                    style={{ width: 260 }}
                                  >
                                    {item.dictOptions.map((option) => {
                                      const optionValue =
                                        option.dictValue === true
                                          ? "true"
                                          : option.dictValue === false
                                            ? "false"
                                            : option.dictValue;
                                      return (
                                        <Option
                                          key={optionValue}
                                          value={optionValue}
                                        >
                                          {option.dictName} ({item.label})
                                        </Option>
                                      );
                                    })}
                                  </Select>,
                                )}
                              </FormItem>
                            </Tooltip>
                          </li>
                        );
                      } else {
                        return (
                          <li key={fieldName}>
                            <Tooltip title={placeholder}>
                              <FormItem>
                                {getFieldDecorator(fieldName, {
                                  rules,
                                  initialValue: defaultValue,
                                })(
                                  <Input
                                    allowClear
                                    addonBefore={
                                      <div style={{ width: labelWidth }}>
                                        {item.label}
                                      </div>
                                    }
                                    placeholder={placeholder}
                                    key={fieldName}
                                  />,
                                )}
                              </FormItem>
                            </Tooltip>
                          </li>
                        );
                      }
                    })}
                  </ul>
                  {multiRuleHandle && (
                    <div style={{ width: 80 }}>
                      <Popconfirm
                        title={getIntlContent("SHENYU.COMMON.DELETE")}
                        placement="bottom"
                        onCancel={(e) => {
                          e.stopPropagation();
                        }}
                        onConfirm={(e) => {
                          e.stopPropagation();
                          onDeletePluginHandle(index);
                        }}
                        okText={getIntlContent("SHENYU.COMMON.SURE")}
                        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                      >
                        <Button type="danger">
                          {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                        </Button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {multiRuleHandle && (
            <div style={{ width: 80, marginLeft: 10 }}>
              <Button onClick={onAddPluginHandle} type="primary">
                {getIntlContent("SHENYU.COMMON.ADD")}
              </Button>
            </div>
          )}
        </div>
        <FormItem
          style={{
            display: getFieldValue("handleType") === "2" ? "block" : "none",
          }}
        >
          {getFieldDecorator("handleJSON", {
            rules: [
              {
                validator(rule, value, callback) {
                  if (
                    getFieldValue("handleType") === "1" ||
                    typeof value !== "string"
                  ) {
                    callback();
                  }
                  if (getFieldValue("handleType") === "2") {
                    try {
                      const obj = JSON.parse(value);
                      if (obj.constructor === Object) {
                        callback();
                      } else {
                        callback(
                          getIntlContent("SHENYU.PLUGIN.RULE.JSON.INVALID"),
                        );
                      }
                    } catch (e) {
                      callback(
                        getIntlContent("SHENYU.PLUGIN.RULE.JSON.INVALID"),
                      );
                    }
                  }
                },
              },
            ],
          })(<Input.TextArea />)}
        </FormItem>
      </FormItem>
    );
  }
}
