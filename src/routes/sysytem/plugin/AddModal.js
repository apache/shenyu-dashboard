import React, { Component } from "react";
import { Modal, Form, Switch, Input, Select } from "antd";
import { connect } from "dva";

const { Option } = Select;
const FormItem = Form.Item;

@connect(({ global }) => ({
  platform: global.platform
}))
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
    let { handleCancel, form, name, enabled = true, role = "0", id } = this.props;

    let disable = false;
    if (id) {
      if (role === 0) {
        disable = true;
      }
    }

    const { getFieldDecorator } = form;

    const formItemLayout = {
      labelCol: {
        sm: { span: 5 }
      },
      wrapperCol: {
        sm: { span: 19 }
      }
    };

    return (
      <Modal
        width={450}
        centered
        title="插件"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label="插件" {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [{ required: true, message: "请选择插件" }],
              initialValue: name,
            })(
              <Input placeholder="插件名" disabled={disable} />
            )}
          </FormItem>
          <FormItem
            label="角色"
            {...formItemLayout}
          >
            {getFieldDecorator('role', {
              rules: [{ required: true, message: '请选择角色' }],
              initialValue: `${role}`,
            })(
              <Select disabled={disable}>
                <Option value="0">系统</Option>
                <Option value="1">自定义</Option>
              </Select>
            )}
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
