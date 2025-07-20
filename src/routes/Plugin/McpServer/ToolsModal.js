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
  Radio,
  Tabs,
} from "antd";
import { connect } from "dva";
import TextArea from "antd/lib/input/TextArea";
import ReactJson from "react-json-view";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { Option } = Select;
const { TabPane } = Tabs;

@connect(({ global }) => ({
  currentNamespaceId: global.currentNamespaceId,
}))
class AddModal extends Component {
  constructor(props) {
    super(props);

    // 初始化表单参数
    const formData = this.initParameters(props);

    // 初始化JSON模式数据
    const jsonData = this.initJsonMode(props);

    this.state = {
      // 表单模式状态
      parameters: formData.parameters,
      questJson: formData.questJson,
      // JSON模式状态
      jsonText: jsonData.jsonText,
      jsonError: jsonData.jsonError,
      // 通用状态
      editMode: "form", // "form" 或 "json"
      activeTab: "1",
    };
  }

  initParameters = (props) => {
    const { handle } = props;
    let questJson = {};
    let parameters = [];

    if (handle) {
      try {
        const handleObj = JSON.parse(handle);
        parameters = handleObj.parameters || [];
        questJson = handleObj.requestConfig
          ? JSON.parse(handleObj.requestConfig)
          : {};
      } catch (e) {
        // Failed to parse handle JSON
        parameters = [
          {
            type: "String",
            name: "",
            description: "",
          },
        ];
      }
    } else {
      parameters = [
        {
          type: "String",
          name: "",
          description: "",
        },
      ];
    }
    return { parameters, questJson };
  };

  initJsonMode = (props) => {
    const { name, description, enabled, handle } = props;

    // 将handle内容提升到最外层，创建扁平化的JSON结构
    let flattenedJson = {
      name: name || "",
      description: description || "",
      enabled: enabled !== undefined ? enabled : true,
      parameters: [],
      requestConfig: "{}",
    };

    if (handle) {
      try {
        const handleObj = JSON.parse(handle);
        flattenedJson = {
          name: name || "",
          description: description || "",
          enabled: enabled !== undefined ? enabled : true,
          parameters: handleObj.parameters || [],
          requestConfig: handleObj.requestConfig || "{}",
        };
      } catch (e) {
        // Failed to parse handle JSON
      }
    }

    return {
      jsonText: JSON.stringify(flattenedJson, null, 2),
      jsonError: null,
    };
  };

  generateTemplate = () => {
    const template = {
      name: "getOrderById",
      description: "Get order details by ID",
      enabled: true,
      parameters: [
        {
          name: "orderId",
          type: "string",
          description: "Order ID",
          required: true,
        },
      ],
      requestConfig: JSON.stringify({
        requestTemplate: {
          url: "/api/orders/{orderId}",
          method: "GET",
          headers: [
            {
              name: "Authorization",
              value: "Bearer {token}",
            },
          ],
          timeout: 30000,
        },
        argsPosition: {
          orderId: "url.path",
        },
      }),
    };

    this.setState({
      jsonText: JSON.stringify(template, null, 2),
      jsonError: null,
    });

    message.success(
      getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.TEMPLATE.SUCCESS"),
    );
  };

  handleEditModeChange = (e) => {
    const editMode = e.target.value;
    this.setState({ editMode });

    // 切换到JSON模式时，同步表单数据到JSON
    if (editMode === "json") {
      const { form } = this.props;
      const { parameters, questJson } = this.state;

      // 获取表单数据
      form.validateFields((err, values) => {
        if (!err) {
          const toolJson = {
            name: values.name || "",
            description: values.description || "",
            enabled: values.enabled !== undefined ? values.enabled : true,
            handle: {
              parameters,
              requestConfig: questJson,
              description: values.description || "",
            },
          };

          this.setState({
            jsonText: JSON.stringify(toolJson, null, 2),
            jsonError: null,
          });
        }
      });
    }
  };

  handleJsonTextChange = (e) => {
    const jsonText = e.target.value;
    this.setState({ jsonText });

    // 实时验证JSON格式
    try {
      JSON.parse(jsonText);
      this.setState({ jsonError: null });
    } catch (error) {
      this.setState({ jsonError: error.message });
    }
  };

  handleFormatJson = () => {
    try {
      const parsed = JSON.parse(this.state.jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      this.setState({
        jsonText: formatted,
        jsonError: null,
      });
      message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.SUCCESS"));
    } catch (error) {
      message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.FAILED"));
    }
  };

  handleCompressJson = () => {
    try {
      const parsed = JSON.parse(this.state.jsonText);
      const compressed = JSON.stringify(parsed);
      this.setState({
        jsonText: compressed,
        jsonError: null,
      });
      message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS.SUCCESS"));
    } catch (error) {
      message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS.FAILED"));
    }
  };

  handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(this.state.jsonText)
      .then(() => {
        message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.COPY.SUCCESS"));
      })
      .catch(() => {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.COPY.FAILED"));
      });
  };

  updateJson = (obj) => {
    this.setState({
      jsonText: JSON.stringify(obj, null, 2),
      jsonError: null,
    });
  };

  checkParams = () => {
    let { parameters } = this.state;
    let result = true;
    if (parameters) {
      parameters.forEach((item, index) => {
        const { type, name, description } = item;
        if (!type || !name || !description) {
          message.destroy();
          message.error(`Line ${index + 1} param is incomplete`);
          result = false;
        }
        // eslint-disable-next-line no-lonely-if
        if (!name) {
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
    const { editMode } = this.state;

    if (editMode === "form") {
      // 表单模式提交
      this.handleFormSubmit();
    } else {
      // JSON模式提交
      this.handleJsonSubmit();
    }
  };

  handleFormSubmit = () => {
    const { form, handleOk } = this.props;
    const { parameters } = this.state;

    form.validateFieldsAndScroll((err, values) => {
      const {
        name,
        description,
        enabled,
        sort,
        loged,
        matchMode,
        matchRestful,
      } = values;
      if (!err) {
        const submit = this.checkParams();
        if (submit) {
          let handle = {
            parameters,
            requestConfig: JSON.stringify(this.state.questJson),
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
            sort: parseInt(sort, 10),
            loged,
            matchMode,
            matchRestful,
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

  handleJsonSubmit = () => {
    const { jsonText } = this.state;
    const { handleOk } = this.props;

    if (!jsonText.trim()) {
      message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.EMPTY.ERROR"));
      return;
    }

    try {
      const parsedJson = JSON.parse(jsonText);

      // 验证必要字段
      if (!parsedJson.name || !parsedJson.name.trim()) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME.ERROR"));
        return;
      }

      // 确保字段存在
      const finalData = {
        name: parsedJson.name,
        description: parsedJson.description || "",
        enabled: parsedJson.enabled !== undefined ? parsedJson.enabled : true,
        parameters: parsedJson.parameters || [],
        requestConfig: parsedJson.requestConfig || "{}",
      };

      // 将扁平化数据转换回原始格式，并添加必需的规则级别字段
      const transformedData = {
        name: finalData.name,
        description: finalData.description,
        enabled: finalData.enabled,
        handle: JSON.stringify({
          parameters: finalData.parameters,
          requestConfig: finalData.requestConfig,
          description: finalData.description,
        }),
        // 添加必需的规则级别字段默认值
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
      };

      handleOk(transformedData);
    } catch (error) {
      message.error(
        `${getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.ERROR")}${error.message}`,
      );
    }
  };

  handleAdd = () => {
    let { parameters } = this.state;
    parameters.push({
      type: "String",
      name: "",
      description: "",
    });

    this.setState({ parameters }, () => {
      let len = parameters.length || 0;
      let key = `typeValueEn${len - 1}`;
      this.setState({ [key]: true });
    });
  };

  handleDelete = (index) => {
    let { parameters } = this.state;
    parameters.splice(index, 1);
    this.setState({ parameters });
  };

  render() {
    let {
      onCancel,
      form,
      name = "",
      description = "",
      enabled = true,
      handle = "{}",
      sort = 1,
      loged = true,
      matchMode = "0",
      matchRestful = false,
    } = this.props;
    const { parameters, questJson, editMode, jsonText, jsonError, activeTab } =
      this.state;

    // Parse handle JSON to get requestConfig and description
    let parsedHandle = {};
    try {
      parsedHandle = JSON.parse(handle);
    } catch (e) {
      // Failed to parse handle JSON
    }

    const { description: handleDescription = "" } = parsedHandle;
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

    // 用于预览的JSON对象
    let previewJson = {};
    try {
      previewJson = JSON.parse(jsonText);
    } catch (e) {
      previewJson = {
        error: getIntlContent("SHENYU.MCP.JSON.EDIT.ERROR.PREFIX") + e.message,
      };
    }

    const modalTitle =
      editMode === "form"
        ? getIntlContent("SHENYU.TOOL.NAME")
        : getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.TITLE");

    return (
      <Modal
        width={1000}
        centered
        title={modalTitle}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <Radio.Group value={editMode} onChange={this.handleEditModeChange}>
              <Radio.Button value="form">
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.MODE.FORM")}
              </Radio.Button>
              <Radio.Button value="json">
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.MODE.JSON")}
              </Radio.Button>
            </Radio.Group>
          </div>

          <p style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>
            {editMode === "form"
              ? getIntlContent("SHENYU.MCP.JSON.EDIT.DESCRIPTION")
              : getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.DESCRIPTION")}
          </p>

          {editMode === "json" && (
            <Row gutter={8}>
              <Col>
                <Button size="small" onClick={this.generateTemplate}>
                  {getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.TEMPLATE")}
                </Button>
              </Col>
              <Col>
                <Button size="small" onClick={this.handleFormatJson}>
                  {getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT")}
                </Button>
              </Col>
              <Col>
                <Button size="small" onClick={this.handleCompressJson}>
                  {getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS")}
                </Button>
              </Col>
              <Col>
                <Button size="small" onClick={this.handleCopyToClipboard}>
                  {getIntlContent("SHENYU.MCP.JSON.EDIT.COPY")}
                </Button>
              </Col>
            </Row>
          )}
        </div>

        {editMode === "form" ? (
          // 表单模式
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
                />,
              )}
            </FormItem>
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

            <FormItem
              label={getIntlContent("SHENYU.SELECTOR.EXEORDER")}
              {...formItemLayout}
            >
              {getFieldDecorator("sort", {
                rules: [
                  {
                    required: true,
                    message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER"),
                  },
                ],
                initialValue: sort,
              })(
                <Input
                  allowClear
                  type="number"
                  min={1}
                  max={1000}
                  placeholder={getIntlContent("SHENYU.SELECTOR.INPUTORDER")}
                />,
              )}
            </FormItem>

            <Row gutter={16}>
              <Col span={12}>
                <FormItem
                  label={getIntlContent("SHENYU.SELECTOR.PRINTLOG")}
                  {...formItemLayout}
                  labelCol={{ sm: { span: 8 } }}
                  wrapperCol={{ sm: { span: 16 } }}
                >
                  {getFieldDecorator("loged", {
                    initialValue: loged,
                    valuePropName: "checked",
                    rules: [{ required: true }],
                  })(<Switch />)}
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem
                  label={getIntlContent("SHENYU.SELECTOR.MATCHRESTFUL")}
                  {...formItemLayout}
                  labelCol={{ sm: { span: 8 } }}
                  wrapperCol={{ sm: { span: 16 } }}
                >
                  {getFieldDecorator("matchRestful", {
                    initialValue: matchRestful,
                    valuePropName: "checked",
                    rules: [{ required: true }],
                  })(<Switch />)}
                </FormItem>
              </Col>
            </Row>

            <FormItem
              label={getIntlContent("SHENYU.COMMON.MATCHTYPE")}
              {...formItemLayout}
            >
              {getFieldDecorator("matchMode", {
                rules: [
                  {
                    required: true,
                    message: getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE"),
                  },
                ],
                initialValue: matchMode,
              })(
                <Select
                  placeholder={getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE")}
                >
                  <Option value="0">and</Option>
                  <Option value="1">or</Option>
                </Select>,
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
                          value={item.name}
                          placeholder={getIntlContent(
                            "SHENYU.COMMON.PARAMETER.NAME",
                          )}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const newParameters = [...parameters];
                            newParameters[index].name = newValue;
                            this.setState({ parameters: newParameters });
                          }}
                        />
                      </Col>
                      <Col span={5}>
                        <Select
                          value={item.type}
                          placeholder={getIntlContent(
                            "SHENYU.COMMON.PARAMETER.TYPE",
                          )}
                          onChange={(value) => {
                            const newParameters = [...parameters];
                            newParameters[index].type = value;
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
                          value={item.description}
                          placeholder={getIntlContent(
                            "SHENYU.COMMON.PARAMETER.DESCRIPTION",
                          )}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const newParameters = [...parameters];
                            newParameters[index].description = newValue;
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
              label={getIntlContent("SHENYU.COMMON.TOOL.REQUESTCONFIG")}
              {...formItemLayout}
              required={true}
            >
              <ReactJson
                src={questJson}
                theme="monokai"
                displayDataTypes={false}
                name={false}
                onAdd={this.updateJson}
                onEdit={this.updateJson}
                onDelete={this.updateJson}
                style={{ borderRadius: 4, padding: 16 }}
              />
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
        ) : (
          // JSON模式
          <Tabs
            activeKey={activeTab}
            onChange={(key) => this.setState({ activeTab: key })}
          >
            <TabPane
              tab={getIntlContent("SHENYU.MCP.JSON.EDIT.TAB.TEXT")}
              key="1"
            >
              <div style={{ position: "relative" }}>
                <TextArea
                  value={jsonText}
                  onChange={this.handleJsonTextChange}
                  placeholder={getIntlContent(
                    "SHENYU.MCP.TOOLS.ADD.JSON.PLACEHOLDER",
                  )}
                  autoSize={{ minRows: 15, maxRows: 25 }}
                  style={{
                    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                />
                {jsonError && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      background: "#ff4d4f",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      maxWidth: "300px",
                      wordBreak: "break-word",
                    }}
                  >
                    {getIntlContent("SHENYU.MCP.JSON.EDIT.ERROR.PREFIX")}
                    {jsonError}
                  </div>
                )}
              </div>
            </TabPane>
            <TabPane
              tab={getIntlContent("SHENYU.MCP.JSON.EDIT.TAB.PREVIEW")}
              key="2"
            >
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: "4px",
                  maxHeight: "400px",
                  overflow: "auto",
                }}
              >
                <ReactJson
                  src={previewJson}
                  theme="monokai"
                  displayDataTypes={false}
                  displayObjectSize={false}
                  name={false}
                  enableClipboard={false}
                  style={{
                    padding: "16px",
                    fontSize: "13px",
                  }}
                />
              </div>
            </TabPane>
          </Tabs>
        )}

        {editMode === "json" && (
          <div style={{ marginTop: "16px", color: "#666", fontSize: "12px" }}>
            <p>
              <strong>
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.STRUCTURE.TITLE")}
              </strong>
            </p>
            <ul>
              <li>
                <code>name</code>:{" "}
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.STRUCTURE.NAME")}
              </li>
              <li>
                <code>description</code>:{" "}
                {getIntlContent(
                  "SHENYU.MCP.TOOLS.ADD.JSON.STRUCTURE.DESCRIPTION",
                )}
              </li>
              <li>
                <code>enabled</code>:{" "}
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.STRUCTURE.ENABLED")}
              </li>
              <li>
                <code>parameters</code>:{" "}
                {getIntlContent("SHENYU.MCP.JSON.EDIT.HANDLE.PARAMETERS")}
              </li>
              <li>
                <code>requestConfig</code>:{" "}
                {getIntlContent("SHENYU.MCP.JSON.EDIT.HANDLE.REQUESTCONFIG")}
              </li>
            </ul>
            <p>
              <strong>
                {getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.TITLE")}
              </strong>
            </p>
            <ul>
              <li>
                {getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.KEYBOARD")}
              </li>
              <li>{getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.SWITCH")}</li>
              <li>
                {getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.VALIDATE")}
              </li>
              <li>
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.OPERATION.TEMPLATE")}
              </li>
            </ul>
          </div>
        )}
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
