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
import {connect} from "dva";
import {Button, Col, Divider, Form, Input, Modal, Row, Select, Table, Tabs, Tooltip} from "antd";
import classnames from "classnames";
import {getIntlContent} from "../../../utils/IntlUtils";
import EditableTable from './UpstreamTable';
import styles from "../index.less";
import ProxySelectorCopy from "./ProxySelectorCopy.js";
import { findKeyByValue } from "../../../utils/utils";


const FormItem = Form.Item;
const { TabPane } = Tabs;
const { Option } = Select;

@connect(({discovery, pluginHandle, shenyuDict}) => ({
  ...discovery,
  ...pluginHandle,
  ...shenyuDict
}))

class ProxySelectorModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      recordCount: this.props.recordCount,
      upstreams: this.props.discoveryUpstreams,
      zkjson: JSON.parse(this.props.zkProps),
      pluginHandleList: [],
      visible: false,
      discoveryHandler: null,
      defaultValueList: null
    };
  }

  componentDidMount() {
    const { isAdd, isSetConfig, tcpType, data, pluginId, dispatch } = this.props;
    const { props } = this.props.data || {};
    if (!isAdd || isSetConfig) {
      this.setState({zkjson: JSON.parse(data.discovery.props)})
      dispatch({
        type: 'discovery/saveGlobalType',
        payload: {
          chosenType: tcpType
        }
      });
    }else{
      dispatch({
        type: 'discovery/saveGlobalType',
        payload: {
          chosenType: null
        }
      });
    }
    let type = 1;
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload: {
        pluginId,
        type,
        handle: props,
        isHandleArray: false,
        callBack: (pluginHandles) => {
          const filteredArray = pluginHandles[0].filter(item => item.field !== 'discoveryHandler');
          const handlerArray = pluginHandles[0].filter(item => item.field === 'discoveryHandler');
          pluginHandles[0] = filteredArray;
          this.setState({discoveryHandler: handlerArray});
          this.setState({ pluginHandleList: pluginHandles });
          let defaultValue = handlerArray[0].defaultValue;
          this.setState({ defaultValueList: defaultValue.split(",")  });
        }
      }
    });
  }

  handleSubmit = e => {
    const {form, handleOk} = this.props;
    const { zkjson, upstreams, pluginHandleList, defaultValueList } = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let {name, forwardPort, listenerNode, serverList, discoveryType} = values;
        const discoveryPropsJson = {};
        Object.entries(zkjson).forEach(([key]) => {
          discoveryPropsJson[key] = form.getFieldValue(key);
        });
        const discoveryProps = JSON.stringify(discoveryPropsJson); // 将字段值转换为JSON字符串
        console.log("discoveryProps", discoveryProps); // 打印JSON字符串，或根据您的需求进行处理

        let handler = {};
        if ( defaultValueList !== null) {
          defaultValueList.forEach(item => {
            if ((values[item]) !== undefined){
              handler[values[item]] = item;
            }
          });
        }

        let handleResult = [];
        handleResult[0] = {};
        pluginHandleList[0].forEach(item => {
          handleResult[0][item.field] = values[item.field + 0];
        });

        handler = JSON.stringify(handler);
        let props = JSON.stringify(handleResult[0]);

        console.log("props", props)
        console.log("handler", handler)
        handleOk({name, forwardPort, props, listenerNode, handler, discoveryProps, serverList, discoveryType, upstreams});
      }
    });
  };

  handleCopyData = copyData => {
    const { form, dispatch } = this.props;
    const { name, forwardPort, discovery, listenerNode } = copyData;
    const formData = {
      name,
      forwardPort,
      listenerNode,
      discoveryType: discovery.type,
      serverList: discovery.serverList
    };
    dispatch({
      type: 'discovery/saveGlobalType',
      payload: {
        chosenType: discovery.type
      }
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

  handleChange = (index, value) => {
    this.setState({
      [index]: value
    });
  }

  handleOptions() {
    return this.props.typeEnums.map(value =>
      <Option key={value} value={value.toString()}>{value}</Option>
    )
  }


  render() {
    const { tcpType, form, handleCancel, isSetConfig, isAdd, chosenType } = this.props;
    const {recordCount, upstreams, zkjson, pluginHandleList, visible, discoveryHandler, defaultValueList } = this.state;
    const {getFieldDecorator} = form;
    const { name, forwardPort, listenerNode, discovery, handler } = this.props.data || {};
    const labelWidth = 200;
    const formItemLayout = {
      labelCol: {
        sm: { span: 4 }
      },
      wrapperCol: {
        sm: { span: 19 }
      }
    };
    console.log("handlerhere", handler)
    const columns = [
      {
        title: 'protocol',
        dataIndex: 'protocol',
        key: 'protocol',
        align: 'center'
      },
      {
        title: 'url',
        dataIndex: 'url',
        key: 'url',
        align: 'center'
      },
      {
        title: 'status',
        dataIndex: 'status',
        key: 'status',
        align: 'center'
      },
      {
        title: 'weight',
        dataIndex: 'weight',
        key: 'weight',
        align: 'center'
      },
    ];

    if (discoveryHandler === null) {
      return <div>Loading...</div>;
    }
    return (
      <Modal
        destroyOnClose
        centered
        visible
        width='60%'
        onCancel={handleCancel}
        onOk={this.handleSubmit}
        title={getIntlContent("SHENYU.SELECTOR.NAME")}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
      >
        <Form onSubmit={this.handleSubmit}>
          <Tabs defaultActiveKey="1" size="small">
            <TabPane tab={getIntlContent("SHENYU.DISCOVERY.SELECTOR.CONFIG.BASIC")} key="1">
              <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.NAME")} {...formItemLayout}>
                {getFieldDecorator('name', {
                  rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.NAME.INPUT")}],
                  initialValue: name
                })(<Input
                  placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.NAME.INPUT")}
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
                />)}
              </FormItem>

              <ProxySelectorCopy
                visible={visible}
                onOk={this.handleCopyData}
                onCancel={() => {
                  this.setState({ visible: false });
                }}
              />

              <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT")} {...formItemLayout}>
                {getFieldDecorator('forwardPort', {
                  rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT.INPUT")}],
                  initialValue: forwardPort
                })(<Input
                  placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT.INPUT")}
                />)}
              </FormItem>

              {/* <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS")} {...formItemLayout}> */}
              {/*   {getFieldDecorator('props', { */}
              {/*     initialValue: isAdd === true ? selectorProps : props */}
              {/*   })(<Input.TextArea */}
              {/*     placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS.INPUT")} */}
              {/*     style={{ height: '100px' }} */}
              {/*   />)} */}
              {/* </FormItem> */}

              <FormItem
                label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS")}
                {...formItemLayout}
              >
                <div
                  className={styles.handleWrap}
                  style={{
                    display: "flex"
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
                            flexDirection: "row"
                          }}
                        >
                          <ul
                            className={classnames({
                              [styles.handleUl]: true,
                              [styles.springUl]: true
                            })}
                            style={{ width: "100%" }}
                          >
                            {handleList.map(item => {
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
                                      <FormItem>
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
                                          initialValue: defaultValue
                                        })(
                                          <Select
                                            placeholder={placeholder}
                                            style={{ width: 260 }}
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
                                          />
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

              <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER")} {...formItemLayout}>
                <div
                  className={styles.handleWrap}
                  style={{
                    display: "flex"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexDirection: "row"
                    }}
                  >
                    <ul
                      className={classnames({
                        [styles.handleUl]: true,
                        [styles.springUl]: true
                      })}
                      style={{ width: "100%" }}
                    >
                      {(() => {
                        if(discoveryHandler != null ){
                          let item = discoveryHandler[0];
                          let checkRule = item.checkRule;
                          let required = item.required === "1";
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
                          if (defaultValueList != null) {
                            return defaultValueList.map((value, index) => (
                              <li key={index}>
                                <FormItem>
                                  {getFieldDecorator(value, {
                                    initialValue: isAdd === true ? findKeyByValue(handler, value): findKeyByValue(JSON.parse(handler), value),
                                    rules
                                  })(
                                    <Input
                                      addonAfter={
                                        <div style={{ width: '50px' }}>
                                          {value}
                                        </div>
                                      }
                                      placeholder={`Your ${value}`}
                                      key={value}
                                    />
                                  )}
                                </FormItem>
                              </li>
                            ));
                          }

                          // if (Object.keys(hh).length !== 0) {
                          //   Object.entries(hh).forEach(([key]) => {
                          //     let value = hh[key];
                          //     let field = { [value]: key }; // 使用动态键来设置字段值
                          //     form.setFieldsValue(field);
                          //   });
                          // }

                          // else if(defaultValueJson !== null) {
                          //   return Object.keys(defaultValueJson).map(key => (
                          //     <li key={defaultValueJson[key]}>
                          //       <FormItem>
                          //         {getFieldDecorator(defaultValueJson[key], {
                          //           rules,
                          //           initialValue: key
                          //         })(
                          //           <Input
                          //             addonAfter={
                          //               <div style={{ width: '50px' }}>
                          //                 {defaultValueJson[key]}
                          //               </div>
                          //             }
                          //             placeholder={`Your ${defaultValueJson[key]}`}
                          //             key={defaultValueJson[key]}
                          //           />
                          //         )}
                          //       </FormItem>
                          //     </li>
                          //   ));
                          // }
                          // 默认情况下，以<li>展示整个defaultValue对象
                          // return <li>{JSON.stringify(defaultValue)}</li>;
                        }
                        // let required = discoveryHandler.required;
                      })()}
                    </ul>
                  </div>
                </div>
              </FormItem>

            </TabPane>
            <TabPane tab={getIntlContent("SHENYU.DISCOVERY.SELECTOR.CONFIG.DISCOVERY")} key="2">
              <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE")} {...formItemLayout}>
                {getFieldDecorator('discoveryType', {
                  rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT")}],
                  initialValue: tcpType !== '' ? tcpType : undefined
                })(
                  <Select
                    placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT")}
                    disabled={isSetConfig||!isAdd}
                    onChange={value => this.props.dispatch({
                      type: 'discovery/saveGlobalType',
                      payload: {
                        chosenType: value
                      }
                    })}
                  >
                    {this.handleOptions()}
                  </Select>,
                )}
              </FormItem>

              {
                chosenType !== 'local' ? (
                  <>
                    <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.LISTENERNODE")} {...formItemLayout}>
                      {getFieldDecorator('listenerNode', {
                        rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.LISTENERNODE.INPUT")}],
                        initialValue: listenerNode
                      })(<Input
                        placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.LISTENERNODE.INPUT")}
                      />)}
                    </FormItem>

                    {/* <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER")} {...formItemLayout}> */}
                    {/*   {getFieldDecorator('handler', { */}
                    {/*     rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER.INPUT")}], */}
                    {/*     initialValue: isAdd === true ? handlerProps : handler */}
                    {/*   })(<Input.TextArea */}
                    {/*     placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER.INPUT")} */}
                    {/*     style={{ height: '100px' }} */}
                    {/*   />)} */}
                    {/* </FormItem> */}



                    {
                      isSetConfig !== true ? (
                        <>
                          <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST")} {...formItemLayout}>
                            {getFieldDecorator('serverList', {
                              rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT")}],
                              initialValue: discovery.serverList
                            })(<Input
                              placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT")}
                            />)}
                          </FormItem>

                          {/* <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")} {...formItemLayout}> */}
                          {/*   {getFieldDecorator('discoveryProps', { */}
                          {/*     initialValue: chosenType === 'zookeeper' && isAdd === true ? zkProps : discovery.props */}
                          {/*   })(<Input.TextArea */}
                          {/*     placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS.INPUT")} */}
                          {/*     style={{ height: '100px' }} */}
                          {/*   />)} */}
                          {/* </FormItem> */}
                          <div style={{ marginLeft: '50px', marginTop: '15px', marginBottom: '15px', fontWeight: '500', }}>
                            {getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")}
                            <span style={{ marginLeft: '2px', fontWeight: '500' }}>:</span>
                          </div>
                          <div style={{ marginLeft: '35px', display: 'flex', alignItems: 'baseline' }}>
                            <div style={{ marginLeft: '8px' }}>
                              <Row gutter={[16, 4]} justify="center">
                                {Object.entries(zkjson).map(([key, value]) => (
                                  <Col span={12} key={key}>
                                    <FormItem>
                                      {getFieldDecorator(key, {
                                        initialValue: value
                                      })(
                                        <Input
                                          placeholder={`Enter ${key}`}
                                          addonBefore={key}
                                        />
                                      )}
                                    </FormItem>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          </div>

                        </>
                      ) : null
                    }

                    {
                      isAdd !== true ? (
                        <>
                          <Divider>{getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM")}</Divider>
                          <Table dataSource={upstreams} columns={columns} />;
                        </>
                      ):null
                    }
                  </>
                ) : (
                  <>
                    <Divider>{getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM")}</Divider>
                    <EditableTable
                      dataSource={upstreams}
                      recordCount={recordCount}
                      onTableChange={this.handleTableChange}
                      onCountChange={this.handleCountChange}
                    />
                  </>
                )
              }
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(ProxySelectorModal);
