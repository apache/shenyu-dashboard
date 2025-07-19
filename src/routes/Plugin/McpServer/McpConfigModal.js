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
import { Modal, Button, message, Row, Col, Typography, Divider, Input } from "antd";
import ReactJson from "react-json-view";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Title, Text } = Typography;
const { TextArea } = Input;

class McpConfigModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sseConfig: {},
      streamableConfig: {},
      customGatewayHost: "", // 用户自定义的网关地址
    };
  }

  componentDidMount() {
    this.generateConfigs();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectorList !== this.props.selectorList) {
      this.generateConfigs();
    }
  }

  // 生成配置信息
  generateConfigs = () => {
    const { selectorList } = this.props;

    if (!selectorList || selectorList.length === 0) {
      this.setState({
        sseConfig: this.getDefaultConfig("sse"),
        streamableConfig: this.getDefaultConfig("streamableHttp"),
      });
      return;
    }

    // 获取网关基础信息
    const gatewayHost = this.getGatewayHost();
    const defaultHeaders = this.getDefaultHeaders();

    // 为每种协议类型生成配置
    const mcpServers = {};

    selectorList.forEach((selector, index) => {
      const selectorName = selector.name || `selector-${index}`;
      const selectorDescription = this.getHandleDescription(selector.handle);
      const selectorUrl = this.getSelectorUrl(selector, gatewayHost);

      // SSE 配置
      const sseKey = `shenyu-mcp-sse-${selectorName}`;
      mcpServers[sseKey] = {
        url: `${selectorUrl}/sse`,
        name: `${selectorName}服务sse`,
        description: `${selectorName}服务测试sse - ${selectorDescription}`,
        headers: defaultHeaders,
        transport: "sse"
      };

      // Streamable HTTP 配置
      const streamableKey = `shenyu-mcp-${selectorName}`;
      mcpServers[streamableKey] = {
        url: `${selectorUrl}/streamablehttp`,
        name: `${selectorName}服务`,
        description: `${selectorName}服务测试 - ${selectorDescription}`,
        headers: defaultHeaders,
        transport: "streamableHttp"
      };
    });

    this.setState({
      sseConfig: { mcpServers: this.filterByTransport(mcpServers, "sse") },
      streamableConfig: { mcpServers: this.filterByTransport(mcpServers, "streamableHttp") },
    });
  };

  // 获取网关主机地址
  getGatewayHost = () => {
    // 优先使用用户自定义的网关地址
    if (this.state.customGatewayHost && this.state.customGatewayHost.trim()) {
      let customHost = this.state.customGatewayHost.trim();
      // 确保包含协议
      if (!customHost.startsWith('http://') && !customHost.startsWith('https://')) {
        customHost = 'http://' + customHost;
      }
      return customHost;
    }

    // 否则使用当前浏览器地址
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = "9195"; // ShenYu默认端口，可以考虑从配置读取

    // 可以在这里添加从配置文件或环境变量读取的逻辑
    // const configHost = process.env.REACT_APP_SHENYU_HOST;
    // const configPort = process.env.REACT_APP_SHENYU_PORT;

    return `${protocol}//${hostname}:${port}`;
  };

  // 获取默认请求头
  getDefaultHeaders = () => {
    return {
      "X-Client-ID": "cursor-client",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.E8C6cQxv5N9Qy7JHHZzY3osVbP40TgXnyFEG-Dc2uo0"
    };
  };

  // 从selector的handle字段获取描述信息
  getHandleDescription = (handle) => {
    if (!handle) return "默认MCP服务";

    try {
      const handleObj = JSON.parse(handle);
      return handleObj.description || "默认MCP服务";
    } catch (e) {
      return "默认MCP服务";
    }
  };

  // 根据传输协议过滤配置
  filterByTransport = (mcpServers, transport) => {
    const filtered = {};
    Object.keys(mcpServers).forEach(key => {
      if (mcpServers[key].transport === transport) {
        filtered[key] = mcpServers[key];
      }
    });
    return filtered;
  };

  // 获取默认配置
  getDefaultConfig = (transport) => {
    const gatewayHost = this.getGatewayHost();
    const defaultHeaders = this.getDefaultHeaders();

    const key = transport === "sse" ? "shenyu-mcp-sse" : "shenyu-mcp";
    // 使用更合理的默认路径，与selector路径生成逻辑保持一致
    const basePath = "/http"; // MCP插件的默认基础路径
    const urlPath = transport === "sse" ? `${basePath}/sse` : `${basePath}/streamablehttp`;
    const nameSuffix = transport === "sse" ? "服务sse" : "服务";
    const descSuffix = transport === "sse" ? "服务测试sse" : "服务测试";

    return {
      mcpServers: {
        [key]: {
          url: `${gatewayHost}${urlPath}`,
          name: `shenyuMcp${nameSuffix}`,
          description: `shenyuMcp${descSuffix}`,
          headers: defaultHeaders,
          transport: transport
        }
      }
    };
  };

  // 复制配置到剪贴板
  handleCopyConfig = (config) => {
    const configText = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configText).then(() => {
      message.success(getIntlContent("SHENYU.MCP.CONFIG.COPY.SUCCESS"));
    }).catch(() => {
      message.error(getIntlContent("SHENYU.MCP.CONFIG.COPY.FAILED"));
    });
  };

  // 复制JSON文本
  copyJsonText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(getIntlContent("SHENYU.MCP.CONFIG.COPY.SUCCESS"));
    }).catch(() => {
      message.error(getIntlContent("SHENYU.MCP.CONFIG.COPY.FAILED"));
    });
  };

  // 根据selector规则生成URL
  getSelectorUrl = (selector, gatewayHost) => {
    // 默认路径使用/http，这是MCP插件的通用前缀
    let basePath = "/http";

    // 尝试从selector的条件中获取更具体的路径信息
    if (selector.selectorConditions && selector.selectorConditions.length > 0) {
      for (const condition of selector.selectorConditions) {
        // 查找URI相关的条件
        if (condition.paramType === 'uri' && condition.paramValue) {
          let conditionPath = condition.paramValue.trim();

          // 移除通配符和多余的字符
          conditionPath = conditionPath
            .replace(/\/\*\*$/, '')  // 移除 /**
            .replace(/\/\*$/, '')    // 移除 /*
            .replace(/\*$/, '');     // 移除结尾的 *

          // 如果路径不为空且不是根路径，使用它作为基础路径
          if (conditionPath && conditionPath !== '/' && conditionPath !== '/**') {
            // 确保路径以/开头
            if (!conditionPath.startsWith('/')) {
              conditionPath = '/' + conditionPath;
            }
            basePath = conditionPath;
            break; // 找到第一个有效的URI条件就使用
          }
        }
      }
    }

    return `${gatewayHost}${basePath}`;
  };

  // 获取从selector提取的路径信息，用于界面显示
  getSelectorPathInfo = (selector) => {
    if (!selector || !selector.selectorConditions || selector.selectorConditions.length === 0) {
      return null;
    }

    for (const condition of selector.selectorConditions) {
      if (condition.paramType === 'uri' && condition.paramValue) {
        let conditionPath = condition.paramValue.trim();

        // 移除通配符和多余的字符
        conditionPath = conditionPath
          .replace(/\/\*\*$/, '')  // 移除 /**
          .replace(/\/\*$/, '')    // 移除 /*
          .replace(/\*$/, '');     // 移除结尾的 *

        // 如果路径不为空且不是根路径，返回它
        if (conditionPath && conditionPath !== '/' && conditionPath !== '/**') {
          // 确保路径以/开头
          if (!conditionPath.startsWith('/')) {
            conditionPath = '/' + conditionPath;
          }
          return conditionPath;
        }
      }
    }

    return "/http (默认)";
  };

  render() {
    const { visible, configType, onCancel, selectorList } = this.props;
    const { sseConfig, streamableConfig } = this.state;

    const isSSE = configType === "sse";
    const config = isSSE ? sseConfig : streamableConfig;
    const title = isSSE
      ? getIntlContent("SHENYU.MCP.CONFIG.SSE.TITLE")
      : getIntlContent("SHENYU.MCP.CONFIG.STREAMABLE.TITLE");

    // 获取当前selector信息
    const currentSelector = selectorList && selectorList.length === 1 ? selectorList[0] : null;
    const selectorInfo = currentSelector
      ? ` - ${currentSelector.name || 'Unnamed Selector'}`
      : '';

    return (
      <Modal
        title={`${title}${selectorInfo}`}
        visible={visible}
        onCancel={onCancel}
        width={800}
        footer={[
          <Button key="copy" type="primary" onClick={() => this.handleCopyConfig(config)}>
            {getIntlContent("SHENYU.MCP.JSON.EDIT.COPY")}
          </Button>,
          <Button key="close" onClick={onCancel}>
            {getIntlContent("SHENYU.COMMON.CALCEL")}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: "16px" }}>
          <Text type="secondary">
            {getIntlContent("SHENYU.MCP.CONFIG.DESCRIPTION")}
          </Text>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <Text strong>网关地址配置:</Text>
          </div>
          <Input
            placeholder="输入自定义网关地址，如: http://localhost:9195 (留空使用默认)"
            value={this.state.customGatewayHost}
            onChange={(e) => {
              this.setState({ customGatewayHost: e.target.value }, () => {
                // 当网关地址改变时重新生成配置
                this.generateConfigs();
              });
            }}
            style={{ marginBottom: "8px" }}
          />
          <div style={{ fontSize: "12px", color: "#666" }}>
            当前使用: <strong>{this.getGatewayHost()}</strong>
          </div>
        </div>

        {currentSelector && (
          <div style={{ marginBottom: "16px" }}>
            <Text type="secondary">
              <>
                <strong>Selector:</strong> {currentSelector.name}
                {currentSelector.enabled ? ' (启用)' : ' (禁用)'}
                <br />
                <strong>基础路径:</strong> {this.getSelectorPathInfo(currentSelector)}
                <br />
                <small style={{ color: "#888" }}>
                  最终URL = 网关地址 + 基础路径 + 协议后缀(/sse 或 /streamablehttp)
                </small>
              </>
            </Text>
          </div>
        )}

        <Divider />

        <div style={{ marginBottom: "16px" }}>
          <Title level={5}>{getIntlContent("SHENYU.MCP.CONFIG.SERVICE.TRANSPORT")}: {isSSE ? "SSE" : "Streamable HTTP"}</Title>
        </div>

        <div style={{
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          maxHeight: "500px",
          overflow: "auto",
          backgroundColor: "#fafafa"
        }}>
          <ReactJson
            src={config}
            theme="monokai"
            displayDataTypes={false}
            displayObjectSize={false}
            name={false}
            enableClipboard={true}
            collapsed={1}
            style={{
              padding: "16px",
              fontSize: "13px",
            }}
          />
        </div>

        {/* 可复制的JSON文本展示 */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <Title level={5}>{getIntlContent("SHENYU.MCP.CONFIG.JSON.TITLE")}</Title>
            <Button
              size="small"
              type="primary"
              onClick={() => this.copyJsonText(JSON.stringify(config, null, 2))}
            >
              {getIntlContent("SHENYU.MCP.CONFIG.COPY.JSON")}
            </Button>
          </div>
          <TextArea
            value={JSON.stringify(config, null, 2)}
            
            readOnly
            autoSize={{ minRows: 6, maxRows: 12 }}
            style={{
              fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
              fontSize: "12px",
              backgroundColor: "#f8f8f8"
            }}
          />
        </div>

        {Object.keys(config.mcpServers || {}).length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <Title level={5}>{getIntlContent("SHENYU.MCP.CONFIG.EXPLANATION.TITLE")}</Title>
            <ul style={{ fontSize: "12px", color: "#666" }}>
              <li><strong>url</strong>: {getIntlContent("SHENYU.MCP.CONFIG.EXPLANATION.URL")}</li>
              <li><strong>name</strong>: {getIntlContent("SHENYU.MCP.CONFIG.EXPLANATION.NAME")}</li>
              <li><strong>description</strong>: {getIntlContent("SHENYU.MCP.CONFIG.EXPLANATION.DESCRIPTION")}</li>
              <li><strong>headers</strong>: {getIntlContent("SHENYU.MCP.CONFIG.EXPLANATION.HEADERS")}</li>
              <li><strong>transport</strong>: {getIntlContent("SHENYU.MCP.CONFIG.EXPLANATION.TRANSPORT")} ({isSSE ? "sse" : "streamableHttp"})</li>
            </ul>
          </div>
        )}
      </Modal>
    );
  }
}

export default McpConfigModal;
