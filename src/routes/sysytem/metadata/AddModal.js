import React, { Component } from 'react';
import { Modal, Form, Select, Input, Switch } from 'antd';

import { connect } from "dva";

const FormItem = Form.Item;
const { Option } = Select;
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
    let { handleCancel, platform, form, appName = '', serviceName='', rpcType='', methodName='',rpcExt='', path='',pathDesc, parameterTypes = '', enabled = true } = this.props;
    let {
      rpcTypeEnums,
     
    } = platform;
   
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
        title="元数据"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label="应用名称"
            {...formItemLayout}
          >
            {getFieldDecorator('appName', {
              rules: [{ required: true, message: '请输入appName' }],
              initialValue: appName,
            })(
              <Input placeholder="应用名称" />
            )}
          </FormItem>
          
          <FormItem
            label="方法名称"
            {...formItemLayout}
          >
            {getFieldDecorator('methodName', {
              rules: [{ required: true, message: '请输入方法名称' }],
              initialValue: methodName,
            })(
              <Input placeholder="方法名称" />
            )}
          </FormItem>
          <FormItem
            label="路径"
            {...formItemLayout}
          >
            {getFieldDecorator('path', {
              rules: [{ required: true, message: '请输入路径' }],
              initialValue: path,
            })(
              <Input placeholder="路径" />
            )}
          </FormItem>
          <FormItem
            label="路径描述"
            {...formItemLayout}
          >
            {getFieldDecorator('pathDesc', {
              rules: [{ required: true, message: '请输入路径描述' }],
              initialValue: pathDesc,
            })(
              <Input placeholder="路径描述" />
            )}
          </FormItem>
          <FormItem
            label="参数类型"
            {...formItemLayout}
          >
            {getFieldDecorator('parameterTypes', {
              rules: [{ required: true, message: '请输入参数类型' }],
              initialValue: parameterTypes,
            })(
              <Input placeholder="参数类型" />
            )}
          </FormItem>
          <FormItem
            label="rpc扩展参数"
            {...formItemLayout}
          >
            {getFieldDecorator('rpcExt', {
              rules: [{ required: true, message: '请输入rpc扩展参数' }],
              initialValue: rpcExt,
            })(
              <TextArea placeholder="rpc扩展参数" rows={3} />
              // <Input placeholder="rpc扩展参数" />
            )}
          </FormItem>
          <FormItem
            label="服务接口"
            {...formItemLayout}
          >
            {getFieldDecorator('serviceName', {
              rules: [{ required: true, message: '请输入服务接口' }],
              initialValue: serviceName,
            })(
              <Input placeholder="服务接口" />
            )}
          </FormItem>
          {/* 下拉 */}
          <FormItem
            label="rpc类型"
            {...formItemLayout}
          >
            {getFieldDecorator('rpcType', {
              rules: [{ required: true, message: '请选择 rpc类型' }],
              initialValue: rpcType,
            })(
              <Select>
                {rpcTypeEnums.map(item => {
                  return (
                    <Option key={item.name} value={`${item.name}`}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
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