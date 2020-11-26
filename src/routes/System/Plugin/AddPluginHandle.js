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

        let { field, label,dataType,type,sort} = values;
        handleOk({ field, label, id, pluginId,dataType,type,sort });
      }
    });
  };


  render() {
    let {handleCancel,  form, label="", field="", dataType ="1",type="2",sort=0 } = this.props;

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
        width={550}
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
          <FormItem label="字段所属类型" {...formItemLayout}>
            {getFieldDecorator("type", {
              rules: [{required: true, message: "描述"}],
              initialValue: type,
            })(
              <Select>
                <Option key="1" value="1">选择器</Option>
                <Option key="2" value="2">规则</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label="排序" {...formItemLayout}>
            {getFieldDecorator("sort", {
              rules: [{required: true, message: "请输入排序"}],
              initialValue: sort,
            })(
              <Input placeholder="sort" type="number" />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
export default Form.create()(AddPluginHandle);
