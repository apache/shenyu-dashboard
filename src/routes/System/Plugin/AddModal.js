import React, { Component, Fragment } from "react";
import { Modal, Form, Switch, Input, Select, Divider } from "antd";
import { connect } from "dva";

const { Option } = Select;
const { TextArea } = Input;
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

        let { name, role, enabled, master, mode, url, password, config } = values;
        if (name === 'rate_limiter') {
          config = JSON.stringify({ master, mode, url, password })
        }
        handleOk({ name, role, enabled, config, id });
      }
    });
  };

  render() {
    let { handleCancel, platform, form, config, name, enabled = true, role = "1", id } = this.props;

    let disable = false;
    if (id) {
      disable = true;
    } else {
      role = "1";
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
    let {
      redisModeEnums,
    } = platform;


    let configWrap = ''


    if (name === 'rate_limiter') {
      try {
        config = JSON.parse(config)
      } catch (error) {
        config = {}
      }

      const ruleMaster = this.props.form.getFieldValue('mode')
      const reMaster = !!((ruleMaster === 'cluster' || ruleMaster === 'sentinel'))
      configWrap = (
        <Fragment>
          <Divider>redis 配置</Divider>
          <FormItem label="方式" {...formItemLayout}>
            {getFieldDecorator("mode", {
              rules: [{ required: true, message: "请选择方式" }],
              initialValue: config.mode
            })(
              <Select>
                {redisModeEnums.map(item => {
                  return (
                    <Option key={item.name} value={item.name}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          <FormItem label="master" {...formItemLayout}>
            {getFieldDecorator("master", {
              rules: reMaster ? [{ required: true, message: "请输入master" }] : [],
              initialValue: config.master,
            })(
              <Input placeholder="请输入master" />
            )}
          </FormItem>

          <FormItem label="URL" {...formItemLayout}>
            {getFieldDecorator("url", {
              rules: [{ required: true, message: "请输入URL" }],
              initialValue: config.url,
            })(
              <TextArea placeholder="请输入URL。如果是cluster 或者 sentinel 多个地址使用分号（;）分隔" rows={3} />
            )}
          </FormItem>
          <FormItem label="密码" {...formItemLayout}>
            {getFieldDecorator("password", {
              rules: [],
              initialValue: config.password,
            })(
              <Input placeholder="请输入password" />
            )}
          </FormItem>

          <Divider />
        </Fragment>
      )
    } else {
      configWrap = (
        <FormItem label="配置" {...formItemLayout}>
          {getFieldDecorator("config", {
            initialValue: config
          })(
            <TextArea placeholder="请输入配置" rows={4} />
          )}
        </FormItem>
      )
    }

    return (
      <Modal
        width={520}
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
          {configWrap}
          <FormItem
            label="角色"
            {...formItemLayout}
          >
            {getFieldDecorator('role', {
              rules: [{ required: true, message: '请选择角色' }],
              initialValue: `${role}`,
            })(
              <Select disabled>
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
