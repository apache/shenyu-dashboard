import React, { Component, Fragment } from "react";
import { Modal, Form, Switch, Input, Select, Divider } from "antd";
import { connect } from "dva";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Option } = Select;
const FormItem = Form.Item;

@connect(({ global }) => ({
  platform: global.platform
}))
class AddModal extends Component {
  handleSubmit = e => {
    const { form, handleOk, id = "" ,data} = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { name, role, enabled, config } = values;
        if(data && data.length > 0){
          config = {}
          data.forEach((item) =>{
            if(values[item.field]){
              config[item.field] = values[item.field]
            }
          })
          config = JSON.stringify(config)
          if(config==='{}'){
            config = ''
          }
        }
        handleOk({ name, role, enabled, config, id });
      }
    });
  };

  render() {
    let { handleCancel, form, config, name, enabled = true, role = "1", id,data } = this.props;
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
    if(config){
      config = JSON.parse(config)
    }
    return (
      <Modal
        width={520}
        centered
        title={getIntlContent("SOUL.PLUGIN")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SOUL.PLUGIN")} {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [{ required: true, message: getIntlContent("SOUL.PLUGIN.SELECT") }],
              initialValue: name,
            })(
              <Input placeholder={getIntlContent("SOUL.PLUGIN.PLUGIN.NAME")} disabled={disable} />
            )}
          </FormItem>
          {(data && data.length > 0) && (
            <Fragment>
              <Divider>{name} {getIntlContent("SOUL.COMMON.SETTING")}</Divider>
              {data.map((eachField,index)=> {
                let fieldInitialValue = config?config[eachField.field]:undefined
                let fieldName = eachField.field
                let dataType = eachField.dataType
                let required = ''
                let checkRule;
                if(eachField.extObj){
                  let extObj = JSON.parse(eachField.extObj)
                  required = extObj.required==='0'?'':extObj.required
                  if(!fieldInitialValue){
                    fieldInitialValue = extObj.defaultValue
                  }
                  if(extObj.rule){
                    checkRule = extObj.rule;
                  }
                }
                let rules = [];
                if(required){
                  rules.push({ required: {required}, message: getIntlContent("SOUL.COMMON.PLEASEINPUT") });
                }
                if(checkRule){
                  rules.push({
                    // eslint-disable-next-line no-eval
                    pattern: eval(checkRule),
                    message: `${getIntlContent("SOUL.PLUGIN.RULE.INVALID")}:(${checkRule})`
                  })
                }
                if(dataType === 1){
                  return (
                    <FormItem label={eachField.label} {...formItemLayout} key={index}>
                      {getFieldDecorator(fieldName, {
                        rules,
                        initialValue: fieldInitialValue,
                      })(
                        <Input placeholder={eachField.label} type="number" />
                      )}
                    </FormItem>
                  )
                } else if(dataType === 3 && eachField.dictOptions){
                  return (
                    <FormItem label={eachField.label} {...formItemLayout} key={index}>
                      {getFieldDecorator(fieldName, {
                        rules,
                        initialValue: fieldInitialValue,
                      })(
                        <Select
                          placeholder={eachField.label}
                        >
                          {eachField.dictOptions.map(option => {
                            return (
                              <Option key={option.dictValue} value={option.dictValue}>
                                {option.dictName} ({eachField.label})
                              </Option>
                            );
                          })}
                        </Select>
                      )}
                    </FormItem>
                  )
                }else{
                  return (
                    <FormItem label={eachField.label} {...formItemLayout} key={index}>
                      {getFieldDecorator(fieldName, {
                        rules,
                        initialValue: fieldInitialValue,
                      })(
                        <Input placeholder={eachField.label} />
                      )}
                    </FormItem>
                  )
                }
              })}
              <Divider />
            </Fragment>
          )}
          <FormItem
            label={getIntlContent("SOUL.SYSTEM.ROLE")}
            {...formItemLayout}
          >
            {getFieldDecorator('role', {
              rules: [{ required: true, message: getIntlContent("SOUL.SYSTEM.SELECTROLE") }],
              initialValue: `${role}`,
            })(
              <Select disabled>
                <Option value="0">{getIntlContent("SOUL.SYSTEM.SYSTEM")}</Option>
                <Option value="1">{getIntlContent("SOUL.SYSTEM.CUSTOM")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label={getIntlContent("SOUL.SYSTEM.STATUS")}>
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
