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
import {Divider, Form, Input, Modal, Select} from "antd";
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
      Upstreams: this.props.discoveryUpstreams,
    };
  }

  handleSubmit = e => {
    const {form, handleOk} = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let {name, forwardPort, props, listenerNode, handler, discoveryProps, serverList, discoveryType} = values;
        const {Upstreams} = this.state
        handleOk({name, forwardPort, props, listenerNode, handler, discoveryProps, serverList, discoveryType, Upstreams});
      }
    });
  };

  handleTableChange = (newData) => {
    const {discoveryUpstreams} = this.state;
    this.setState({ Upstreams: newData });
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
    const {recordCount, Upstreams } = this.state;
    const {getFieldDecorator} = form;
    const { name, forwardPort, props, listenerNode, handler, discovery} = this.props.data || {};
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
          <FormItem label="Type">
            {getFieldDecorator('discoveryType', {
              rules: [{required: true, message: 'Please select the discovery type!'}],
              initialValue: tcpType !== '' ? tcpType : undefined
            })(
              <Select
                placeholder="Please select the discovery type"
                disabled={isSetConfig}
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

          <FormItem label="Name">
            {getFieldDecorator('name', {
              rules: [{required: true, message: 'Please input the proxy selector name!'}],
              initialValue: name
            })(<Input
              placeholder="the proxy selector name"
            />)}
          </FormItem>

          <FormItem label="ForwardPort">
            {getFieldDecorator('forwardPort', {
              rules: [{required: true, message: 'Please input the forwardPort!'}],
              initialValue: forwardPort
            })(<Input
              placeholder="the forwardPort"
            />)}
          </FormItem>

          <FormItem label="Props">
            {getFieldDecorator('props', {
              rules: [{required: true, message: 'Please input the proxy selector props!'}],
              initialValue: props
            })(<Input.TextArea
              placeholder="the proxy selector props"
            />)}
          </FormItem>

          {
            chosenType !== 'local' ? (
              <>
                <FormItem label="ListenerNode">
                  {getFieldDecorator('listenerNode', {
                    rules: [{required: true, message: 'Please input the listenerNode!'}],
                    initialValue: listenerNode
                  })(<Input
                    placeholder="the listenerNode"
                  />)}
                </FormItem>

                <FormItem label="Handler">
                  {getFieldDecorator('handler', {
                    rules: [{required: true, message: 'Please input the handler!'}],
                    initialValue: handler
                  })(<Input.TextArea
                    placeholder="the handler"
                  />)}
                </FormItem>

                {
                  isSetConfig !== true && (
                    <>
                      <Divider />
                      <FormItem label="ServerList">
                        {getFieldDecorator('serverList', {
                          rules: [{required: true, message: 'Please input the discovery server list!'}],
                          initialValue: discovery.serverList
                        })(<Input
                          placeholder="the discovery server list"
                        />)}
                      </FormItem>

                      <FormItem label="Props">
                        {getFieldDecorator('discoveryProps', {
                          rules: [{required: true, message: 'Please input the discovery props!'}],
                          initialValue: discovery.props
                        })(<Input.TextArea
                          placeholder="the discovery props"
                        />)}
                      </FormItem>

                    </>
                  )
                }

                {
                  isAdd !== true && (
                    <>
                      <Divider />
                      <EditableTable
                        dataSource={Upstreams}
                        recordCount={recordCount}
                        onTableChange={this.handleTableChange}
                        onCountChange={this.handleCountChange}
                      />
                    </>
                  )
                }
              </>
            ) : (
              <>
                <Divider />
                {/* {this.renderDiscoveryUpstreams(discoveryUpstreams)} */}
                <EditableTable
                  dataSource={Upstreams}
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
