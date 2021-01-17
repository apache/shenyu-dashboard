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
        title={getIntlContent("SOUL.SYSTEM.USER")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.USERNAME")}
            {...formItemLayout}
          >
            {getFieldDecorator('userName', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.USER.NAME") }],
              initialValue: userName,
            })(
              <Input readOnly={userName === "admin"} placeholder={getIntlContent("SOUL.SYSTEM.USERNAME")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.PASSWORD")}
            {...formItemLayout}
          >
            {getFieldDecorator('password', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.USER.PASSWORD") }],
              initialValue: password,
            })(
              <Input placeholder={getIntlContent("SOUL.SYSTEM.PASSWORD")} />
            )}
          </FormItem>
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.ROLE")}
            {...formItemLayout}
          >
            {getFieldDecorator('roles', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.SELECTROLE")}],
              initialValue: roles.map(e=>e.id),
            })(
              <Select mode="multiple" placeholder={getIntlContent("SOUL.SYSTEM.SELECTROLE")} style={{width: '100%'}}>
                {allRoles.map((roleItem)=><Option value={roleItem.id} key={roleItem.id}>{roleItem.roleName}</Option>)}
              </Select>
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={getIntlContent("SOUL.SYSTEM.STATUS")}
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
