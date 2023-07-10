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
import {Divider, Form, Input, Modal, Select, Table} from "antd";
import {getIntlContent} from "../../../utils/IntlUtils";
import EditableTable from './upstreamTable';

const FormItem = Form.Item;


@connect(({discovery}) => ({
  ...discovery
}))

class ProxySelectorModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      recordCount: this.props.recordCount,
      upstreams: this.props.discoveryUpstreams,
    };
  }

  handleSubmit = e => {
    const {form, handleOk} = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let {name, forwardPort, props, listenerNode, handler, discoveryProps, serverList, discoveryType} = values;
        const {upstreams} = this.state
        handleOk({name, forwardPort, props, listenerNode, handler, discoveryProps, serverList, discoveryType, upstreams});
      }
    });
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
    const {Option} = Select
    return this.props.typeEnums.map(value =>
      <Option key={value} value={value.toString()}>{value}</Option>
    )
  }

  render() {
    const { tcpType, form, handleCancel, isSetConfig, isAdd, chosenType} = this.props;
    const {recordCount, upstreams } = this.state;
    const {getFieldDecorator} = form;
    const { name, forwardPort, props, listenerNode, handler, discovery} = this.props.data || {};
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 }
      },
      wrapperCol: {
        sm: { span: 17 }
      }
    };
    if (!isAdd || isSetConfig) {
      this.props.dispatch({
        type: 'discovery/saveGlobalType',
        payload: {
          chosenType: tcpType
        }
      })
    }

    const columns = [
      {
        title: 'protocol',
        dataIndex: 'protocol',
        key: 'protocol',
      },
      {
        title: 'url',
        dataIndex: 'url',
        key: 'url',
      },
      {
        title: 'status',
        dataIndex: 'status',
        key: 'status',
      },
      {
        title: 'weight',
        dataIndex: 'weight',
        key: 'weight',
      },
    ];
    return (
      <Modal
        destroyOnClose
        centered
        visible
        onCancel={handleCancel}
        onOk={this.handleSubmit}
        title={getIntlContent("SHENYU.SELECTOR.NAME")}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
      >
        <Form onSubmit={this.handleSubmit}>
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

          <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.NAME")} {...formItemLayout}>
            {getFieldDecorator('name', {
              rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.NAME.INPUT")}],
              initialValue: name
            })(<Input
              placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.NAME.INPUT")}
            />)}
          </FormItem>

          <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT")} {...formItemLayout}>
            {getFieldDecorator('forwardPort', {
              rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT.INPUT")}],
              initialValue: forwardPort
            })(<Input
              placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT.INPUT")}
            />)}
          </FormItem>

          <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS")} {...formItemLayout}>
            {getFieldDecorator('props', {
              rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS.INPUT")}],
              initialValue: props
            })(<Input.TextArea
              placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS.INPUT")}
            />)}
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

                <FormItem label={getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER")} {...formItemLayout}>
                  {getFieldDecorator('handler', {
                    rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER.INPUT")}],
                    initialValue: handler
                  })(<Input.TextArea
                    placeholder={getIntlContent("SHENYU.DISCOVERY.SELECTOR.HANDLER.INPUT")}
                  />)}
                </FormItem>

                {
                  isSetConfig !== true ? (
                    <>
                      <Divider>{getIntlContent("SHENYU.DISCOVERY.SELECTOR.CONFIGURATION")}</Divider>
                      <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST")} {...formItemLayout}>
                        {getFieldDecorator('serverList', {
                          rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT")}],
                          initialValue: discovery.serverList
                        })(<Input
                          placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT")}
                        />)}
                      </FormItem>

                      <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")} {...formItemLayout}>
                        {getFieldDecorator('discoveryProps', {
                          rules: [{required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS.INPUT")}],
                          initialValue: discovery.props
                        })(<Input.TextArea
                          placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS.INPUT")}
                        />)}
                      </FormItem>

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
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(ProxySelectorModal);
