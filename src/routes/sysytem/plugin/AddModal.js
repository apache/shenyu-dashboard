import React, { Component } from "react";
import { Modal, Form, Switch, Select } from "antd";
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
    let { handleCancel, form, code, enabled = true, platform , disabled} = this.props;

    const { getFieldDecorator } = form;

    const { pluginEnums } = platform;

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
            {getFieldDecorator("code", {
              rules: [{ required: true, message: "请选择插件" }],
              initialValue: code,
            })(
              <Select disabled={disabled}>
                {pluginEnums &&
                  pluginEnums.map(item => {
                    return (
                      <Option key={item.code} value={item.code}>
                        {item.name}
                      </Option>
                    );
                  })}
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
