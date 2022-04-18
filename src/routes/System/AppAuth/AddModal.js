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

import React, { Component } from "react";
import {Modal, Button, Form, Input, Switch, message, Table, Popconfirm} from "antd";
import styles from "./index.less";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { TextArea } = Input;
class AddModal extends Component {
 constructor(props) {
   super(props);
   const selectorConditions = props.authParamVOList || [{
    "appName": "",
    "appParam": ""
    }];
   const pathDatas = props.authPathVOList || [{
     "path": "",
   }];
   this.columns = [
     {
       title: getIntlContent("SHENYU.AUTH.RESOUCE.PATH"),
       dataIndex: 'path',
       editable: 'true',
       render: (text,record,index) => (
         <Input
           placeholder="/"
           value={text}
           onChange={(e) => this.handleTableInput(e.target.value , index)}
         />
       )
     },
     {
       title: getIntlContent("SHENYU.COMMON.OPERAT"),
       dataIndex: 'operation',
       render: (text, record,index) =>
         this.state.pathDatas.length > 1 ? (
           <Popconfirm title={getIntlContent("SHENYU.COMMON.DELETE")} onConfirm={() => this.handleDeletePath(index)}>
             <a>{getIntlContent("SHENYU.COMMON.DELETE.NAME")}</a>
           </Popconfirm>
         ) : null,
     },
   ];
   this.state = {
     selectorConditions,
     pathTableVisible: true,
     pagination: 1,
     pathDatas,
   }
 }

  handleSubmit = e => {
    const { form, handleOk, id = "" } = this.props;
    const {selectorConditions} = this.state;
    const {pathDatas} = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({ authParamDTOList:selectorConditions,authPathDTOList:pathDatas,id,...values });
      }
    });
  };

  conditionChange = (index, name, value) => {
    let { selectorConditions } = this.state;
    selectorConditions[index][name] = value;
    this.setState({ selectorConditions });
  };

  handleDelete = index => {
    let { selectorConditions } = this.state;
    if (selectorConditions && selectorConditions.length > 1) {
      selectorConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("At least one app parameter");
    }
    this.setState({ selectorConditions });
  };

  handleAdd = () => {
    let { selectorConditions } = this.state;
    selectorConditions.push({
      appName: "",
      appParam: ""
    });
    this.setState({ selectorConditions });
  };

  handleOpenChange = (checked) => {
    this.setState({pathTableVisible: checked});
  };

  handleAddPath = () => {
    const pathDatas = this.state.pathDatas
    const newData = {
      path: '',
    };
    this.setState({
      pathDatas: [...pathDatas, newData]
    })
  };

  handleDeletePath = (index) => {
    let { pathDatas, pagination } = this.state;
    if (pathDatas && pathDatas.length > 1) {
      pathDatas.splice(index + (pagination-1)*10, 1);
    } else {
      message.destroy();
      message.error("At least one app path");
    }
    this.setState({ pathDatas });
  };

  handleTableInput = (value, index) => {
    let { pathDatas, pagination } = this.state;
    pathDatas[index + (pagination-1)*10].path = value;
    this.setState({ pathDatas });
  };

  handleTableChange = paginationObj => {
    this.setState({
      pagination: paginationObj.current,
    });
  };

  render() {
    let {
      handleCancel,
      form,
      appKey = "",
      appSecret = "",
      userId,
      phone,
      extInfo,
      open = true,
      enabled = true
    } = this.props;
    const { getFieldDecorator } = form;
    const { pathTableVisible } = this.state;
    const columns = this.columns
    const formItemLayout = {
      labelCol: {
        sm: { span: 6 }
      },
      wrapperCol: {
        sm: { span: 18 }
      }
    };
    return (
      <Modal
        width={550}
        centered
        title={getIntlContent("SHENYU.AUTH.AUTH")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SHENYU.AUTH.APPID")} {...formItemLayout}>
            {getFieldDecorator("appKey", {
              rules: [{ required: true, message: `${getIntlContent("SHENYU.AUTH.INPUT")}AppKey` }],
              initialValue: appKey
            })(<Input disabled placeholder={`${getIntlContent("SHENYU.AUTH.INPUT")}AppKey`} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.APPPASSWORD")} {...formItemLayout}>
            {getFieldDecorator("appSecret", {
              rules: [{ required: true, message: `${getIntlContent("SHENYU.AUTH.INPUT")}AppSecret` }],
              initialValue: appSecret
            })(<Input disabled placeholder={`${getIntlContent("SHENYU.AUTH.INPUT")}AppSecret`} />)}
          </FormItem>
          <FormItem label={`${getIntlContent("SHENYU.SYSTEM.USER")}Id`} {...formItemLayout}>
            {getFieldDecorator("userId", {
              rules: [{ required: true, message: getIntlContent("SHENYU.AUTH.INPUTUSERID")}],
              initialValue: userId
            })(<Input placeholder={getIntlContent("SHENYU.AUTH.INPUTUSERID")} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.TEL")} {...formItemLayout}>
            {getFieldDecorator("phone", {
              rules: [{ required: true, message: getIntlContent("SHENYU.AUTH.TELPHONE")}],
              initialValue: phone
            })(<Input placeholder={getIntlContent("SHENYU.AUTH.TELPHONE")} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.EXPANDINFO")} {...formItemLayout}>
            {getFieldDecorator("extInfo", {
              rules: [{  message: getIntlContent("SHENYU.AUTH.EXPANDINFO") }],
              initialValue: extInfo
            })(<TextArea placeholder={getIntlContent("SHENYU.AUTH.INPUTEXPANDINFO")} rows={3} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.AUTH.OPENPATH")} {...formItemLayout}>
            {getFieldDecorator('open', {
              initialValue: open,
              valuePropName: 'checked',
            })(
              <Switch onChange={this.handleOpenChange} />
            )}
          </FormItem>

          {/* 添加删除行 */}
          <div className={styles.condition}>
            {/* 输入框左侧标题
            <h3 className={styles.header}>
              authParamVOList:{" "}
            </h3> */}
            <div>
              {
                this.state.selectorConditions.map((item,index)=>{
                  return (
                    <ul key={index}>
                      <li>
                        <div className={styles.title}>{getIntlContent("SHENYU.AUTH.APPNAME")}:</div>
                      </li>
                      <li>
                        <Input
                          onChange={e => { this.conditionChange(index,"appName",e.target.value)}}
                          value={item.appName}
                          className={styles.appName}
                        />
                      </li>
                      <li>
                        <div className={styles.title}>{getIntlContent("SHENYU.AUTH.PARAMS")}:</div>
                      </li>
                      <li>
                        <TextArea
                          rows={3}
                          onChange={e => { this.conditionChange( index,"appParam", e.target.value ); }}
                          value={item.appParam}
                          className={styles.appParam}
                        />
                      </li>
                      <li>
                        <Button
                          className={styles.btn}
                          type="danger"
                          onClick={() => {
                            this.handleDelete(index);
                          }}
                        >
                          {getIntlContent( "SHENYU.COMMON.DELETE.NAME")}
                        </Button>
                      </li>
                    </ul>
                  )
                })
              }
            </div>
            <Button onClick={this.handleAdd} className={styles.btn} type="primary">
              {getIntlContent("SHENYU.COMMON.ADD")}
            </Button>
          </div>



          <FormItem {...formItemLayout} label={getIntlContent("SHENYU.SYSTEM.STATUS")}>
            {getFieldDecorator("enabled", {
              initialValue: enabled,
              valuePropName: "checked"
            })(<Switch />)}
          </FormItem>

          {pathTableVisible && (
            <div>
              <Button
                onClick={this.handleAddPath}
                type="primary"
                style={{
                  marginBottom: 16,
                }}
              >{getIntlContent("SHENYU.AUTH.ADD")}
              </Button>
              <Table
                bordered
                columns={columns}
                dataSource={this.state.pathDatas}
                onChange={this.handleTableChange}
                rowKey={(record, index) => index}
                pagination={{ current: this.state.pagination, pageSize: 10 }}
              />
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
