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
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Switch,
} from "antd";
import { connect } from "dva";
import TextArea from "antd/lib/input/TextArea";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";
import RuleCopy from "./RuleCopy";

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ global }) => ({
  currentNamespaceId: global.currentNamespaceId,
}))
class AddModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };

    this.initParameters(props);
  }

  initParameters = (props) => {
    let parameters = [];
    try {
      const handle = props.handle ? JSON.parse(props.handle) : {};
      parameters = handle.parameters || [
        {
          paramType: "String",
          paramName: "",
          paramDescription: "",
        },
      ];
    } catch (e) {
      console.error("Failed to parse handle JSON:", e);
      parameters = [
        {
          paramType: "String",
          paramName: "",
          paramDescription: "",
        },
      ];
    }
    this.state.parameters = parameters;
  };

  checkParams = () => {
    let { parameters } = this.state;
    let result = true;
    if (parameters) {
      parameters.forEach((item, index) => {
        const { paramType, paramName, paramDescription } = item;
        if (!paramType || !paramName || !paramDescription) {
          message.destroy();
          message.error(`Line ${index + 1} param is incomplete`);
          result = false;
        }
        // eslint-disable-next-line no-lonely-if
        if (!paramName) {
          message.destroy();
          message.error(`Line ${index + 1} param is incomplete`);
          result = false;
        }
      });
    }
    return result;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { form, handleOk } = this.props;
    const { parameters } = this.state;

    form.validateFieldsAndScroll((err, values) => {
      const { name, description, enabled, requestTemplate } = values;
      if (!err) {
        const submit = this.checkParams();
        if (submit) {
          let handle = {
            parameters,
            requestTemplate,
            description,
          };
          handle = JSON.stringify({
            ...handle,
          });
          handleOk({
            name,
            description,
            handle,
            enabled,
            sort: 1,
            loged: true,
            matchMode: "0",
            matchRestful: false,
            ruleConditions: [
              {
                paramType: "uri",
                operator: "pathPattern",
                paramName: "/",
                paramValue: "/**",
              },
            ],
          });
        }
      }
    });
  };

  handleAdd = () => {
    let { parameters } = this.state;
    parameters.push({
      paramType: "String",
      paramName: "",
      paramDescription: "",
    });

    this.setState({ parameters }, () => {
      let len = parameters.length || 0;
      let key = `paramTypeValueEn${len - 1}`;
      this.setState({ [key]: true });
    });
  };

  handleDelete = (index) => {
    let { parameters } = this.state;
    parameters.splice(index, 1);
    this.setState({ parameters });
  };

  handleCopyData = (copyData) => {
    if (!copyData) {
      this.setState({ visible: false });
      return;
    }
    const { form } = this.props;
    const { name, matchMode, loged, enabled, sort } = copyData;
    const formData = {
      name,
      matchMode: matchMode.toString(),
      loged,
      enabled,
      sort,
    };
    form.setFieldsValue(formData);
    this.setState({ visible: false });
  };

  render() {
    let {
      onCancel,
      form,
      name = "",
      description = "",
      enabled = true,
      handle = "{}",
    } = this.props;
    const { parameters, visible } = this.state;

    // Parse handle JSON to get requestTemplate and description
    let parsedHandle = {};
    try {
      parsedHandle = JSON.parse(handle);
    } catch (e) {
      console.error("Failed to parse handle JSON:", e);
    }

    const { requestTemplate = "", description: handleDescription = "" } =
      parsedHandle;
    // Use description from handle if available, otherwise use from props
    const finalDescription = handleDescription || description;

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 4 },
      },
      wrapperCol: {
        sm: { span: 20 },
      },
    };
    return (
      <Modal
        width={1000}
        centered
        title={getIntlContent("SHENYU.TOOL.NAME")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem
            label={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME")}
            {...formItemLayout}
          >
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.COMMON.INPUTNAME"),
                },
              ],
              initialValue: name,
            })(
              <Input
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME",
                )}
                addonAfter={
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      this.setState({ visible: true });
                    }}
                  >
                    {getIntlContent("SHENYU.PLUGIN.SEARCH.RULE.COPY")}
                  </Button>
                }
              />,
            )}
          </FormItem>
          <RuleCopy
            visible={visible}
            onOk={this.handleCopyData}
            onCancel={() => {
              this.setState({ visible: false });
            }}
          />
          <FormItem
            label={getIntlContent(
              "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.DESCRIPTION",
            )}
            {...formItemLayout}
          >
            {getFieldDecorator("description", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.COMMON.INPUTDESCRIPTION"),
                },
              ],
              initialValue: finalDescription,
            })(
              <TextArea
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.DESCRIPTION",
                )}
              />,
            )}
          </FormItem>
          <div className={styles.condition}>
            <FormItem
              label={getIntlContent("SHENYU.COMMON.PARAMETER")}
              {...formItemLayout}
            >
              {parameters.map((item, index) => {
                return (
                  <Row key={index} gutter={8}>
                    <Col span={4}>
                      <Input
                        allowClear
                        value={item.paramName}
                        placeholder={getIntlContent(
                          "SHENYU.COMMON.PARAMETER.NAME",
                        )}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const newParameters = [...parameters];
                          newParameters[index].paramName = newValue;
                          this.setState({ parameters: newParameters });
                        }}
                      />
                    </Col>
                    <Col span={5}>
                      <Select
                        value={item.paramType}
                        placeholder={getIntlContent(
                          "SHENYU.COMMON.PARAMETER.TYPE",
                        )}
                        onChange={(value) => {
                          const newParameters = [...parameters];
                          newParameters[index].paramType = value;
                          this.setState({ parameters: newParameters });
                        }}
                      >
                        <Option value="String">String</Option>
                        <Option value="Integer">Integer</Option>
                        <Option value="Long">Long</Option>
                        <Option value="Double">Double</Option>
                        <Option value="Float">Float</Option>
                        <Option value="Boolean">Boolean</Option>
                      </Select>
                    </Col>
                    <Col span={11}>
                      <Input
                        allowClear
                        value={item.paramDescription}
                        placeholder={getIntlContent(
                          "SHENYU.COMMON.PARAMETER.DESCRIPTION",
                        )}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const newParameters = [...parameters];
                          newParameters[index].paramDescription = newValue;
                          this.setState({ parameters: newParameters });
                        }}
                      />
                    </Col>
                    <Col span={4}>
                      <Button
                        type="danger"
                        onClick={() => {
                          this.handleDelete(index);
                        }}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                    </Col>
                  </Row>
                );
              })}
            </FormItem>
            <FormItem label={" "} colon={false} {...formItemLayout}>
              <Button
                className={styles.addButton}
                onClick={this.handleAdd}
                type="primary"
              >
                {getIntlContent("SHENYU.COMMON.ADD")}{" "}
                {getIntlContent("SHENYU.COMMON.PARAMETER")}
              </Button>
            </FormItem>
          </div>
          <FormItem
            label={getIntlContent(
              "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.REQUESTTEMPLATE",
            )}
            {...formItemLayout}
          >
            {getFieldDecorator("requestTemplate", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.COMMON.INPUTREQUESTTEMPLATE"),
                },
              ],
              initialValue: requestTemplate,
            })(
              <TextArea
                allowClear
                placeholder={getIntlContent(
                  "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.REQUESTTEMPLATE",
                )}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={getIntlContent("SHENYU.SELECTOR.WHETHEROPEN")}
          >
            {getFieldDecorator("enabled", {
              initialValue: enabled,
              valuePropName: "checked",
              rules: [{ required: true }],
            })(<Switch />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
