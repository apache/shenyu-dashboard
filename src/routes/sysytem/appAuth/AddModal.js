import React, { Component } from 'react';
import { Modal, Form, Input, Switch } from 'antd';

const FormItem = Form.Item;

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
    let { handleCancel, form, userName = '', enabled = true } = this.props;
    
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
        title="用户"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label="appKey"
            {...formItemLayout}
          >
            {getFieldDecorator('userName', {
              rules: [{ required: true, message: '请输入用户名' }],
              initialValue: userName,
            })(
              <Input placeholder="用户名" />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="状态"
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