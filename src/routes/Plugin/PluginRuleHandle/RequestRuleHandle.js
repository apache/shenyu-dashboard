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
import { getIntlContent } from '../../../utils/IntlUtils'

const FormItem = Form.Item;
const { Option } = Select;
const { TabPane } = Tabs;

export default class RequestRuleHandle extends Component {

  constructor(props) {
    super(props);
    props.onRef(this);
    this.state = {
      headerOperateType: [
        {
          label: "addHeaders",
          value: "addHeaders"
        },
        {
          label: "replaceHeaderKeys",
          value: "replaceHeaderKeys"
        },
        {
          label: "setHeaders",
          value: "setHeaders"
        },
        {
          label: "removeHeaderKeys",
          value: "removeHeaderKeys"
        },
      ],
      parameterOperateType: [
        {
          label: "addParameters",
          value: "addParameters"
        },
        {
          label: "replaceParameterKeys",
          value: "replaceParameterKeys"
        },
        {
          label: "setParameters",
          value: "setParameters"
        },
        {
          label: "removeParameterKeys",
          value: "removeParameterKeys"
        },
      ],
      cookieOperateType: [
        {
          label: "addCookies",
          value: "addCookies"
        },
        {
          label: "replaceCookieKeys",
          value: "replaceCookieKeys"
        },
        {
          label: "setCookies",
          value: "setCookies"
        },
        {
          label: "removeCookieKeys",
          value: "removeCookieKeys"
        },
      ],
      currentType: "parameter",


    }
    this.initList(props);
  }

  initList = (props) => {
    let handle = props.handle && JSON.parse(props.handle);
    this.state.parameterList = this.initListByType(handle, "parameter");
    this.state.headerList = this.initListByType(handle, "header");
    this.state.cookieList = this.initListByType(handle, "cookie");
  }

  initListByType = (handle, dataType) => {
    let dataTypeFirstUpper = dataType.substring(0, 1).toUpperCase() + dataType.substring(1, dataType.length);
    let dataTypeUpper = dataType.toUpperCase();
    let addFields = `add${dataTypeFirstUpper}s`;
    let replaceFieldKeys = `replace${dataTypeFirstUpper}Keys`;
    let setFields = `set${dataTypeFirstUpper}s`;
    let removeFields = `remove${dataTypeFirstUpper}Keys`;
    let list = [
      [
        { fieldLabel: "OperateType", fieldName: `${dataType}_type_0`, fieldValue: `add${dataTypeFirstUpper}s` },
        { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.KEY`), fieldName: `${dataType}_key_0`, fieldValue: null },
        { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.VALUE`), fieldName: `${dataType}_value_0`, fieldValue: null },
      ]
    ];
    if (handle && handle[dataType] && (
      (handle[dataType][addFields]&&Object.keys(handle[dataType][addFields]).length > 0) ||
      (handle[dataType][replaceFieldKeys] && Object.keys(handle[dataType][replaceFieldKeys]).length > 0) ||
      (handle[dataType][setFields] && Object.keys(handle[dataType][setFields]).length > 0) ||
      (handle[dataType][removeFields] && handle[dataType][removeFields].length > 0)
    )) {
      list = [];
      let index = 0;
      // eslint-disable-next-line no-unused-expressions
      handle[dataType][addFields] && Object.keys(handle[dataType][addFields]).length > 0 && Object.keys(handle[dataType][addFields]).forEach((e) => {
        let v = handle[dataType][addFields][e];
        list.push([
          { fieldLabel: "OperateType", fieldName: `${dataType}_type_${index}`, fieldValue: `add${dataTypeFirstUpper}s` },
          { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.KEY`), fieldName: `${dataType}_key_${index}`, fieldValue: e },
          { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.VALUE`), fieldName: `${dataType}_value_${index}`, fieldValue: v },
        ]);
        index += 1;
      })
      // eslint-disable-next-line no-unused-expressions
      handle[dataType][replaceFieldKeys] && Object.keys(handle[dataType][replaceFieldKeys]).length > 0 && Object.keys(handle[dataType][replaceFieldKeys]).forEach((e) => {
        let v = handle[dataType][replaceFieldKeys][e];
        list.push([
          { fieldLabel: "OperateType", fieldName: `${dataType}_type_${index}`, fieldValue: `replace${dataTypeFirstUpper}Keys` },
          { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.OLD.KEY`), fieldName: `${dataType}_key_${index}`, fieldValue: e },
          { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.NEW.KEY`), fieldName: `${dataType}_value_${index}`, fieldValue: v },
        ])
        index += 1;
      })
      // eslint-disable-next-line no-unused-expressions
      handle[dataType][setFields] && Object.keys(handle[dataType][setFields]).length > 0 && Object.keys(handle[dataType][setFields]).forEach((e) => {
        let v = handle[dataType][setFields][e];
        list.push([
          { fieldLabel: "OperateType", fieldName: `${dataType}_type_${index}`, fieldValue: `set${dataTypeFirstUpper}s` },
          { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.KEY`), fieldName: `${dataType}_key_${index}`, fieldValue: e },
          { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.VALUE`), fieldName: `${dataType}_value_${index}`, fieldValue: v },
        ])
        index += 1;
      })
      let removeKeys = [];
      // eslint-disable-next-line no-unused-expressions
      (handle[dataType][removeFields] && handle[dataType][removeFields].length > 0) && handle[dataType][removeFields].forEach((e, i) => {
        if (i % 2 === 0) {
          removeKeys.push([]);
        }
        removeKeys[removeKeys.length - 1].push(e);
      });
      // eslint-disable-next-line no-unused-expressions
      (removeKeys && removeKeys.length > 0) && removeKeys.forEach((e) => {
        let dataItem = [
          { fieldLabel: "OperateType", fieldName: `${dataType}_type_${index}`, fieldValue: `remove${dataTypeFirstUpper}Keys` },
          { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.KEY`), fieldName: `${dataType}_key_${index}`, fieldValue: e[0] }
        ];
        if (e[1]) {
          dataItem.push(
            { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${dataTypeUpper}.KEY`), fieldName: `${dataType}_value_${index}`, fieldValue: e[1] }
          )
        }
        list.push(dataItem)
        index += 1;
      })
    }
    return list;
  }

  handleTabChange = (currentType) => {
    this.setState({
      currentType
    })
  }

  handleAddRow = (type) => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    let list = this.state[`${type}List`];
    let strs = list[list.length - 1][0].fieldName.split("_");
    // eslint-disable-next-line radix
    let index = parseInt(strs[strs.length - 1]) + 1;

    let defaultFieldType = this.state[`${type}OperateType`][0].value;
    list.push(
      [
        { fieldLabel: "OperateType", fieldName: `${type}_type_${index}`, fieldValue: defaultFieldType },
        { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.KEY`), fieldName: `${type}_key_${index}`, fieldValue: null },
        { fieldLabel: getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.VALUE`), fieldName: `${type}_value_${index}`, fieldValue: null },
      ]
    )
    this.setState({
      [`${type}List`]: list
    })
  }

  handleDeleteRow = (type, rowIndex) => {
    if (rowIndex === 0) {
      return;
    }
    // eslint-disable-next-line react/no-access-state-in-setstate
    let list = this.state[`${type}List`];
    list.splice(rowIndex, 1);
    this.setState({
      [`${type}List`]: list
    })
  }

  handleTypeChange = (val, type, rowIndex) => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    let list = this.state[`${type}List`];
    if (val.startsWith("replace")) {
      list[rowIndex][1].fieldLabel = getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.OLD.KEY`);
      list[rowIndex][2].fieldLabel = getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.NEW.KEY`);
    } else if (val.startsWith("remove")) {
      list[rowIndex][1].fieldLabel = getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.KEY`);
      list[rowIndex][2].fieldLabel = getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.KEY`);
    } else {
      list[rowIndex][1].fieldLabel = getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.KEY`);
      list[rowIndex][2].fieldLabel = getIntlContent(`SHENYU.PLUGIN.REQUEST.${type.toUpperCase()}.VALUE`);
    }
    this.setState({
      [`${type}List`]: list
    })
  }

  getData = (formValues) => {
    let handle = {
      header: {
        addHeaders: {},
        replaceHeaderKeys: {},
        setHeaders: {},
        removeHeaderKeys: []
      },
      parameter: {
        addParameters: {},
        replaceParameterKeys: {},
        setParameters: {},
        removeParameterKeys: []
      },
      cookie: {
        addCookies: {},
        replaceCookieKeys: {},
        setCookies: {},
        removeCookieKeys: []
      }
    };
    this.buildData(handle, formValues, "parameter");
    this.buildData(handle, formValues, "header");
    this.buildData(handle, formValues, "cookie");
    return JSON.stringify(handle);
  }

  buildData = (handle, formValues, dataType) => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    let list = this.state[`${dataType}List`];
    list.forEach(row => {
      let type = formValues[row[0].fieldName];
      let value1 = row[1]&&formValues[row[1].fieldName];
      let value2 = row.length>2&&formValues[row[2].fieldName];
      if (!type.startsWith("remove") && value1 && value2) {
        handle[dataType][type][value1] = value2
      }
      if (type.startsWith("remove")) {
        if (value1) {
          handle[dataType][type].push(value1)
        }
        if (value2) {
          handle[dataType][type].push(value2)
        }
      }
    })
  }

  render() {
    const { headerOperateType, parameterOperateType, cookieOperateType, currentType, headerList, parameterList, cookieList } = this.state;
    const { form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <div className={styles.handleWrap} style={{ padding: "0px 40px" }}>
        <div className={styles.header}>
          <h3 style={{ width: 60, marginTop: 10 }}>{getIntlContent("SHENYU.COMMON.DEAL")}: </h3>
        </div>
        <Tabs style={{ marginLeft: 10 }} defaultActiveKey={currentType} onChange={this.handleTabChange}>
          <TabPane tab="Params" key="parameter">
            {parameterList && parameterList.length > 0 && (
              parameterList.map((row, rowIndex) => {
                return (
                  <Row gutter={24} key={rowIndex}>
                    {
                      row.map((field, i) => {
                        let rules = [];
                        let placeholder = field.fieldLabel;
                        return (
                          <Col span={6} key={i}>
                            {
                              field.fieldName.includes("type") ? (
                                <FormItem>
                                  {getFieldDecorator(field.fieldName, {
                                    rules,
                                    initialValue: field.fieldValue,
                                  })(
                                    <Select onChange={(val) => { this.handleTypeChange(val, "parameter", rowIndex) }} placeholder={placeholder} style={{ width: 200 }}>
                                      {
                                        parameterOperateType.map(opt => {
                                          return <Option value={opt.value}>{opt.label}</Option>
                                        })
                                      }
                                    </Select>
                                  )
                                  }
                                </FormItem>
                              ) : (
                                <FormItem>
                                  {getFieldDecorator(field.fieldName, {
                                    rules,
                                    initialValue: field.fieldValue,
                                  })(
                                    <Input
                                      // addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                      placeholder={placeholder}
                                      key={field.fieldName}
                                    // type="number"
                                    />)
                                  }
                                </FormItem>
                              )
                            }

                          </Col>
                        )
                      })
                    }
                    <Col span={6}>
                      <Button
                        type="danger"
                        style={{ marginRight: "20px" }}
                        onClick={() => {
                          this.handleDeleteRow("parameter", rowIndex);
                        }}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                      {rowIndex === 0 && (
                        <Button onClick={() => this.handleAddRow("parameter")} type="primary">
                          {getIntlContent("SHENYU.COMMON.ADD")}
                        </Button>
                      )}
                    </Col>
                  </Row>
                )
              })
            )}
          </TabPane>
          <TabPane tab="Headers" key="header">
            {headerList && headerList.length > 0 && (
              headerList.map((row, rowIndex) => {
                return (
                  <Row gutter={24} key={rowIndex}>
                    {
                      row.map((field, i) => {
                        let rules = [];
                        let placeholder = field.fieldLabel;
                        return (
                          <Col span={6} key={i}>
                            {
                              field.fieldName.includes("type") ? (
                                <FormItem>
                                  {getFieldDecorator(field.fieldName, {
                                    rules,
                                    initialValue: field.fieldValue,
                                  })(
                                    <Select onChange={(val) => { this.handleTypeChange(val, "header", rowIndex) }} placeholder={placeholder} style={{ width: 200 }}>
                                      {
                                        headerOperateType.map(opt => {
                                          return <Option value={opt.value}>{opt.label}</Option>
                                        })
                                      }
                                    </Select>
                                  )
                                  }
                                </FormItem>
                              ) : (
                                <FormItem>
                                  {getFieldDecorator(field.fieldName, {
                                    rules,
                                    initialValue: field.fieldValue,
                                  })(
                                    <Input
                                      // addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                      placeholder={placeholder}
                                      key={field.fieldName}
                                    // type="number"
                                    />)
                                  }
                                </FormItem>
                              )
                            }

                          </Col>
                        )
                      })
                    }
                    <Col span={6}>
                      <Button
                        type="danger"
                        style={{ marginRight: "20px" }}
                        onClick={() => {
                          this.handleDeleteRow("header", rowIndex);
                        }}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                      {rowIndex === 0 && (
                        <Button onClick={() => this.handleAddRow("header")} type="primary">
                          {getIntlContent("SHENYU.COMMON.ADD")}
                        </Button>
                      )}
                    </Col>
                  </Row>
                )
              })
            )}
          </TabPane>
          <TabPane tab="Cookies" key="cookie">
            {cookieList && cookieList.length > 0 && (
              cookieList.map((row, rowIndex) => {
                return (
                  <Row gutter={24} key={rowIndex}>
                    {
                      row.map((field, i) => {
                        let rules = [];
                        let placeholder = field.fieldLabel;
                        return (
                          <Col span={6} key={i}>
                            {
                              field.fieldName.includes("type") ? (
                                <FormItem>
                                  {getFieldDecorator(field.fieldName, {
                                    rules,
                                    initialValue: field.fieldValue,
                                  })(
                                    <Select onChange={(val) => { this.handleTypeChange(val, "cookie", rowIndex) }} placeholder={placeholder} style={{ width: 200 }}>
                                      {
                                        cookieOperateType.map(opt => {
                                          return <Option value={opt.value}>{opt.label}</Option>
                                        })
                                      }
                                    </Select>
                                  )
                                  }
                                </FormItem>
                              ) : (
                                <FormItem>
                                  {getFieldDecorator(field.fieldName, {
                                    rules,
                                    initialValue: field.fieldValue,
                                  })(
                                    <Input
                                      // addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                      placeholder={placeholder}
                                      key={field.fieldName}
                                    // type="number"
                                    />)
                                  }
                                </FormItem>
                              )
                            }

                          </Col>
                        )
                      })
                    }
                    <Col span={6}>
                      <Button
                        type="danger"
                        style={{ marginRight: "20px" }}
                        onClick={() => {
                          this.handleDeleteRow("cookie", rowIndex);
                        }}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                      {rowIndex === 0 && (
                        <Button onClick={() => this.handleAddRow("cookie")} type="primary">
                          {getIntlContent("SHENYU.COMMON.ADD")}
                        </Button>
                      )}
                    </Col>
                  </Row>
                )
              })
            )}
          </TabPane>
        </Tabs>
      </div>
    );
  }
}
