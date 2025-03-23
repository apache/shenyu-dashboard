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
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Switch,
  TimePicker,
} from "antd";
import { connect } from "dva";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";
import CommonRuleHandle from "./CommonRuleHandle";
import ComposeRuleHandle from "./ComposeRuleHandle";
import PluginRuleHandle from "../PluginRuleHandle";
import RuleCopy from "./RuleCopy";
import {
  formatDate,
  formatDateString,
  formatTime,
  formatTimeString,
} from "../../../utils/utils";

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ pluginHandle, shenyuDict, global }) => ({
  pluginHandle,
  shenyuDict,
  currentNamespaceId: global.currentNamespaceId,
}))
class AddModal extends Component {
  constructor(props) {
    super(props);

    const customPluginNames = Object.keys(PluginRuleHandle);
    this.state = {
      customRulePage: customPluginNames.includes(props.pluginName),

      visible: false,
    };

    this.initRuleCondition(props);
    this.initDics();
  }

  componentDidMount() {
    const {
      dispatch,
      pluginId,
      handle,
      multiRuleHandle,
      form: { setFieldsValue },
      currentNamespaceId,
    } = this.props;
    this.setState({ pluginHandleList: [] });
    let type = 2;
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload: {
        pluginId,
        type,
        handle,
        isHandleArray: multiRuleHandle,
        namespaceId: currentNamespaceId,
        callBack: (pluginHandles, useJSON) => {
          this.setState({ pluginHandleList: pluginHandles }, () => {
            if (useJSON) {
              setFieldsValue({
                handleType: "2",
                handleJSON: handle,
              });
            }
          });
        },
      },
    });
  }

  initRuleCondition = (props) => {
    const ruleConditions = props.ruleConditions || [
      {
        paramType: "uri",
        operator: "pathPattern",
        paramName: "/",
        paramValue: "",
      },
    ];
    ruleConditions.forEach((item, index) => {
      const { paramType } = item;
      let key = `paramTypeValueEn${index}`;
      if (paramType === "uri" || paramType === "host" || paramType === "ip") {
        this.state[key] = true;
        ruleConditions[index].paramName = "/";
      } else {
        this.state[key] = false;
      }
    });
    this.state.ruleConditions = ruleConditions;
  };

  initDics = () => {
    this.initDic("operator");
    this.initDic("matchMode");
    this.initDic("paramType");
  };

  initDic = (type) => {
    const { dispatch } = this.props;
    dispatch({
      type: "shenyuDict/fetchByType",
      payload: {
        type,
        callBack: (dics) => {
          this.state[`${type}Dics`] = dics;
        },
      },
    });
  };

  checkConditions = () => {
    let { ruleConditions } = this.state;
    let result = true;
    if (ruleConditions) {
      ruleConditions.forEach((item, index) => {
        const { paramType, operator, paramName, paramValue } = item;
        if (
          !paramType ||
          !operator ||
          (operator !== "isBlank" && !paramValue)
        ) {
          message.destroy();
          message.error(`Line ${index + 1} condition is incomplete`);
          result = false;
        }
        if (paramType === "uri" || paramType === "host" || paramType === "ip") {
          // aaa
        } else {
          // eslint-disable-next-line no-lonely-if
          if (!paramName) {
            message.destroy();
            message.error(`Line ${index + 1} condition is incomplete`);
            result = false;
          }
        }
      });
    } else {
      message.destroy();
      message.error(`Incomplete condition`);
      result = false;
    }

    return result;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { form, handleOk, multiRuleHandle } = this.props;
    const { ruleConditions, pluginHandleList } = this.state;

    form.validateFieldsAndScroll((err, values) => {
      const {
        name,
        matchMode,
        loged,
        enabled,
        matchRestful,
        handleType,
        handleJSON,
      } = values;
      if (!err) {
        const submit = this.checkConditions();
        if (submit) {
          let handle;

          // commonRule
          switch (handleType) {
            case "1":
              handle = [];
              pluginHandleList.forEach((handleList, index) => {
                handle[index] = {};
                handleList.forEach((item) => {
                  handle[index][item.field] = values[item.field + index];
                });
              });
              handle = multiRuleHandle
                ? JSON.stringify(handle)
                : JSON.stringify(handle[0]);
              break;
            case "2":
              handle = handleJSON;
              break;
            default:
              break;
          }
          if (this.handleComponentRef) {
            // customizationRule
            const customHandle = this.handleComponentRef.getData(values);
            handle = JSON.stringify({
              ...JSON.parse(handle ?? "{}"),
              ...JSON.parse(customHandle),
            });
          }

          handleOk({
            name,
            matchMode,
            handle,
            loged,
            enabled,
            matchRestful,
            sort: Number(values.sort),
            ruleConditions,
          });
        }
      }
    });
  };

  handleAdd = () => {
    let { ruleConditions } = this.state;
    ruleConditions.push({
      paramType: "uri",
      operator: "pathPattern",
      paramName: "/",
      paramValue: "",
    });

    this.setState({ ruleConditions }, () => {
      let len = ruleConditions.length || 0;
      let key = `paramTypeValueEn${len - 1}`;
      this.setState({ [key]: true });
    });
  };

  handleDelete = (index) => {
    let { ruleConditions } = this.state;
    if (ruleConditions && ruleConditions.length > 1) {
      ruleConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("At least one condition");
    }
    this.setState({ ruleConditions });
  };

  handleAddHandle = () => {
    let { pluginHandleList } = this.state;
    let pluginHandle = pluginHandleList[0];
    let toAddPluginHandle = pluginHandle.map((e) => {
      return { ...e, value: null };
    });
    pluginHandleList.push(toAddPluginHandle);
    this.setState({
      pluginHandleList,
    });
  };

  handleDeleteHandle = (index) => {
    let { pluginHandleList } = this.state;
    if (pluginHandleList.length === 1) {
      message.destroy();
      message.error(getIntlContent("SHENYU.PLUGIN.HANDLE.TIP"));
    } else {
      pluginHandleList.splice(index, 1);
      this.setState({ pluginHandleList });
    }
  };

  conditionChange = (index, name, value) => {
    let { ruleConditions } = this.state;
    ruleConditions[index][name] = value;
    if (name === "paramType") {
      let key = `paramTypeValueEn${index}`;
      if (
        value === "uri" ||
        value === "host" ||
        value === "ip" ||
        value === "req_method" ||
        value === "domain"
      ) {
        this.setState({ [key]: true });
        ruleConditions[index].paramName = "/";
      } else {
        this.setState({ [key]: false });
      }
      if (value === "post") {
        ruleConditions[index].paramName = "filedName";
      }
      if (value === "query") {
        ruleConditions[index].paramName = "paramName";
      }
      if (value === "header") {
        ruleConditions[index].paramName = "headerName";
      }
      if (value === "cookie") {
        ruleConditions[index].paramName = "cookieName";
      }
      if (value === "uri") {
        ruleConditions[index].operator = "pathPattern";
      } else if (value === "req_method") {
        ruleConditions[index].operator = "=";
      } else {
        ruleConditions[index].operator = "";
      }
    }

    this.setState({ ruleConditions });
  };

  handleCopyData = (copyData) => {
    if (!copyData) {
      this.setState({ visible: false });
      return;
    }
    const { form } = this.props;
    const { ruleConditions, name, matchMode, loged, enabled, sort } = copyData;
    const formData = {
      name,
      matchMode: matchMode.toString(),
      loged,
      enabled,
      sort,
    };
    this.initRuleCondition({
      ruleConditions: ruleConditions.map((v) => {
        const {
          id: rawId,
          selectorId,
          dateCreated,
          dateUpdated,
          ...condition
        } = v;
        return condition;
      }),
    });
    form.setFieldsValue(formData);
    this.setState({ visible: false });
  };

  renderOperatorOptions = (operators, paramType) => {
    if (operators && operators instanceof Array) {
      let operatorsFil = operators.map((operate) => {
        return (
          <Option key={operate.dictValue} value={operate.dictValue}>
            {operate.dictName}
          </Option>
        );
      });
      if (paramType !== "uri") {
        operatorsFil = operatorsFil.filter((operate) => {
          return operate.key !== "pathPattern" ? operate : "";
        });
      }
      if (
        paramType !== "post" &&
        paramType !== "query" &&
        paramType !== "header" &&
        paramType !== "cookie"
      ) {
        operatorsFil = operatorsFil.filter((operate) => {
          return operate.key !== "isBlank" ? operate : "";
        });
      }
      if (
        paramType === "uri" ||
        paramType === "host" ||
        paramType === "ip" ||
        paramType === "cookie" ||
        paramType === "domain"
      ) {
        operatorsFil = operatorsFil.filter((operate) => {
          return operate.key !== "TimeBefore" && operate.key !== "TimeAfter"
            ? operate
            : "";
        });
      }
      if (paramType === "req_method") {
        operatorsFil = operatorsFil.filter((operate) => {
          return operate.key === "=" ? operate : "";
        });
      }
      return operatorsFil;
    }

    return "";
  };

  getParamValueInput = (item, index) => {
    if (item.operator === "TimeBefore" || item.operator === "TimeAfter") {
      let date = new Date();
      const defaultDay = date
        .getFullYear()
        .toString()
        .concat("-")
        .concat(date.getMonth() + 1)
        .concat("-")
        .concat(date.getDate());
      return (
        <Input.Group compact style={{ top: -2 }}>
          <DatePicker
            style={{ width: "51%" }}
            onChange={(e) => {
              let day = e
                ? e
                    .eraYear()
                    .toString()
                    .concat("-")
                    .concat(e.month() + 1)
                    .concat("-")
                    .concat(e.date())
                : defaultDay;
              this.conditionChange(
                index,
                "paramValue",
                `${formatDateString(day)} ${formatTimeString(item.paramValue)}`,
              );
            }}
            value={formatDate(item.paramValue)}
          />
          <TimePicker
            style={{ width: "49%" }}
            onChange={(e) => {
              let time = e
                ? ""
                    .concat(" ")
                    .concat(e.hours())
                    .concat(":")
                    .concat(e.minutes())
                    .concat(":")
                    .concat(e.seconds())
                : "";
              this.conditionChange(
                index,
                "paramValue",
                `${formatDateString(item.paramValue)} ${formatTimeString(time)}`,
              );
            }}
            value={formatTime(item.paramValue)}
          />
        </Input.Group>
      );
    } else {
      return (
        <Input
          allowClear
          onChange={(e) => {
            this.conditionChange(index, "paramValue", e.target.value);
          }}
          value={item.paramValue}
        />
      );
    }
  };

  render() {
    let {
      onCancel,
      form,
      name = "",
      matchMode = "",
      loged = true,
      enabled = true,
      matchRestful = false,
      sort = "",
      multiRuleHandle,
      pluginName,
      handle,
    } = this.props;
    const {
      ruleConditions,
      pluginHandleList,
      operatorDics,
      matchModeDics,
      paramTypeDics,
      customRulePage,
      visible,
    } = this.state;

    let RuleHandleComponent;
    if (customRulePage) {
      RuleHandleComponent = ComposeRuleHandle;
    } else if (pluginHandleList) {
      RuleHandleComponent = CommonRuleHandle;
    }

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 4 },
      },
      wrapperCol: {
        sm: { span: 20 },
      },
    };
    const formCheckLayout = {
      labelCol: {
        sm: { span: 18 },
      },
      wrapperCol: {
        sm: { span: 4 },
      },
    };
    return (
      <Modal
        width={1000}
        centered
        title={getIntlContent("SHENYU.RULE.NAME")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.COMMON.INPUTNAME"),
                },
              ],
              initialValue: name,
            })(
              <Input
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME",
                )}
                addonAfter={
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      this.setState({ visible: true });
                    }}
                  >
                    {getIntlContent("SHENYU.PLUGIN.SEARCH.RULE.COPY")}
                  </Button>
                }
              />,
            )}
          </FormItem>
          <RuleCopy
            visible={visible}
            onOk={this.handleCopyData}
            onCancel={() => {
              this.setState({ visible: false });
            }}
          />
          <FormItem
            label={getIntlContent("SHENYU.COMMON.MATCHTYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator("matchMode", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE"),
                },
              ],
              initialValue: `${matchMode}`,
            })(
              <Select>
                {matchModeDics &&
                  matchModeDics.map((item) => {
                    return (
                      <Option key={item.dictValue} value={item.dictValue}>
                        {item.dictName}
                      </Option>
                    );
                  })}
              </Select>,
            )}
          </FormItem>
          <div className={styles.condition}>
            <FormItem
              label={getIntlContent("SHENYU.COMMON.CONDITION")}
              required
              {...formItemLayout}
            >
              {ruleConditions.map((item, index) => {
                return (
                  <Row key={index} gutter={8}>
                    <Col span={5}>
                      <Select
                        onChange={(value) => {
                          this.conditionChange(index, "paramType", value);
                        }}
                        value={item.paramType}
                      >
                        {paramTypeDics &&
                          paramTypeDics.map((type) => {
                            return (
                              <Option
                                key={type.dictValue}
                                value={type.dictValue}
                              >
                                {type.dictName}
                              </Option>
                            );
                          })}
                      </Select>
                    </Col>
                    <Col
                      span={4}
                      style={{
                        display: this.state[`paramTypeValueEn${index}`]
                          ? "none"
                          : "block",
                      }}
                    >
                      <Input
                        allowClear
                        onChange={(e) => {
                          this.conditionChange(
                            index,
                            "paramName",
                            e.target.value,
                          );
                        }}
                        placeholder={item.paramName}
                      />
                    </Col>
                    <Col span={4}>
                      <Select
                        onChange={(value) => {
                          this.conditionChange(index, "operator", value);
                        }}
                        value={item.operator}
                      >
                        {this.renderOperatorOptions(
                          operatorDics,
                          item.paramType,
                        )}
                      </Select>
                    </Col>
                    <Col
                      span={7}
                      style={{
                        display: item.operator === "isBlank" ? "none" : "block",
                      }}
                    >
                      {this.getParamValueInput(item, index)}
                    </Col>
                    <Col span={4}>
                      <Button
                        type="danger"
                        onClick={() => {
                          this.handleDelete(index);
                        }}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                    </Col>
                  </Row>
                );
              })}
            </FormItem>
            <FormItem label={" "} colon={false} {...formItemLayout}>
              <Button
                className={styles.addButton}
                onClick={this.handleAdd}
                type="primary"
              >
                {getIntlContent("SHENYU.COMMON.ADD")}{" "}
                {getIntlContent("SHENYU.COMMON.CONDITION")}
              </Button>
            </FormItem>
          </div>
          {RuleHandleComponent && (
            <RuleHandleComponent
              onRef={(handleComponentRef) => {
                this.handleComponentRef = handleComponentRef;
              }}
              pluginName={pluginName}
              onAddPluginHandle={this.handleAddHandle}
              onDeletePluginHandle={this.handleDeleteHandle}
              form={form}
              pluginHandleList={pluginHandleList}
              handle={handle}
              multiRuleHandle={multiRuleHandle}
            />
          )}
          <FormItem
            label={getIntlContent("SHENYU.SELECTOR.EXEORDER")}
            {...formItemLayout}
          >
            {getFieldDecorator("sort", {
              initialValue: sort,
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER"),
                },
                {
                  pattern: /^([1-9][0-9]{0,2}|1000)$/,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER"),
                },
              ],
            })(
              <Input
                allowClear
                placeholder={getIntlContent("SHENYU.SELECTOR.INPUTORDER")}
              />,
            )}
          </FormItem>
          <FormItem label={" "} colon={false} {...formItemLayout}>
            <div className={styles.layout}>
              <FormItem
                style={{ margin: "0 30px" }}
                {...formCheckLayout}
                label={getIntlContent("SHENYU.SELECTOR.PRINTLOG")}
              >
                {getFieldDecorator("loged", {
                  initialValue: loged,
                  valuePropName: "checked",
                  rules: [{ required: true }],
                })(<Switch />)}
              </FormItem>
              <FormItem
                {...formCheckLayout}
                label={getIntlContent("SHENYU.SELECTOR.WHETHEROPEN")}
              >
                {getFieldDecorator("enabled", {
                  initialValue: enabled,
                  valuePropName: "checked",
                  rules: [{ required: true }],
                })(<Switch />)}
              </FormItem>
              <FormItem
                style={{ margin: "0 30px" }}
                {...formCheckLayout}
                label={getIntlContent("SHENYU.SELECTOR.MATCHRESTFUL")}
              >
                {getFieldDecorator("matchRestful", {
                  initialValue: matchRestful,
                  valuePropName: "checked",
                  rules: [{ required: true }],
                })(<Switch />)}
              </FormItem>
            </div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
