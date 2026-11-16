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
import Button from "@douyinfe/semi-ui/lib/es/button";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import classnames from "classnames";
import Form from "../../../components/ui/Form";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";
import { checkRulePattern } from "../../../utils/regExpRule";

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

export const isValidHandleJSON = (handleType, value) => {
  if (handleType !== "2") {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed !== null && parsed.constructor === Object;
  } catch (e) {
    return false;
  }
};

export const validateHandleJSON = (
  handleType,
  value,
  callback,
  invalidMessage,
) => {
  callback(isValidHandleJSON(handleType, value) ? undefined : invalidMessage);
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
                      const checkPattern = checkRulePattern(checkRule);
                      if (checkPattern) {
                        rules.push({
                          pattern: checkPattern,
                          message: `${getIntlContent(
                            "SHENYU.PLUGIN.RULE.INVALID",
                          )}:(${checkRule})`,
                        });
                      }
                      if (item.dataType === 1) {
                        return (
                          <li key={fieldName}>
                            <Tooltip content={placeholder}>
                              <div>
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
                              </div>
                            </Tooltip>
                          </li>
                        );
                      } else if (item.dataType === 3 && item.dictOptions) {
                        return (
                          <li key={fieldName}>
                            <Tooltip content={placeholder}>
                              <div>
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
                              </div>
                            </Tooltip>
                          </li>
                        );
                      } else {
                        return (
                          <li key={fieldName}>
                            <Tooltip content={placeholder}>
                              <div>
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
                              </div>
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
                        position="bottom"
                        onCancel={(e) => {
                          e?.stopPropagation();
                        }}
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          onDeletePluginHandle(index);
                        }}
                        okText={getIntlContent("SHENYU.COMMON.SURE")}
                        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                      >
                        <Button type="danger" htmlType="button">
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
                  validateHandleJSON(
                    getFieldValue("handleType"),
                    value,
                    callback,
                    getIntlContent("SHENYU.PLUGIN.RULE.JSON.INVALID"),
                  );
                },
              },
            ],
          })(<Input.TextArea />)}
        </FormItem>
      </FormItem>
    );
  }
}
