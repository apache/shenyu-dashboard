import React, { Component } from "react";
import { Modal, Form, Select, Input } from "antd";

const FormItem = Form.Item;
const { Option } = Select;

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
    let { handleCancel, form, userName = "" } = this.props;

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
        width={600}
        title="用户"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label="名称" {...formItemLayout}>
            {getFieldDecorator("userName", {
              rules: [{ required: true, message: "请输入名称" }],
              initialValue: userName
            })(<Input placeholder="名称" />)}
          </FormItem>
          <FormItem label="类型" {...formItemLayout}>
            {getFieldDecorator("type", {
              rules: [{ required: true, message: "请选择类型" }],
              initialValue: ""
            })(
              <Select>
                <Option value="0">管理员</Option>
                <Option value="1">用户</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label="匹配方式" {...formItemLayout}>
            {getFieldDecorator("matchMode", {
              rules: [{ required: true, message: "请选择匹配方式" }],
              initialValue: ""
            })(
              <Select>
                <Option value="0">管理员</Option>
                <Option value="1">用户</Option>
              </Select>
            )}
          </FormItem>

          <div>条件</div>
          <FormItem label="处理" {...formItemLayout}>
            {getFieldDecorator("matchMode", {
              rules: [{ required: true, message: "请选择处理方式" }],
              initialValue: ""
            })(
              <Select>
                <Option value="0">管理员</Option>
                <Option value="1">用户</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label="日志" {...formItemLayout}>
            {getFieldDecorator("matchMode", {
              rules: [{ required: true, message: "请选择是否打印日志" }],
              initialValue: ""
            })(
              <Select>
                <Option value="0">是</Option>
                <Option value="1">否</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label="是否开启" {...formItemLayout}>
            {getFieldDecorator("matchMode", {
              rules: [{ required: true, message: "请选择是否开启" }],
              initialValue: ""
            })(
              <Select>
                <Option value="0">是</Option>
                <Option value="1">否</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label="执行顺序" {...formItemLayout}>
            {getFieldDecorator("userName", {
              rules: [{ required: true, message: "" }],
              initialValue: userName
            })(<Input placeholder="可以填写1-100之间的数字标志执行先后顺序" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
