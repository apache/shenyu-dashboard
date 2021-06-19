import React, {Component} from "react";
import {Form, Select, Row, Col, Input, Button} from "antd";
import styles from "../index.less";
import {getIntlContent} from '../../../utils/IntlUtils'

const FormItem = Form.Item;
const {Option} = Select;

export default class ParamPluginRuleHandle extends Component {

  constructor(props) {
    super(props);
    props.onRef(this);
    this.state = {
      parameterOperateType: [
        {
          label: "addParameterKeys",
          value: "addParameterKeys"
        },
        {
          label: "replaceParameterKeys",
          value: "replaceParameterKeys"
        },
        {
          label: "removeParameterKeys",
          value: "removeParameterKeys"
        }
      ]
    }
    this.initList(props);
  }

  initList = (props) => {
    let handle = props.handle && JSON.parse(props.handle);
    let list = [
      [
        {fieldLabel: "OperateType", fieldName: `parameter_type_0`, fieldValue: `addParameterKeys`},
        {
          fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.PATH`),
          fieldName: `parameter_path_0`,
          fieldValue: null
        },
        {
          fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`),
          fieldName: `parameter_key_0`,
          fieldValue: null
        },
        {
          fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.VALUE`),
          fieldName: `parameter_value_0`,
          fieldValue: null
        },

      ]
    ];
    if (handle && (
      (handle.addParameterKeys && handle.addParameterKeys.length > 0) ||
      (handle.replaceParameterKeys && handle.replaceParameterKeys.length > 0) ||
      (handle.removeParameterKeys && handle.removeParameterKeys.length > 0)
    )) {
      list = [];
      let index = 0;
      // eslint-disable-next-line no-unused-expressions
      handle.addParameterKeys && handle.addParameterKeys.length > 0 && handle.addParameterKeys.forEach((e) => {
        list.push([
          {fieldLabel: "OperateType", fieldName: `parameter_type_${index}`, fieldValue: `addParameterKeys`},
          {
            fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.PATH`),
            fieldName: `parameter_path_${index}`,
            fieldValue: e.path
          },
          {
            fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`),
            fieldName: `parameter_key_${index}`,
            fieldValue: e.key
          },
          {
            fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.VALUE`),
            fieldName: `parameter_value_${index}`,
            fieldValue: e.value
          }
        ]);
        index += 1;
      })
      // eslint-disable-next-line no-unused-expressions
      handle.replaceParameterKeys && handle.replaceParameterKeys.length > 0 && handle.replaceParameterKeys.forEach((e) => {
        list.push([
          {
            fieldLabel: "OperateType",
            fieldName: `parameter_type_${index}`,
            fieldValue: `replaceParameterKeys`
          },
          {
            fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.PATH`),
            fieldName: `parameter_path_${index}`,
            fieldValue: e.path
          },
          {
            fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`),
            fieldName: `parameter_key_${index}`,
            fieldValue: e.key
          },
          {
            fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.VALUE`),
            fieldName: `parameter_value_${index}`,
            fieldValue: e.value
          },
        ])
        index += 1;
      })

      let removeKeys = [];
      // eslint-disable-next-line no-unused-expressions
      (handle.removeParameterKeys && handle.removeParameterKeys.length > 0) && handle.removeParameterKeys.forEach((e, i) => {
        if (i % 3 === 0) {
          removeKeys.push([]);
        }
        removeKeys[removeKeys.length - 1].push(e);
      });
      // eslint-disable-next-line no-unused-expressions
      (removeKeys && removeKeys.length > 0) && removeKeys.forEach((e) => {
        let dataItem = [
          {
            fieldLabel: "OperateType",
            fieldName: `parameter_type_${index}`,
            fieldValue: `removeParameterKeys`
          },
          {
            fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`),
            fieldName: `parameter_path_${index}`,
            fieldValue: e[0]
          }
        ];
        if (e[1]) {
          dataItem.push(
            {
              fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`),
              fieldName: `parameter_key_${index}`,
              fieldValue: e[1]
            }
          )
        }
        if (e[2]) {
          dataItem.push(
            {
              fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`),
              fieldName: `parameter_value_${index}`,
              fieldValue: e[2]
            }
          )
        }
        list.push(dataItem)
        index += 1;
      })
    }
    this.state.parameterList = list;
  }

  handleAddRow = () => {
    let {parameterList} = this.state;
    let strs = parameterList[parameterList.length - 1][0].fieldName.split("_");
    // eslint-disable-next-line radix
    let index = parseInt(strs[strs.length - 1]) + 1;

    let defaultFieldType = this.state.parameterOperateType[0].value;
    parameterList.push(
      [
        {fieldLabel: "OperateType", fieldName: `parameter_type_${index}`, fieldValue: defaultFieldType},
        {
          fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.PATH`),
          fieldName: `parameter_path_${index}`,
          fieldValue: null
        },
        {
          fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`),
          fieldName: `parameter_key_${index}`,
          fieldValue: null
        },
        {
          fieldLabel: getIntlContent(`SHENYU.PLUGIN.PARAM.VALUE`),
          fieldName: `parameter_value_${index}`,
          fieldValue: null
        },
      ]
    )
    this.setState({
      parameterList
    })
  }

  handleDeleteRow = (type, rowIndex) => {
    if (rowIndex === 0) {
      return;
    }
    // eslint-disable-next-line react/no-access-state-in-setstate
    let list = this.state.parameterList;
    list.splice(rowIndex, 1);
    this.setState({
       parameterList: list
    })
  }

  handleTypeChange = (val, rowIndex) => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    let list = this.state.parameterList;
    if (val.startsWith("remove")) {
      list[rowIndex][1].fieldLabel = getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`);
      list[rowIndex][2].fieldLabel = getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`);
      list[rowIndex][3].fieldLabel = getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`);
    } else {
      list[rowIndex][1].fieldLabel = getIntlContent(`SHENYU.PLUGIN.PARAM.PATH`);
      list[rowIndex][2].fieldLabel = getIntlContent(`SHENYU.PLUGIN.PARAM.KEY`);
      list[rowIndex][3].fieldLabel = getIntlContent(`SHENYU.PLUGIN.PARAM.VALUE`);
    }
    this.setState({
      parameterList: list
    })
  }

  getData = (formValues) => {
    let handle = {
      addParameterKeys: [],
      replaceParameterKeys: [],
      removeParameterKeys: []
    };
    this.buildData(handle, formValues);
    return JSON.stringify(handle);
  }

  buildData = (handle, formValues) => {
    let list = this.state.parameterList;
    list.forEach(row => {
      let type = formValues[row[0].fieldName];
      let value1 = row.length > 1 && formValues[row[1].fieldName];
      let value2 = row.length > 2 && formValues[row[2].fieldName];
      let value3 = row.length > 3 && formValues[row[3].fieldName];
      if (!type.startsWith("remove") && value1 && value2 && value3) {
        handle[type].push({
          path: value1,
          key: value2,
          value: value3,
        })
      }
      if (type.startsWith("remove")) {
        if (value1) {
          handle[type].push(value1)
        }
        if (value2) {
          handle[type].push(value2)
        }
        if (value3) {
          handle[type].push(value3)
        }
      }
    })
  }

  render() {
    const {parameterOperateType, parameterList} = this.state;
    const {form} = this.props;
    const {getFieldDecorator} = form;
    return (
      <div className={styles.handleWrap} style={{padding: "0px 40px"}}>
        <div className={styles.header}>
          <h3 style={{width: 60, marginTop: 10}}>{getIntlContent("SHENYU.COMMON.DEAL")}: </h3>
        </div>
        <div style={{display:"flex",flexDirection:"column",marginLeft:"10px"}}>
          {parameterList && parameterList.length > 0 && (
            parameterList.map((row, rowIndex) => {
              return (
                <Row gutter={12} key={rowIndex}>
                  {
                    row.map((field, i) => {
                      let rules = [];
                      let placeholder = field.fieldLabel;
                      return (
                          field.fieldName.includes("type") ? (
                            <Col span={6} key={i}>
                              <FormItem>
                                {getFieldDecorator(field.fieldName, {
                                  rules,
                                  initialValue: field.fieldValue,
                                })(
                                  <Select onChange={(val) => { this.handleTypeChange(val, rowIndex) }} placeholder={placeholder} style={{ width: 190 }}>
                                    {
                                      parameterOperateType.map(opt => {
                                        return <Option value={opt.value}>{opt.label}</Option>
                                      })
                                    }
                                  </Select>
                                )}
                              </FormItem>
                            </Col>
                          ) : (
                            <Col span={4} key={i}>
                              <FormItem>
                                {getFieldDecorator(field.fieldName, {
                                  rules,
                                  initialValue: field.fieldValue,
                                })(
                                  <Input
                                    // addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                    placeholder={placeholder}
                                    key={field.fieldName}
                                    // type="number"
                                  />)
                                }
                              </FormItem>
                            </Col>
                          )
                      )}
                    )
                  }
                  <Col span={5}>
                    <Button
                      type="danger"
                      style={{marginRight: "20px"}}
                      onClick={() => {
                        this.handleDeleteRow("parameter", rowIndex);
                      }}
                    >
                      {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                    </Button>
                    {rowIndex === 0 && (
                      <Button onClick={() => this.handleAddRow()} type="primary">
                        {getIntlContent("SHENYU.COMMON.ADD")}
                      </Button>
                    )}
                  </Col>
                </Row>
              )
            })
          )}
        </div>
      </div>
    );
  }
}
