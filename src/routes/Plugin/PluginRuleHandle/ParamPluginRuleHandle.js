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

import React, {Component} from "react";
import {Form, Select, Row, Col, Input, Button, Tabs, Table} from "antd";
import {getIntlContent} from '../../../utils/IntlUtils'

const {Option} = Select;
const {TabPane} = Tabs;

const TypeKey = {
  body: ["addParameterKeys", "replaceParameterKeys", "removeParameterKeys"]
};

function ConfigInput(cfProps) {
  const {code, data, onChange} = cfProps;
  return (
    <Input
      value={data[code]}
      placeholder={`please enter ${code}`}
      addonBefore={code}
      onChange={e => {
        onChange({[code]: e.target.value}, data.id);
      }}
    />
  );
}

class ParamPluginRuleConfig extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: "body",
      body: [{id: (+new Date() + 1).toString()}],
    };
  }

  componentDidMount() {
    const {value} = this.props;
    const {body} = this.state;
    if (value) {
      const data = {};
      try {
        Object.assign(data, JSON.parse(value));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
      const bodyData = [];
      const draftData = [];

      Object.keys(data).forEach(type => {
        if (Array.isArray(data[type])) {
          data[type].forEach(item => {
            if (typeof item === "string") {
              draftData.push({type, key: item});
            } else {
              draftData.push({type, ...item});
            }
          });
        }
        if (Object.prototype.toString.call(data[type]) === "[object Object]") {
          Object.keys(data[type]).forEach(key => {
            draftData.push({type, key, value: data[type][key]});
          });
        }
      });
      draftData.forEach((item, i) => {
        if (TypeKey.body.includes(item.type)) {
          bodyData.push({...item, id: i.toString()});
        }
      });
      this.setState({
        body: bodyData.concat(body),
      });
    }
  }

  componentDidUpdate() {
    const {onChange, value} = this.props;
    const data = {};
    const currentData = this.getCurrentData();
    const valueStr = JSON.stringify(currentData);
    // console.log(currentData);
    if (value !== undefined) {
      try {
        Object.assign(data, JSON.parse(value));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    }

    if (valueStr !== value && onChange) {
      onChange(valueStr);
    }
  }

  getCurrentData = () => {
    const {body} = this.state;
    const currentData = {};

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

    const handleForEach = item => {

      if (["addParameterKeys", "replaceParameterKeys"].includes(item.type)) {
        hanlePathKeyValue(item);
      }
      if (["removeParameterKeys"].includes(item.type)) {
        hanleKeys(item);
      }
    };
    body.forEach(handleForEach);
    return currentData;
  };

  onChangeConfig = (value, id) => {
    const state = this.state;
    const { activeKey } = state;
    const index = state[activeKey].findIndex(v => v.id === id);
    const newData = state[activeKey].map(v => {
      if (v.id === id) {
        return value.type
          ? {id: v.id, ...value}
          : {
            ...v,
            ...value
          };
      }
      return v;
    });
    this.setState(prevState =>({
      [activeKey]:
        value.type &&
        prevState[activeKey][index].type === undefined &&
        activeKey === "body"
          ? newData.concat([{id: (+new Date()).toString()}])
          : newData
    }))
  };

  renderConfig = data => {
    let Comp = null;
    if (!data.type) {
      return Comp;
    }

    switch (data.type) {
      case "addParameterKeys":
      case "replaceParameterKeys":
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
      case "removeParameterKeys":
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
      default:
        break;
    }

    return Comp;
  };

  render() {
    const {activeKey} = this.state;

    const columns = [
      {
        title: "Type",
        dataIndex: "type",
        width: 180,
        render: (value, row) => {
          return (
            <Select
              value={row.type}
              onChange={type => this.onChangeConfig({type}, row.id)}
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
                    // eslint-disable-next-line react/no-access-state-in-setstate
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
          <TabPane tab="Body" key="body" />
        </Tabs>
        <Table
          rowKey="id"
          size="small"
          columns={activeKey === "body" ? columns : columns}
          dataSource={this.state[activeKey]}
          pagination={false}
        />
      </>
    );
  }
}

export default class ParamPluginRuleHandle extends Component {
  constructor(props) {
    super(props);
    props.onRef(this);
  }

  getData = () => {
    const {
      form: {getFieldValue}
    } = this.props;
    const value = getFieldValue("handle");
    return value;
  };

  render() {
    const {
      handle,
      form: {getFieldDecorator}
    } = this.props;

    return (
      <Form.Item
        label={getIntlContent("SHENYU.COMMON.DEAL")}
        labelCol={{span: 3}}
        wrapperCol={{span: 21}}
      >
        {getFieldDecorator("handle", {
          initialValue: handle
        })(<ParamPluginRuleConfig />)}
      </Form.Item>
    );
  }
}
