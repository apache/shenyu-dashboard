import React, { Component } from "react";
import { Modal, Form, Select, Input, Switch, Button } from "antd";
import styles from "./selector.less";

const FormItem = Form.Item;
const { Option } = Select;

const selectorTypeEnums = [
  {
    code: 0,
    name: "full flow",
    support: true
  },
  {
    code: 1,
    name: "custom flow",
    support: true
  }
];

const matchModeEnums = [
  {
    code: 0,
    name: "and",
    support: true
  },
  {
    code: 1,
    name: "or",
    support: true
  }
];

class AddModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorConditions: [
        {
          "paramType": "host",
          "operator": "match",
          "paramName": "paramName",
          "paramValue": "paramValue"
        }
      ],
    }
  }

  handleSubmit = e => {
    const { form, handleOk, id = "" } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({ ...values, id });
      }
    });
  };

  handleAdd=()=>{

  }

  handleDelete=(item)=>{
    console.log(item);
  }

  render() {
    let { onCancel, form, userName = "" } = this.props;
    const { selectorConditions } = this.state;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 4 }
      },
      wrapperCol: {
        sm: { span: 20 }
      }
    };
    const formCheckLayout = {
      labelCol: {
        sm: { span: 18 }
      },
      wrapperCol: {
        sm: { span: 4 }
      }
    };
    return (
      <Modal
        width={660}
        centered
        title="选择器"
        visible
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label="名称" {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [{ required: true, message: "请输入名称" }],
              initialValue: userName
            })(<Input placeholder="名称" />)}
          </FormItem>
          <FormItem label="类型" {...formItemLayout}>
            {getFieldDecorator("type", {
              rules: [{ required: true, message: "请选择类型" }],
              initialValue: ""
            })(
              <Select>
                {selectorTypeEnums.map(item => {
                  return (
                    <Option key={item.code} value={item.code}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          <FormItem label="匹配方式" {...formItemLayout}>
            {getFieldDecorator("matchMode", {
              rules: [{ required: true, message: "请选择匹配方式" }],
              initialValue: ""
            })(
              <Select>
                {matchModeEnums.map(item => {
                  return (
                    <Option key={item.code} value={item.code}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          <div className={styles.condition}>
            <h3>条件</h3>
            {
              selectorConditions.map((item, index) => {
                return (
                  <ul key={index}>
                    <li>
                      <Select style={{ width: 120 }}>
                        <Option value='0'>大于</Option>
                      </Select>
                    </li>
                    <li>
                      <Input style={{width: 120}} placeholder='运算' />
                    </li>
                    <li>
                      <Select style={{ width: 120 }}>
                        <Option value='0'>小于</Option>
                      </Select>
                    </li>
                    <li>
                      <Input style={{width: 120}} placeholder='计算' />
                    </li>
                    <li><Button type='priamry' onClick={()=>{this.handleDelete(item)}}>删除</Button></li>
                  </ul>
                )
              })
            }
            <Button onClick={this.handleAdd} style={{marginLeft: 40}} type='primary'>新增</Button>
          </div>
          <div className={styles.layout}>
            <FormItem {...formCheckLayout} label="继续后续选择器">
              {getFieldDecorator("continued", {
                initialValue: true,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem
              style={{ margin: "0 30px" }}
              {...formCheckLayout}
              label="打印日志"
            >
              {getFieldDecorator("loged", {
                initialValue: true,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem {...formCheckLayout} label="是否开启">
              {getFieldDecorator("enabled", {
                initialValue: true,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
          </div>

          <FormItem label="执行顺序" {...formItemLayout}>
            {getFieldDecorator("rank", {
              rules: [{ required: true, message: "" }],
              initialValue: userName
            })(<Input placeholder="可以填写1-100之间的数字标志执行先后顺序" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
