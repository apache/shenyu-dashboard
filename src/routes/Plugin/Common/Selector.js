import React, { Component, Fragment } from "react";
import {Modal, Form, Select, Input, Switch, Button, message, Tooltip, Popconfirm} from "antd";
import { connect } from "dva";
import classnames from "classnames";
import styles from "../index.less";
import { getIntlContent } from '../../../utils/IntlUtils'

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ pluginHandle, global }) => ({
  pluginHandle,
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
    // eslint-disable-next-line prefer-template
    let selectValue = props.type + "" || null;
    this.state = {
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

  componentWillMount() {
    const { dispatch, pluginId, handle, multiSelectorHandle } = this.props;
    this.setState({pluginHandleList: []})
    let type = 1
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload:{
        pluginId,
        type,
        handle,
        isHandleArray: multiSelectorHandle,
        callBack: pluginHandles => {
          this.setPluginHandleList(pluginHandles);
        }
      }
    });
  }

  setPluginHandleList = pluginHandles=>{
    this.setState({pluginHandleList: pluginHandles})
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

  handleSubmit = e => {
    e.preventDefault();
    const { form, handleOk, multiSelectorHandle } = this.props;
    const { selectorConditions, selectValue, pluginHandleList } = this.state;
    let handle = [];

    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const mySubmit =
          selectValue !== "0" && this.checkConditions(selectorConditions);
        if (mySubmit || selectValue === "0") {
          pluginHandleList.forEach((handleList, index) => {
            handle[index] = {};
            handleList.forEach((item) => {
              handle[index][item.field] = values[item.field + index]
              delete values[item.field + index];
            });
          });
          handleOk({
            ...values,
            handle: multiSelectorHandle ? JSON.stringify(handle) : JSON.stringify(handle[0]) ,
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
      sort,
      multiSelectorHandle
    } = this.props;
    const labelWidth = 75
    const { selectorConditions, selectValue, pluginHandleList } = this.state;

    type = `${type}`;
    let {
      selectorTypeEnums,
      matchModeEnums,
      operatorEnums,
      paramTypeEnums
    } = platform;

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
        width={(pluginHandleList && pluginHandleList.length > 0 && pluginHandleList[0].length > 3) ? 1350 : 1000}
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
              rules: [{ required: true, message: getIntlContent("SOUL.COMMON.INPUTNAME") }],
              initialValue: name
            })(<Input placeholder={getIntlContent("SOUL.PLUGIN.SELECTOR.LIST.COLUMN.NAME")} />)}
          </FormItem>
          <FormItem label={getIntlContent("SOUL.COMMON.TYPE")} {...formItemLayout}>
            {getFieldDecorator("type", {
              rules: [{ required: true, message: getIntlContent("SOUL.COMMON.INPUTTYPE") }],
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
              <div className={styles.condition}>
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
                            style={{ width: 90 }}
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
                            [styles.handleSelectorUl]: true,
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
                                          style={{ width: 160}}
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
                        {multiSelectorHandle && (
                          <div style={{width:80,marginTop:3}}>
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
              {multiSelectorHandle &&<div style={{width:80,marginTop:3,marginLeft:5}}><Button onClick={this.handleAddHandle} type="primary">{getIntlContent("SOUL.COMMON.ADD")}</Button></div>}
            </div>
          )}

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
