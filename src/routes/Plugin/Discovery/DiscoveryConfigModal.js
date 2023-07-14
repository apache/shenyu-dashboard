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
import {Button, Col, Form, Input, Modal, Popconfirm, Row, Select} from "antd";
import {connect} from "dva";
import {getIntlContent} from "../../../utils/IntlUtils";


const FormItem = Form.Item;

@connect(({discovery}) => ({
  ...discovery
}))

class DiscoveryConfigModal extends Component {

  state = {
    zkjson: JSON.parse(this.props.zkProps)
  };

  componentDidMount() {
    const { isSetConfig, data } = this.props;
    if (!isSetConfig) {
      this.props.dispatch({
        type: 'discovery/saveGlobalType',
        payload: {
          chosenType: null
        }
      });
    }else{
      this.setState({zkjson: JSON.parse(data.props)})
    }
  }


  handleSubmit = e => {
    const { form, handleOk } = this.props;
    const { zkjson } = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { name, serverList, tcpType } = values;
        const propsjson = {};
        Object.entries(zkjson).forEach(([key]) => {
          propsjson[key] = form.getFieldValue(key);
        });
        const props = JSON.stringify(propsjson); // 将字段值转换为JSON字符串
        console.log("props", props); // 打印JSON字符串，或根据您的需求进行处理
        handleOk({ name, serverList, props, tcpType});
      }
    });
  };


  handleOptions() {
    const {Option} = Select;
    return this.props.typeEnums
      .filter(value => value !== "local")
      .map(value => <Option key={value} value={value.toString()}>{value}</Option>)
  }


  render() {
    const { handleCancel, form, data, isSetConfig, handleConfigDelete } = this.props
    const { getFieldDecorator } = form;
    const { name, serverList, type: tcpType, id} = data || {};
    const { zkjson } = this.state;
    const formItemLayout = {
      labelCol: {
        sm: { span: 4 }
      },
      wrapperCol: {
        sm: { span: 19 }
      }
    };

    return (
      <Modal
        visible
        centered
        width='60%'
        title={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.CONFIGURATION")}
        onCancel={handleCancel}
        onOk={this.handleSubmit}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        footer={[
          isSetConfig === true ? (
            <Popconfirm
              placement="topLeft"
              title={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.DELETE")}
              onConfirm={() => handleConfigDelete(id)}
              okText="Yes"
              cancelText="No"
              key="popconfirm"
            >
              <Button key="delete" type="danger" style={{ marginRight: '10px' }}>
                {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
              </Button>
            </Popconfirm>
          ) : null,
          <Button key="cancel" onClick={handleCancel} style={{marginRight: '5px'}}>
            {getIntlContent("SHENYU.COMMON.CALCEL")}
          </Button>,
          <Button key="submit" type="primary" onClick={this.handleSubmit}>
            {getIntlContent("SHENYU.COMMON.SURE")}
          </Button>,
        ]}
        destroyOnClose
      >
        <Form onSubmit={this.handleSubmit}>
          <Form.Item label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE")} {...formItemLayout}>
            {getFieldDecorator('tcpType', {
              rules: [{ required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT") }],
              initialValue: tcpType !== "" ? tcpType : undefined
            })(
              <Select
                placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT")}
                onChange={value => this.props.dispatch({
                  type: 'discovery/saveGlobalType',
                  payload: {
                    chosenType: value
                  }
                })}
              >
                {this.handleOptions()}
              </Select>,
            )}
          </Form.Item>
          <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.NAME")} {...formItemLayout}>
            {getFieldDecorator('name', {
              rules: [{ required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.NAME.INPUT") }],
              initialValue: name
            })(<Input
              placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.NAME.INPUT")}
            />)}
          </FormItem>

          <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST")} {...formItemLayout}>
            {getFieldDecorator('serverList', {
              rules: [{ required: true, message: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT") }],
              initialValue: serverList
            })(<Input
              placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST.INPUT")}
            />)}
          </FormItem>

          {/* <FormItem label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")} {...formItemLayout}> */}
          {/*   {getFieldDecorator('props', { */}
          {/*     initialValue: chosenType === 'zookeeper' && isSetConfig === false ? zkProps : props */}
          {/*   })(<Input.TextArea */}
          {/*     placeholder={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS.INPUT")} */}
          {/*     style={{ height: '120px' }} */}
          {/*   />)} */}
          {/* </FormItem> */}

          <div style={{ marginLeft: '50px', marginTop: '15px', marginBottom: '15px', fontWeight: '500', }}>
            {getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")}
            <span style={{ marginLeft: '2px', fontWeight: '500' }}>:</span>
          </div>
          <div style={{ marginLeft: '35px', display: 'flex', alignItems: 'baseline' }}>
            <div style={{ marginLeft: '8px' }}>
              <Row gutter={[16, 4]} justify="center">
                {Object.entries(zkjson).map(([key, value]) => (
                  <Col span={12} key={key}>
                    <FormItem>
                      {getFieldDecorator(key, {
                        initialValue: value
                      })(
                        <Input
                          placeholder={`Enter ${key}`}
                          addonBefore={key}
                        />
                      )}
                    </FormItem>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(DiscoveryConfigModal);
