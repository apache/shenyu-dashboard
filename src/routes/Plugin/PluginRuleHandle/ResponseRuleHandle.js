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

/* eslint-disable react/no-access-state-in-setstate */
import React, { Component } from "react";
import {
  Tabs,
  Form,
  Select,
  Row,
  Col,
  Input,
  Button,
  Table,
  InputNumber
} from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Option } = Select;
const { TabPane } = Tabs;

const TypeKey = {
  statusCode: ["statusCode"],
  headers: [
    "addHeaders",
    "setHeaders",
    "replaceHeaderKeys",
    "removeHeaderKeys"
  ],
  body: ["addBodyKeys", "replaceBodyKeys", "removeBodyKeys"]
};

function ConfigInput(cfProps) {
  const { code, data, onChange } = cfProps;
  return (
    <Input
      value={data[code]}
      placeholder={`please enter ${code}`}
      addonBefore={code}
      onChange={e => {
        onChange({ [code]: e.target.value }, data.id);
      }}
    />
  );
}

class ResponseConfig extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: "statusCode",
      headers: [{ id: (+new Date() + 1).toString() }],
      body: [{ id: (+new Date() + 1).toString() }],
      statusCode: [{ id: (+new Date() + 1).toString(), type: "statusCode" }]
    };
  }

  componentDidMount() {
    const { value } = this.props;
    const { headers, body } = this.state;
    if (value) {
      const data = {};
      try {
        Object.assign(data, JSON.parse(value));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
      const headerData = [];
      const bodyData = [];
      const statusCodeData = [
        { id: (+new Date() + 1).toString(), type: "statusCode" }
      ];
      const draftData = [];

      Object.keys(data).forEach(type => {
        if (Array.isArray(data[type])) {
          data[type].forEach(item => {
            if (typeof item === "string") {
              draftData.push({ type, key: item });
            } else {
              draftData.push({ type, ...item });
            }
          });
        }
        if (Object.prototype.toString.call(data[type]) === "[object Object]") {
          Object.keys(data[type]).forEach(key => {
            draftData.push({ type, key, value: data[type][key] });
          });
        }
        if (typeof data[type] === "number") {
          statusCodeData[0].code = data[type];
        }
      });
      draftData.forEach((item, i) => {
        if (TypeKey.headers.includes(item.type)) {
          headerData.push({
            ...item,
            id: i.toString()
          });
        }
        if (TypeKey.body.includes(item.type)) {
          bodyData.push({ ...item, id: i.toString() });
        }
      });
      this.setState({
        headers: headerData.concat(headers),
        body: bodyData.concat(body),
        statusCode: statusCodeData
      });
    }
  }

  componentDidUpdate() {
    const { onChange, value } = this.props;
    const data = {};
    const currentData = this.getCurrentData();
    const valueStr = JSON.stringify(currentData);
    if (value !== undefined) {
      try {
        Object.assign(data, JSON.parse(value));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }

    if (valueStr !== value && onChange) {
      onChange(valueStr);
    }
  }

  getCurrentData = () => {
    const { headers, body, statusCode } = this.state;
    const currentData = {};
    const hanleKeyValue = item => {
      if (currentData[item.type] === undefined) {
        currentData[item.type] = {};
      }
      currentData[item.type][item.key] = item.value;
    };
    const hanlePathKeyValue = item => {
      if (currentData[item.type] === undefined) {
        currentData[item.type] = [];
      }
      currentData[item.type].push({
        path: item.path,
        key: item.key,
        value: item.value
      });
    };
    const hanleKeys = item => {
      if (currentData[item.type] === undefined) {
        currentData[item.type] = [];
      }
      currentData[item.type].push(item.key);
    };
    const hanleStatusCode = item => {
      if (currentData[item.type] === undefined) {
        currentData[item.type] = [];
      }
      currentData.statusCode = item.code;
    };
    const handleForEach = item => {
      if (
        ["addHeaders", "setHeaders", "replaceHeaderKeys"].includes(item.type)
      ) {
        hanleKeyValue(item);
      }
      if (["addBodyKeys", "replaceBodyKeys"].includes(item.type)) {
        hanlePathKeyValue(item);
      }
      if (["removeHeaderKeys", "removeBodyKeys"].includes(item.type)) {
        hanleKeys(item);
      }
      if (["statusCode"].includes(item.type)) {
        hanleStatusCode(item);
      }
    };
    headers.forEach(handleForEach);
    body.forEach(handleForEach);
    statusCode.forEach(handleForEach);
    return currentData;
  };

  onChangeConfig = (value, id) => {
    const state = this.state;
    const { activeKey } = state;
    const index = state[activeKey].findIndex(v => v.id === id);
    const newData = state[activeKey].map(v => {
      if (v.id === id) {
        return value.type
          ? { id: v.id, ...value }
          : {
              ...v,
              ...value
            };
      }
      return v;
    });
    this.setState({
      [activeKey]:
        value.type &&
        state[activeKey][index].type === undefined &&
        activeKey !== "statusCode"
          ? newData.concat([{ id: (+new Date()).toString() }])
          : newData
    });
  };

  renderConfig = data => {
    let Comp = null;
    if (!data.type) {
      return Comp;
    }

    switch (data.type) {
      case "addHeaders":
      case "setHeaders":
      case "replaceHeaderKeys":
        Comp = (
          <Row gutter={8}>
            <Col span={12}>
              <ConfigInput
                code="key"
                data={data}
                onChange={this.onChangeConfig}
              />
            </Col>
            <Col span={12}>
              <ConfigInput
                code="value"
                data={data}
                onChange={this.onChangeConfig}
              />
            </Col>
          </Row>
        );
        break;
      case "addBodyKeys":
      case "replaceBodyKeys":
        Comp = (
          <Row gutter={8}>
            <Col span={8}>
              <ConfigInput
                code="path"
                data={data}
                onChange={this.onChangeConfig}
              />
            </Col>
            <Col span={8}>
              <ConfigInput
                code="key"
                data={data}
                onChange={this.onChangeConfig}
              />
            </Col>
            <Col span={8}>
              <ConfigInput
                code="value"
                data={data}
                onChange={this.onChangeConfig}
              />
            </Col>
          </Row>
        );
        break;
      case "removeHeaderKeys":
      case "removeBodyKeys":
      default:
        Comp = (
          <Row gutter={8}>
            <Col span={24}>
              <ConfigInput
                code="key"
                data={data}
                onChange={this.onChangeConfig}
              />
            </Col>
          </Row>
        );
        break;
    }

    return Comp;
  };

  render() {
    const { activeKey } = this.state;

    const columns = [
      {
        title: "Type",
        dataIndex: "type",
        width: 180,
        render: (value, row) => {
          return (
            <Select
              value={row.type}
              onChange={type => this.onChangeConfig({ type }, row.id)}
            >
              {TypeKey[activeKey].map(v => (
                <Option key={v} value={v}>
                  {v}
                </Option>
              ))}
            </Select>
          );
        }
      },
      {
        title: "Config",
        dataIndex: "config",
        align: "center",
        render: (value, row) => this.renderConfig(row)
      },
      {
        title: "Operater",
        dataIndex: "id",
        with: 80,
        fixed: "right",
        render: (value, row, index) => {
          return (
            this.state[activeKey].length - 1 !== index && (
              <Button
                type="danger"
                onClick={() => {
                  this.setState({
                    [activeKey]: this.state[activeKey].filter(
                      v => v.id !== row.id
                    )
                  });
                }}
              >
                {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
              </Button>
            )
          );
        }
      }
    ];

    const statusCodeColums = [
      {
        title: "Code",
        dataIndex: "code",
        render: (value, row) => (
          <InputNumber
            style={{ width: 100 }}
            precision={0}
            min={200}
            max={599}
            placeholder="200~599"
            value={value}
            onChange={v => this.onChangeConfig({ code: v }, row.id)}
          />
        )
      }
    ];

    return (
      <>
        <Tabs
          activeKey={activeKey}
          onChange={key =>
            this.setState({
              activeKey: key
            })
          }
        >
          <TabPane tab="StatusCode" key="statusCode" />
          <TabPane tab="Headers" key="headers" />
          <TabPane tab="Body" key="body" />
        </Tabs>
        <Table
          rowKey="id"
          size="small"
          columns={activeKey === "statusCode" ? statusCodeColums : columns}
          dataSource={this.state[activeKey]}
          pagination={false}
        />
      </>
    );
  }
}

export default class ResponseRuleHandle extends Component {
  constructor(props) {
    super(props);
    props.onRef(this);
  }

  getData = () => {
    const {
      form: { getFieldValue }
    } = this.props;
    const value = getFieldValue("handle");
    return value;
  };

  render() {
    const {
      handle,
      form: { getFieldDecorator }
    } = this.props;

    return (
      <Form.Item
        label={getIntlContent("SHENYU.COMMON.DEAL")}
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
      >
        {getFieldDecorator("handle", {
          initialValue: handle
        })(<ResponseConfig />)}
      </Form.Item>
    );
  }
}
