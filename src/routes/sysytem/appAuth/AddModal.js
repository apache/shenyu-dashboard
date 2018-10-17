import React, { Component } from "react";
import { Modal, Form, Input, Switch } from "antd";

const FormItem = Form.Item;

class AddModal extends Component {
  handleSubmit = e => {
    const { form, handleOk, id = "" } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({ ...values, id });
      }
    });
  };

  render() {
    let {
      handleCancel,
      form,
      appKey = "",
      appSecret = "",
      enabled = true
    } = this.props;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 }
      },
      wrapperCol: {
        sm: { span: 18 }
      }
    };
    return (
      <Modal
        width={450}
        centered
        title="认证"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label="module" {...formItemLayout}>
            {getFieldDecorator("appKey", {
              rules: [{ required: true, message: "请输入appKey" }],
              initialValue: appKey
            })(<Input placeholder="appKey" />)}
          </FormItem>
          <FormItem label="appSecret" {...formItemLayout}>
            {getFieldDecorator("appSecret", {
              rules: [{ required: true, message: "请输入appSecret" }],
              initialValue: appSecret
            })(<Input placeholder="appSecret" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="状态">
            {getFieldDecorator("enabled", {
              initialValue: enabled,
              valuePropName: "checked"
            })(<Switch />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
