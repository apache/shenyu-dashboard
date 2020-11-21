import React, {Component} from "react";
import {Modal, Form, Input, Select} from "antd";
import {connect} from "dva";

const { Option } = Select;
const FormItem = Form.Item;

@connect(({global}) => ({
  platform: global.platform
}))
class AddPluginHandle extends Component {
  handleSubmit = e => {
    const { form, handleOk, id = "", pluginId} = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {

        let { field, label,dataType} = values;
        handleOk({ field, label, id, pluginId,dataType });
      }
    });
  };


  render() {
    let {handleCancel,  form, label="", field="", dataType ="1" } = this.props;

    const {getFieldDecorator} = form;

    const formItemLayout = {
      labelCol: {
        sm: {span: 5}
      },
      wrapperCol: {
        sm: {span: 19}
      }
    };

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
          <FormItem label="字段" {...formItemLayout}>
            {getFieldDecorator("field", {
              rules: [{required: true, message: "字段"}],
              initialValue: field,
            })(
              <Input placeholder="field" />
            )}
          </FormItem>
          <FormItem label="描述" {...formItemLayout}>
            {getFieldDecorator("label", {
              rules: [{required: true, message: "描述"}],
              initialValue: label,
            })(
              <Input placeholder="label" />
            )}
          </FormItem>
          <FormItem label="数据类型" {...formItemLayout}>
            {getFieldDecorator("dataType", {
              rules: [{required: true, message: "描述"}],
              initialValue: dataType,
            })(
              <Select>
                <Option key="1" value="1">数字</Option>
                <Option key="2" value="2">字符串</Option>
                <Option key="3" value="3">下拉框</Option>
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
export default Form.create()(AddPluginHandle);
