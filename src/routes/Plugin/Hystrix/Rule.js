import React, { Component } from "react";
import { Modal, Form, Select, Input, Switch, Button, message } from "antd";
import { connect } from "dva";
import classnames from "classnames";
import styles from "../index.less";

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ global }) => ({
  platform: global.platform
}))
class AddModal extends Component {
  constructor(props) {
    super(props);
    const ruleConditions = props.ruleConditions || [
      {
        paramType: "uri",
        operator: "=",
        paramName: "/",
        paramValue: ""
      }
    ];
    let requestVolumeThreshold = "20",
      errorThresholdPercentage = "50",
      maxConcurrentRequests = "100",
      sleepWindowInMilliseconds = "5000",
      groupKey = "",
      commandKey = "",
      callBackUri="",
      executionIsolationStrategy=1,
      hystrixThreadPoolConfig = {
        coreSize: 10,
        maximumSize: 10,
        maxQueueSize: 12
      }
      ;
    if (props.handle) {
      const myHandle = JSON.parse(props.handle);
      requestVolumeThreshold = myHandle.requestVolumeThreshold;
      errorThresholdPercentage = myHandle.errorThresholdPercentage;
      maxConcurrentRequests = myHandle.maxConcurrentRequests;
      sleepWindowInMilliseconds = myHandle.sleepWindowInMilliseconds;
      groupKey = myHandle.groupKey;
      commandKey = myHandle.commandKey;
      if (typeof(myHandle.executionIsolationStrategy) !== 'undefined' ) {
        executionIsolationStrategy = myHandle.executionIsolationStrategy;
      }
      if (myHandle.hystrixThreadPoolConfig) {
        hystrixThreadPoolConfig = myHandle.hystrixThreadPoolConfig;
      }
      callBackUri = myHandle.callBackUri;
    }
    this.state = {
      requestVolumeThreshold,
      errorThresholdPercentage,
      maxConcurrentRequests,
      sleepWindowInMilliseconds,
      groupKey,
      commandKey,
      executionIsolationStrategy,
      hystrixThreadPoolConfig,
      callBackUri
    };

    ruleConditions.forEach((item, index) => {
      const { paramType } = item;

      let key = `paramTypeValueEn${index}`;
      if (paramType === "uri" || paramType === "host" || paramType === "ip") {
        this.state[key] = true;
        ruleConditions[index].paramName = "/";
      } else {
        this.state[key] = false;
      }
    });

    this.state.ruleConditions = ruleConditions;
  }

  checkConditions = (permission, statusCode) => {
    let { ruleConditions } = this.state;
    let result = true;
    if (ruleConditions) {
      ruleConditions.forEach((item, index) => {
        const { paramType, operator, paramName, paramValue } = item;
        if (!paramType || !operator || !paramValue) {
          message.destroy();
          message.error(`第${index + 1}行条件不完整`);
          result = false;
        }
        if (paramType === "uri" || paramType === "host" || paramType === "ip") {
          // aaa
        } else {
          // eslint-disable-next-line no-lonely-if
          if (!paramName) {
            message.destroy();
            message.error(`第${index + 1}行条件不完整`);
            result = false;
          }
        }
      });
    } else {
      message.destroy();
      message.error(`条件不完整`);
      result = false;
    }

    if (permission === "reject" && !statusCode) {
      message.destroy();
      message.error(`请填写状态码`);
      result = false;
    }

    return result;
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form, handleOk } = this.props;
    const {
      ruleConditions,
      requestVolumeThreshold,
      errorThresholdPercentage,
      maxConcurrentRequests,
      sleepWindowInMilliseconds,
      groupKey,
      commandKey,
      executionIsolationStrategy,
      hystrixThreadPoolConfig,
      callBackUri
    } = this.state;
    const myRequestVolumeThreshold =
      requestVolumeThreshold > 0 ? requestVolumeThreshold : "0";
    const myErrorThresholdPercentage =
      errorThresholdPercentage > 0 ? errorThresholdPercentage : "0";
    const myMaxConcurrentRequests =
      maxConcurrentRequests > 0 ? maxConcurrentRequests : "0";
    const mySleepWindowInMilliseconds =
      sleepWindowInMilliseconds > 0 ? sleepWindowInMilliseconds : "0";
    const myCoreSize = hystrixThreadPoolConfig.coreSize > 0 ? hystrixThreadPoolConfig.coreSize : "0";
    const myMaximumSize = hystrixThreadPoolConfig.maximumSize > 0 ? hystrixThreadPoolConfig.maximumSize : "0";
    const myMaxQueueSize = hystrixThreadPoolConfig.maxQueueSize > 0 ? hystrixThreadPoolConfig.maxQueueSize : "0";
    form.validateFieldsAndScroll((err, values) => {
      const {
        name,
        matchMode,
        permission,
        statusCode,
        loged,
        enabled
      } = values;
      const handle = {
        permission,
        statusCode,
        requestVolumeThreshold: myRequestVolumeThreshold,
        errorThresholdPercentage: myErrorThresholdPercentage,
        sleepWindowInMilliseconds: mySleepWindowInMilliseconds,
        executionIsolationStrategy,
        callBackUri,
        groupKey,
        commandKey
      };
      if (handle.executionIsolationStrategy === 1) {
        handle.maxConcurrentRequests = myMaxConcurrentRequests;
      } else{
        handle.hystrixThreadPoolConfig={
          coreSize: myCoreSize,
          maximumSize: myMaximumSize,
          maxQueueSize: myMaxQueueSize
        }
      }

      if (!err) {
        const submit = this.checkConditions(permission, statusCode);
        if (submit) {
          handleOk({
            name,
            matchMode,
            handle: JSON.stringify(handle),
            loged,
            enabled,
            sort: Number(values.sort),
            ruleConditions
          });
        }
      }
    });
  };

  handleAdd = () => {
    let { ruleConditions } = this.state;
    ruleConditions.push({
      paramType: "uri",
      operator: "=",
      paramName: "/",
      paramValue: ""
    });
    this.setState({ ruleConditions }, () => {
      let len = ruleConditions.length || 0;
      let key = `paramTypeValueEn${len - 1}`;
      this.setState({ [key]: true });
    });
  };

  handleDelete = index => {
    let { ruleConditions } = this.state;
    if (ruleConditions && ruleConditions.length > 1) {
      ruleConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("至少有一个条件");
    }
    this.setState({ ruleConditions });
  };

  conditionChange = (index, name, value) => {
    let { ruleConditions } = this.state;
    ruleConditions[index][name] = value;
    if (name === "paramType") {
      let key = `paramTypeValueEn${index}`;
      if (value === "uri" || value === "host" || value === "ip") {
        this.setState({ [key]: true });
        ruleConditions[index].paramName = "";
      } else {
        this.setState({ [key]: false });
      }
    }

    this.setState({ ruleConditions });
  };

  onHandleChange = (key, value) => {
    this.setState({ [key]: value });
  };

  onHandleNumberChange = (key, value) => {
    if (/^\d*$/.test(value)) {
      this.setState({ [key]: value });
    }
  };

  render() {
    let {
      onCancel,
      form,
      platform,
      name = "",
      matchMode = "",
      loged = true,
      enabled = true,
      sort = ""
    } = this.props;
    const {
      ruleConditions,
      requestVolumeThreshold,
      errorThresholdPercentage,
      maxConcurrentRequests,
      sleepWindowInMilliseconds,
      groupKey,
      commandKey,
      executionIsolationStrategy,
      hystrixThreadPoolConfig,
      callBackUri
    } = this.state;

    let { matchModeEnums, operatorEnums, paramTypeEnums, hystrixIsolationModeEnums} = platform;

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
        sm: { span: 4 }
      },
      wrapperCol: {
        sm: { span: 18 }
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
        width={800}
        centered
        title="规则"
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
            })(<Input placeholder="名称" style={{width:500}} />)}
          </FormItem>
          <FormItem label="匹配方式" {...formItemLayout}>
            {getFieldDecorator("matchMode", {
              rules: [{ required: true, message: "请选择匹配方式" }],
              initialValue: matchMode
            })(
              <Select style={{width:500}}>
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
          <div className={styles.ruleConditions}>
            <h3 className={styles.header}>
              <strong>*</strong>条件:
            </h3>
            <div className={styles.content}>
              {ruleConditions.map((item, index) => {
                return (
                  <ul key={index}>
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
                    <li style={{display: this.state[`paramTypeValueEn${index}`]?'none':'block'}}>
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
            </div>
            <div>
              <Button onClick={this.handleAdd} type="primary">
                新增
              </Button>
            </div>
          </div>
          {/* <FormItem label="处理" {...formItemLayout}>
            {getFieldDecorator("permission", {
              initialValue: permission,
              rules: [{ required: true, message: "请选择处理" }]
            })(
              <Select>
                {wafEnums.map(item => {
                  return (
                    <Option key={item.name} value={item.name}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem> */}
          <FormItem label="Hystrix隔离模式" {...formItemLayout}>
            {getFieldDecorator("executionIsolationStrategy", {
              rules: [{ required: true, message: "请选择隔离模式" }],
              initialValue: executionIsolationStrategy
            })(
              <Select
                onChange={value => {
                  this.onHandleChange("executionIsolationStrategy", value);
                }}
                style={{width:500}}
              >
                {hystrixIsolationModeEnums.map(item => {
                  return (
                    <Option key={item.code} value={item.code}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          <div className={styles.handleWrap}>
            <div className={styles.header}>
              <h3>Hystrix处理: </h3>
            </div>
            <ul
              className={classnames({
                [styles.handleUl]: true,
                [styles.springUl]: true
              })}
            >
              <li>
                <Input
                  addonBefore={<div>跳闸最小请求数量</div>}
                  value={requestVolumeThreshold}
                  style={{ width: 250 }}
                  placeholder="requestVolumeThreshold"
                  onChange={e => {
                    const value = e.target.value;
                    this.onHandleNumberChange("requestVolumeThreshold", value);
                  }}
                />
              </li>
              <li>
                <Input
                  addonBefore={<div>错误百分比阀值</div>}
                  value={errorThresholdPercentage}
                  style={{ width: 250 }}
                  placeholder="errorThresholdPercentage"
                  onChange={e => {
                    const value = e.target.value;
                    this.onHandleNumberChange(
                      "errorThresholdPercentage",
                      value
                    );
                  }}
                />
              </li>
              {
                this.state.executionIsolationStrategy === 1&&(
                <li>
                  <Input
                    addonBefore={<div>最大并发量</div>}
                    value={maxConcurrentRequests}
                    style={{ width: 280 }}
                    placeholder="maxConcurrentRequests"
                    onChange={e => {
                      const value = e.target.value;
                      this.onHandleNumberChange("maxConcurrentRequests", value);
                    }}
                  />
                </li>
)
              }
              <li>
                <Input
                  addonBefore={<div>跳闸休眠时间(ms)</div>}
                  value={sleepWindowInMilliseconds}
                  style={{ width: 360 }}
                  placeholder="sleepWindowInMilliseconds"
                  onChange={e => {
                    const value = e.target.value;
                    this.onHandleNumberChange(
                      "sleepWindowInMilliseconds",
                      value
                    );
                  }}
                />
              </li>
              <li>
                <Input
                  addonBefore={<div>分组Key</div>}
                  value={groupKey}
                  style={{ width: 320 }}
                  placeholder="groupKey"
                  onChange={e => {
                    const value = e.target.value;
                    this.onHandleChange("groupKey", value);
                  }}
                />
              </li>
              <li>
                <Input
                  addonBefore={<div>失败降级url</div>}
                  value={callBackUri}
                  style={{ width: 320 }}
                  placeholder="失败回调uri,eg: /fallBack"
                  onChange={e => {
                    const value = e.target.value;
                    this.onHandleChange("callBackUri", value);
                  }}
                />
              </li>
              <li>
                <Input
                  addonBefore={<div>命令Key</div>}
                  value={commandKey}
                  style={{ width: 320 }}
                  placeholder="commandKey"
                  onChange={e => {
                    const value = e.target.value;
                    this.onHandleChange("commandKey", value);
                  }}
                />
              </li>
              {
                this.state.executionIsolationStrategy === 0 && (
                <li>
                  <Input
                    addonBefore={<div>线程池coreSize</div>}
                    value={hystrixThreadPoolConfig.coreSize}
                    style={{ width: 320 }}
                    placeholder="hystrix 线程池线程核心数量"
                    onChange={e => {
                        const value = e.target.value;
                        this.onHandleChange("hystrixThreadPoolConfig.coreSize", value);
                      }}
                  />
                </li>
              )}

              {
                this.state.executionIsolationStrategy === 0 && (
                <li>
                  <Input
                    addonBefore={<div>线程池maximumSize</div>}
                    value={hystrixThreadPoolConfig.maximumSize}
                    style={{ width: 320 }}
                    placeholder="hystrix 线程池线程最大数量"
                    onChange={e => {
                      const value = e.target.value;
                      this.onHandleChange("hystrixThreadPoolConfig.maximumSize", value);
                    }}
                  />
                </li>
              )}
              {
                this.state.executionIsolationStrategy === 0&& (
                <li>
                  <Input
                    addonBefore={<div>线程池maxQueueSize</div>}
                    value={hystrixThreadPoolConfig.maxQueueSize}
                    style={{ width: 320 }}
                    placeholder="hystrix 线程池任务队列最大size"
                    onChange={e => {
                      const value = e.target.value;
                      this.onHandleChange("hystrixThreadPoolConfig.maximumSize", value);
                    }}
                  />
                </li>
              )}


            </ul>

          </div>

          {/* <FormItem label="状态码" {...formItemLayout}>
            {getFieldDecorator("statusCode", {
              initialValue: statusCode,
              rules: [
                {
                  pattern: /^\d*$/,
                  message: "请输入数字"
                }
              ]
            })(<Input placeholder="请输入状态码" />)}
          </FormItem> */}
          <div className={styles.layout}>
            <FormItem
              style={{ margin: "0 20px" }}
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
            })(<Input style={{width:360}} placeholder="可以填写1-100之间的数字标志执行先后顺序" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
