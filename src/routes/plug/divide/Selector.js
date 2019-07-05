import React, { Component } from "react";
import { Modal, Form, Select, Input, Switch, Button, message } from "antd";
import { connect } from "dva";
import styles from "../index.less";

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ global }) => ({
  platform: global.platform
}))
class AddModal extends Component {
  constructor(props) {
    super(props);

    const selectorConditions = props.selectorConditions || [
      {
        paramType: "header",
        operator: "=",
        paramName: "",
        paramValue: ""
      }
    ];

    let upstreamList = [{
      upstreamHost: "",
      protocol: "",
      upstreamUrl: "",
      weight: '50'
    }]

    if (props.handle) {
      const myHandle = JSON.parse(props.handle);
      upstreamList = myHandle;
    }

    this.state = {
      selectorConditions,
      upstreamList
    };
  }

  checkConditions = selectorConditions => {
    let result = true;
    if (selectorConditions) {
      selectorConditions.forEach((item, index) => {
        const { paramType, operator, paramName, paramValue } = item;
        if (!paramType || !operator || !paramName || !paramValue) {
          message.destroy();
          message.error(`第${index + 1}行条件不完整`);
          result = false;
        }
      });
    } else {
      message.destroy();
      message.error(`条件不完整`);
      result = false;
    }
    return result;
  };

  checkUpstream = (upstreamList) => {
    let result = true;

    if (upstreamList) {
      upstreamList.forEach((item, index) => {
        const { upstreamHost, upstreamUrl,weight} = item;
        if (!upstreamHost || !upstreamUrl || !weight) {
          message.destroy();
          message.error(
            `第${index + 1}行http负载, upstreamHost和upstreamUrl, weight不能为空`
          );
          result = false;
        }
      });
    } else {
      message.destroy();
      message.error(`http负载不完整`);
      result = false;
    }
    return result;
  }



  handleSubmit = e => {
    const { form, handleOk } = this.props;
    const { selectorConditions } = this.state;

    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { upstreamList } = this.state;

        const mySubmit = this.checkConditions(selectorConditions);
        const myUpstream = this.checkUpstream(upstreamList);
        if (mySubmit && myUpstream) {
          handleOk({
            ...values,
            handle: JSON.stringify(upstreamList),
            sort: Number(values.sort),
            selectorConditions
          });
        }
      }
    });
  };

  handleAdd = () => {
    let { selectorConditions } = this.state;
    selectorConditions.push({
      paramType: "header",
      operator: "=",
      paramName: "",
      paramValue: ""
    });
    this.setState({ selectorConditions });
  };

  handleDelete = index => {
    let { selectorConditions } = this.state;
    if (selectorConditions && selectorConditions.length > 1) {
      selectorConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("至少有一个条件");
    }
    this.setState({ selectorConditions });
  };

  conditionChange = (index, name, value) => {
    let { selectorConditions } = this.state;
    selectorConditions[index][name] = value;
    this.setState({ selectorConditions });
  };

  divideHandleAdd = () => {
    let { upstreamList } = this.state;
    if (upstreamList) {
      upstreamList.push({
        upstreamHost: "",
        protocol: "",
        upstreamUrl: "",
        weight: "50"
      });
    } else {
      upstreamList = [];
    }

    this.setState({ upstreamList });
  };

  divideHandleChange = (index, name, value) => {
    let { upstreamList } = this.state;
    upstreamList[index][name] = value;
    this.setState({ upstreamList });
  };

  divideHandleDelete = index => {
    let { upstreamList } = this.state;
    if (upstreamList && upstreamList.length > 1) {
      upstreamList.splice(index, 1);
    } else {
      message.destroy();
      message.error("至少有一个http负载");
    }
    this.setState({ upstreamList });
  };

  render() {
    let {
      onCancel,
      form,
      name = "",
      platform,
      type = "",
      matchMode = "",
      continued = true,
      loged = true,
      enabled = true,
      sort
    } = this.props;

    const { selectorConditions, upstreamList } = this.state;

    let {
      selectorTypeEnums,
      matchModeEnums,
      operatorEnums,
      paramTypeEnums
    } = platform;

    type = `${type}`

    if (operatorEnums) {
      operatorEnums = operatorEnums.filter(item => {
        return item.support === true;
      });
    }

    if (paramTypeEnums) {
      paramTypeEnums = paramTypeEnums.filter(item => {
        return item.support === true;
      });
    }

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 3 }
      },
      wrapperCol: {
        sm: { span: 21 }
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
        width={700}
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
              initialValue: type || "1"
            })(
              <Select>
                {selectorTypeEnums.map(item => {
                  return (
                    <Option key={item.code} value={`${item.code}`}>
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
              initialValue: matchMode
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
            <h3 className={styles.header}>
              <strong>*</strong>条件:{" "}
            </h3>
            <div>
              {selectorConditions.map((item, index) => {
                return (
                  <ul key={index}>
                    <li>
                      <Select
                        onChange={value => {
                          this.conditionChange(index, "paramType", value);
                        }}
                        value={item.paramType}
                        style={{ width: 100 }}
                      >
                        {paramTypeEnums.map(typeItem => {
                          return (
                            <Option key={typeItem.name} value={typeItem.name}>
                              {typeItem.name}
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
                        style={{ width: 100 }}
                      />
                    </li>
                    <li>
                      <Select
                        onChange={value => {
                          this.conditionChange(index, "operator", value);
                        }}
                        value={item.operator}
                        style={{ width: 100 }}
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
                            "paramValue",
                            e.target.value
                          );
                        }}
                        value={item.paramValue}
                        style={{ width: 100 }}
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
            </div>

            <Button onClick={this.handleAdd} type="primary">
              新增
            </Button>
          </div>
          <div className={styles.layout}>
            <FormItem {...formCheckLayout} label="继续后续选择器">
              {getFieldDecorator("continued", {
                initialValue: continued,
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
                initialValue: loged,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem {...formCheckLayout} label="是否开启">
              {getFieldDecorator("enabled", {
                initialValue: enabled,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
          </div>
          <div className={styles.condition}>
            <h3 className={styles.header} style={{ width: 120 }}>
              <strong>*</strong>http配置:
            </h3>
            <div className={styles.content}>
              {upstreamList.map((item, index) => {
                return (
                  <ul key={index}>
                    <li>
                      <Input
                        onChange={e => {
                          this.divideHandleChange(
                            index,
                            "upstreamHost",
                            e.target.value
                          );
                        }}
                        placeholder="hostName"
                        value={item.upstreamHost}
                        style={{ width: 100 }}
                      />
                    </li>
                    <li>
                      <Input
                        onChange={e => {
                          this.divideHandleChange(
                            index,
                            "protocol",
                            e.target.value
                          );
                        }}
                        placeholder="http://"
                        value={item.protocol}
                        style={{ width: 100 }}
                      />
                    </li>
                    <li>
                      <Input
                        onChange={e => {
                          this.divideHandleChange(
                            index,
                            "upstreamUrl",
                            e.target.value
                          );
                        }}
                        placeholder="ip:port"
                        value={item.upstreamUrl}
                        style={{ width: 100 }}
                      />
                    </li>

                    <li>
                      <Input
                        onChange={e => {
                          this.divideHandleChange(
                            index,
                            "weight",
                            e.target.value
                          );
                        }}
                        placeholder="weight"
                        value={item.weight}
                        style={{ width: 80 }}
                      />
                    </li>
                    <li>
                      <Button
                        type="danger"
                        onClick={() => {
                          this.divideHandleDelete(index);
                        }}
                      >
                        删除
                      </Button>
                    </li>
                  </ul>
                );
              })}
            </div>
            <div>
              <Button onClick={this.divideHandleAdd} type="primary">
                新增
              </Button>
            </div>
          </div>

          <FormItem label="执行顺序" {...formItemLayout}>
            {getFieldDecorator("sort", {
              initialValue: sort,
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
