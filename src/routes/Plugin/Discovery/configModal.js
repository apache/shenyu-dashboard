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
import {Form, Input, Modal, Select} from "antd";
import {getIntlContent} from "../../../utils/IntlUtils";


const FormItem = Form.Item;


class ConfigModal extends Component {


  handleSubmit = e => {
    const { form, handleOk } = this.props;
    // console.log("I'm submit");
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { name, serverList, props, tcpType } = values;
        // console.log("id", id);
        handleOk({ name, serverList, props, tcpType});
      }
    });
  };


  handleOptions() {
    const {Option} = Select;
    return this.props.typeEnums
      .filter(value => value !== "local")
      .map(value => <Option key={value} value={value.toString()}>{value}</Option>)
  }

  render() {
    const { handleCancel, form, data } = this.props
    const { getFieldDecorator } = form;
    const { name, serverList, props, type: tcpType} = data || {};
    return (
      <Modal
        visible
        centered
        title={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.CONFIGURATION")}
        onCancel={handleCancel}
        onOk={this.handleSubmit}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        destroyOnClose
      >
        <Form onSubmit={this.handleSubmit}>
          <Form.Item label="Type">
            {getFieldDecorator('tcpType', {
              rules: [{ required: true, message: 'Please select the discovery type!' }],
              initialValue: tcpType !== "" ? tcpType : undefined
            })(
              <Select
                placeholder="Please select the discovery type"
              >
                {this.handleOptions()}
              </Select>,
            )}
          </Form.Item>
          <FormItem label="Name">
            {getFieldDecorator('name', {
              rules: [{ required: true, message: 'Please input the discovery name!' }],
              initialValue: name
            })(<Input
              placeholder="the discovery name"
            />)}
          </FormItem>

          <FormItem label="ServerList">
            {getFieldDecorator('serverList', {
              rules: [{ required: true, message: 'Please input the register server url!' }],
              initialValue: serverList
            })(<Input
              placeholder="register server url"
            />)}
          </FormItem>

          <FormItem label="Props">
            {getFieldDecorator('props', {
              rules: [{ required: true, message: 'Please input the props!' }],
              initialValue: props
            })(<Input.TextArea
              placeholder="the discovery props"
            />)}
          </FormItem>

        </Form>
      </Modal>
    )
  }
}

export default Form.create()(ConfigModal);
