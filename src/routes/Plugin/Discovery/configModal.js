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
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { name, serverList, props, tcpType } = values;
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
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 }
      },
      wrapperCol: {
        sm: { span: 17 }
      }
    };
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
          <Form.Item label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE")} {...formItemLayout}>
            {getFieldDecorator('tcpType', {
              rules: [{ required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT") }],
              initialValue: tcpType !== "" ? tcpType : undefined
            })(
              <Select
                placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT")}
              >
                {this.handleOptions()}
              </Select>,
            )}
          </Form.Item>
          <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.NAME")} {...formItemLayout}>
            {getFieldDecorator('name', {
              rules: [{ required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.NAME.INPUT") }],
              initialValue: name
            })(<Input
              placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.NAME.INPUT")}
            />)}
          </FormItem>

          <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST")} {...formItemLayout}>
            {getFieldDecorator('serverList', {
              rules: [{ required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT") }],
              initialValue: serverList
            })(<Input
              placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT")}
            />)}
          </FormItem>

          <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")} {...formItemLayout}>
            {getFieldDecorator('props', {
              rules: [{ required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS.INPUT") }],
              initialValue: props
            })(<Input.TextArea
              placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS.INPUT")}
            />)}
          </FormItem>

        </Form>
      </Modal>
    )
  }
}

export default Form.create()(ConfigModal);
