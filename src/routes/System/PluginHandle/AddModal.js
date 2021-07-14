/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
        let { pluginId, field, label,dataType,type,sort,required,defaultValue,placeholder,rule} = values;
        if(dataType === "1" && defaultValue && isNaN(defaultValue)){
          message.warn(getIntlContent("SHENYU.PLUGIN.DEFAULTVALUE") + getIntlContent("SHENYU.COMMON.WARN.INPUT_NUMBER"));
          return;
        }
        handleOk({ field, label, id, pluginId,dataType,type,sort,required,defaultValue,placeholder,rule});
      }
    });
  };


  render() {
    let {handleCancel,  form, pluginId, label="", field="", dataType ="1",type="2",sort=0,required="0",defaultValue=undefined,placeholder=undefined,rule=undefined,pluginDropDownList } = this.props;
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
        title={getIntlContent("SHENYU.PLUGIN.PLUGINHANDLE")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SHENYU.PLUGIN.PLUGIN.NAME")} {...formItemLayout}>
            {getFieldDecorator("pluginId", {
              rules: [{required: true, message: getIntlContent("SHENYU.PLUGIN.PLUGIN.NAME")}],
              initialValue: pluginId,
            })(
              <Select
                placeholder={getIntlContent("SHENYU.PLUGIN.PLUGIN.NAME")}
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
          <FormItem label={getIntlContent("SHENYU.PLUGIN.FIELD")} {...formItemLayout}>
            {getFieldDecorator("field", {
              rules: [{required: true, message: getIntlContent("SHENYU.PLUGIN.FIELD")}],
              initialValue: field,
            })(
              <Input placeholder={getIntlContent("SHENYU.PLUGIN.FIELD")} />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.PLUGIN.DESCRIBE")} {...formItemLayout}>
            {getFieldDecorator("label", {
              rules: [{required: true, message: getIntlContent("SHENYU.PLUGIN.DESCRIBE")}],
              initialValue: label,
            })(
              <Input placeholder={getIntlContent("SHENYU.PLUGIN.DESCRIBE")} />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.PLUGIN.DATATYPE")} {...formItemLayout}>
            {getFieldDecorator("dataType", {
              rules: [{required: true, message: getIntlContent("SHENYU.PLUGIN.DESCRIBE")}],
              initialValue: `${dataType}` || undefined,
            })(
              <Select>
                <Option key="1" value="1">{getIntlContent("SHENYU.PLUGIN.DIGITAL")}</Option>
                <Option key="2" value="2">{getIntlContent("SHENYU.PLUGIN.STRING")}</Option>
                <Option key="3" value="3">{getIntlContent("SHENYU.PLUGIN.DROPDOWN")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.PLUGIN.FIELDTYPE")} {...formItemLayout}>
            {getFieldDecorator("type", {
              rules: [{required: true, message: getIntlContent("SHENYU.PLUGIN.DESCRIBE")}],
              initialValue: `${type}` || undefined,
            })(
              <Select>
                <Option key="1" value="1">{getIntlContent("SHENYU.SELECTOR.NAME")}</Option>
                <Option key="2" value="2">{getIntlContent("SHENYU.PLUGIN.RULES")}</Option>
                <Option key="3" value="3">{getIntlContent("SHENYU.PLUGIN")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.PLUGIN.SORT")} {...formItemLayout}>
            {getFieldDecorator("sort", {
              rules: [{required: true, message: getIntlContent("SHENYU.PLUGIN.INPUTSORT")}],
              initialValue: sort,
            })(
              <Input placeholder={getIntlContent("SHENYU.PLUGIN.SORT")} type="number" />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.PLUGIN.REQUIRED")} {...formItemLayout}>
            {getFieldDecorator("required", {
              rules: [{required: false}],
              initialValue: required,
            })(
              <Select placeholder={getIntlContent("SHENYU.PLUGIN.REQUIRED")}>
                <Option key="1" value="1">{getIntlContent("SHENYU.COMMON.YES")}</Option>
                <Option key="0" value="0">{getIntlContent("SHENYU.COMMON.NO")}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.PLUGIN.DEFAULTVALUE")} {...formItemLayout}>
            {getFieldDecorator("defaultValue", {
              rules: [{required: false}],
              initialValue: defaultValue,
            })(
              <Input placeholder={getIntlContent("SHENYU.PLUGIN.DEFAULTVALUE")} />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.PLUGIN.PLACEHOLDER")} {...formItemLayout}>
            {getFieldDecorator("placeholder", {
              rules: [{required: false}],
              initialValue: placeholder,
            })(
              <Input placeholder={getIntlContent("SHENYU.PLUGIN.PLACEHOLDER")} />
            )}
          </FormItem>
          <FormItem
            label={
              <span>
                {getIntlContent("SHENYU.PLUGIN.RULE")}&nbsp;
                <Tooltip title={getIntlContent("SHENYU.PLUGIN.RULE.TIP")}>
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
              <Input placeholder={getIntlContent("SHENYU.PLUGIN.RULE")} />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
export default Form.create()(AddPluginHandle);
