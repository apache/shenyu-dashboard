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

import React, { Component } from 'react';
import { Modal, Form, Select, Input, Switch } from 'antd';

import { connect } from "dva";
import { getIntlContent } from '../../../utils/IntlUtils';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;
@connect(({ global }) => ({
  platform: global.platform
}))

class AddModal extends Component {

  handleSubmit = (e) => {
    const { form, handleOk, id = '' } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({...values, id});
      }
    });
  }

  render() {
    let { handleCancel, platform, form, appName = '', serviceName='', rpcType='', methodName='',rpcExt='', path='',pathDesc, parameterTypes = '', enabled = true } = this.props;
    let {
      rpcTypeEnums,

    } = platform;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 8 },
      },
      wrapperCol: {
        sm: { span: 16 },
      },
    };
    return (
      <Modal
        width={450}
        centered
        title={getIntlContent("SHENYU.META.DATA")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent( "SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.AUTH.APPNAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('appName', {
              rules: [{ required: true, message: getIntlContent("SHENYU.AUTH.INPUT") + getIntlContent("SHENYU.AUTH.APPNAME") }],
              initialValue: appName,
            })(
              <Input placeholder={getIntlContent("SHENYU.AUTH.APPNAME")} />
            )}
          </FormItem>

          <FormItem
            label={getIntlContent("SHENYU.META.FUNC.NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('methodName', {
              rules: [{ required: true, message: getIntlContent("SHENYU.AUTH.INPUT") + getIntlContent("SHENYU.META.FUNC.NAME") }],
              initialValue: methodName,
            })(
              <Input placeholder={getIntlContent("SHENYU.META.FUNC.NAME")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.META.PATH")}
            {...formItemLayout}
          >
            {getFieldDecorator('path', {
              rules: [{ required: true, message: getIntlContent("SHENYU.AUTH.INPUT") + getIntlContent("SHENYU.META.PATH") }],
              initialValue: path,
            })(
              <Input placeholder={getIntlContent("SHENYU.META.PATH")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.AUTH.PATH.DESCRIBE")}
            {...formItemLayout}
          >
            {getFieldDecorator('pathDesc', {
              rules: [{ required: false, message: getIntlContent("SHENYU.AUTH.INPUT") + getIntlContent("SHENYU.AUTH.PATH.DESCRIBE")}],
              initialValue: pathDesc,
            })(
              <Input placeholder={getIntlContent("SHENYU.AUTH.PATH.DESCRIBE")} />
            )}
          </FormItem>
          <FormItem
            label={`${getIntlContent("SHENYU.AUTH.PARAMS")}${getIntlContent("SHENYU.COMMON.TYPE")}`}
            {...formItemLayout}
          >
            {getFieldDecorator('parameterTypes', {
              rules: [{ required: false, message: `${getIntlContent("SHENYU.AUTH.INPUT")}${getIntlContent("SHENYU.AUTH.PARAMS")}${getIntlContent("SHENYU.COMMON.TYPE")}` }],
              initialValue: parameterTypes,
            })(
              <Input placeholder={`${getIntlContent("SHENYU.AUTH.PARAMS")}${getIntlContent("SHENYU.COMMON.TYPE")}`} />
            )}
          </FormItem>
          <FormItem
            label={`Rpc${getIntlContent("SHENYU.META.EXPAND.PARAMS")}`}
            {...formItemLayout}
          >
            {getFieldDecorator('rpcExt', {
              rules: [{ message: `${getIntlContent("SHENYU.AUTH.INPUT")}Rpc${getIntlContent("SHENYU.META.EXPAND.PARAMS")}` }],
              initialValue: rpcExt,
            })(
              <TextArea placeholder={`Rpc${getIntlContent( "SHENYU.META.EXPAND.PARAMS")}`} rows={3} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.META.SERVER.INTER")}
            {...formItemLayout}
          >
            {getFieldDecorator('serviceName', {
              rules: [{ required: true, message: getIntlContent("SHENYU.META.INPUTSERVICEINTERFACE") }],
              initialValue: serviceName,
            })(
              <Input placeholder={getIntlContent("SHENYU.META.SERVER.INTER")} />
            )}
          </FormItem>
          {/* select */}
          <FormItem
            label={`Rpc${getIntlContent("SHENYU.COMMON.TYPE")}`}
            {...formItemLayout}
          >
            {getFieldDecorator('rpcType', {
              rules: [{ required: true, message: getIntlContent("SHENYU.META.SELECTRPCTYPE") }],
              initialValue: rpcType,
            })(
              <Select>
                {rpcTypeEnums.map(item => {
                  return (
                    <Option key={item.name} value={`${item.name}`}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          {/* status */}
          {
          (
            <FormItem
              {...formItemLayout}
              label={getIntlContent("SHENYU.SYSTEM.STATUS")}
            >
              {getFieldDecorator('enabled', {
              initialValue: enabled,
              valuePropName: 'checked',
            })(
              <Switch disabled={!this.props.isShow} />
            )}
            </FormItem>
          )}
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(AddModal);
