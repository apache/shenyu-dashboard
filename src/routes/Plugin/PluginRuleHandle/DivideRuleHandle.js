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
import { Col, Form, Input, message, Row, Select, Switch } from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { Option } = Select;

export default class DivideRuleHandle extends Component {
  constructor(props) {
    super(props);
    props.onRef(this);
    let grayEnabled = false,
      grayPercent = 0,
      grayConditionParamType = "",
      grayConditionParamName = "",
      grayConditionOperator = "=",
      grayConditionParamValue = "",
      grayMetadataKey = "",
      grayMetadataValue = "";
    if (props.handle) {
      try {
        const myHandle = JSON.parse(props.handle);
        if (typeof myHandle.grayEnabled !== "undefined") {
          grayEnabled =
            myHandle.grayEnabled === true || myHandle.grayEnabled === "true";
        }
        if (typeof myHandle.grayPercent !== "undefined") {
          grayPercent = Number(myHandle.grayPercent) || 0;
        }
        if (myHandle.grayConditionParamType) {
          grayConditionParamType = myHandle.grayConditionParamType;
        }
        if (myHandle.grayConditionParamName) {
          grayConditionParamName = myHandle.grayConditionParamName;
        }
        if (myHandle.grayConditionOperator) {
          grayConditionOperator = myHandle.grayConditionOperator;
        }
        if (myHandle.grayConditionParamValue) {
          grayConditionParamValue = myHandle.grayConditionParamValue;
        }
        if (myHandle.grayMetadataKey) {
          grayMetadataKey = myHandle.grayMetadataKey;
        }
        if (myHandle.grayMetadataValue) {
          grayMetadataValue = myHandle.grayMetadataValue;
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    this.state = {
      grayEnabled,
      grayPercent,
      grayConditionParamType,
      grayConditionParamName,
      grayConditionOperator,
      grayConditionParamValue,
      grayMetadataKey,
      grayMetadataValue,
    };
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  getData = () => {
    const {
      grayEnabled,
      grayPercent,
      grayConditionParamType,
      grayConditionParamName,
      grayConditionOperator,
      grayConditionParamValue,
      grayMetadataKey,
      grayMetadataValue,
    } = this.state;
    const handle = { grayEnabled };
    if (grayEnabled) {
      if (!grayConditionParamType || !grayConditionOperator) {
        message.error(
          getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.CONDITION.REQUIRED") ||
            "GrayCondition fields are required",
        );
        return null;
      }
      if (grayConditionParamType !== "ip" && !grayConditionParamName) {
        message.error(
          getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.CONDITION.REQUIRED") ||
            "GrayCondition fields are required",
        );
        return null;
      }
      if (grayConditionOperator !== "isBlank" && !grayConditionParamValue) {
        message.error(
          getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.CONDITION.REQUIRED") ||
            "GrayCondition fields are required",
        );
        return null;
      }
      if (!grayMetadataKey || !grayMetadataValue) {
        message.error(
          getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.METADATA.REQUIRED") ||
            "MetadataMatch key and value are required",
        );
        return null;
      }
      if (!grayPercent || grayPercent <= 0) {
        message.error(
          getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.PERCENT.REQUIRED") ||
            "GrayPercent must be greater than 0",
        );
        return null;
      }
    }
    handle.grayPercent = grayPercent;
    handle.grayConditionParamType = grayConditionParamType;
    handle.grayConditionParamName = grayConditionParamName;
    handle.grayConditionOperator = grayConditionOperator;
    handle.grayConditionParamValue = grayConditionParamValue;
    handle.grayMetadataKey = grayMetadataKey;
    handle.grayMetadataValue = grayMetadataValue;
    return JSON.stringify(handle);
  };

  onHandleChange = (key, value) => {
    this.setState({ [key]: value });
  };

  render() {
    const {
      grayEnabled,
      grayPercent,
      grayConditionParamType,
      grayConditionParamName,
      grayConditionOperator,
      grayConditionParamValue,
      grayMetadataKey,
      grayMetadataValue,
    } = this.state;
    const formItemLayout = {
      labelCol: {
        sm: { span: 4 },
      },
      wrapperCol: {
        sm: { span: 20 },
      },
    };
    return (
      <FormItem
        label={
          getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.TITLE") || "Gray Release"
        }
        {...formItemLayout}
      >
        <Switch
          checked={grayEnabled}
          onChange={(checked) => this.onHandleChange("grayEnabled", checked)}
        />
        {grayEnabled && (
          <div style={{ marginTop: 12 }}>
            {/* Row 1: GrayCondition */}
            <Row gutter={8} style={{ marginBottom: 8 }}>
              <Col span={4}>
                <span style={{ lineHeight: "32px", fontWeight: 500 }}>
                  <span style={{ color: "#f5222d", marginRight: 4 }}>*</span>
                  {getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.CONDITION") ||
                    "GrayCondition"}
                </span>
              </Col>
              <Col span={5}>
                <Select
                  value={grayConditionParamType || undefined}
                  style={{ width: "100%" }}
                  placeholder="paramType"
                  onChange={(value) => {
                    this.onHandleChange("grayConditionParamType", value || "");
                    if (value === "ip") {
                      this.onHandleChange("grayConditionParamName", "ip");
                    }
                  }}
                >
                  <Option value="header">header</Option>
                  <Option value="cookie">cookie</Option>
                  <Option value="query">query</Option>
                  <Option value="ip">ip</Option>
                </Select>
              </Col>
              <Col span={5}>
                <Input
                  value={grayConditionParamName}
                  placeholder="param name"
                  disabled={grayConditionParamType === "ip"}
                  onChange={(e) =>
                    this.onHandleChange(
                      "grayConditionParamName",
                      e.target.value,
                    )
                  }
                />
              </Col>
              <Col span={5}>
                <Select
                  value={grayConditionOperator || undefined}
                  style={{ width: "100%" }}
                  placeholder="operator"
                  onChange={(value) => {
                    this.onHandleChange("grayConditionOperator", value || "=");
                    if (value === "isBlank") {
                      this.onHandleChange("grayConditionParamValue", "");
                    }
                  }}
                >
                  <Option value="match">match</Option>
                  <Option value="=">=</Option>
                  <Option value="regex">regex</Option>
                  <Option value="contains">contains</Option>
                  <Option value="exclude">exclude</Option>
                  <Option value="startsWith">startsWith</Option>
                  <Option value="endsWith">endsWith</Option>
                  <Option value="isBlank">isBlank</Option>
                </Select>
              </Col>
              <Col span={5}>
                <Input
                  value={
                    grayConditionOperator === "isBlank"
                      ? ""
                      : grayConditionParamValue
                  }
                  placeholder="param value"
                  disabled={grayConditionOperator === "isBlank"}
                  onChange={(e) =>
                    this.onHandleChange(
                      "grayConditionParamValue",
                      e.target.value,
                    )
                  }
                />
              </Col>
            </Row>
            {/* Row 2: MetadataMatch + GrayPercent */}
            <Row gutter={8}>
              <Col span={4}>
                <span style={{ lineHeight: "32px", fontWeight: 500 }}>
                  <span style={{ color: "#f5222d", marginRight: 4 }}>*</span>
                  {getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.METADATA.MATCH") ||
                    "MetadataMatch"}
                </span>
              </Col>
              <Col span={5}>
                <Input
                  value={grayMetadataKey}
                  placeholder="key"
                  onChange={(e) =>
                    this.onHandleChange("grayMetadataKey", e.target.value)
                  }
                />
              </Col>
              <Col span={5}>
                <Input
                  value={grayMetadataValue}
                  placeholder="value"
                  onChange={(e) =>
                    this.onHandleChange("grayMetadataValue", e.target.value)
                  }
                />
              </Col>
              <Col span={4}>
                <span style={{ lineHeight: "32px", fontWeight: 500 }}>
                  <span style={{ color: "#f5222d", marginRight: 4 }}>*</span>
                  {getIntlContent("SHENYU.PLUGIN.DIVIDE.GRAY.PERCENT") ||
                    "GrayPercent"}
                </span>
              </Col>
              <Col span={6}>
                <Input
                  value={grayPercent}
                  placeholder="0-100"
                  suffix="%"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      const num = val === "" ? 0 : Number(val);
                      this.onHandleChange("grayPercent", num > 100 ? 100 : num);
                    }
                  }}
                />
              </Col>
            </Row>
          </div>
        )}
      </FormItem>
    );
  }
}
