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
  Input,
  message,
  Popconfirm,
  Row,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { connect } from "dva";
import TextArea from "antd/lib/input/TextArea";
import styles from "../index.less";
import Tools from "./Tools";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import {
  getUpdateModal,
  updateNamespacePluginsEnabledByNamespace,
} from "../../../utils/namespacePlugin";

const { Search } = Input;
const { Title } = Typography;
@connect(({ common, global, loading }) => ({
  ...global,
  ...common,
  loading: loading.effects["global/fetchPlatform"],
}))
export default class McpServer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorPage: 1,
      selectorPageSize: 12,
      toolPage: 1,
      toolPageSize: 12,
      popup: "",
      localeName: "",
      selectorName: undefined,
      toolName: undefined,
      isPluginEnabled: false,
      pluginName: "mcpServer",
      pluginRole: "Mcp",
    };
  }

  componentDidMount() {
    const { dispatch, plugins } = this.props;
    const { selectorPage, selectorPageSize } = this.state;
    if (plugins && plugins.length > 0) {
      this.getAllSelectors(selectorPage, selectorPageSize, plugins);
    } else {
      dispatch({
        type: "global/fetchPlugins",
        payload: {
          callback: (pluginList) => {
            this.getAllSelectors(selectorPage, selectorPageSize, pluginList);
          },
        },
      });
    }
  }

  /* eslint-disable no-unused-vars */
  componentDidUpdate(prevProps, prevState, snapshot) {
    const preId = prevProps.match.params.id;
    const newId = this.props.match.params.id;
    const { selectorPage, selectorPageSize } = this.state;
    const { dispatch, plugins, currentNamespaceId } = this.props;
    if (newId !== preId) {
      dispatch({
        type: "common/resetData",
      });

      if (prevProps.plugins && prevProps.plugins.length > 0) {
        this.getAllSelectors(selectorPage, selectorPageSize, prevProps.plugins);
      } else {
        dispatch({
          type: "global/fetchPlugins",
          payload: {
            callback: (pluginList) => {
              this.getAllSelectors(selectorPage, selectorPageSize, pluginList);
            },
          },
        });
      }
    }
    if (prevProps.currentNamespaceId !== currentNamespaceId) {
      if (plugins) {
        this.getAllSelectors(selectorPage, selectorPageSize, plugins);
      }
    }
  }
  /* eslint-enable no-unused-vars */

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: "common/resetData",
    });
  }

  getAllSelectors = (page, pageSize, plugins) => {
    const { dispatch, currentNamespaceId } = this.props;
    const { selectorName } = this.state;
    const tempPlugin = this.getPlugin(plugins, this.state.pluginName);
    const tempPluginId = tempPlugin?.pluginId;
    const enabled = tempPlugin?.enabled ?? false;
    this.setState({ pluginId: tempPluginId, isPluginEnabled: enabled });
    dispatch({
      type: "common/fetchSelector",
      payload: {
        currentPage: page,
        pageSize,
        pluginId: tempPluginId,
        name: selectorName,
        namespaceId: currentNamespaceId,
      },
    });
    this.setState({ toolSelectedRowKeys: [] });
  };

  getAllTools = (page, pageSize) => {
    const { dispatch, currentSelector, currentNamespaceId } = this.props;
    const { toolName } = this.state;
    const selectorId = currentSelector ? currentSelector.id : "";
    dispatch({
      type: "common/fetchRule",
      payload: {
        selectorId,
        currentPage: page,
        pageSize,
        name: toolName,
        namespaceId: currentNamespaceId,
      },
    });
    this.setState({ toolSelectedRowKeys: [] });
  };

  getPlugin = (plugins, name) => {
    const plugin = plugins.filter((item) => {
      return item.name === name;
    });
    return plugin && plugin.length > 0 ? plugin[0] : null;
  };

  getPluginConfigField = (config, fieldName) => {
    if (config) {
      let configObj = JSON.parse(config);
      return configObj[fieldName];
    } else {
      return "";
    }
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  searchToolOnchange = (e) => {
    const toolName = e.target.value;
    this.setState({ toolName });
  };

  searchTool = () => {
    this.setState({ toolPage: 1 });
    const { toolPageSize } = this.state;
    this.getAllTools(1, toolPageSize);
  };

  addTool = () => {
    const { toolPage, toolPageSize, pluginId, pluginName } = this.state;
    const { dispatch, currentSelector, plugins, currentNamespaceId } =
      this.props;
    const plugin = this.getPlugin(plugins, this.state.pluginName);
    const { config } = plugin;
    const multiRuleHandle =
      this.getPluginConfigField(config, "multiRuleHandle") === "1";
    if (currentSelector && currentSelector.id) {
      const selectorId = currentSelector.id;
      this.setState({
        popup: (
          <Tools
            pluginId={pluginId}
            pluginName={pluginName}
            multiRuleHandle={multiRuleHandle}
            handleOk={(rule) => {
              dispatch({
                type: "common/addRule",
                payload: {
                  selectorId,
                  ...rule,
                  namespaceId: currentNamespaceId,
                },
                fetchValue: {
                  selectorId,
                  currentPage: toolPage,
                  pageSize: toolPageSize,
                  namespaceId: currentNamespaceId,
                },
                callback: () => {
                  this.closeModal();
                },
              });
            }}
            onCancel={this.closeModal}
          />
        ),
      });
    } else {
      message.destroy();
      message.warn(getIntlContent("SHENYU.COMMON.WARN.INPUT_SELECTOR"));
    }
  };

  togglePluginStatus = () => {
    const { dispatch, plugins } = this.props;
    const pluginName = this.state.pluginName;
    const plugin = this.getPlugin(plugins, pluginName);
    const enabled = !this.state.isPluginEnabled;
    updateNamespacePluginsEnabledByNamespace({
      list: [plugin.pluginId],
      namespaceId: this.props.currentNamespaceId,
      enabled,
      dispatch,
      callback: () => {
        plugin.enabled = enabled;
        this.setState({ isPluginEnabled: enabled });
        this.closeModal();
      },
    });
  };

  editClick = () => {
    const { dispatch, plugins } = this.props;
    const plugin = this.getPlugin(plugins, this.state.pluginName);
    getUpdateModal({
      id: plugin.id,
      namespaceId: plugin.namespaceId,
      dispatch,
      callback: (popup) => {
        this.setState({ popup });
      },
      updatedCallback: ({ enabled }) => {
        this.setState({ isPluginEnabled: enabled });
        this.closeModal();
      },
      canceledCallback: () => {
        this.closeModal();
      },
    });
  };

  pageToolChange = (page) => {
    this.setState({ toolPage: page });
    const { toolPageSize } = this.state;
    this.getAllTools(page, toolPageSize);
  };

  pageToolChangeSize = (currentPage, pageSize) => {
    this.setState({ toolPage: 1, toolPageSize: pageSize });
    this.getAllTools(1, pageSize);
  };

  editTool = (record) => {
    console.log("record", record);
    const { dispatch, currentSelector, plugins, currentNamespaceId } =
      this.props;
    const { toolPage, toolPageSize, pluginId, pluginName } = this.state;
    const plugin = this.getPlugin(plugins, this.state.pluginName);
    const { config } = plugin;
    const multiRuleHandle =
      this.getPluginConfigField(config, "multiRuleHandle") === "1";
    const selectorId = currentSelector ? currentSelector.id : "";
    const { id } = record;
    dispatch({
      type: "common/fetchRuleItem",
      payload: {
        id,
        namespaceId: currentNamespaceId,
      },
      callback: (rule) => {
        this.setState({
          popup: (
            <Tools
              {...rule}
              pluginId={pluginId}
              pluginName={pluginName}
              multiRuleHandle={multiRuleHandle}
              handleOk={(values) => {
                dispatch({
                  type: "common/updateRule",
                  payload: {
                    selectorId,
                    ...values,
                    id,
                    namespaceId: currentNamespaceId,
                  },
                  fetchValue: {
                    selectorId,
                    currentPage: toolPage,
                    pageSize: toolPageSize,
                    namespaceId: currentNamespaceId,
                  },
                  callback: () => {
                    this.closeModal();
                  },
                });
              }}
              onCancel={this.closeModal}
            />
          ),
        });
      },
    });
  };

  enableTool = ({ list, enabled }) => {
    const { toolPage, toolPageSize } = this.state;
    const { dispatch, currentSelector, currentNamespaceId } = this.props;
    const selectorId = currentSelector ? currentSelector.id : "";
    dispatch({
      type: "common/enableRule",
      payload: {
        list,
        enabled,
        namespaceId: currentNamespaceId,
      },
      fetchValue: {
        selectorId,
        currentPage: toolPage,
        pageSize: toolPageSize,
        namespaceId: currentNamespaceId,
      },
    });
  };

  onToolSelectChange = (toolSelectedRowKeys) => {
    if (toolSelectedRowKeys && toolSelectedRowKeys.length > 0) {
      this.setState({ toolSelectedRowKeys });
    } else {
      this.setState({ toolSelectedRowKeys: [] });
    }
  };

  openToolClick = () => {
    const { toolSelectedRowKeys } = this.state;
    const { ruleList } = this.props;
    if (toolSelectedRowKeys && toolSelectedRowKeys.length > 0) {
      let anyEnabled = ruleList
        ? ruleList.some(
            (tool) => toolSelectedRowKeys.includes(tool.id) && tool.enabled,
          )
        : false;
      this.enableTool({
        list: toolSelectedRowKeys,
        enabled: !anyEnabled,
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  deleteTool = (record) => {
    const { dispatch, currentSelector, ruleList, currentNamespaceId } =
      this.props;
    const { toolPage, toolPageSize } = this.state;
    const currentPage =
      toolPage > 1 && ruleList.length === 1 ? toolPage - 1 : toolPage;
    dispatch({
      type: "common/deleteRule",
      payload: {
        list: [record.id],
        namespaceId: currentNamespaceId,
      },
      fetchValue: {
        selectorId: currentSelector.id,
        currentPage,
        pageSize: toolPageSize,
        namespaceId: currentNamespaceId,
      },
      callback: () => {
        this.setState({ toolSelectedRowKeys: [] });
      },
    });
  };

  asyncClick = () => {
    const { dispatch, plugins } = this.props;
    const plugin = this.getPlugin(plugins, this.state.pluginName);
    dispatch({
      type: "global/asyncPlugin",
      payload: {
        id: plugin.id,
      },
    });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  changeLocales(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  render() {
    const { popup, toolPage, toolPageSize, toolSelectedRowKeys } = this.state;
    const { ruleList, toolTotal } = this.props;

    const toolRowSelection = {
      selectedRowKeys: toolSelectedRowKeys,
      onChange: this.onToolSelectChange,
    };

    const toolsColumns = [
      // {
      //   align: "center",
      //   title: getIntlContent("SHENYU.SELECTOR.EXEORDER"),
      //   dataIndex: "sort",
      //   key: "sort",
      // },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.TOOL.NAME"),
        dataIndex: "name",
        key: "name",
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.TOOL.REQUESTPARAMS"),
        dataIndex: "handle",
        key: "requestParams",
        render: (text) => {
          const handle = JSON.parse(text);
          const parameters = handle.parameters;
          return (
            <TextArea
              // style={{ width: "100%", height: 100 }}
              value={JSON.stringify(parameters)}
              // disabled
            />
          );
        },
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.TOOL.REQUESTCONFIG"),
        dataIndex: "handle",
        key: "requestConfig",
        render: (text) => {
          const handle = JSON.parse(text);
          const requestConfig = handle.requestConfig;
          return (
            <TextArea
              // style={{ width: "100%", height: 100 }}
              value={requestConfig}
              // disabled
            />
          );
        },
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPEN"),
        dataIndex: "enabled",
        key: "enabled",
        render: (text, row) => (
          <Switch
            checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
            unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
            checked={text}
            onChange={(checked) => {
              this.enableTool({ list: [row.id], enabled: checked });
            }}
          />
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
        dataIndex: "dateCreated",
        key: "dateCreated",
        sorter: (a, b) => (a.dateCreated > b.dateCreated ? 1 : -1),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        render: (text, record) => {
          return (
            <div>
              <AuthButton perms={`plugin:${this.state.pluginName}Rule:edit`}>
                <span
                  className="edit"
                  style={{ marginRight: 8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    this.editTool(record);
                  }}
                >
                  {getIntlContent("SHENYU.COMMON.CHANGE")}
                </span>
              </AuthButton>
              <AuthButton perms={`plugin:${this.state.pluginName}Rule:delete`}>
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  placement="bottom"
                  onCancel={(e) => {
                    e.stopPropagation();
                  }}
                  onConfirm={(e) => {
                    e.stopPropagation();
                    this.deleteTool(record);
                  }}
                  okText={getIntlContent("SHENYU.COMMON.SURE")}
                  cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                >
                  <span
                    className="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                  </span>
                </Popconfirm>
              </AuthButton>
            </div>
          );
        },
      },
    ];

    const tag = {
      text: this.state.isPluginEnabled
        ? getIntlContent("SHENYU.COMMON.OPEN")
        : getIntlContent("SHENYU.COMMON.CLOSE"),
      color: this.state.isPluginEnabled ? "green" : "red",
    };

    const expandedRowRender = (record) => (
      <p
        style={{
          maxWidth: document.documentElement.clientWidth * 0.5 - 50,
        }}
      >
        {record.handle}
      </p>
    );

    return (
      <div className="plug-content-wrap">
        <Row
          style={{
            marginBottom: "5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "end", flex: 1, margin: 0 }}
          >
            <Title
              level={2}
              style={{ textTransform: "capitalize", margin: "0 20px 0 0" }}
            >
              {this.state.pluginName}
            </Title>
            <Title level={3} type="secondary" style={{ margin: "0 20px 0 0" }}>
              {this.state.pluginRole}
            </Title>
            <Tag color={tag.color}>{tag.text}</Tag>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              minHeight: 32,
            }}
          >
            <Switch
              checked={this.state.isPluginEnabled ?? false}
              onChange={this.togglePluginStatus}
            />
            <AuthButton perms="system:plugin:edit">
              <div className="edit" onClick={this.editClick}>
                {getIntlContent("SHENYU.SYSTEM.EDITOR")}
              </div>
            </AuthButton>
          </div>
        </Row>
        <Row gutter={20}>
          <Col>
            <div className="table-header">
              <div style={{ display: "flex", alignItems: "center" }}>
                <h3>{getIntlContent("SHENYU.PLUGIN.SELECTOR.TOOL.LIST")}</h3>
                <AuthButton perms={`plugin:${this.state.pluginName}:modify`}>
                  <Button
                    icon="reload"
                    onClick={this.asyncClick}
                    type="primary"
                  >
                    {getIntlContent("SHENYU.COMMON.SYN")}{" "}
                    {this.state.pluginName}
                  </Button>
                </AuthButton>
              </div>

              <div className={styles.headerSearch}>
                <AuthButton perms={`plugin:${this.state.pluginName}Rule:query`}>
                  <Search
                    className={styles.search}
                    placeholder={getIntlContent(
                      "SHENYU.PLUGIN.SEARCH.TOOL.NAME",
                    )}
                    enterButton={getIntlContent("SHENYU.SYSTEM.SEARCH")}
                    size="default"
                    onChange={this.searchToolOnchange}
                    onSearch={this.searchTool}
                  />
                </AuthButton>
                <AuthButton perms={`plugin:${this.state.pluginName}Rule:add`}>
                  <Button type="primary" onClick={this.addTool}>
                    {getIntlContent("SHENYU.COMMON.ADD.TOOL")}
                  </Button>
                </AuthButton>
                <AuthButton perms={`plugin:${this.state.pluginName}Rule:edit`}>
                  <Button
                    type="primary"
                    onClick={this.openToolClick}
                    style={{ marginLeft: 10 }}
                  >
                    {getIntlContent(
                      ruleList
                        ? ruleList.some(
                            (tool) =>
                              toolSelectedRowKeys.includes(tool.id) &&
                              tool.enabled,
                          )
                          ? "SHENYU.PLUGIN.SELECTOR.BATCH.CLOSED"
                          : "SHENYU.PLUGIN.SELECTOR.BATCH.OPENED"
                        : "",
                    )}
                  </Button>
                </AuthButton>
              </div>
            </div>
            <Table
              size="small"
              style={{ marginTop: 30 }}
              bordered
              columns={toolsColumns}
              expandedRowRender={expandedRowRender}
              dataSource={ruleList}
              rowSelection={toolRowSelection}
              pagination={{
                total: toolTotal,
                showTotal: (showTotal) => `${showTotal}`,
                showSizeChanger: true,
                pageSizeOptions: ["12", "20", "50", "100"],
                current: toolPage,
                pageSize: toolPageSize,
                onChange: this.pageToolChange,
                onShowSizeChange: this.pageToolChangeSize,
              }}
            />
          </Col>
        </Row>
        {popup}
      </div>
    );
  }
}
