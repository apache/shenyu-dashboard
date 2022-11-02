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
import {
  Modal,
  Form,
  Select,
  Input,
  Switch,
  Button,
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Card,
  Icon,
  InputNumber,
  DatePicker,
  TimePicker
} from "antd";
import { connect } from "dva";
import classnames from "classnames";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";
import SelectorCopy from "./SelectorCopy";

const { Item } = Form;
const { Option } = Select;

const formItemLayout = {
  labelCol: { sm: { span: 3 } },
  wrapperCol: { sm: { span: 21 } }
};
const formCheckLayout = {
  labelCol: { sm: { span: 18 } },
  wrapperCol: { sm: { span: 4 } }
};

let id = 0;

@connect(({ pluginHandle, global, shenyuDict }) => ({
  pluginHandle,
  platform: global.platform,
  shenyuDict
}))
class AddModal extends Component {
  constructor(props) {
    super(props);
    const { handle, pluginId } = props;
    let selectValue = `${props.type}` || null;
    let data = {};
    if (handle) {
      try {
        data = JSON.parse(handle);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }

    const { divideUpstreams = [], gray = false, serviceId = "" } = data;

    if (pluginId === "8") {
      id = divideUpstreams.length;
    }

    this.state = {
      selectValue,

      gray,
      serviceId,
      divideUpstreams,

      visible: false
    };

    this.initSelectorCondition(props);
    this.initDics();
  }

  componentWillMount() {
    const { dispatch, pluginId, handle, multiSelectorHandle } = this.props;
    this.setState({ pluginHandleList: [] });
    let type = 1;
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload: {
        pluginId,
        type,
        handle,
        isHandleArray: multiSelectorHandle,
        callBack: pluginHandles => {
          this.setPluginHandleList(pluginHandles);
        }
      }
    });
  }

  initSelectorCondition = props => {
    const selectorConditions = props.selectorConditions || [
      {
        paramType: "uri",
        operator: "pathPattern",
        paramName: "/",
        paramValue: ""
      }
    ];
    selectorConditions.forEach((item, index) => {
      const { paramType } = item;
      let key = `paramTypeValueEn${index}`;
      if (paramType === "uri" || paramType === "host" || paramType === "ip" || paramType === "req_method" || paramType === "domain") {
        this.state[key] = true;
        selectorConditions[index].paramName = "/";
      } else {
        this.state[key] = false;
      }
    });
    this.state.selectorConditions = selectorConditions;
  };

  initDics = () => {
    this.initDic("operator");
    this.initDic("matchMode");
    this.initDic("paramType");
  };

  initDic = type => {
    const { dispatch } = this.props;
    dispatch({
      type: "shenyuDict/fetchByType",
      payload: {
        type,
        callBack: dics => {
          this.state[`${type}Dics`] = dics;
        }
      }
    });
  };

  setPluginHandleList = pluginHandles => {
    this.setState({ pluginHandleList: pluginHandles });
  };

  checkConditions = selectorConditions => {
    let result = true;
    if (selectorConditions) {
      selectorConditions.forEach((item, index) => {
        const { paramType, operator, paramName, paramValue } = item;
        if (!paramType || !operator || !paramValue) {
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

  handleSubmit = e => {
    e.preventDefault();
    const { form, handleOk, multiSelectorHandle, pluginId } = this.props;
    const { selectorConditions, selectValue, pluginHandleList } = this.state;
    let handle = [];

    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const mySubmit =
          selectValue !== "0" && this.checkConditions(selectorConditions);
        if (mySubmit || selectValue === "0") {
          pluginHandleList.forEach((handleList, index) => {
            handle[index] = {};
            handleList.forEach(item => {
              if (pluginId === "8") {
                const { keys, divideUpstreams } = values;
                const data = {
                  [item.field]: values[item.field],
                  gray: values.gray
                };

                if (Array.isArray(divideUpstreams) && divideUpstreams.length) {
                  data.divideUpstreams = keys.map(key => divideUpstreams[key]);
                }
                handle[index] = data;
                delete values[item.field];
                delete values.divideUpstreams;
                delete values.gray;
                delete values.key;
              } else {
                handle[index][item.field] = values[item.field + index];
                delete values[item.field + index];
              }
            });
          });
          handleOk({
            ...values,
            handle: multiSelectorHandle
              ? JSON.stringify(handle)
              : JSON.stringify(handle[0]),
            sort: Number(values.sort),
            selectorConditions
          });
        }
      }
    });
  };

  handleAdd = () => {
    let { selectorConditions } = this.state;
    selectorConditions.push({
      paramType: "uri",
      operator: "pathPattern",
      paramName: "/",
      paramValue: ""
    });
    this.setState({ selectorConditions }, () => {
      let len = selectorConditions.length || 0;
      let key = `paramTypeValueEn${len - 1}`;

      this.setState({ [key]: true });
    });
  };

  handleDelete = index => {
    let { selectorConditions } = this.state;
    if (selectorConditions && selectorConditions.length > 1) {
      selectorConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("At least one condition");
    }
    this.setState({ selectorConditions });
  };

  handleAddHandle = () => {
    let { pluginHandleList } = this.state;
    let pluginHandle = pluginHandleList[0];
    let toAddPluginHandle = pluginHandle.map(e => {
      return { ...e, value: null };
    });
    pluginHandleList.push(toAddPluginHandle);
    this.setState({
      pluginHandleList
    });
  };

  handleDeleteHandle = index => {
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
    let { selectorConditions } = this.state;
    selectorConditions[index][name] = value;

    if (name === "paramType") {
      let key = `paramTypeValueEn${index}`;
      if (value === "uri" || value === "host" || value === "ip" || value === "req_method" || value === "domain") {
        this.setState({ [key]: true });
        selectorConditions[index].paramName = "/";
      } else {
        this.setState({ [key]: false });
      }
      if (value === "post") {
        selectorConditions[index].paramName = "filedName";
      }
      if (value === "query") {
        selectorConditions[index].paramName = "paramName";
      }
      if (value === "header") {
        selectorConditions[index].paramName = "headerName";
      }
      if (value === "cookie") {
        selectorConditions[index].paramName = "cookieName";
      }
      if (value === "uri") {
        selectorConditions[index].operator = "pathPattern";
      }
      else if (value === "req_method") {
        selectorConditions[index].operator = "=";
      }
      else {
        selectorConditions[index].operator = "";
      }
    }

    this.setState({ selectorConditions });
  };

  getSelectValue = value => {
    this.setState({
      selectValue: value
    });
  };

  renderPluginHandler = () => {
    const { pluginHandleList, divideUpstreams, gray, serviceId } = this.state;
    const {
      form: { getFieldDecorator, getFieldValue, setFieldsValue },
      multiSelectorHandle,
      pluginId
    } = this.props;
    const labelWidth = 75;

    if (pluginId === "8") {
      getFieldDecorator("keys", {
        initialValue: Array.from({
          length: divideUpstreams.length
        }).map((_, i) => i)
      });
      const keys = getFieldValue("keys");
      const Rule = keys.map((key, index) => (
        <Item
          required
          key={key}
          {...(index === 0
            ? { labelCol: { span: 3 }, wrapperCol: { span: 21 } }
            : { wrapperCol: { span: 21, offset: 3 } })}
          label={index === 0 ? "divideUpstreams" : ""}
        >
          <Card>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Row gutter={8}>
                <Col span={8}>
                  <Item label="protocol" wrapperCol={{ span: 16 }}>
                    {getFieldDecorator(`divideUpstreams[${key}].protocol`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].protocol
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "protocol is required"
                        }
                      ]
                    })(<Input />)}
                  </Item>
                </Col>
                <Col span={16}>
                  <Item label="upstreamUrl" wrapperCol={{ span: 19 }}>
                    {getFieldDecorator(`divideUpstreams[${key}].upstreamUrl`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].upstreamUrl
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "upstreamUrl is required"
                        }
                      ]
                    })(<Input />)}
                  </Item>
                </Col>
                <Col span={6}>
                  <Item label="weight" wrapperCol={{ span: 15 }}>
                    {getFieldDecorator(`divideUpstreams[${key}].weight`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].weight
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "weight is required"
                        }
                      ]
                    })(
                      <InputNumber
                        min={0}
                        max={100}
                        style={{ width: "100%" }}
                      />
                    )}
                  </Item>
                </Col>

                <Col span={4}>
                  <Item label="status" wrapperCol={{ span: 11 }}>
                    {getFieldDecorator(`divideUpstreams[${key}].status`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].status
                        : false,
                      valuePropName: "checked",
                      rules: [
                        {
                          required: true,
                          message: "status is required"
                        }
                      ]
                    })(<Switch />)}
                  </Item>
                </Col>

                <Col span={8}>
                  <Item label="timestamp" wrapperCol={{ span: 15 }}>
                    {getFieldDecorator(`divideUpstreams[${key}].timestamp`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].timestamp
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "timestamp is required"
                        }
                      ]
                    })(<InputNumber style={{ width: "100%" }} />)}
                  </Item>
                </Col>

                <Col span={6}>
                  <Item label="warmup" wrapperCol={{ span: 14 }}>
                    {getFieldDecorator(`divideUpstreams[${key}].warmup`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].warmup
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "warmup is required"
                        }
                      ]
                    })(<InputNumber style={{ width: "100%" }} />)}
                  </Item>
                </Col>
              </Row>
              <div style={{ width: 64, textAlign: "right" }}>
                <Icon
                  onClick={() => {
                    setFieldsValue({
                      keys: keys.filter(k => k !== key)
                    });
                  }}
                  type="minus-circle-o"
                  style={{
                    fontSize: 18,
                    color: "#ff0000",
                    cursor: "pointer"
                  }}
                />
              </div>
            </div>
          </Card>
        </Item>
      ));

      return (
        <Row gutter={16} key="8">
          <Col span={10}>
            <Item label="serviceId" wrapperCol={{ span: 16 }}>
              {getFieldDecorator("serviceId", {
                initialValue: serviceId,
                rules: [
                  {
                    required: true
                  }
                ]
              })(<Input placeholder="serviceId" />)}
            </Item>
          </Col>
          <Col span={8}>
            <Item label="gray" wrapperCol={{ span: 16 }}>
              {getFieldDecorator("gray", {
                valuePropName: "checked",
                initialValue: gray,
                rules: [
                  {
                    required: true
                  }
                ]
              })(<Switch />)}
            </Item>
          </Col>
          <Col span={24}>
            {Rule}
            <Item wrapperCol={{ span: 16, offset: 3 }}>
              <Button
                type="dashed"
                onClick={() => {
                  const keysData = getFieldValue("keys");
                  // eslint-disable-next-line no-plusplus
                  const nextKeys = keysData.concat(id++);
                  setFieldsValue({
                    keys: nextKeys
                  });
                }}
              >
                <Icon type="plus" /> Add divide upstream
              </Button>
            </Item>
          </Col>
        </Row>
      );
    }

    if (Array.isArray(pluginHandleList) && pluginHandleList.length) {
      return (
        <div className={styles.handleWrap}>
          <div className={styles.header}>
            <h3 style={{ width: 100 }}>
              {getIntlContent("SHENYU.COMMON.DEAL")}:{" "}
            </h3>
          </div>
          <div>
            {pluginHandleList.map((handleList, index) => {
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "row"
                  }}
                >
                  <ul
                    className={classnames({
                      [styles.handleUl]: true,
                      [styles.handleSelectorUl]: true,
                      [styles.springUl]: true
                    })}
                    style={{ width: "100%" }}
                  >
                    {handleList &&
                      handleList.map(item => {
                        let required = item.required === "1";
                        let defaultValue =
                          item.value === 0 || item.value === false
                            ? item.value
                            : item.value ||
                            (item.defaultValue === "true"
                              ? true
                              : item.defaultValue === "false"
                                ? false
                                : item.defaultValue);
                        let placeholder = item.placeholder || item.label;
                        let checkRule = item.checkRule;
                        let fieldName = item.field + index;
                        let rules = [];
                        if (required) {
                          rules.push({
                            required: { required },
                            message:
                              getIntlContent("SHENYU.COMMON.PLEASEINPUT") +
                              item.label
                          });
                        }
                        if (checkRule) {
                          rules.push({
                            // eslint-disable-next-line no-eval
                            pattern: eval(checkRule),
                            message: `${getIntlContent(
                              "SHENYU.PLUGIN.RULE.INVALID"
                            )}:(${checkRule})`
                          });
                        }
                        if (item.dataType === 1) {
                          return (
                            <li key={fieldName}>
                              <Tooltip title={placeholder}>
                                <Item>
                                  {getFieldDecorator(fieldName, {
                                    rules,
                                    initialValue: defaultValue
                                  })(
                                    <Input
                                      addonBefore={
                                        <div style={{ width: labelWidth }}>
                                          {item.label}
                                        </div>
                                      }
                                      placeholder={placeholder}
                                      key={fieldName}
                                      type="number"
                                    />
                                  )}
                                </Item>
                              </Tooltip>
                            </li>
                          );
                        } else if (item.dataType === 3 && item.dictOptions) {
                          return (
                            <li key={fieldName}>
                              <Tooltip title={placeholder}>
                                <Item>
                                  {getFieldDecorator(fieldName, {
                                    rules,
                                    initialValue: defaultValue
                                  })(
                                    <Select
                                      placeholder={placeholder}
                                      style={{ width: "100%" }}
                                    >
                                      {item.dictOptions.map(option => {
                                        return (
                                          <Option
                                            key={option.dictValue}
                                            value={
                                              option.dictValue === "true"
                                                ? true
                                                : option.dictValue === "false"
                                                  ? false
                                                  : option.dictValue
                                            }
                                          >
                                            {option.dictName} ({item.label})
                                          </Option>
                                        );
                                      })}
                                    </Select>
                                  )}
                                </Item>
                              </Tooltip>
                            </li>
                          );
                        } else {
                          return (
                            <li key={fieldName}>
                              <Tooltip title={item.value}>
                                <Item>
                                  {getFieldDecorator(fieldName, {
                                    rules,
                                    initialValue: defaultValue
                                  })(
                                    <Input
                                      addonBefore={
                                        <div style={{ width: labelWidth }}>
                                          {item.label}
                                        </div>
                                      }
                                      placeholder={placeholder}
                                      key={fieldName}
                                      onChange={e => {
                                        this.onDealChange(e.target.value, item);
                                      }}
                                    />
                                  )}
                                </Item>
                              </Tooltip>
                            </li>
                          );
                        }
                      })}
                  </ul>
                  {multiSelectorHandle && (
                    <div style={{ width: 80, marginTop: 3 }}>
                      <Popconfirm
                        title={getIntlContent("SHENYU.COMMON.DELETE")}
                        placement="bottom"
                        onCancel={e => {
                          e.stopPropagation();
                        }}
                        onConfirm={e => {
                          e.stopPropagation();
                          this.handleDeleteHandle(index);
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
          {multiSelectorHandle && (
            <div style={{ width: 80, marginTop: 3, marginLeft: 5 }}>
              <Button onClick={this.handleAddHandle} type="primary">
                {getIntlContent("SHENYU.COMMON.ADD")}
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  handleCopyData = copyData => {
    const { form } = this.props;
    const {
      selectorConditions,
      name,
      type,
      matchMode,
      continued,
      loged,
      enabled,
      sort
    } = copyData;
    const formData = {
      name,
      type: type.toString(),
      continued,
      loged,
      enabled,
      sort
    };

    if (type === 1) {
      formData.matchMode = matchMode.toString();
      this.initSelectorCondition({
        selectorConditions: selectorConditions.map(v => {
          const {
            id: rawId,
            selectorId,
            dateCreated,
            dateUpdated,
            ...condition
          } = v;
          return condition;
        })
      });
    }
    form.setFieldsValue(formData);
    this.setState({ visible: false, selectValue: type.toString() });
  };

  onDealChange = (value, item) => {
    item.value = value;
  };

  renderOperatorOptions = (operators, paramType) => {
    if (operators && operators instanceof Array) {
      let operatorsFil = operators.map(operate => {
        return (
          <Option key={operate.dictValue} value={operate.dictValue}>
            {operate.dictName}
          </Option>
        )
      })
      if (paramType !== "uri") {
        operatorsFil = operatorsFil.filter(operate => {
          return operate.key !== "pathPattern" ? operate : ""
        })
      }
      if (paramType === "uri" || paramType === "host" || paramType === "ip" || paramType === "cookie" || paramType === "domain") {
        operatorsFil = operatorsFil.filter(operate => {
          return operate.key !== "TimeBefore" && operate.key !== "TimeAfter" ? operate : ""
        })
      }
      if (paramType === "req_method") {
        operatorsFil = operatorsFil.filter(operate => {
          return operate.key === "=" ? operate : ""
        })
      }
      return operatorsFil
    }

    return "";
  };

  renderParamTypeOptions = (paramTypes = []) => {
    if (paramTypes && paramTypes instanceof Array) {
      return paramTypes.map(typeItem => {
        const { dictValue, dictName } = typeItem;
        return (
          <Option key={dictValue} value={dictValue}>
            {dictName}
          </Option>
        );
      });
    }

    return "";
  };

  getParamValueInput = (item, index) => {
    if (item.operator === "TimeBefore" || item.operator === "TimeAfter") {
      let date = new Date()
      const defaultDay = date.getFullYear().toString().concat("-").concat((date.getMonth() + 1)).concat("-").concat(date.getDate())
      let day = defaultDay
      return (
        <Input.Group
          compact
          style={{ width: 213, top: -2 }}
        >
          <DatePicker
            onChange={e => {
              day = e ? e.eraYear().toString().concat('-').concat((e.month() + 1)).concat("-").concat(e.date() < 10 ? '0'.concat(e.date()) : e.date()) : defaultDay
            }}
            style={{ width: "51%" }}
          />
          <TimePicker
            style={{ width: "49%" }}
            onChange={e => {
              let Time = e ? day.concat(" ").concat(e.hours()).concat(":").concat(e.minutes()).concat(":").concat(e.seconds() < 10 ? '0'.concat(e.seconds()) : e.seconds()) : ""
              this.conditionChange(
                index,
                "paramValue",
                Time
              );
            }}
          />
        </Input.Group>
      )
    }
    else {
      return (
        <Input
          onChange={e => {
            this.conditionChange(
              index,
              "paramValue",
              e.target.value
            );
          }}
          value={item.paramValue}
          style={{ width: 160 }}
        />
      )
    }
  }

  render() {
    let {
      onCancel,
      form,
      name = "",
      platform,
      type = "",
      matchMode = "",
      continued = true,
      loged = true,
      enabled = true,
      sort
    } = this.props;

    const {
      selectorConditions,
      selectValue,
      operatorDics,
      matchModeDics,
      paramTypeDics,
      visible
    } = this.state;

    type = `${type}`;
    let { selectorTypeEnums } = platform;

    const { getFieldDecorator } = form;

    return (
      <Modal
        width='900px'
        centered
        title={getIntlContent("SHENYU.SELECTOR.NAME")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <Item
            label={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.COMMON.INPUTNAME")
                }
              ],
              initialValue: name
            })(
              <Input
                placeholder={getIntlContent(
                  "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME"
                )}
                addonAfter={
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      this.setState({ visible: true });
                    }}
                  >
                    {getIntlContent("SHENYU.SELECTOR.COPY")}
                  </Button>
                }
              />
            )}
          </Item>
          <SelectorCopy
            visible={visible}
            onOk={this.handleCopyData}
            onCancel={() => {
              this.setState({ visible: false });
            }}
          />
          <Item
            label={getIntlContent("SHENYU.COMMON.TYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator("type", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.COMMON.INPUTTYPE")
                }
              ],
              initialValue: type || "1"
            })(
              <Select
                placeholder={getIntlContent("SHENYU.COMMON.TYPE")}
                onChange={value => this.getSelectValue(value)}
              >
                {selectorTypeEnums.map(item => {
                  return (
                    <Option key={item.code} value={`${item.code}`}>
                      {getIntlContent(
                        `SHENYU.COMMON.SELECTOR.TYPE.${item.name.toUpperCase()}`,
                        item.name
                      )}
                    </Option>
                  );
                })}
              </Select>
            )}
          </Item>
          {selectValue !== "0" && (
            <Fragment>
              <Item
                label={getIntlContent("SHENYU.COMMON.MATCHTYPE")}
                {...formItemLayout}
              >
                {getFieldDecorator("matchMode", {
                  rules: [
                    {
                      required: true,
                      message: getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE")
                    }
                  ],
                  initialValue: `${matchMode}`
                })(
                  <Select
                    placeholder={getIntlContent("SHENYU.COMMON.MATCHTYPE")}
                  >
                    {matchModeDics &&
                      matchModeDics.map(item => {
                        return (
                          <Option key={item.dictValue} value={item.dictValue}>
                            {item.dictName}
                          </Option>
                        );
                      })}
                  </Select>
                )}
              </Item>
              <div className={styles.condition}>
                <Item
                  label={getIntlContent("SHENYU.COMMON.CONDITION")}
                  required
                  {...formItemLayout}
                >
                  {selectorConditions.map((item, index) => {
                    return (
                      <Row key={index} gutter={8}>
                        <Col span={5}>
                          <Select
                            onChange={value => {
                              this.conditionChange(index, "paramType", value);
                            }}
                            value={item.paramType}
                          >
                            {this.renderParamTypeOptions(paramTypeDics)}
                          </Select>
                        </Col>
                        <Col
                          span={4}
                          style={{
                            display: this.state[`paramTypeValueEn${index}`]
                              ? "none"
                              : "block"
                          }}
                        >
                          <Input
                            onChange={e => {
                              this.conditionChange(
                                index,
                                "paramName",
                                e.target.value
                              );
                            }}
                            placeholder={item.paramName}
                          />
                        </Col>
                        <Col span={4}>
                          <Select
                            onChange={value => {
                              this.conditionChange(index, "operator", value);
                            }}
                            value={item.operator}
                          >
                            {this.renderOperatorOptions(operatorDics, item.paramType)}
                          </Select>
                        </Col>

                        <Col span={7}>
                          <Tooltip title={item.paramValue}>
                            {this.getParamValueInput(item, index)}
                          </Tooltip>
                        </Col>
                        <Col span={4}>
                          <Button
                            type="danger"
                            onClick={() => {
                              this.handleDelete(index);
                            }}
                            style={{ marginLeft: 10 }}
                          >
                            {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                          </Button>
                        </Col>
                      </Row>
                    );
                  })}
                </Item>
                <Item
                  label={' '}
                  colon={false}
                  {...formItemLayout}
                >
                  <Button className={styles.addButton} onClick={this.handleAdd} type="primary">
                    {getIntlContent("SHENYU.COMMON.ADD")} {" "}
                    {getIntlContent("SHENYU.COMMON.CONDITION")}
                  </Button>
                </Item>
              </div>

            </Fragment>
          )}
          <div className={styles.layout}>
            <Item
              {...formCheckLayout}
              label={getIntlContent("SHENYU.SELECTOR.CONTINUE")}
            >
              {getFieldDecorator("continued", {
                initialValue: continued,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </Item>
            <Item
              style={{ margin: "0 30px" }}
              {...formCheckLayout}
              label={getIntlContent("SHENYU.SELECTOR.PRINTLOG")}
            >
              {getFieldDecorator("loged", {
                initialValue: loged,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </Item>
            <Item
              {...formCheckLayout}
              label={getIntlContent("SHENYU.SELECTOR.WHETHEROPEN")}
            >
              {getFieldDecorator("enabled", {
                initialValue: enabled,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </Item>
          </div>
          {this.renderPluginHandler()}
          <Item
            label={getIntlContent("SHENYU.SELECTOR.EXEORDER")}
            {...formItemLayout}
          >
            {getFieldDecorator("sort", {
              initialValue: sort,
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER")
                },
                {
                  pattern: /^([1-9][0-9]{0,2}|1000)$/,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER")
                }
              ]
            })(
              <Input
                placeholder={getIntlContent("SHENYU.SELECTOR.INPUTORDER")}
              />
            )}
          </Item>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
