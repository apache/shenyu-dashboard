import React, { Component, Fragment } from "react";
import { Modal, Form, Select, Input, Switch, Button, message, Tooltip } from "antd";
import { connect } from "dva";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";

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
        paramType: "uri",
        operator: "=",
        paramName: "/",
        paramValue: ""
      }
    ];

    let upstreamList = [
      {
        upstreamHost: "",
        protocol: "",
        upstreamUrl: "",
        weight: "50",
        status: true,
        timestamp: "0",
        warmup: "0"
      }
    ];

    if (props.handle) {
      const myHandle = JSON.parse(props.handle);
      upstreamList = myHandle;
    }
    // eslint-disable-next-line prefer-template
    let selectValue = props.type + "" || null;
    this.state = {
      upstreamList,
      selectValue
    };
    selectorConditions.forEach((item, index) => {
      const { paramType } = item;

      let key = `paramTypeValueEn${index}`;
      if (paramType === "uri" || paramType === "host" || paramType === "ip") {
        this.state[key] = true;
        selectorConditions[index].paramName = "/";
      } else {
        this.state[key] = false;
      }
    });

    this.state.selectorConditions = selectorConditions;
  }

  checkConditions = selectorConditions => {
    let result = true;
    if (selectorConditions) {
      selectorConditions.forEach((item, index) => {
        const { paramType, operator, paramName, paramValue } = item;
        if (!paramType || !operator || !paramValue) {
          message.destroy();
          message.error(`Line ${index + 1} condition is incomplete`);
          result = false;
        }
        if (paramType === "uri" || paramType === "host" || paramType === "ip") {
          // aaa
        } else {
          // eslint-disable-next-line no-lonely-if
          if (!paramName) {
            message.destroy();
            message.error(`Line ${index + 1} condition is incomplete`);
            result = false;
          }
        }
      });
    } else {
      message.destroy();
      message.error(`Incomplete condition`);
      result = false;
    }
    return result;
  };

  checkUpstream = upstreamList => {
    let result = true;

    if (upstreamList) {
      upstreamList.forEach((item, index) => {
        const { upstreamHost, upstreamUrl, weight, status, timestamp, warmup } = item;
        if (!upstreamHost || !upstreamUrl || !weight) {
          message.destroy();
          message.error(
            `Line ${index +
            1} upstreamHost, upstreamUrl and weight can not be null`
          );
          result = false;
        }
        if (!timestamp) {
          item.timestamp = "0";
        }
        if (!warmup) {
          item.warmup = "0";
        }
        if (status === undefined) {
          item.status = true;
        }
      });
    } else {
      message.destroy();
      message.error(`The upstreamList is incomplete`);
      result = false;
    }
    return result;
  };

  handleSubmit = e => {
    const { form, handleOk } = this.props;
    const { selectorConditions, selectValue } = this.state;

    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { upstreamList } = this.state;

        const mySubmit =
          selectValue !== "0" && this.checkConditions(selectorConditions);
        const myUpstream = this.checkUpstream(upstreamList);
        if ((mySubmit || selectValue === "0") && myUpstream) {
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
      paramType: "uri",
      operator: "=",
      paramName: "/",
      paramValue: ""
    });
    this.setState({ selectorConditions }, () => {
      let len = selectorConditions.length || 0;
      let key = `paramTypeValueEn${len - 1}`;

      this.setState({ [key]: true });
    });
  };

  handleDelete = index => {
    let { selectorConditions } = this.state;
    if (selectorConditions && selectorConditions.length > 1) {
      selectorConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("At least one condition");
    }
    this.setState({ selectorConditions });
  };

  conditionChange = (index, name, value) => {
    let { selectorConditions } = this.state;
    selectorConditions[index][name] = value;
    if (name === "paramType") {
      let key = `paramTypeValueEn${index}`;
      if (value === "uri" || value === "host" || value === "ip") {
        this.setState({ [key]: true });
        selectorConditions[index].paramName = "/";
      } else {
        this.setState({ [key]: false });
      }
    }

    this.setState({ selectorConditions });
  };

  divideHandleAdd = () => {
    let { upstreamList } = this.state;
    if (upstreamList) {
      upstreamList.push({
        upstreamHost: "",
        protocol: "",
        upstreamUrl: "",
        weight: "50",
        status: true,
        timestamp: "0",
        warmup: "0"
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
      message.error("At least one upstream");
    }
    this.setState({ upstreamList });
  };

  getSelectValue = value => {
    this.setState({
      selectValue: value
    });
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

    const { selectorConditions, upstreamList, selectValue } = this.state;

    let {
      selectorTypeEnums,
      matchModeEnums,
      operatorEnums,
      paramTypeEnums
    } = platform;

    type = `${type}`;

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
        width={1100}
        centered
        title={getIntlContent("SOUL.SELECTOR.NAME")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SOUL.PLUGIN.SELECTOR.LIST.COLUMN.NAME")} {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [{ required: true, message: getIntlContent("SOUL.COMMON.INPUTNAME")}],
              initialValue: name
            })(<Input placeholder={getIntlContent("SOUL.PLUGIN.SELECTOR.LIST.COLUMN.NAME")} />)}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.COMMON.TYPE")} {...formItemLayout}>
            {getFieldDecorator("type", {
              rules: [{ required: true, message: getIntlContent("SOUL.COMMON.SELCTTYPE")}],
              initialValue: type || "1"
            })(
              <Select onChange={value => this.getSelectValue(value)}>
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
          {selectValue !== "0" && (
            <Fragment>
              <FormItem label={getIntlContent("SOUL.COMMON.MATCHTYPE")} {...formItemLayout}>
                {getFieldDecorator("matchMode", {
                  rules: [{ required: true, message: getIntlContent("SOUL.COMMON.INPUTMATCHTYPE") }],
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
              {/* 条件 */}
              <div className={styles.condition}>
                {/* 输入框左侧标题 */}
                <h3 className={styles.header}>
                  <strong>*</strong>{getIntlContent("SOUL.COMMON.CONDITION")}:{" "}
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
                            style={{ width: 90}}
                          >
                            {paramTypeEnums.map(typeItem => {
                              return (
                                <Option
                                  key={typeItem.name}
                                  value={typeItem.name}
                                >
                                  {typeItem.name}
                                </Option>
                              );
                            })}
                          </Select>
                        </li>
                        <li
                          style={{
                            display: this.state[`paramTypeValueEn${index}`]
                              ? "none"
                              : "block"
                          }}
                        >
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
                            style={{ width: 80 }}
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
                            style={{ width: 300 }}
                          />
                        </li>
                        <li>
                          <Button
                            type="danger"
                            onClick={() => {
                              this.handleDelete(index);
                            }}
                          >
                            {getIntlContent("SOUL.COMMON.DELETE.NAME")}
                          </Button>
                        </li>
                      </ul>
                    );
                  })}
                </div>

                <Button onClick={this.handleAdd} type="primary">
                  {getIntlContent("SOUL.COMMON.ADD")}
                </Button>
              </div>
            </Fragment>
          )}
          <div className={styles.layout}>
            <FormItem {...formCheckLayout} label={getIntlContent("SOUL.SELECTOR.CONTINUE")}>
              {getFieldDecorator("continued", {
                initialValue: continued,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem
              style={{ margin: "0 30px" }}
              {...formCheckLayout}
              label={getIntlContent("SOUL.SELECTOR.PRINTLOG")}
            >
              {getFieldDecorator("loged", {
                initialValue: loged,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem {...formCheckLayout} label={getIntlContent("SOUL.SELECTOR.WHETHEROPEN")}>
              {getFieldDecorator("enabled", {
                initialValue: enabled,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
          </div>
          {/* http配置 */}
          <div className={styles.condition}>
            <h3 className={styles.header} style={{width:105}}>
              <strong>*</strong>{getIntlContent("SOUL.COMMON.SETTING")}:
            </h3>
            <div className={styles.content}>
              {upstreamList.map((item, index) => {
                return (
                  <table key={index}>
                    <tbody>
                      <tr>
                        <td>
                          <Tooltip title="HostName">
                            <Input
                              addonBefore={<div style={{width:70}}>host</div>}
                              onChange={e => {
                              this.divideHandleChange(
                                index,
                                "upstreamHost",
                                e.target.value
                              );
                            }}
                              placeholder="HostName"
                              value={item.upstreamHost}
                              style={{ width: 200 }}
                            />
                          </Tooltip>
                        </td>
                        <td>
                          <Tooltip title="protocol">
                            <Input
                              addonBefore={<div style={{width:70}}>protocol</div>}
                              onChange={e => {
                              this.divideHandleChange(
                                index,
                                "protocol",
                                e.target.value
                              );
                            }}
                              placeholder="http://"
                              value={item.protocol}
                              style={{ width: 200 }}
                            />
                          </Tooltip>
                        </td>
                        <td>
                          <Tooltip title="ip:port">
                            <Input
                              addonBefore={<div style={{width:70}}>ip:port</div>}
                              onChange={e => {
                              this.divideHandleChange(
                                index,
                                "upstreamUrl",
                                e.target.value
                              );
                            }}
                              placeholder="ip:port"
                              value={item.upstreamUrl}
                              style={{ width: 200 }}
                            />
                          </Tooltip>
                        </td>

                        <td>
                          <Tooltip title="weight">
                            <Input
                              addonBefore={<div style={{width:70}}>weight</div>}
                              onChange={e => {
                              this.divideHandleChange(
                                index,
                                "weight",
                                e.target.value
                              );
                            }}
                              placeholder="weight"
                              value={item.weight}
                              style={{ width: 200 }}
                            />
                          </Tooltip>
                        </td>
                        <td>
                          <Button
                            type="danger"
                            onClick={() => {
                            this.divideHandleDelete(index);
                          }}
                          >
                            {getIntlContent("SOUL.COMMON.DELETE.NAME")}
                          </Button>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Tooltip title="startup timestamp">
                            <Input
                              addonBefore={<div style={{width:70}}>startupTime</div>}
                              style={{ width: 200 }}
                              onChange={e => {
                              this.divideHandleChange(
                                index,
                                "timestamp",
                                e.target.value
                              );
                            }}
                              placeholder="timestamp"
                              type="number"
                              value={`${item.timestamp? item.timestamp : "0"}`}
                            />
                          </Tooltip>
                        </td>

                        <td>
                          <Tooltip title="warmup time(ms)">
                            <Input
                              addonBefore={<div style={{width:70}}>warmupTime</div>}
                              style={{ width: 200 }}
                              onChange={e => {
                              this.divideHandleChange(
                                index,
                                "warmup",
                                e.target.value
                              );
                            }}
                              placeholder="warmup time(ms)"
                              type="number"
                              value={`${item.warmup? item.warmup : "0"}`}
                            />
                          </Tooltip>
                        </td>

                        <td>
                          <Tooltip title="status">
                            <Select
                              onChange={value => {
                              this.divideHandleChange(
                                index,
                                "status",
                                value
                              );
                            }}
                              value={`${item.status? item.status : true}`}
                              style={{ width: 200 }}
                            >
                              <Option key="open" value="true">open</Option>
                              <Option key="close" value="false">close</Option>
                            </Select>
                          </Tooltip>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                );
              })}
            </div>
            <div>
              <Button onClick={this.divideHandleAdd} type="primary">
                {getIntlContent("SOUL.COMMON.ADD")}
              </Button>
            </div>
          </div>

          <FormItem label={getIntlContent("SOUL.SELECTOR.EXEORDER")} {...formItemLayout}>
            {getFieldDecorator("sort", {
              initialValue: sort,
              rules: [
                {
                  required: true,
                  message: getIntlContent("SOUL.SELECTOR.INPUTNUMBER")
                },
                {
                  pattern: /^([1-9][0-9]{0,1}|100)$/,
                  message: getIntlContent("SOUL.SELECTOR.INPUTNUMBER")
                }
              ]
            })(<Input placeholder={getIntlContent("SOUL.SELECTOR.INPUTORDER")} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
