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
import { Modal, Form, Select, InputNumber, Input, Icon, Tooltip } from 'antd';
import IconModal from "./IconModal";
import { getIntlContent } from '../../../utils/IntlUtils';

const FormItem = Form.Item;
const { Option } = Select;

class AddModal extends Component {

  state = {
    popup: "",
    icon: undefined,
  }

  handleSubmit = (e) => {
    const { form, handleOk, id = '' } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({...values, id});
      }
    });
  }

  closeModal = () => {
    this.setState({ popup: "" });
  };

  handleChooseIcon = () => {
    this.setState({
      popup: (
        <IconModal
          onChooseIcon={(icon) => {
            const { form: { setFieldsValue }} = this.props;
            setFieldsValue({icon})
            this.setState({
              icon,
              popup: ""
            })
          }}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      )
    })
  }

  render() {
    let { handleCancel, menuTree, id, parentId, perms, form, sort, title, icon, url, resourceType } = this.props;
    const { popup } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 },
      },
      wrapperCol: {
        sm: { span: 18 },
      },
    };
    return (
      <Modal
        width={550}
        centered
        title={getIntlContent("SHENYU.SYSTEM.RESOURCE")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.RESOURCETYPE")}
            {...formItemLayout}
          >
            {getFieldDecorator('resourceType', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.RESOURCETYPE.INPUT") }],
              initialValue: resourceType,
            })(
              <Select disabled>
                <Option value={0}>{getIntlContent("SHENYU.SYSTEM.MAINMENU")}</Option>
                <Option value={1}>{getIntlContent("SHENYU.SYSTEM.SUBMENU")}</Option>
                <Option value={2}>{getIntlContent("SHENYU.SYSTEM.BUTTON")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.RESOURCENAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('title', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.RESOURCENAME.INPUT") }],
              initialValue: (title && getIntlContent(title)) || title,
            })(
              <Input disabled={!!id} placeholder={getIntlContent("SHENYU.SYSTEM.RESOURCENAME.INPUT")} />
            )}
          </FormItem>
          {resourceType !== 2 && menuTree && menuTree.length > 0 && (
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.RESOURCE.PARENT")}
            {...formItemLayout}
          >
            {getFieldDecorator('parentId', {
              rules: [{ message: getIntlContent("SHENYU.SYSTEM.RESOURCE.PARENT.INPUT") }],
              initialValue: parentId,
            })(
              <Select disabled={!!id} allowClear placeholder={getIntlContent("SHENYU.SYSTEM.RESOURCE.PARENT.INPUT")} style={{width: '100%'}}>
                {menuTree.map((menu)=><Option value={menu.id} disabled={menu.url === "/plug"} key={menu.id}>{(menu.title && getIntlContent(menu.title)) || menu.title}</Option>)}
              </Select>
            )}
          </FormItem>
          )}
          {resourceType !== 2 && (
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ROUTER")}
            {...formItemLayout}
          >
            {getFieldDecorator('url', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.ROUTER.INPUT") }],
              initialValue: url,
            })(
              <Input disabled={!!id} placeholder={getIntlContent("SHENYU.SYSTEM.ROUTER.INPUT")} />
            )}
          </FormItem>
          )}
          {resourceType !== 2 && (
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.RESOURCEORDER")}
            {...formItemLayout}
          >
            {getFieldDecorator('sort', {
              rules: [{ required: true, message: getIntlContent("SHENYU.SYSTEM.RESOURCEORDER.INPUT") }],
              initialValue: sort,
            })(
              <InputNumber style={{width:"100%"}} placeholder={getIntlContent("SHENYU.SYSTEM.RESOURCEORDER.INPUT")} />
            )}
          </FormItem>
          )}
          {resourceType === 2 && (
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.RESOURCE.PERMS")}
            {...formItemLayout}
          >
            {getFieldDecorator('perms', {
              rules: [{ message: getIntlContent("SHENYU.SYSTEM.RESOURCE.PERMS.INPUT") }],
              initialValue: perms
            })(
              <Input disabled={!!id} placeholder={getIntlContent("SHENYU.SYSTEM.RESOURCE.PERMS.INPUT")} />
            )}
          </FormItem>
          )}
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ICON")}
            {...formItemLayout}
          >
            {getFieldDecorator('icon', {
              rules: [{ required: false, message: getIntlContent("SHENYU.SYSTEM.ICON.INPUT") }],
              initialValue: icon,
            })(
              <Input
                readOnly
                placeholder={!icon&&getIntlContent("SHENYU.SYSTEM.ICON.INPUT")}
                prefix={(this.state.icon||icon)&&<Icon type={this.state.icon||icon} />}
                suffix={
                  <Tooltip title={getIntlContent("SHENYU.SYSTEM.ICON.INPUT")}>
                    <Icon type="plus" onClick={this.handleChooseIcon} />
                  </Tooltip>
                }
              />
            )}
          </FormItem>
        </Form>
        {popup}
      </Modal>
    )
  }
}

export default Form.create()(AddModal);
