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
import { getIntlContent } from '../../../utils/IntlUtils';

const FormItem = Form.Item;
const { Option } = Select;

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
    let { handleCancel, form, userName = '', password = '', roles = [], enabled = true, allRoles = [] } = this.props;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 5 },
      },
      wrapperCol: {
        sm: { span: 19 },
      },
    };
    return (
      <Modal
        width={450}
        centered
        title={getIntlContent("SHENYU.SYSTEM.USER")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.USERNAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('userName', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.USER.NAME") }],
              initialValue: userName,
            })(
              <Input readOnly={userName === "admin"} placeholder={getIntlContent("SHENYU.SYSTEM.USERNAME")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.PASSWORD")}
            {...formItemLayout}
          >
            {getFieldDecorator('password', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.USER.PASSWORD") }],
              initialValue: password,
            })(
              <Input placeholder={getIntlContent("SHENYU.SYSTEM.PASSWORD")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ROLE")}
            {...formItemLayout}
          >
            {getFieldDecorator('roles', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.SELECTROLE")}],
              initialValue: roles.map(e=>e.id),
            })(
              <Select mode="multiple" placeholder={getIntlContent("SHENYU.SYSTEM.SELECTROLE")} style={{width: '100%'}}>
                {allRoles.map((roleItem)=><Option value={roleItem.id} key={roleItem.id}>{roleItem.roleName}</Option>)}
              </Select>
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={getIntlContent("SHENYU.SYSTEM.STATUS")}
          >
            {getFieldDecorator('enabled', {
              initialValue: enabled,
              valuePropName: 'checked',
            })(
              <Switch />
            )}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(AddModal);
