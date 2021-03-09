import React, { Component } from "react";
import { Modal, Form, Select, Input, Switch, Button, message, Tooltip, Popconfirm } from "antd";
import { connect } from "dva";
import classnames from 'classnames';
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils"

const FormItem = Form.Item;
const { Option } = Select;

@connect(({pluginHandle, global }) => ({
  pluginHandle,
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
    this.state = {};
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

  componentWillMount() {
    const { dispatch,pluginId, handle, multiRuleHandle } = this.props;
    this.setState({pluginHandleList: []})
    let type = 2
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload:{
        pluginId,
        type,
        handle,
        isHandleArray: multiRuleHandle,
        callBack: pluginHandles => {
          this.setPluginHandleList(pluginHandles);
        }
      }
    });
  }

  setPluginHandleList = pluginHandles=>{

    this.setState({pluginHandleList: pluginHandles})
  }

  checkConditions = () => {
    let { ruleConditions } = this.state;
    let result = true;
    if (ruleConditions) {
      ruleConditions.forEach((item, index) => {
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

  handleSubmit = e => {
    e.preventDefault();
    const { form, handleOk, multiRuleHandle } = this.props;
    const { ruleConditions,pluginHandleList } = this.state;
    let handle =[];

    form.validateFieldsAndScroll((err, values) => {
      const { name, matchMode, loged, enabled } = values;
      if (!err) {
        const submit = this.checkConditions();
        if (submit) {
          pluginHandleList.forEach((handleList, index) => {
            handle[index] = {};
            handleList.forEach((item) => {
              handle[index][item.field] = values[item.field + index]
            });
          });

          handleOk({
            name,
            matchMode,
            handle: multiRuleHandle ? JSON.stringify(handle) : JSON.stringify(handle[0]) ,
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
      message.error("At least one condition");
    }
    this.setState({ ruleConditions });
  };

  handleAddHandle = () => {
    let {pluginHandleList} = this.state;
    let pluginHandle = pluginHandleList[0];
    let toAddPluginHandle = pluginHandle.map(e=>{
      return {...e,value:null};
    })
    pluginHandleList.push(toAddPluginHandle);
    this.setState({
      pluginHandleList
    })
  }

  handleDeleteHandle = (index) => {
    let {pluginHandleList} = this.state;
    if(pluginHandleList.length === 1) {
      message.destroy();
      message.error(getIntlContent("SOUL.PLUGIN.HANDLE.TIP"));
    } else {
      pluginHandleList.splice(index,1);
      this.setState({pluginHandleList})
    }
  }

  conditionChange = (index, name, value) => {
    let { ruleConditions } = this.state;
    ruleConditions[index][name] = value;
    if (name === "paramType") {
      let key = `paramTypeValueEn${index}`;
      if (value === "uri" || value === "host" || value === "ip") {
        this.setState({ [key]: true });
        ruleConditions[index].paramName = "/";
      } else {
        this.setState({ [key]: false });
      }
    }

    this.setState({ ruleConditions });
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
      sort = "",
      multiRuleHandle
    } = this.props;
    const labelWidth = 160
    const { ruleConditions,pluginHandleList } = this.state;
    let { matchModeEnums, operatorEnums, paramTypeEnums } = platform;
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
        width={1000}
        centered
        title={getIntlContent("SOUL.RULE.NAME")}
        visible
        okText={getIntlContent("SOUL.COMMON.SURE")}
        cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SOUL.PLUGIN.SELECTOR.LIST.COLUMN.NAME")} {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [{ required: true, message: getIntlContent("SOUL.COMMON.INPUTNAME") }],
              initialValue: name
            })(<Input placeholder={getIntlContent("SOUL.PLUGIN.SELECTOR.LIST.COLUMN.NAME")} />)}
          </FormItem>
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
          <div className={styles.ruleConditions}>
            <h3 className={styles.header} style={{width:105}}>
              <strong>*</strong>{getIntlContent("SOUL.COMMON.CONDITION")}:
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
                        style={{ width: 90 }}
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
                        style={{ width: 280 }}
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
            <div>
              <Button onClick={this.handleAdd} type="primary">
                {getIntlContent("SOUL.COMMON.ADD")}
              </Button>
            </div>
          </div>
          {(pluginHandleList && pluginHandleList.length > 0) && (
            <div className={styles.handleWrap}>
              <div className={styles.header}>
                <h3 style={{width:100}}>{getIntlContent("SOUL.COMMON.DEAL")}: </h3>
              </div>
              <div>
                {
                  pluginHandleList.map((handleList,index) =>{
                    return (
                      <div key={index} style={{display:"flex",justifyContent:"space-between",flexDirection:"row"}}>
                        <ul
                          className={classnames({
                            [styles.handleUl]: true,
                            [styles.springUl]: true
                          })}
                          style={{width:"100%"}}
                        >
                          {handleList.map(item=> {
                            let required = item.required === "1";
                            let defaultValue =  (item.value === 0 || item.value === false) ? item.value: 
                            (item.value || 
                              (item.defaultValue === "true"?true:(item.defaultValue === "false" ? false : item.defaultValue))
                            );                            
                            let placeholder = item.placeholder || item.label;
                            let checkRule = item.checkRule;
                            let fieldName = item.field+index;
                            let rules = [];
                            if(required){
                              rules.push({ required: {required}, message: getIntlContent("SOUL.COMMON.PLEASEINPUT") + item.label});
                            }
                            if(checkRule){
                              rules.push({
                                // eslint-disable-next-line no-eval
                                pattern: eval(checkRule),
                                message: `${getIntlContent("SOUL.PLUGIN.RULE.INVALID")}:(${checkRule})`
                              })
                            }
                            if (item.dataType === 1) {
                              return (
                                <li key={fieldName}>
                                  <Tooltip title={placeholder}>
                                    <FormItem>
                                      {getFieldDecorator(fieldName, {
                                        rules,
                                        initialValue: defaultValue,
                                      })(
                                        <Input
                                          addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                          placeholder={placeholder}
                                          key={fieldName}
                                          type="number"
                                        />)
                                        }
                                    </FormItem>
                                  </Tooltip>
                                </li>
                              )
                            } else if (item.dataType === 3 && item.dictOptions) {
                              return (
                                <li key={fieldName}>
                                  <Tooltip title={placeholder}>
                                    <FormItem>
                                      {getFieldDecorator(fieldName, {
                                        rules,
                                        initialValue: defaultValue,
                                      })(
                                        <Select
                                          style={{ width: 260}}
                                        >
                                          {item.dictOptions.map(option => {
                                            return (
                                              <Option key={option.dictValue} value={option.dictValue==="true"?true:(option.dictValue==="false"?false:option.dictValue)}>
                                                {option.dictName} ({item.label})
                                              </Option>
                                            );
                                          })}
                                        </Select>
                                      )}
                                    </FormItem>
                                  </Tooltip>
                                </li>
                              )
                            } else {
                              return (
                                <li key={fieldName}>
                                  <Tooltip title={placeholder}>
                                    <FormItem>
                                      {getFieldDecorator(fieldName, {
                                        rules,
                                        initialValue: defaultValue,
                                      })(
                                        <Input
                                          addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                          placeholder={placeholder}
                                          key={fieldName}
                                        />
                                      )}
                                    </FormItem>
                                  </Tooltip>
                                </li>
                              )
                            }
                          })}
                        </ul>
                        {multiRuleHandle && (
                          <div style={{width:80}}>
                            <Popconfirm
                              title={getIntlContent("SOUL.COMMON.DELETE")}
                              placement='bottom'
                              onCancel={(e) => {
                                e.stopPropagation()
                              }}
                              onConfirm={(e) => {
                                e.stopPropagation()
                                this.handleDeleteHandle(index);
                              }}
                              okText={getIntlContent("SOUL.COMMON.SURE")}
                              cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
                            >
                              <Button
                                type="danger" 
                              >
                                {getIntlContent("SOUL.COMMON.DELETE.NAME")}
                              </Button>
                            </Popconfirm>
                          </div>
                        )}
                      </div>
                    )
                  }) 
                }
              </div>
              {multiRuleHandle &&<div style={{width:80}}><Button onClick={this.handleAddHandle} type="primary">{getIntlContent("SOUL.COMMON.ADD")}</Button></div>}
            </div>
          )}
          <div className={styles.layout}>
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
