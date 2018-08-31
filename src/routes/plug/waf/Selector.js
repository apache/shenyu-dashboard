import React, { Component } from "react";
import { Modal, Form, Select, Input, Switch, Button } from "antd";
import { connect } from "dva";
import styles from "./selector.less";

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ global }) => ({
  platform: global.platform
}))
class AddModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorConditions: [
        {
          paramType: "",
          operator: "",
          paramName: "",
          paramValue: ""
        }
      ]
    };
  }

  handleSubmit = e => {
    const { form, handleOk } = this.props;
    const { selectorConditions } = this.state;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        handleOk({ ...values, sort: Number(values.sort), selectorConditions });
      }
    });
  };

  handleAdd = () => {
    let { selectorConditions } = this.state;
    selectorConditions.push({
      paramType: "",
      operator: "",
      paramName: "",
      paramValue: ""
    });
    this.setState({ selectorConditions });
  };

  handleDelete = index => {
    let { selectorConditions } = this.state;
    if (selectorConditions && selectorConditions.length > 0) {
      selectorConditions.splice(index, 1);
    }
    this.setState({ selectorConditions });
  };

  conditionChange = (index, name, value) => {
    let { selectorConditions } = this.state;
    selectorConditions[index][name] = value;
    this.setState({ selectorConditions });
  };

  render() {
    let { onCancel, form, name = "", platform } = this.props;
    const { selectorConditions } = this.state;

    const {
      selectorTypeEnums,
      matchModeEnums,
      operatorEnums,
      paramTypeEnums
    } = platform;

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
              initialValue: name
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
            {selectorConditions.map((item, index) => {
              return (
                <ul key={index}>
                  <li>
                    <Select
                      onChange={value => {
                        this.conditionChange(index, "operator", value);
                      }}
                      value={item.operator}
                      style={{ width: 110 }}
                    >
                      {operatorEnums.map(opearte => {
                        return (
                          <Option key={opearte.name} value={opearte.name}>
                            {opearte.name}
                          </Option>
                        );
                      })}
                    </Select>
                  </li>
                  <li>
                    <Input
                      onChange={e => {
                        this.conditionChange(
                          index,
                          "paramName",
                          e.target.value
                        );
                      }}
                      value={item.paramName}
                      style={{ width: 110 }}
                    />
                  </li>
                  <li>
                    <Select
                      onChange={value => {
                        this.conditionChange(index, "paramType", value);
                      }}
                      value={item.paramType}
                      style={{ width: 110 }}
                    >
                      {paramTypeEnums.map(type => {
                        return (
                          <Option key={type.name} value={type.name}>
                            {type.name}
                          </Option>
                        );
                      })}
                    </Select>
                  </li>
                  <li>
                    <Input
                      onChange={e => {
                        this.conditionChange(
                          index,
                          "paramValue",
                          e.target.value
                        );
                      }}
                      value={item.paramValue}
                      style={{ width: 110 }}
                    />
                  </li>
                  <li>
                    <Button
                      type="danger"
                      onClick={() => {
                        this.handleDelete(index);
                      }}
                    >
                      删除
                    </Button>
                  </li>
                </ul>
              );
            })}
            <Button
              onClick={this.handleAdd}
              style={{ marginLeft: 40 }}
              type="primary"
            >
              新增
            </Button>
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
            {getFieldDecorator("sort", {
              rules: [
                {
                  required: true,
                  message: "请输入1-100数字"
                },
                {
                  pattern: /^([1-9][0-9]{0,1}|100)$/,
                  message: "请输入1-100数字"
                }
              ]
            })(<Input placeholder="可以填写1-100之间的数字标志执行先后顺序" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
