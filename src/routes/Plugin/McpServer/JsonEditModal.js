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
import { Button, Modal, message, Input, Row, Col, Tabs, Radio } from "antd";
import ReactJson from "react-json-view";
import { getIntlContent } from "../../../utils/IntlUtils";

const { TextArea } = Input;
const { TabPane } = Tabs;

class JsonEditModal extends Component {
  constructor(props) {
    super(props);

    // 解析handle字段，提升到最外层
    let flattenedData = {};
    let flattenedText = "{}";
    let toolName = "";
    let unifiedJson = {};
    let unifiedText = "{}";

    if (props.data) {
      toolName = props.data.name || "";
      
      // 将handle内容提升到最外层
      if (props.data.handle) {
        try {
          const handleObj = JSON.parse(props.data.handle);
          flattenedData = {
            name: toolName,
            parameters: handleObj.parameters || [],
            requestConfig: handleObj.requestConfig || "{}",
            description: handleObj.description || ""
          };
          flattenedText = JSON.stringify(flattenedData, null, 2);
        } catch (e) {
          console.error("Failed to parse handle JSON:", e);
          flattenedData = {
            name: toolName,
            parameters: [],
            requestConfig: "{}",
            description: ""
          };
          flattenedText = JSON.stringify(flattenedData, null, 2);
        }
      } else {
        flattenedData = {
          name: toolName,
          parameters: [],
          requestConfig: "{}",
          description: ""
        };
        flattenedText = JSON.stringify(flattenedData, null, 2);
      }
    }

    // 统一编辑模式使用相同的扁平化数据
    unifiedJson = flattenedData;
    unifiedText = flattenedText;

    this.state = {
      originalData: props.data || {},
      toolName: toolName,
      flattenedText: flattenedText,
      unifiedText: unifiedText,
      editMode: "separate", // "separate" 或 "unified"
      activeTab: "1",
      parseError: null,
      unifiedParseError: null,
      toolNameError: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data && this.props.data) {
      let flattenedData = {};
      let flattenedText = "{}";
      let toolName = "";
      let unifiedJson = {};
      let unifiedText = "{}";

      toolName = this.props.data.name || "";
      
      // 将handle内容提升到最外层
      if (this.props.data.handle) {
        try {
          const handleObj = JSON.parse(this.props.data.handle);
          flattenedData = {
            name: toolName,
            parameters: handleObj.parameters || [],
            requestConfig: handleObj.requestConfig || "{}",
            description: handleObj.description || ""
          };
          flattenedText = JSON.stringify(flattenedData, null, 2);
        } catch (e) {
          console.error("Failed to parse handle JSON:", e);
          flattenedData = {
            name: toolName,
            parameters: [],
            requestConfig: "{}",
            description: ""
          };
          flattenedText = JSON.stringify(flattenedData, null, 2);
        }
      } else {
        flattenedData = {
          name: toolName,
          parameters: [],
          requestConfig: "{}",
          description: ""
        };
        flattenedText = JSON.stringify(flattenedData, null, 2);
      }

      // 统一编辑模式使用相同的扁平化数据
      unifiedJson = flattenedData;
      unifiedText = flattenedText;

      this.setState({
        originalData: { ...this.props.data },
        toolName: toolName,
        flattenedText: flattenedText,
        unifiedText: unifiedText,
        parseError: null,
        unifiedParseError: null,
        toolNameError: null,
      });
    }
  }

  handleToolNameChange = (e) => {
    const toolName = e.target.value;
    this.setState({ 
      toolName,
      toolNameError: null 
    });
  };

  handleTextChange = (e) => {
    const flattenedText = e.target.value;
    this.setState({ flattenedText });

    // 实时验证JSON格式
    try {
      JSON.parse(flattenedText);
      this.setState({ parseError: null });
    } catch (error) {
      this.setState({ parseError: error.message });
    }
  };

  handleUnifiedTextChange = (e) => {
    const unifiedText = e.target.value;
    this.setState({ unifiedText });

    // 实时验证JSON格式
    try {
      const parsed = JSON.parse(unifiedText);
      this.setState({ unifiedParseError: null });
      
      // 同步更新分别编辑模式的数据
      if (parsed.name !== undefined) {
        this.setState({ toolName: parsed.name });
      }
      
      // 更新扁平化文本
      this.setState({ 
        flattenedText: JSON.stringify(parsed, null, 2),
        parseError: null
      });
    } catch (error) {
      this.setState({ unifiedParseError: error.message });
    }
  };

  handleEditModeChange = (e) => {
    const editMode = e.target.value;
    this.setState({ editMode });

    // 切换到统一编辑模式时，同步数据
    if (editMode === "unified") {
      try {
        const flattenedJson = JSON.parse(this.state.flattenedText);
        // 确保toolName被包含在JSON中
        flattenedJson.name = this.state.toolName;
        const unifiedText = JSON.stringify(flattenedJson, null, 2);
        this.setState({ 
          unifiedText,
          unifiedParseError: null 
        });
      } catch (error) {
        // 如果解析失败，使用基础模板
        const basicJson = {
          name: this.state.toolName,
          parameters: [],
          requestConfig: "{}",
          description: ""
        };
        const unifiedText = JSON.stringify(basicJson, null, 2);
        this.setState({ 
          unifiedText,
          unifiedParseError: null 
        });
      }
    }
  };

  handleFormatJson = () => {
    const { editMode } = this.state;
    
    if (editMode === "separate") {
      try {
        const parsed = JSON.parse(this.state.flattenedText);
        const formatted = JSON.stringify(parsed, null, 2);
        this.setState({
          flattenedText: formatted,
          parseError: null
        });
        message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.SUCCESS"));
      } catch (error) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.FAILED"));
      }
    } else {
      try {
        const parsed = JSON.parse(this.state.unifiedText);
        const formatted = JSON.stringify(parsed, null, 2);
        this.setState({
          unifiedText: formatted,
          unifiedParseError: null
        });
        message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.SUCCESS"));
      } catch (error) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.FAILED"));
      }
    }
  };

  handleCompressJson = () => {
    const { editMode } = this.state;
    
    if (editMode === "separate") {
      try {
        const parsed = JSON.parse(this.state.flattenedText);
        const compressed = JSON.stringify(parsed);
        this.setState({
          flattenedText: compressed,
          parseError: null
        });
        message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS.SUCCESS"));
      } catch (error) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS.FAILED"));
      }
    } else {
      try {
        const parsed = JSON.parse(this.state.unifiedText);
        const compressed = JSON.stringify(parsed);
        this.setState({
          unifiedText: compressed,
          unifiedParseError: null
        });
        message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS.SUCCESS"));
      } catch (error) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.COMPRESS.FAILED"));
      }
    }
  };

  handleCopyToClipboard = () => {
    const { editMode } = this.state;
    const textToCopy = editMode === "separate" ? this.state.flattenedText : this.state.unifiedText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      message.success(getIntlContent("SHENYU.MCP.JSON.EDIT.COPY.SUCCESS"));
    }).catch(() => {
      message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.COPY.FAILED"));
    });
  };

  handleOk = () => {
    const { editMode, toolName, flattenedText, unifiedText, originalData } = this.state;
    const { onOk } = this.props;

    let finalJsonData = {};
    
    if (editMode === "separate") {
      // 分别编辑模式验证
      if (!toolName.trim()) {
        this.setState({ toolNameError: getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME.ERROR") });
        return;
      }

      if (!flattenedText.trim()) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.EMPTY.ERROR"));
        return;
      }

      try {
        const parsed = JSON.parse(flattenedText);
        // 确保name字段是从toolName输入框获取的
        finalJsonData = {
          ...parsed,
          name: toolName
        };
      } catch (error) {
        message.error(`${getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.ERROR")}${error.message}`);
        return;
      }
    } else {
      // 统一编辑模式验证
      if (!unifiedText.trim()) {
        message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.EMPTY.ERROR"));
        return;
      }

      try {
        finalJsonData = JSON.parse(unifiedText);
        
        if (!finalJsonData.name || !finalJsonData.name.trim()) {
          message.error(getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME.ERROR"));
          return;
        }
      } catch (error) {
        message.error(`${getIntlContent("SHENYU.MCP.JSON.EDIT.FORMAT.ERROR")}${error.message}`);
        return;
      }
    }

    // 验证必要字段
    if (!finalJsonData.parameters) {
      finalJsonData.parameters = [];
    }
    if (!finalJsonData.requestConfig) {
      finalJsonData.requestConfig = "{}";
    }
    if (!finalJsonData.description) {
      finalJsonData.description = "";
    }

    // 将扁平化数据转换回原始格式
    const updatedData = {
      ...originalData,
      name: finalJsonData.name,
      handle: JSON.stringify({
        parameters: finalJsonData.parameters,
        requestConfig: finalJsonData.requestConfig,
        description: finalJsonData.description
      })
    };

    onOk(updatedData);
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel();
  };

  render() {
    const { visible } = this.props;
    const { 
      toolName, 
      flattenedText, 
      unifiedText, 
      editMode, 
      parseError, 
      unifiedParseError, 
      toolNameError, 
      activeTab 
    } = this.state;

    // 用于预览的JSON对象
    let previewJson = {};
    let unifiedPreviewJson = {};
    
    try {
      previewJson = JSON.parse(flattenedText);
    } catch (e) {
      previewJson = { error: getIntlContent("SHENYU.MCP.JSON.EDIT.ERROR.PREFIX") + e.message };
    }

    try {
      unifiedPreviewJson = JSON.parse(unifiedText);
    } catch (e) {
      unifiedPreviewJson = { error: getIntlContent("SHENYU.MCP.JSON.EDIT.ERROR.PREFIX") + e.message };
    }

    const modalTitle = editMode === "separate" 
      ? getIntlContent("SHENYU.MCP.JSON.EDIT.TITLE")
      : getIntlContent("SHENYU.MCP.JSON.EDIT.UNIFIED.TITLE");

    return (
      <Modal
        title={modalTitle}
        visible={visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        width={900}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        bodyStyle={{ padding: "20px" }}
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <Radio.Group value={editMode} onChange={this.handleEditModeChange}>
              <Radio.Button value="separate">
                {getIntlContent("SHENYU.MCP.JSON.EDIT.MODE.SEPARATE")}
              </Radio.Button>
              <Radio.Button value="unified">
                {getIntlContent("SHENYU.MCP.JSON.EDIT.MODE.UNIFIED")}
              </Radio.Button>
            </Radio.Group>
          </div>
          
          <p style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>
            {editMode === "separate" 
              ? getIntlContent("SHENYU.MCP.JSON.EDIT.DESCRIPTION")
              : getIntlContent("SHENYU.MCP.JSON.EDIT.UNIFIED.DESCRIPTION")
            }
          </p>
          
          <Row gutter={8}>
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
        </div>

        {editMode === "separate" ? (
          <Tabs activeKey={activeTab} onChange={(key) => this.setState({ activeTab: key })}>
            <TabPane tab={getIntlContent("SHENYU.MCP.JSON.EDIT.TAB.TEXT")} key="1">
              <div style={{ marginBottom: "16px" }}>
                <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                  {getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME")}
                </div>
                <Input
                  value={toolName}
                  onChange={this.handleToolNameChange}
                  placeholder={getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME.PLACEHOLDER")}
                  style={{ marginBottom: "8px" }}
                />
                {toolNameError && (
                  <div style={{ color: "#ff4d4f", fontSize: "12px", marginBottom: "8px" }}>
                    {toolNameError}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                {getIntlContent("SHENYU.MCP.JSON.EDIT.HANDLE.FIELD")}
              </div>
              <div style={{ position: "relative" }}>
                <TextArea
                  value={flattenedText}
                  onChange={this.handleTextChange}
                  placeholder={getIntlContent("SHENYU.MCP.JSON.EDIT.UNIFIED.PLACEHOLDER")}
                  autoSize={{ minRows: 12, maxRows: 20 }}
                  style={{
                    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                />
                {parseError && (
                  <div style={{
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
                  }}>
                    {getIntlContent("SHENYU.MCP.JSON.EDIT.ERROR.PREFIX")}{parseError}
                  </div>
                )}
              </div>
            </TabPane>
            <TabPane tab={getIntlContent("SHENYU.MCP.JSON.EDIT.TAB.PREVIEW")} key="2">
              <div style={{ marginBottom: "16px" }}>
                <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                  {getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME")}
                </div>
                <div style={{ 
                  padding: "8px 12px", 
                  backgroundColor: "#f5f5f5", 
                  borderRadius: "4px",
                  fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
                  fontSize: "13px"
                }}>
                  {toolName || getIntlContent("SHENYU.MCP.JSON.EDIT.TOOL.NAME.PLACEHOLDER")}
                </div>
              </div>
              
              <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                {getIntlContent("SHENYU.MCP.JSON.EDIT.HANDLE.FIELD")}
              </div>
              <div style={{
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                maxHeight: "400px",
                overflow: "auto",
              }}>
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
        ) : (
          <Tabs activeKey={activeTab} onChange={(key) => this.setState({ activeTab: key })}>
            <TabPane tab={getIntlContent("SHENYU.MCP.JSON.EDIT.TAB.TEXT")} key="1">
              <div style={{ position: "relative" }}>
                <TextArea
                  value={unifiedText}
                  onChange={this.handleUnifiedTextChange}
                  placeholder={getIntlContent("SHENYU.MCP.JSON.EDIT.UNIFIED.PLACEHOLDER")}
                  autoSize={{ minRows: 15, maxRows: 25 }}
                  style={{
                    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                />
                {unifiedParseError && (
                  <div style={{
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
                  }}>
                    {getIntlContent("SHENYU.MCP.JSON.EDIT.ERROR.PREFIX")}{unifiedParseError}
                  </div>
                )}
              </div>
            </TabPane>
            <TabPane tab={getIntlContent("SHENYU.MCP.JSON.EDIT.TAB.PREVIEW")} key="2">
              <div style={{
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                maxHeight: "400px",
                overflow: "auto",
              }}>
                <ReactJson
                  src={unifiedPreviewJson}
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

        <div style={{ marginTop: "16px", color: "#666", fontSize: "12px" }}>
          <p><strong>{getIntlContent("SHENYU.MCP.JSON.EDIT.UNIFIED.STRUCTURE.TITLE")}</strong></p>
          <ul>
            <li><code>name</code>: {getIntlContent("SHENYU.MCP.JSON.EDIT.UNIFIED.STRUCTURE.NAME")}</li>
            <li><code>parameters</code>: {getIntlContent("SHENYU.MCP.JSON.EDIT.HANDLE.PARAMETERS")}</li>
            <li><code>requestConfig</code>: {getIntlContent("SHENYU.MCP.JSON.EDIT.HANDLE.REQUESTCONFIG")}</li>
            <li><code>description</code>: {getIntlContent("SHENYU.MCP.JSON.EDIT.HANDLE.DESCRIPTION")}</li>
          </ul>
          <p><strong>{getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.TITLE")}</strong></p>
          <ul>
            <li>{getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.KEYBOARD")}</li>
            <li>{getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.SWITCH")}</li>
            <li>{getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.VALIDATE")}</li>
            <li>{getIntlContent("SHENYU.MCP.JSON.EDIT.OPERATION.UNIFIED.UPDATE")}</li>
          </ul>
        </div>
      </Modal>
    );
  }
}

export default JsonEditModal;
