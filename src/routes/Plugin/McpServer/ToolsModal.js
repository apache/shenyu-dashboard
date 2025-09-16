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

        // Handle array type parameters, force set the first sub-parameter's name to "items"
        parameters = this.fixArrayParameterNames(parameters);

        questJson = handleObj.requestConfig
          ? JSON.parse(handleObj.requestConfig)
          : {};
      } catch (e) {
        // Failed to parse handle JSON
        parameters = [
          {
            type: "string",
            name: "",
            description: "",
            required: true,
          },
        ];
      }
    } else {
      parameters = [
        {
          type: "string",
          name: "",
          description: "",
          required: true,
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
        // Handle array type parameters, force set the first sub-parameter's name to "items"
        const fixedParameters = this.fixArrayParameterNames(
          handleObj.parameters || [],
        );

        flattenedJson = {
          name: name || "",
          description: description || "",
          enabled: enabled !== undefined ? enabled : true,
          parameters: fixedParameters,
          requestConfig: handleObj.requestConfig || "{}",
        };
      } catch (e) {
        // Failed to parse handle JSON
        console.warn("Failed to parse handle JSON in initJsonMode:", e.message);
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

    // When switching to JSON mode, sync form data to JSON
    if (editMode === "json") {
      this.syncFormToJson();
    } else {
      // When switching to form mode, sync JSON data to form
      this.syncJsonToForm();
    }
    this.setState({ editMode });
  };

  // Sync form data to JSON
  syncFormToJson = () => {
    const { form } = this.props;
    const { parameters, questJson } = this.state;
    const values = form.getFieldsValue();
    // Get form data
    const toolJson = {
      name: values.name || "",
      description: values.description || "",
      enabled: values.enabled !== undefined ? values.enabled : true,
      parameters,
      requestConfig: JSON.stringify(questJson),
    };
    this.setState({
      jsonText: JSON.stringify(toolJson, null, 2),
      jsonError: null,
    });
  };

  // Sync JSON data to form
  syncJsonToForm = () => {
    const { jsonText } = this.state;
    const { form } = this.props;
    setTimeout(() => {
      try {
        const parsedJson = JSON.parse(jsonText);

        // Update form fields
        form.setFieldsValue({
          name: parsedJson.name || "",
          description: parsedJson.description || "",
          enabled: parsedJson.enabled !== undefined ? parsedJson.enabled : true,
        });

        // 更新参数和请求配置
        let questJson = {};
        try {
          questJson =
            typeof parsedJson.requestConfig === "string"
              ? JSON.parse(parsedJson.requestConfig)
              : parsedJson.requestConfig || {};
        } catch (e) {
          questJson = {};
        }

        this.setState({
          parameters: this.fixArrayParameterNames(parsedJson.parameters || []),
          questJson,
        });
      } catch (error) {
        // Do not sync when JSON format is invalid
        console.warn("JSON格式错误，无法同步到表单:", error.message);
      }
    }, 0);
  };

  handleJsonTextChange = (e) => {
    const jsonText = e.target.value;
    this.setState({ jsonText });

    // Validate JSON format in real time
    try {
      JSON.parse(jsonText);
      this.setState({ jsonError: null });

      // If JSON format is valid and currently in JSON mode, sync to form in real time
      if (this.state.editMode === "json") {
        this.syncJsonToFormRealtime(jsonText);
      }
    } catch (error) {
      this.setState({ jsonError: error.message });
    }
  };

  // Sync JSON data to form in real time (silent update, no validation errors)
  syncJsonToFormRealtime = (jsonText) => {
    const { form } = this.props;

    try {
      const parsedJson = JSON.parse(jsonText);

      // Update form fields (silent update, no validation triggered)
      const fieldsToUpdate = {};
      if (parsedJson.name !== undefined) fieldsToUpdate.name = parsedJson.name;
      if (parsedJson.description !== undefined)
        fieldsToUpdate.description = parsedJson.description;
      if (parsedJson.enabled !== undefined)
        fieldsToUpdate.enabled = parsedJson.enabled;

      form.setFieldsValue(fieldsToUpdate);

      // Update parameters and request configuration
      let questJson = {};
      try {
        questJson =
          typeof parsedJson.requestConfig === "string"
            ? JSON.parse(parsedJson.requestConfig)
            : parsedJson.requestConfig || {};
      } catch (e) {
        questJson = {};
      }

      this.setState({
        parameters: parsedJson.parameters || [],
        questJson,
      });
    } catch (error) {
      // Silently handle errors to avoid affecting user input
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

  // Listen for form field changes
  handleFormValuesChange = () => {
    // If currently in form mode, sync form data to JSON in real time
    if (this.state.editMode === "form") {
      // Use setTimeout to ensure form values are updated before syncing
      setTimeout(() => {
        // Slightly delay to ensure form values are updated before syncing
        this.syncFormToJson();
      }, 100);
    }
  };

  // Sync form data to JSON when parameters change
  handleParametersChange = (newParameters) => {
    this.setState({ parameters: newParameters }, () => {
      // If currently in form mode, sync form data to JSON
      if (this.state.editMode === "form") {
        this.syncFormToJson();
      }
    });
  };

  updateJson = (obj) => {
    const { form } = this.props;

    // Get current form values
    const values = form.getFieldsValue();

    // Build complete tool configuration object
    const toolJson = {
      name: values.name || "",
      description: values.description || "",
      enabled: values.enabled !== undefined ? values.enabled : true,
      parameters: this.state.parameters,
      requestConfig: JSON.stringify(obj.updated_src),
    };

    this.setState(
      {
        questJson: obj.updated_src,
        jsonText: JSON.stringify(toolJson, null, 2),
        jsonError: null,
      },
      () => {
        // If currently in form mode, sync form data to JSON
        if (this.state.editMode === "form") {
          this.syncFormToJson();
        }
      },
    );
  };

  checkParams = () => {
    let { parameters } = this.state;
    let result = true;
    // Maximum nesting depth limit
    const MAX_NESTING_DEPTH = 6;

    const checkParameterRecursive = (params, path = "", depth = 0) => {
      if (!params || !Array.isArray(params)) return true;

      // Check nesting depth
      if (depth > MAX_NESTING_DEPTH) {
        message.destroy();
        message.error(
          `参数嵌套深度超过限制（最大${MAX_NESTING_DEPTH}层）: ${path}`,
        );
        return false;
      }

      for (let i = 0; i < params.length; i += 1) {
        const item = params[i];
        const { type, name } = item;
        const currentPath = path ? `${path}[${i}]` : `第${i + 1}行`;

        if (!type || !name) {
          message.destroy();
          message.error(`${currentPath} 参数不完整，请填写名称、类型`);
          return false;
        }

        // Validate parameter name format (optional: add more strict validation)
        if (name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
          message.destroy();
          message.warning(
            `${currentPath} Parameter name suggestion: Use letters, numbers, and underscores, and start with a letter or underscore`,
          );
        }

        // Recursively check child parameters
        if ((type === "object" || type === "array") && item.parameters) {
          if (
            !checkParameterRecursive(
              item.parameters,
              `${currentPath}.parameters`,
              depth + 1,
            )
          ) {
            return false;
          }
        }
      }
      return true;
    };

    result = checkParameterRecursive(parameters);
    return result;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { editMode } = this.state;

    if (editMode === "form") {
      // Form mode submission
      this.handleFormSubmit();
    } else {
      // JSON mode submission
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

      // Validate required fields
      if (!parsedJson.name || !parsedJson.name.trim()) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME.ERROR"));
        return;
      }

      // Validate required fields
      if (!parsedJson.name || !parsedJson.name.trim()) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME.ERROR"));
        return;
      }

      // Ensure required fields exist
      const finalData = {
        name: parsedJson.name,
        description: parsedJson.description || "",
        enabled: parsedJson.enabled !== undefined ? parsedJson.enabled : true,
        parameters: parsedJson.parameters || [],
        requestConfig: parsedJson.requestConfig || "{}",
      };

      // Convert flattened data back to original format and add required rule-level fields
      const transformedData = {
        name: finalData.name,
        description: finalData.description,
        enabled: finalData.enabled,
        handle: JSON.stringify({
          parameters: finalData.parameters,
          requestConfig: finalData.requestConfig,
          description: finalData.description,
        }),
        // Add required rule-level fields default values
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
      type: "string",
      name: "",
      description: "",
      required: true,
    });

    this.handleParametersChange(parameters);
    let len = parameters.length || 0;
    let key = `typeValueEn${len - 1}`;
    this.setState({ [key]: true });
  };

  handleDelete = (index) => {
    let { parameters } = this.state;
    parameters.splice(index, 1);
    this.handleParametersChange(parameters);
  };

  // Add sub-parameter - supports arbitrary depth nesting but with depth limit
  handleAddSubParameter = (path) => {
    // Maximum nesting depth limit
    const MAX_NESTING_DEPTH = 6;

    // Check current path depth
    if (path.length >= MAX_NESTING_DEPTH) {
      message.destroy();
      message.warning(
        `已达到最大嵌套深度限制（${MAX_NESTING_DEPTH}层），无法继续添加子参数`,
      );
      return;
    }

    let { parameters } = this.state;
    const newParameters = [...parameters];

    // Find target parameter based on path
    let targetParam = newParameters;
    for (let i = 0; i < path.length; i += 1) {
      if (i === path.length - 1) {
        // Last level, add sub-parameter
        if (!targetParam[path[i]].parameters) {
          targetParam[path[i]].parameters = [];
        }
        targetParam[path[i]].parameters.push({
          name: "",
          type: "string",
          description: "",
          required: true,
        });
      } else {
        // Intermediate level, continue navigating down
        targetParam = targetParam[path[i]].parameters;
      }
    }

    this.handleParametersChange(newParameters);
  };

  // Delete sub-parameter - supports arbitrary depth nesting
  handleDeleteSubParameter = (path, subIndex) => {
    let { parameters } = this.state;
    const newParameters = [...parameters];

    // Find parent of target parameter based on path
    let targetParam = newParameters;
    for (let i = 0; i < path.length; i += 1) {
      if (i === path.length - 1) {
        // Last level, delete sub-parameter
        targetParam[path[i]].parameters.splice(subIndex, 1);
      } else {
        // Intermediate level, continue navigating down
        targetParam = targetParam[path[i]].parameters;
      }
    }

    this.handleParametersChange(newParameters);
  };

  //  Update sub-parameter - supports arbitrary depth nesting
  updateSubParameter = (path, subIndex, field, value) => {
    let { parameters } = this.state;
    const newParameters = [...parameters];

    // Find target parameter based on path
    let targetParam = newParameters;
    for (let i = 0; i < path.length; i += 1) {
      if (i === path.length - 1) {
        // Last level, update sub-parameter
        targetParam[path[i]].parameters[subIndex][field] = value;

        // If sub-parameter type changes to object or array, also handle nesting
        if (field === "type") {
          if (value === "object") {
            targetParam[path[i]].parameters[subIndex].parameters = [];
          } else if (value === "array") {
            // Force set the first sub-parameter name to "items" for array type
            targetParam[path[i]].parameters[subIndex].parameters = [
              {
                name: "items",
                type: "string",
                description: "",
                required: true,
              },
            ];
          } else {
            delete targetParam[path[i]].parameters[subIndex].parameters;
          }
        }
      } else {
        // Intermediate level, continue navigating down
        targetParam = targetParam[path[i]].parameters;
      }
    }

    this.handleParametersChange(newParameters);
  };

  // Render sub-parameters - supports infinite level nesting
  renderSubParameters = (subParams, parentType, path = [], level = 1) => {
    if (!subParams || !Array.isArray(subParams)) return null;

    const indentStyle = {
      paddingLeft: `${level * 20}px`,
      borderLeft: level > 1 ? "2px solid #e8e8e8" : "none",
      marginLeft: level > 1 ? "10px" : "0",
    };

    return subParams.map((subParam, subIndex) => {
      const currentPath = [...path, subIndex];

      return (
        <div key={`${path.join("-")}-${subIndex}`} style={indentStyle}>
          <Row
            gutter={8}
            style={{ marginTop: "8px", display: "flex", alignItems: "center" }}
          >
            <Col span={4}>
              <Input
                allowClear
                value={subParam.name}
                placeholder={getIntlContent(
                  "SHENYU.COMMON.PARAMETER.SUBTYPE.NAME",
                )}
                onChange={(e) => {
                  this.updateSubParameter(
                    path,
                    subIndex,
                    "name",
                    e.target.value,
                  );
                }}
                disabled={parentType === "array"}
              />
            </Col>
            <Col span={5}>
              <Select
                value={subParam.type}
                placeholder={getIntlContent("SHENYU.COMMON.PARAMETER.SUBTYPE")}
                onChange={(value) => {
                  this.updateSubParameter(path, subIndex, "type", value);
                }}
              >
                <Option value="string">String</Option>
                <Option value="integer">Integer</Option>
                <Option value="long">Long</Option>
                <Option value="double">Double</Option>
                <Option value="float">Float</Option>
                <Option value="boolean">Boolean</Option>
                <Option value="object">Object</Option>
                <Option value="array">Array</Option>
              </Select>
            </Col>
            <Col span={11}>
              <Input
                allowClear
                value={subParam.description}
                placeholder={getIntlContent(
                  "SHENYU.COMMON.PARAMETER.SUBTYPE.DESCRIPTION",
                )}
                onChange={(e) => {
                  this.updateSubParameter(
                    path,
                    subIndex,
                    "description",
                    e.target.value,
                  );
                }}
                // Add hidden logic: hide description input when parent form type is array
                style={{ display: parentType === "array" ? "none" : "block" }}
              />
            </Col>
            <Col span={4}>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {/* Show add button for Object type */}
                {subParam.type === "object" && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      this.handleAddSubParameter([...path, subIndex]);
                    }}
                  >
                    {getIntlContent("SHENYU.COMMON.PARAMETER.SUBTYPE.ADD")}
                  </Button>
                )}
                <Button
                  type="danger"
                  size="small"
                  onClick={() => {
                    this.handleDeleteSubParameter(path, subIndex);
                  }}
                >
                  {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Recursively render deeper sub-parameters */}
          {(subParam.type === "object" || subParam.type === "array") &&
            subParam.parameters && (
              <div
                style={{
                  marginTop: "8px",
                  border: "1px solid #f0f0f0",
                  borderRadius: "4px",
                  padding: "8px",
                  backgroundColor: level % 2 === 1 ? "#fafafa" : "#f5f5f5",
                  position: "relative",
                }}
              >
                {this.renderSubParameters(
                  subParam.parameters,
                  currentPath,
                  level + 1,
                  subParam.type,
                )}
              </div>
            )}
        </div>
      );
    });
  };

  // Fix array type parameter names, force set the first sub-parameter name to "items"
  fixArrayParameterNames = (parameters) => {
    if (!parameters || !Array.isArray(parameters)) {
      return parameters;
    }

    return parameters.map((param) => {
      // If current parameter is array type and has sub-parameters, force set first sub-parameter's name to "items"
      if (
        param.type === "array" &&
        param.parameters &&
        param.parameters.length > 0
      ) {
        return {
          ...param,
          parameters: param.parameters.map((subParam, index) => {
            if (index === 0) {
              return {
                ...subParam,
                name: "items",
              };
            }
            return subParam;
          }),
        };
      }

      // Recursively handle sub-parameters
      if (param.parameters && Array.isArray(param.parameters)) {
        return {
          ...param,
          parameters: this.fixArrayParameterNames(param.parameters),
        };
      }

      return param;
    });
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

    // JSON object for preview
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
          // Form mode
          <Form
            onSubmit={this.handleSubmit}
            className="login-form"
            onValuesChange={this.handleFormValuesChange}
          >
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
                    <div key={index} style={{ marginBottom: "16px" }}>
                      <Row gutter={8}>
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
                              this.handleParametersChange(newParameters);
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

                              // Handle type change logic
                              if (value === "object") {
                                // Object type: clear sub-parameters, wait for user to manually add
                                newParameters[index].parameters = [];
                              } else if (value === "array") {
                                // Array type: force set first sub-parameter name to "items"
                                newParameters[index].parameters = [
                                  {
                                    name: "items",
                                    type: "string",
                                    description: "",
                                    required: true,
                                  },
                                ];
                              } else {
                                // Other basic types: delete sub-parameters
                                delete newParameters[index].parameters;
                              }

                              this.handleParametersChange(newParameters);
                            }}
                          >
                            <Option value="string">String</Option>
                            <Option value="integer">Integer</Option>
                            <Option value="long">Long</Option>
                            <Option value="double">Double</Option>
                            <Option value="float">Float</Option>
                            <Option value="boolean">Boolean</Option>
                            <Option value="object">Object</Option>
                            <Option value="array">Array</Option>
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
                              this.handleParametersChange(newParameters);
                            }}
                          />
                        </Col>
                        <Col span={4}>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {/* Object type: display add button */}
                            {item.type === "object" && (
                              <Button
                                type="primary"
                                onClick={() => {
                                  this.handleAddSubParameter([index]);
                                }}
                              >
                                {getIntlContent(
                                  "SHENYU.COMMON.PARAMETER.SUBTYPE.ADD",
                                )}
                              </Button>
                            )}
                            <Button
                              type="danger"
                              onClick={() => {
                                this.handleDelete(index);
                              }}
                            >
                              {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                            </Button>
                          </div>
                        </Col>
                      </Row>
                      {/* Render sub-parameters */}
                      {(item.type === "object" || item.type === "array") &&
                        item.parameters && (
                          <div
                            style={{
                              marginTop: "8px",
                              border: "1px solid #f0f0f0",
                              borderRadius: "4px",
                              padding: "8px",
                              backgroundColor: "#fafafa",
                            }}
                          >
                            {this.renderSubParameters(
                              item.parameters,
                              [index],
                              1,
                              item.type,
                            )}
                          </div>
                        )}
                    </div>
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
          // JSON mode
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
