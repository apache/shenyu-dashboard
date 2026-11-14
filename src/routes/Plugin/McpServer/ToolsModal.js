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
import { message } from "antd";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Input from "@douyinfe/semi-ui/lib/es/input";
import TextArea from "@douyinfe/semi-ui/lib/es/input/textarea";
import Select from "@douyinfe/semi-ui/lib/es/select";
import Radio from "@douyinfe/semi-ui/lib/es/radio";
import Tabs from "@douyinfe/semi-ui/lib/es/tabs";
import { Row, Col } from "@douyinfe/semi-ui/lib/es/grid";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import "@douyinfe/semi-ui/lib/es/_base/base.css";
import { connect } from "react-redux";
import ReactJson from "@microlink/react-json-view";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils";
import { clipboardCopy } from "../../../utils/utils";

const FormItem = Form.Slot;
const { Option } = Select;
const { TabPane } = Tabs;

@connect(({ global }) => ({
  currentNamespaceId: global.currentNamespaceId,
  language: global.language,
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

  getFormApi = (formApi) => {
    this.formApi = formApi;
  };

  setFormValues = (fields) => {
    this.formApi.setValues({ ...this.formApi.getValues(), ...fields });
  };

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

        questJson =
          typeof handleObj.requestConfig === "string"
            ? JSON.parse(handleObj.requestConfig)
            : handleObj.requestConfig || {};
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
    } else if (!this.syncJsonToForm()) {
      return;
    }
    this.setState({ editMode });
  };

  // Sync form data to JSON
  syncFormToJson = () => {
    const { parameters, questJson } = this.state;
    const values = this.formApi.getValues();
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
    try {
      const parsedJson = this.parseToolJson(jsonText);

      // Update form fields
      this.setFormValues({
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
        parameters: parsedJson.parameters,
        questJson,
      });
      return true;
    } catch (error) {
      message.error(
        `${getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.ERROR")}${error.message}`,
      );
      return false;
    }
  };

  handleJsonTextChange = (jsonText) => {
    this.setState({ jsonText });

    // Validate JSON format in real time
    try {
      this.parseToolJson(jsonText);
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
    try {
      const parsedJson = this.parseToolJson(jsonText);

      // Update form fields (silent update, no validation triggered)
      const fieldsToUpdate = {};
      if (parsedJson.name !== undefined) fieldsToUpdate.name = parsedJson.name;
      if (parsedJson.description !== undefined)
        fieldsToUpdate.description = parsedJson.description;
      if (parsedJson.enabled !== undefined)
        fieldsToUpdate.enabled = parsedJson.enabled;

      this.setFormValues(fieldsToUpdate);

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
    clipboardCopy(this.state.jsonText)
      .then(() => {
        message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.COPY.SUCCESS"));
      })
      .catch(() => {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.COPY.FAILED"));
      });
  };

  // Listen for form field changes
  handleFormValuesChange = () => {
    if (this.state.editMode === "form") {
      this.syncFormToJson();
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
    // Get current form values
    const values = this.formApi.getValues();

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
          `${getIntlContent("SHENYU.MCP.TOOLS.PARAM.DEPTH.EXCEEDED")}${getIntlContent("SHENYU.MCP.TOOLS.PARAM.DEPTH.MAX.PREFIX")}${MAX_NESTING_DEPTH}${getIntlContent("SHENYU.MCP.TOOLS.PARAM.DEPTH.MAX.SUFFIX")}: ${path}`,
        );
        return false;
      }

      for (let i = 0; i < params.length; i += 1) {
        const item = params[i];
        const { type, name } = item;
        const currentPath = path
          ? `${path}[${i}]`
          : `${getIntlContent("SHENYU.MCP.TOOLS.PARAM.ROW.PREFIX")}${i + 1}${getIntlContent("SHENYU.MCP.TOOLS.PARAM.ROW.SUFFIX")}`;

        if (!type || !name) {
          message.destroy();
          message.error(
            `${currentPath} ${getIntlContent("SHENYU.MCP.TOOLS.PARAM.INCOMPLETE")}`,
          );
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
    if (e && e.preventDefault) e.preventDefault();
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
    this.formApi.submitForm();
  };

  handleValidFormSubmit = (values) => {
    const { handleOk } = this.props;
    const { parameters, questJson } = this.state;
    const {
      name,
      description,
      enabled,
      sort,
      logged,
      matchMode,
      matchRestful,
    } = values;
    if (this.checkParams()) {
      handleOk({
        name,
        description,
        handle: JSON.stringify({
          parameters,
          requestConfig: JSON.stringify(questJson),
          description,
        }),
        enabled,
        sort: parseInt(sort, 10),
        logged,
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
  };

  handleJsonSubmit = () => {
    const { jsonText } = this.state;
    const { handleOk } = this.props;

    if (!jsonText.trim()) {
      message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.EMPTY.ERROR"));
      return;
    }

    try {
      const parsedJson = this.parseToolJson(jsonText);

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
        logged: true,
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
        `${getIntlContent("SHENYU.MCP.TOOLS.PARAM.DEPTH.MAX.REACHED")}${getIntlContent("SHENYU.MCP.TOOLS.PARAM.DEPTH.MAX.PREFIX")}${MAX_NESTING_DEPTH}${getIntlContent("SHENYU.MCP.TOOLS.PARAM.DEPTH.MAX.SUFFIX")}${getIntlContent("SHENYU.MCP.TOOLS.PARAM.DEPTH.MAX.CANNOT.ADD")}`,
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
                showClear
                value={subParam.name}
                placeholder={getIntlContent(
                  "SHENYU.COMMON.PARAMETER.SUBTYPE.NAME",
                )}
                onChange={(value) => {
                  this.updateSubParameter(path, subIndex, "name", value);
                }}
                disabled={parentType === "array"}
              />
            </Col>
            <Col span={5}>
              <Select
                motion={false}
                style={{ width: "100%" }}
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
                showClear
                value={subParam.description}
                placeholder={getIntlContent(
                  "SHENYU.COMMON.PARAMETER.SUBTYPE.DESCRIPTION",
                )}
                onChange={(value) => {
                  this.updateSubParameter(path, subIndex, "description", value);
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
                  subParam.type,
                  currentPath,
                  level + 1,
                )}
              </div>
            )}
        </div>
      );
    });
  };

  parseToolJson = (text) => {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(
        getIntlContent("SHENYU.MCP.TOOLS.PARAM.INVALID.STRUCTURE"),
      );
    }
    return {
      ...parsed,
      parameters: this.fixArrayParameterNames(parsed.parameters || []),
    };
  };

  fixArrayParameterNames = (parameters) => {
    if (!Array.isArray(parameters)) {
      throw new Error(
        getIntlContent("SHENYU.MCP.TOOLS.PARAM.INVALID.STRUCTURE"),
      );
    }
    return parameters.map((param) => {
      if (!param || typeof param !== "object" || Array.isArray(param)) {
        throw new Error(
          getIntlContent("SHENYU.MCP.TOOLS.PARAM.INVALID.STRUCTURE"),
        );
      }
      if (param.parameters == null) return param;
      const children = this.fixArrayParameterNames(param.parameters);
      return {
        ...param,
        parameters: children.map((child, index) =>
          param.type === "array" && index === 0
            ? { ...child, name: "items" }
            : child,
        ),
      };
    });
  };

  render() {
    let {
      onCancel,
      language,
      name = "",
      description = "",
      enabled = true,
      handle = "{}",
      sort = 1,
      logged = true,
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

    const locale =
      language || window.sessionStorage.getItem("locale") || "en-US";
    const initValues = {
      name,
      description: finalDescription,
      enabled,
      sort,
      logged,
      matchMode,
      matchRestful,
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

    const modal = (
      <Modal
        width={1000}
        bodyStyle={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}
        centered
        title={modalTitle}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        okButtonProps={{ "aria-label": getIntlContent("SHENYU.COMMON.SURE") }}
        cancelButtonProps={{
          "aria-label": getIntlContent("SHENYU.COMMON.CALCEL"),
        }}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <Radio.Group
              type="button"
              value={editMode}
              onChange={this.handleEditModeChange}
            >
              <Radio value="form">
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.MODE.FORM")}
              </Radio>
              <Radio value="json">
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.MODE.JSON")}
              </Radio>
            </Radio.Group>
          </div>

          <p style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>
            {editMode === "form"
              ? getIntlContent("SHENYU.MCP.JSON.EDIT.DESCRIPTION")
              : getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.DESCRIPTION")}
          </p>

          {editMode === "json" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                theme="outline"
                size="small"
                onClick={this.generateTemplate}
              >
                {getIntlContent("SHENYU.MCP.TOOLS.ADD.JSON.TEMPLATE")}
              </Button>
              <Button
                theme="outline"
                size="small"
                onClick={this.handleFormatJson}
              >
                {getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT")}
              </Button>
              <Button
                theme="outline"
                size="small"
                onClick={this.handleCompressJson}
              >
                {getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS")}
              </Button>
              <Button
                theme="outline"
                size="small"
                onClick={this.handleCopyToClipboard}
              >
                {getIntlContent("SHENYU.MCP.JSON.EDIT.COPY")}
              </Button>
            </div>
          )}
        </div>

        <Form
          initValues={initValues}
          getFormApi={this.getFormApi}
          onSubmit={this.handleValidFormSubmit}
          onValueChange={this.handleFormValuesChange}
          allowEmpty
          autoScrollToError
          labelPosition="left"
          labelAlign="right"
          labelWidth={160}
          style={{ display: editMode === "form" ? undefined : "none" }}
        >
          <Form.Input
            field="name"
            label={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME")}
            rules={[
              {
                required: true,
                message: getIntlContent("SHENYU.COMMON.INPUTNAME"),
              },
            ]}
            placeholder={getIntlContent(
              "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME",
            )}
            showClear
          />
          <Form.TextArea
            field="description"
            label={getIntlContent(
              "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.DESCRIPTION",
            )}
            rules={[
              {
                required: true,
                message: getIntlContent("SHENYU.COMMON.INPUTDESCRIPTION"),
              },
            ]}
            placeholder={getIntlContent(
              "SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.DESCRIPTION",
            )}
            showClear
          />
          <Form.Input
            field="sort"
            label={getIntlContent("SHENYU.SELECTOR.EXEORDER")}
            rules={[
              {
                required: true,
                message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER"),
              },
            ]}
            placeholder={getIntlContent("SHENYU.SELECTOR.INPUTORDER")}
            type="number"
            min={1}
            max={1000}
            showClear
          />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Switch
                field="logged"
                label={getIntlContent("SHENYU.SELECTOR.PRINTLOG")}
                rules={[{ required: true }]}
              />
            </Col>
            <Col span={12}>
              <Form.Switch
                field="matchRestful"
                label={getIntlContent("SHENYU.SELECTOR.MATCHRESTFUL")}
                rules={[{ required: true }]}
              />
            </Col>
          </Row>
          <Form.Select
            field="matchMode"
            label={getIntlContent("SHENYU.COMMON.MATCHTYPE")}
            rules={[
              {
                required: true,
                message: getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE"),
              },
            ]}
            placeholder={getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE")}
            motion={false}
            style={{ width: "100%" }}
          >
            <Option value="0">and</Option>
            <Option value="1">or</Option>
          </Form.Select>
          <div className={styles.condition}>
            <FormItem label={getIntlContent("SHENYU.COMMON.PARAMETER")}>
              {parameters.map((item, index) => {
                return (
                  <div key={index} style={{ marginBottom: "16px" }}>
                    <Row gutter={8}>
                      <Col span={4}>
                        <Input
                          showClear
                          value={item.name}
                          placeholder={getIntlContent(
                            "SHENYU.COMMON.PARAMETER.NAME",
                          )}
                          onChange={(value) => {
                            const newValue = value;
                            const newParameters = [...parameters];
                            newParameters[index].name = newValue;
                            this.handleParametersChange(newParameters);
                          }}
                        />
                      </Col>
                      <Col span={5}>
                        <Select
                          motion={false}
                          style={{ width: "100%" }}
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
                          showClear
                          value={item.description}
                          placeholder={getIntlContent(
                            "SHENYU.COMMON.PARAMETER.DESCRIPTION",
                          )}
                          onChange={(value) => {
                            const newValue = value;
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
                            item.type,
                            [index],
                            1,
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </FormItem>
            <FormItem label={" "} colon={false}>
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
            label={{
              text: getIntlContent("SHENYU.COMMON.TOOL.REQUESTCONFIG"),
              required: true,
            }}
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
          <Form.Switch
            field="enabled"
            label={getIntlContent("SHENYU.SELECTOR.WHETHEROPEN")}
            rules={[{ required: true }]}
          />
        </Form>
        {editMode === "json" && (
          <Tabs
            activeKey={activeTab}
            onChange={(key) => this.setState({ activeTab: key })}
          >
            <TabPane
              tab={getIntlContent("SHENYU.MCP.JSON.EDIT.TAB.TEXT")}
              itemKey="1"
            >
              <div style={{ position: "relative" }}>
                <TextArea
                  value={jsonText}
                  onChange={this.handleJsonTextChange}
                  placeholder={getIntlContent(
                    "SHENYU.MCP.TOOLS.ADD.JSON.PLACEHOLDER",
                  )}
                  autosize={{ minRows: 15, maxRows: 25 }}
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
              itemKey="2"
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

    return (
      <LocaleProvider locale={locale.toLowerCase() === "en-us" ? enUS : zhCN}>
        {modal}
      </LocaleProvider>
    );
  }
}

export default AddModal;
