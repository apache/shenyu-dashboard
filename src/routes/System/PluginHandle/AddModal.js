import React, {Component} from "react";
import {Modal, Form, Input, Select, Tooltip, Icon, message} from "antd";
import {connect} from "dva";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Option } = Select;
const FormItem = Form.Item;

@connect(({global}) => ({
  platform: global.platform
}))
class AddPluginHandle extends Component {
  handleSubmit = e => {
    const { form, handleOk, id = "",} = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { pluginId, field, label,dataType,type,sort,required,defaultValue,rule} = values;
        if(dataType === "1" && defaultValue && isNaN(defaultValue)){
          message.warn(getIntlContent("SOUL.PLUGIN.DEFAULTVALUE") + getIntlContent("SOUL.COMMON.WARN.INPUT_NUMBER"));
          return;
        }
        handleOk({ field, label, id, pluginId,dataType,type,sort,required,defaultValue,rule});
      }
    });
  };


  render() {
    let {handleCancel,  form, pluginId, label="", field="", dataType ="1",type="2",sort=0,required=undefined,defaultValue=undefined,rule=undefined,pluginDropDownList } = this.props;
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
        width={650}
        centered
        title={getIntlContent("SOUL.PLUGIN.PLUGINHANDLE")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SOUL.PLUGIN.PLUGIN.NAME")} {...formItemLayout}>
            {getFieldDecorator("pluginId", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.PLUGIN.NAME")}],
              initialValue: pluginId,
            })(
              <Select
                placeholder="Plugin"
              >
                {
                  pluginDropDownList.map((item,i)=>{
                    return(
                      <Option key={i} value={item.id}>{item.name}</Option>
                    )
                  })
                }
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.FIELD")} {...formItemLayout}>
            {getFieldDecorator("field", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.FIELD")}],
              initialValue: field,
            })(
              <Input placeholder="Field" />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.DESCRIBE")} {...formItemLayout}>
            {getFieldDecorator("label", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.DESCRIBE")}],
              initialValue: label,
            })(
              <Input placeholder="Label" />
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
                <Option key="3" value="3">{getIntlContent("SOUL.PLUGIN")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.SORT")} {...formItemLayout}>
            {getFieldDecorator("sort", {
              rules: [{required: true, message: getIntlContent("SOUL.PLUGIN.INPUTSORT")}],
              initialValue: sort,
            })(
              <Input placeholder="Sort" type="number" />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.REQUIRED")} {...formItemLayout}>
            {getFieldDecorator("required", {
              rules: [{required: false}],
              initialValue: required,
            })(
              <Select placeholder="Required">
                <Option key="1" value="1">{getIntlContent("SOUL.COMMON.YES")}</Option>
                <Option key="0" value="0">{getIntlContent("SOUL.COMMON.NO")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.PLUGIN.DEFAULTVALUE")} {...formItemLayout}>
            {getFieldDecorator("defaultValue", {
              rules: [{required: false}],
              initialValue: defaultValue,
            })(
              <Input placeholder="DefaultValue" />
            )}
          </FormItem>
          <FormItem
            label={
              <span>
                {getIntlContent("SOUL.PLUGIN.RULE")}&nbsp;
                <Tooltip title={getIntlContent("SOUL.PLUGIN.RULE.TIP")}>
                  <Icon type="question-circle-o" />
                </Tooltip>
              </span>
            }
            {...formItemLayout}
          >
            {getFieldDecorator("rule", {
              rules: [{required: false}],
              initialValue: rule,
            })(
              <Input placeholder={getIntlContent("SOUL.PLUGIN.RULE")} />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
export default Form.create()(AddPluginHandle);
