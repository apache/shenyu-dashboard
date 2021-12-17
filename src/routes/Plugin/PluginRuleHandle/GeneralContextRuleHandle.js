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
import { Tabs, Form, Select, Row, Col, Input, Button } from "antd";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";
import { titleCase, guid } from "../../../utils/utils";

const FormItem = Form.Item;
const { Option } = Select;
const { TabPane } = Tabs;

const handlers = ["dubbo", "grpc", "sofa", "motan"];
const contextType = ["addGeneralContext", "transmitHeaderToGeneralContext"];

export default class GeneralContextRuleHandle extends Component {
  constructor(props) {
    super(props);
    props.onRef(this);
    const { handle } = props;
    const keys = {};
    const handleData = {};
    handlers.forEach(v => {
      keys[v] = [];
    });
    // format handle
    try {
      const handleJSON = JSON.parse(handle);
      handlers.forEach(handleName => {
        if (Array.isArray(handleJSON[handleName])) {
          keys[handleName] = handleJSON[handleName].map(data => {
            const Guid = guid();
            if (!handleData[handleName]) {
              handleData[handleName] = {};
            }
            handleData[handleName][Guid] = data;
            return Guid;
          });
        } else {
          keys[handleName] = [guid()];
        }
      });
    } catch (e) {
      handlers.forEach(handleName => {
        keys[handleName] = [guid()];
      });
    }
    this.keys = keys;
    this.handleData = handleData;
    this.state = {
      currentType: handlers[0]
    };
  }

  handleAddRow = handler => {
    const {
      form: { setFieldsValue, getFieldValue }
    } = this.props;
    const keys = Object.assign({}, getFieldValue("keys"));
    keys[handler].push(guid());
    setFieldsValue({ keys });
  };

  handleDeleteRow = (handler, key) => {
    const {
      form: { setFieldsValue, getFieldValue }
    } = this.props;
    const keys = Object.assign({}, getFieldValue("keys"));
    if (keys[handler].length === 1) {
      return;
    }
    keys[handler] = keys[handler].filter(v => v !== key);
    setFieldsValue({ keys });
  };

  getData = values => {
    const { handle, keys } = values;
    const handleData = {};
    handlers.forEach(v => {
      handleData[v] = keys[v].map(key => handle[v][key]);
    });
    return JSON.stringify(handleData);
  };

  render() {
    const { handleData } = this;
    const { currentType } = this.state;
    const { form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    getFieldDecorator("keys", {
      initialValue: this.keys
    });
    const keys = getFieldValue("keys");

    return (
      <div className={styles.handleWrap} style={{ padding: "0px 40px" }}>
        <div className={styles.header}>
          <h3 style={{ width: 60, marginTop: 10 }}>
            {getIntlContent("SHENYU.COMMON.DEAL")}:{" "}
          </h3>
        </div>
        <Tabs
          style={{ marginLeft: 10, width: "100%" }}
          defaultActiveKey={currentType}
          onChange={this.handleTabChange}
        >
          {handlers.map(handler => (
            <TabPane tab={titleCase(handler)} key={handler}>
              {keys[handler].map((key, keyIndex) => (
                <Row gutter={16} key={key}>
                  <Col span={7}>
                    <FormItem>
                      {getFieldDecorator(
                        `handle['${handler}']['${key}']['generalContextType']`,
                        {
                          initialValue:
                            handleData?.[handler]?.[key]?.generalContextType
                        }
                      )(
                        <Select
                          placeholder={`${titleCase(
                            `Select ${handler} Context Type`
                          )}`}
                        >
                          {contextType.map(v => (
                            <Option value={v} key={v} title={v}>
                              {v}
                            </Option>
                          ))}
                        </Select>
                      )}
                    </FormItem>
                  </Col>
                  <Col span={6}>
                    <FormItem>
                      {getFieldDecorator(
                        `handle['${handler}']['${key}']['generalContextKey']`,
                        {
                          initialValue:
                            handleData?.[handler]?.[key]?.generalContextKey
                        }
                      )(
                        <Input
                          placeholder={`${titleCase(
                            `Set ${handler} Context Key`
                          )}`}
                        />
                      )}
                    </FormItem>
                  </Col>
                  <Col span={6}>
                    <FormItem>
                      {getFieldDecorator(
                        `handle['${handler}']['${key}']['generalContextValue']`,
                        {
                          initialValue:
                            handleData?.[handler]?.[key]?.generalContextValue
                        }
                      )(
                        <Input
                          placeholder={`${titleCase(
                            `Set ${handler} Context Value`
                          )}`}
                        />
                      )}
                    </FormItem>
                  </Col>
                  <Col span={5}>
                    <FormItem>
                      <Button
                        type="danger"
                        style={{ marginRight: 16 }}
                        onClick={() => this.handleDeleteRow(handler, key)}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                      {keyIndex === 0 && (
                        <Button
                          onClick={() => this.handleAddRow(handler)}
                          type="primary"
                        >
                          {getIntlContent("SHENYU.COMMON.ADD")}
                        </Button>
                      )}
                    </FormItem>
                  </Col>
                </Row>
              ))}
            </TabPane>
          ))}
        </Tabs>
      </div>
    );
  }
}
