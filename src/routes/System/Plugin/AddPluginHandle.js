import React, {Component} from "react";
import {Modal, Form, Input, Select} from "antd";
import {connect} from "dva";
import { getIntlContent } from "../../../utils/IntlUtils";

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
        title={getIntlContent("SOUL.PLUGIN")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SOUL.PLUGIN.FIELD")} {...formItemLayout}>
            {getFieldDecorator("field", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.FIELD")}],
              initialValue: field,
            })(
              <Input placeholder="field" />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.DESCRIBE")} {...formItemLayout}>
            {getFieldDecorator("label", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.DESCRIBE")}],
              initialValue: label,
            })(
              <Input placeholder="label" />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.DATATYPE")} {...formItemLayout}>
            {getFieldDecorator("dataType", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.DESCRIBE")}],
              initialValue: `${dataType}` || undefined,
            })(
              <Select>
                <Option key="1" value="1">{getIntlContent("SOUL.PLUGIN.DIGITAL")}</Option>
                <Option key="2" value="2">{getIntlContent("SOUL.PLUGIN.STRING")}</Option>
                <Option key="3" value="3">{getIntlContent("SOUL.PLUGIN.DROPDOWN")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.FIELDTYPE")} {...formItemLayout}>
            {getFieldDecorator("type", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.DESCRIBE")}],
              initialValue: `${type}` || undefined,
            })(
              <Select>
                <Option key="1" value="1">{getIntlContent("SOUL.SELECTOR.NAME")}</Option>
                <Option key="2" value="2">{getIntlContent("SOUL.PLUGIN.RULES")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.SORT")} {...formItemLayout}>
            {getFieldDecorator("sort", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.INPUTSORT")}],
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
