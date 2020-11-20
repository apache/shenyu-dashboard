import React, { Component } from 'react';
import { Modal, Form, Input, Switch } from 'antd';

import { connect } from "dva";

const FormItem = Form.Item;
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
    let { handleCancel, form, type = '', dictCode = '', dictName = '', dictValue = '', desc = '', sort = '0', enabled = true } = this.props;

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
        title="字典"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label="字典类型"
            {...formItemLayout}
          >
            {getFieldDecorator('type', {
              rules: [{ required: true, message: '请输入字典类型' }],
              initialValue: type,
            })(
              <Input placeholder="字典类型" />
            )}
          </FormItem>

          <FormItem
            label="字典编码"
            {...formItemLayout}
          >
            {getFieldDecorator('dictCode', {
              rules: [{ required: true, message: '请输入字典编码' }],
              initialValue: dictCode,
            })(
              <Input placeholder="字典编码" />
            )}
          </FormItem>
          <FormItem
            label="字典名称"
            {...formItemLayout}
          >
            {getFieldDecorator('dictName', {
              rules: [{ required: true, message: '请输入字典名称' }],
              initialValue: dictName,
            })(
              <Input placeholder="字典名称" />
            )}
          </FormItem>
          <FormItem
            label="字典值"
            {...formItemLayout}
          >
            {getFieldDecorator('dictValue', {
              rules: [{ required: true, message: '请输入字典值' }],
              initialValue: dictValue,
            })(
              <Input placeholder="字典值" />
            )}
          </FormItem>
          <FormItem
            label="字典描述或备注"
            {...formItemLayout}
          >
            {getFieldDecorator('desc', {
              initialValue: desc,
            })(
              <TextArea placeholder="字典描述或备注" rows={3} />
            )}
          </FormItem>
          <FormItem
            label="排序"
            {...formItemLayout}
          >
            {getFieldDecorator('sort', {
              rules: [
                {
                  required: true,
                  message: "请输入排序"
                }
              ],
              initialValue: sort,
            })(
              <Input placeholder="排序" type="number" />
            )}
          </FormItem>
          {/* 状态 */}
          {this.props.isShow?
          (
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
          ) : ''}
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(AddModal);
