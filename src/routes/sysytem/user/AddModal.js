import React, { Component } from 'react';
import { Modal, Form, Select, Input } from 'antd';

const FormItem = Form.Item;
const { Option } = Select;

class AddModal extends Component {

  handleSubmit = (e) => {
    const { form, handleOk } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log(values);
        handleOk();
      }
    });
  }

  render() {
    const { handleCancel, form } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 5},
      },
      wrapperCol: {
        sm: { span: 19 },
      },
    };
    return (
      <Modal
        width={450}
        title="用户"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label="用户名"
            {...formItemLayout}
          >
            {getFieldDecorator('userName', {
              rules: [{ required: true, message: '请输入用户名' }],
            })(
              <Input placeholder="用户名" />
            )}
          </FormItem>
          <FormItem
            label="密码"
            {...formItemLayout}
          >
            {getFieldDecorator('password', {
              rules: [{ required: true, message: '请输入密码密码' }],
            })(
              <Input placeholder="密码" />
            )}
          </FormItem>
          <FormItem
            label="角色"
            {...formItemLayout}
          >
            {getFieldDecorator('role', {
              rules: [{ required: true, message: '请选择角色' }],
            })(
              <Select>
                <Option value="0">管理员</Option>
                <Option value="1">用户</Option>
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(AddModal);