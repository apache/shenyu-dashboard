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
import { connect } from "dva";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Tabs,
  Tooltip,
} from "antd";
import classnames from "classnames";
import { getIntlContent } from "../../../utils/IntlUtils";
import styles from "../index.less";
import ProxySelectorCopy from "./ProxySelectorCopy.js";
import { findKeyByValue } from "../../../utils/utils";
import EditableFormTable from "./DiscoveryUpstreamTable";

const FormItem = Form.Item;
const { TabPane } = Tabs;
const { Option } = Select;

@connect(({ discovery, pluginHandle, shenyuDict }) => ({
  ...discovery,
  ...pluginHandle,
  ...shenyuDict,
}))
class ProxySelectorModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recordCount: this.props.recordCount,
      upstreams: this.props.discoveryUpstreams,
      discoveryDicts: this.props.discoveryDicts,
      configPropsJson: {},
      pluginHandleList: [],
      visible: false,
      discoveryHandler: null,
      defaultValueList: null,
    };
  }

  componentDidMount() {
    const { isAdd, isSetConfig, discoveryType, data, pluginId, dispatch } =
      this.props;
    const { discoveryDicts } = this.state;
    const { props } = this.props.data || {};

    if (!isAdd || isSetConfig) {
      this.setState({
        configPropsJson:
          isSetConfig === true ? {} : JSON.parse(data.discovery.props),
      });
      dispatch({
        type: "discovery/saveGlobalType",
        payload: {
          chosenType: discoveryType,
        },
      });
    } else {
      let configProps = discoveryDicts.filter(
        (item) => item.dictName === "zookeeper",
      );
      let propsEntries = JSON.parse(configProps[0]?.dictValue || "{}");
      this.setState({ configPropsJson: propsEntries });
      dispatch({
        type: "discovery/saveGlobalType",
        payload: {
          chosenType: "",
        },
      });
    }

    let type = 1;
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload: {
        pluginId,
        type,
        handle: Object.keys(props).length === 0 ? "" : props,
        isHandleArray: false,
        callBack: (pluginHandles) => {
          if (Object.keys(pluginHandles).length > 0) {
            const filteredArray = pluginHandles[0].filter(
              (item) => item.field !== "discoveryHandler",
            );

            const handlerArray = pluginHandles[0].filter(
              (item) => item.field === "discoveryHandler",
            );
            this.setState({ discoveryHandler: handlerArray });

            pluginHandles[0] = filteredArray;
            this.setState({ pluginHandleList: pluginHandles });

            let defaultValue = handlerArray[0].defaultValue;
            this.setState({ defaultValueList: defaultValue.split(",") });
          }
        },
      },
    });
  }

  handleSubmit = (e) => {
    const { form, handleOk } = this.props;
    const { configPropsJson, upstreams, pluginHandleList, defaultValueList } =
      this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let {
          name,
          forwardPort,
          listenerNode,
          serverList,
          selectedDiscoveryType,
        } = values;
        const discoveryPropsJson = {};
        Object.entries(configPropsJson).forEach(([key]) => {
          discoveryPropsJson[key] = form.getFieldValue(key);
        });
        // The discoveryProps refer to the attributes corresponding to each registration center mode
        const discoveryProps = JSON.stringify(discoveryPropsJson);

        // The handler refers to the url, status, weight, protocol, etc. of the discovery module.
        let handler = {};
        if (defaultValueList !== null) {
          defaultValueList.forEach((item) => {
            if (values[item] !== undefined) {
              handler[values[item]] = item;
            }
          });
        }
        handler = JSON.stringify(handler);

        let handleResult = [];
        handleResult[0] = {};
        if (Object.keys(pluginHandleList).length > 0) {
          pluginHandleList[0].forEach((item) => {
            handleResult[0][item.field] = values[item.field + 0];
          });
        }
        // The props refer to the properties of each plug-in
        let props = JSON.stringify(handleResult[0]);
        handleOk({
          name,
          forwardPort,
          props,
          listenerNode,
          handler,
          discoveryProps,
          serverList,
          selectedDiscoveryType,
          upstreams,
        });
      }
    });
  };

  handleCopyData = (copyData) => {
    const { form, dispatch } = this.props;
    const { name, forwardPort, discovery, listenerNode } = copyData;
    const formData = {
      name,
      forwardPort,
      listenerNode,
      selectedDiscoveryType: discovery.type,
      serverList: discovery.serverList,
    };
    dispatch({
      type: "discovery/saveGlobalType",
      payload: {
        chosenType: discovery.type,
      },
    });
    form.setFieldsValue(formData);
    this.setState({ visible: false });
  };

  handleTableChange = (newData) => {
    this.setState({ upstreams: newData });
  };

  handleCountChange = (newCount) => {
    this.setState({ recordCount: newCount });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  handleChange = (index, value) => {
    this.setState({
      [index]: value,
    });
  };

  handleOptions() {
    return this.props.typeEnums.map((value) => (
      <Option key={value} value={value.toString()}>
        {value}
      </Option>
    ));
  }

  render() {
    const {
      discoveryType,
      form,
      handleCancel,
      isSetConfig,
      isAdd,
      chosenType,
      dispatch,
    } = this.props;
    const {
      recordCount,
      upstreams,
      pluginHandleList,
      visible,
      discoveryHandler,
      defaultValueList,
      discoveryDicts,
      configPropsJson,
    } = this.state;
    const { getFieldDecorator } = form;
    const { name, forwardPort, listenerNode, discovery, handler } =
      this.props.data || {};
    const labelWidth = 200;
    const formItemLayout = {
      labelCol: {
        sm: { span: 4 },
      },
      wrapperCol: {
        sm: { span: 19 },
      },
    };

    return (
      <Modal
        destroyOnClose
        centered
        visible
        width="60%"
        onCancel={handleCancel}
        onOk={this.handleSubmit}
        title={getIntlContent("SHENYU.SELECTOR.NAME")}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
      >
        <Form onSubmit={this.handleSubmit}>
          <Tabs defaultActiveKey="1" size="small">
            <TabPane
              tab={getIntlContent("SHENYU.DISCOVERY.SELECTOR.CONFIG.BASIC")}
              key="1"
            >
              <FormItem
                label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.NAME")}
                {...formItemLayout}
              >
                {getFieldDecorator("name", {
                  rules: [
                    {
                      required: true,
                      message: getIntlContent(
                        "SHENYU.DISCOVERY.SELECTOR.NAME.INPUT",
                      ),
                    },
                  ],
                  initialValue: name,
                })(
                  <Input
                    allowClear
                    disabled={!isAdd}
                    placeholder={getIntlContent(
                      "SHENYU.DISCOVERY.SELECTOR.NAME.INPUT",
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
                  />,
                )}
              </FormItem>

              <ProxySelectorCopy
                disabled={!isAdd}
                visible={visible}
                onOk={this.handleCopyData}
                onCancel={() => {
                  this.setState({ visible: false });
                }}
              />

              <FormItem
                label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT")}
                {...formItemLayout}
              >
                {getFieldDecorator("forwardPort", {
                  rules: [
                    {
                      required: true,
                      message: getIntlContent(
                        "SHENYU.DISCOVERY.SELECTOR.FORWARDPORT.INPUT",
                      ),
                    },
                  ],
                  initialValue: forwardPort,
                })(
                  <Input
                    allowClear
                    disabled={!isAdd}
                    placeholder={getIntlContent(
                      "SHENYU.DISCOVERY.SELECTOR.FORWARDPORT.INPUT",
                    )}
                  />,
                )}
              </FormItem>

              <FormItem
                label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS")}
                {...formItemLayout}
              >
                <div
                  className={styles.handleWrap}
                  style={{
                    display: "flex",
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
                            style={{ width: "100%" }}
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
                                    getIntlContent(
                                      "SHENYU.COMMON.PLEASEINPUT",
                                    ) + item.label,
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
                                            disabled={!isAdd}
                                            addonBefore={
                                              <div
                                                style={{ width: labelWidth }}
                                              >
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
                              } else if (
                                item.dataType === 3 &&
                                item.dictOptions
                              ) {
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
                                            disabled={!isAdd}
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
                                                  {option.dictName} (
                                                  {item.label})
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
                                            disabled={!isAdd}
                                            addonBefore={
                                              <div
                                                style={{ width: labelWidth }}
                                              >
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FormItem>
            </TabPane>
            <TabPane
              tab={getIntlContent("SHENYU.DISCOVERY.SELECTOR.CONFIG.DISCOVERY")}
              key="2"
            >
              <FormItem
                label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE")}
                {...formItemLayout}
              >
                {getFieldDecorator("selectedDiscoveryType", {
                  rules: [
                    {
                      required: true,
                      message: getIntlContent(
                        "SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT",
                      ),
                    },
                  ],
                  initialValue:
                    discoveryType !== "" ? discoveryType : undefined,
                })(
                  <Select
                    placeholder={getIntlContent(
                      "SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT",
                    )}
                    disabled={isSetConfig || !isAdd}
                    onChange={(value) => {
                      dispatch({
                        type: "discovery/saveGlobalType",
                        payload: {
                          chosenType: value,
                        },
                      });

                      let configProps = discoveryDicts.filter(
                        (item) => item.dictName === value,
                      );
                      let propsEntries = JSON.parse(
                        configProps[0]?.dictValue || "{}",
                      );
                      this.setState({ configPropsJson: propsEntries });
                    }}
                  >
                    {this.handleOptions()}
                  </Select>,
                )}
              </FormItem>

              {chosenType !== "local" ? (
                <>
                  <FormItem
                    label={getIntlContent(
                      "SHENYU.DISCOVERY.SELECTOR.LISTENERNODE",
                    )}
                    {...formItemLayout}
                  >
                    {getFieldDecorator("listenerNode", {
                      rules: [
                        {
                          required: true,
                          message: getIntlContent(
                            "SHENYU.DISCOVERY.SELECTOR.LISTENERNODE.INPUT",
                          ),
                        },
                      ],
                      initialValue: listenerNode,
                    })(
                      <Input
                        allowClear
                        disabled={!isAdd}
                        placeholder={getIntlContent(
                          "SHENYU.DISCOVERY.SELECTOR.LISTENERNODE.INPUT",
                        )}
                      />,
                    )}
                  </FormItem>

                  <FormItem
                    label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER")}
                    {...formItemLayout}
                  >
                    <div
                      className={styles.handleWrap}
                      style={{
                        display: "flex",
                      }}
                    >
                      <div
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
                          style={{ width: "100%" }}
                        >
                          {(() => {
                            if (discoveryHandler != null) {
                              let item = discoveryHandler[0];
                              let checkRule = item.checkRule;
                              let required = item.required === "1";
                              let rules = [];
                              if (required) {
                                rules.push({
                                  required: { required },
                                  message:
                                    getIntlContent(
                                      "SHENYU.COMMON.PLEASEINPUT",
                                    ) + item.label,
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
                              if (defaultValueList != null) {
                                return defaultValueList.map((value, index) => (
                                  <li key={index}>
                                    <FormItem>
                                      {getFieldDecorator(value, {
                                        initialValue:
                                          isAdd === true
                                            ? findKeyByValue(handler, value)
                                            : findKeyByValue(
                                                JSON.parse(handler),
                                                value,
                                              ),
                                        rules,
                                      })(
                                        <Input
                                          allowClear
                                          disabled={!isAdd}
                                          addonAfter={
                                            <div style={{ width: "50px" }}>
                                              {value}
                                            </div>
                                          }
                                          placeholder={
                                            isAdd ? `Your ${value}` : ""
                                          }
                                          key={value}
                                        />,
                                      )}
                                    </FormItem>
                                  </li>
                                ));
                              }
                            }
                          })()}
                        </ul>
                      </div>
                    </div>
                  </FormItem>

                  {isSetConfig !== true ? (
                    <>
                      <FormItem
                        label={getIntlContent(
                          "SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST",
                        )}
                        {...formItemLayout}
                      >
                        {getFieldDecorator("serverList", {
                          rules: [
                            {
                              required: true,
                              message: getIntlContent(
                                "SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT",
                              ),
                            },
                          ],
                          initialValue: discovery.serverList,
                        })(
                          <Input
                            allowClear
                            disabled={!isAdd}
                            placeholder={getIntlContent(
                              "SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT",
                            )}
                          />,
                        )}
                      </FormItem>

                      <div
                        style={{
                          marginLeft: "50px",
                          marginTop: "15px",
                          marginBottom: "15px",
                          fontWeight: "500",
                        }}
                      >
                        {getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")}
                        <span style={{ marginLeft: "2px", fontWeight: "500" }}>
                          :
                        </span>
                      </div>
                      <div
                        style={{
                          marginLeft: "35px",
                          display: "flex",
                          alignItems: "baseline",
                        }}
                      >
                        <div style={{ marginLeft: "8px", width: "100%" }}>
                          <Row gutter={[16, 4]} justify="center">
                            {Object.entries(configPropsJson).map(
                              ([key, value]) => (
                                <Col span={12} key={key}>
                                  <FormItem>
                                    {getFieldDecorator(key, {
                                      initialValue: value,
                                    })(
                                      <Input
                                        allowClear
                                        disabled={!isAdd}
                                        placeholder={
                                          isAdd ? `Enter ${key}` : ""
                                        }
                                        addonBefore={key}
                                      />,
                                    )}
                                  </FormItem>
                                </Col>
                              ),
                            )}
                          </Row>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {isAdd !== true ? (
                    <>
                      <Divider>
                        {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM")}
                      </Divider>
                      <EditableFormTable
                        isLocal={false}
                        dataSource={upstreams}
                        recordCount={recordCount}
                        onTableChange={this.handleTableChange}
                        onCountChange={this.handleCountChange}
                      />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <Divider>
                    {getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM")}
                  </Divider>
                  <EditableFormTable
                    isLocal={true}
                    dataSource={upstreams}
                    recordCount={recordCount}
                    onTableChange={this.handleTableChange}
                    onCountChange={this.handleCountChange}
                  />
                </>
              )}
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(ProxySelectorModal);
