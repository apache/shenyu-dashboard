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
import styles from "../index.less";
import Selector from "./Selector";
import Rule from "./Rule";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { getUpdateModal, updatePluginsEnabled } from "../../../utils/plugin";

const { Search } = Input;
const { Title } = Typography;
@connect(({ common, global, loading }) => ({
  ...global,
  ...common,
  loading: loading.effects["global/fetchPlatform"],
}))
export default class Common extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorPage: 1,
      selectorPageSize: 12,
      selectorSelectedRowKeys: [],
      rulePage: 1,
      rulePageSize: 12,
      ruleSelectedRowKeys: [],
      popup: "",
      localeName: "",
      selectorName: undefined,
      ruleName: undefined,
      isPluginEnabled: false,
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
    let name = this.props.match.params ? this.props.match.params.id : "";
    const tempPlugin = this.getPlugin(plugins, name);
    const tempPluginId = tempPlugin?.id;
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
    this.setState({ selectorSelectedRowKeys: [] });
    this.setState({ ruleSelectedRowKeys: [] });
  };

  getAllRules = (page, pageSize) => {
    const { dispatch, currentSelector, currentNamespaceId } = this.props;
    const { ruleName } = this.state;
    const selectorId = currentSelector ? currentSelector.id : "";
    dispatch({
      type: "common/fetchRule",
      payload: {
        selectorId,
        currentPage: page,
        pageSize,
        name: ruleName,
        namespaceId: currentNamespaceId,
      },
    });
    this.setState({ selectorSelectedRowKeys: [] });
    this.setState({ ruleSelectedRowKeys: [] });
  };

  getPlugin = (plugins, name) => {
    const plugin = plugins.filter((item) => {
      return item.name === name;
    });
    return plugin && plugin.length > 0 ? plugin[0] : null;
  };

  getPluginId = (plugins, name) => {
    let plugin = this.getPlugin(plugins, name);
    if (plugin) {
      return plugin.id;
    } else {
      return "";
    }
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

  searchSelectorOnchange = (e) => {
    const selectorName = e.target.value;
    this.setState({ selectorName });
  };

  searchSelector = () => {
    const { plugins } = this.props;
    const { selectorPage, selectorPageSize } = this.state;
    this.getAllSelectors(selectorPage, selectorPageSize, plugins);
  };

  isDiscovery = (pluginId) => {
    // 5:   divide
    // 15:  grpc
    // 26:  websocket
    return ["5", "15", "26"].includes(pluginId);
  };

  addSelector = () => {
    const { selectorPage, selectorPageSize } = this.state;
    const { dispatch, plugins, currentNamespaceId } = this.props;
    let name = this.props.match.params ? this.props.match.params.id : "";
    const plugin = this.getPlugin(plugins, name);
    const { id: pluginId, config } = plugin;
    const multiSelectorHandle =
      this.getPluginConfigField(config, "multiSelectorHandle") === "1";
    const isDiscovery = this.isDiscovery(pluginId);
    if (isDiscovery) {
      let discoveryConfig = {
        discoveryType: "",
        serverList: "",
        handler: {},
        listenerNode: "",
        props: {},
      };
      this.setState({
        popup: (
          <Selector
            pluginName={name}
            pluginId={pluginId}
            multiSelectorHandle={multiSelectorHandle}
            isAdd={true}
            discoveryConfig={discoveryConfig}
            isDiscovery={true}
            handleOk={(selector) => {
              const {
                name: selectorName,
                listenerNode,
                serverList,
                selectedDiscoveryType,
                discoveryProps,
                handler,
                upstreams,
                importedDiscoveryId,
              } = selector;
              const upstreamsWithProps = this.getUpstreamsWithProps(upstreams);
              dispatch({
                type: "common/addSelector",
                payload: {
                  pluginId,
                  ...selector,
                  upstreams: upstreamsWithProps,
                  namespaceId: currentNamespaceId,
                },
                fetchValue: {
                  pluginId,
                  currentPage: selectorPage,
                  pageSize: selectorPageSize,
                  namespaceId: currentNamespaceId,
                },
                callback: (selectorId) => {
                  this.addDiscoveryUpstream({
                    selectorId,
                    selectorName,
                    pluginName: name,
                    listenerNode,
                    handler,
                    typeValue: this.getTypeValueByPluginName(name),
                    upstreamsWithProps,
                    importedDiscoveryId,
                    selectedDiscoveryType,
                    serverList,
                    discoveryProps,
                  });
                  this.closeModal();
                },
              });
            }}
            onCancel={this.closeModal}
          />
        ),
      });
    } else {
      this.setState({
        popup: (
          <Selector
            pluginName={name}
            pluginId={pluginId}
            multiSelectorHandle={multiSelectorHandle}
            isDiscovery={false}
            handleOk={(selector) => {
              dispatch({
                type: "common/addSelector",
                payload: {
                  pluginId,
                  ...selector,
                  namespaceId: currentNamespaceId,
                },
                fetchValue: {
                  pluginId,
                  currentPage: selectorPage,
                  pageSize: selectorPageSize,
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
    }
  };

  searchRuleOnchange = (e) => {
    const ruleName = e.target.value;
    this.setState({ ruleName });
  };

  searchRule = () => {
    this.setState({ rulePage: 1 });
    const { rulePageSize } = this.state;
    this.getAllRules(1, rulePageSize);
  };

  addRule = () => {
    const { rulePage, rulePageSize, pluginId } = this.state;
    const { dispatch, currentSelector, plugins, currentNamespaceId } =
      this.props;
    let name = this.props.match.params ? this.props.match.params.id : "";
    const plugin = this.getPlugin(plugins, name);
    const { config } = plugin;
    const multiRuleHandle =
      this.getPluginConfigField(config, "multiRuleHandle") === "1";
    if (currentSelector && currentSelector.id) {
      const selectorId = currentSelector.id;
      this.setState({
        popup: (
          <Rule
            pluginId={pluginId}
            pluginName={name}
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
                  currentPage: rulePage,
                  pageSize: rulePageSize,
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
    const pluginName = this.props.match.params
      ? this.props.match.params.id
      : "";
    const plugin = this.getPlugin(plugins, pluginName);
    const enabled = !this.state.isPluginEnabled;
    updatePluginsEnabled({
      list: [plugin.id],
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
    const pluginName = this.props.match.params
      ? this.props.match.params.id
      : "";
    const plugin = this.getPlugin(plugins, pluginName);
    getUpdateModal({
      pluginId: plugin.id,
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

  getTypeValueByPluginName = (name) => {
    return name === "divide"
      ? "http"
      : name === "websocket"
        ? "ws"
        : name === "grpc"
          ? "grpc"
          : "http";
  };

  getUpstreamsWithProps = (upstreams) => {
    return upstreams.map((item) => ({
      protocol: item.protocol,
      url: item.url,
      status: parseInt(item.status, 10),
      weight: item.weight,
      startupTime: item.startupTime,
      props: JSON.stringify({
        warmupTime: item.warmupTime,
      }),
    }));
  };

  addDiscoveryUpstream = ({
    selectorId,
    selectorName,
    pluginName,
    listenerNode,
    handler,
    typeValue,
    upstreamsWithProps,
    importedDiscoveryId,
    selectedDiscoveryType,
    serverList,
    discoveryProps,
  }) => {
    const { dispatch } = this.props;
    dispatch({
      type: "discovery/bindSelector",
      payload: {
        selectorId,
        name: selectorName,
        pluginName,
        listenerNode,
        handler,
        type: typeValue,
        discoveryUpstreams: upstreamsWithProps,
        discovery: {
          id: importedDiscoveryId,
          discoveryType: selectedDiscoveryType,
          serverList,
          props: discoveryProps,
          name: selectorName,
        },
      },
    });
  };

  updateDiscoveryUpstream = (discoveryHandlerId, upstreams) => {
    const { dispatch } = this.props;
    const upstreamsWithHandlerId = upstreams.map((item) => ({
      protocol: item.protocol,
      url: item.url,
      status: parseInt(item.status, 10),
      weight: item.weight,
      props: JSON.stringify({
        warmupTime: item.warmupTime,
      }),
      discoveryHandlerId,
    }));
    dispatch({
      type: "discovery/updateDiscoveryUpstream",
      payload: {
        discoveryHandlerId,
        upstreams: upstreamsWithHandlerId,
      },
    });
  };

  editSelector = (record) => {
    const { dispatch, plugins, currentNamespaceId } = this.props;
    const { selectorPage, selectorPageSize } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : "";
    const plugin = this.getPlugin(plugins, name);
    const { id: pluginId, config } = plugin;
    const multiSelectorHandle =
      this.getPluginConfigField(config, "multiSelectorHandle") === "1";
    const isDiscovery = this.isDiscovery(pluginId);
    const { id } = record;
    dispatch({
      type: "common/fetchSeItem",
      payload: {
        id,
        namespaceId: currentNamespaceId,
      },
      callback: (selector) => {
        if (isDiscovery) {
          let discoveryConfig = {
            props:
              selector.discoveryVO && selector.discoveryVO.props
                ? selector.discoveryVO.props
                : "{}",
            discoveryType:
              selector.discoveryVO && selector.discoveryVO.type
                ? selector.discoveryVO.type
                : "local",
            serverList:
              selector.discoveryVO && selector.discoveryVO.serverList
                ? selector.discoveryVO.serverList
                : "",
            handler:
              selector.discoveryHandler && selector.discoveryHandler.handler
                ? selector.discoveryHandler.handler
                : "{}",
            listenerNode:
              selector.discoveryHandler &&
              selector.discoveryHandler.listenerNode
                ? selector.discoveryHandler.listenerNode
                : "",
          };
          let updateArray = [];
          if (selector.discoveryUpstreams) {
            updateArray = selector.discoveryUpstreams.map((item) => {
              let propsObj = JSON.parse(item.props || "{}");
              if (item.props === null) {
                propsObj = {
                  warmupTime: 10,
                };
              }
              return { ...item, key: item.id, warmupTime: propsObj.warmupTime };
            });
          }
          let discoveryHandlerId = selector.discoveryHandler
            ? selector.discoveryHandler.id
            : "";
          this.setState({
            popup: (
              <Selector
                pluginName={name}
                {...selector}
                multiSelectorHandle={multiSelectorHandle}
                discoveryConfig={discoveryConfig}
                discoveryUpstreams={updateArray}
                isAdd={false}
                isDiscovery={true}
                handleOk={(values) => {
                  dispatch({
                    type: "common/updateSelector",
                    payload: {
                      pluginId,
                      ...values,
                      id,
                      namespaceId: currentNamespaceId,
                    },
                    fetchValue: {
                      pluginId,
                      currentPage: selectorPage,
                      pageSize: selectorPageSize,
                      namespaceId: currentNamespaceId,
                    },
                    callback: () => {
                      const {
                        name: selectorName,
                        handler,
                        upstreams,
                        serverList,
                        listenerNode,
                        discoveryProps,
                        importedDiscoveryId,
                        selectedDiscoveryType,
                      } = values;

                      if (!discoveryHandlerId) {
                        this.addDiscoveryUpstream({
                          selectorId: id,
                          selectorName,
                          pluginName: name,
                          listenerNode,
                          handler,
                          typeValue: this.getTypeValueByPluginName(name),
                          upstreamsWithProps:
                            this.getUpstreamsWithProps(upstreams),
                          importedDiscoveryId,
                          selectedDiscoveryType,
                          serverList,
                          discoveryProps,
                        });
                      } else {
                        this.updateDiscoveryUpstream(
                          discoveryHandlerId,
                          upstreams,
                        );
                      }
                      this.closeModal();
                    },
                  });
                }}
                onCancel={this.closeModal}
              />
            ),
          });
        } else {
          this.setState({
            popup: (
              <Selector
                pluginName={name}
                {...selector}
                multiSelectorHandle={multiSelectorHandle}
                isDiscovery={false}
                handleOk={(values) => {
                  dispatch({
                    type: "common/updateSelector",
                    payload: {
                      pluginId,
                      ...values,
                      id,
                      namespaceId: currentNamespaceId,
                    },
                    fetchValue: {
                      pluginId,
                      currentPage: selectorPage,
                      pageSize: selectorPageSize,
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
        }
      },
    });
  };

  enableSelector = ({ list, enabled }) => {
    const { dispatch, plugins, currentNamespaceId } = this.props;
    const { selectorPage, selectorPageSize } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : "";
    const plugin = this.getPlugin(plugins, name);
    const { id: pluginId } = plugin;
    dispatch({
      type: "common/enableSelector",
      payload: {
        list,
        enabled,
        namespaceId: currentNamespaceId,
      },
      fetchValue: {
        pluginId,
        currentPage: selectorPage,
        pageSize: selectorPageSize,
        namespaceId: currentNamespaceId,
      },
    });
  };

  onSelectorSelectChange = (selectorSelectedRowKeys) => {
    this.setState({ selectorSelectedRowKeys });
  };

  openSelectorClick = () => {
    const { selectorSelectedRowKeys } = this.state;
    const { selectorList } = this.props;
    if (selectorSelectedRowKeys && selectorSelectedRowKeys.length > 0) {
      let anyEnabled = selectorList.some(
        (selector) =>
          selectorSelectedRowKeys.includes(selector.id) && selector.enabled,
      );
      this.enableSelector({
        list: selectorSelectedRowKeys,
        enabled: !anyEnabled,
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  deleteSelector = (record) => {
    const { dispatch, plugins, currentNamespaceId } = this.props;
    const { selectorPage, selectorPageSize } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : "";
    const pluginId = this.getPluginId(plugins, name);
    dispatch({
      type: "common/deleteSelector",
      payload: {
        list: [record.id],
        namespaceId: currentNamespaceId,
      },
      fetchValue: {
        pluginId,
        currentPage: selectorPage,
        pageSize: selectorPageSize,
        namespaceId: currentNamespaceId,
      },
    });
  };

  pageSelectorChange = (page) => {
    this.setState({ selectorPage: page });
    const { plugins } = this.props;
    const { selectorPageSize } = this.state;
    this.getAllSelectors(page, selectorPageSize, plugins);
  };

  pageSelectorChangeSize = (currentPage, pageSize) => {
    const { plugins } = this.props;
    this.setState({ selectorPage: 1, selectorPageSize: pageSize });
    this.getAllSelectors(1, pageSize, plugins);
  };

  pageRuleChange = (page) => {
    this.setState({ rulePage: page });
    const { rulePageSize } = this.state;
    this.getAllRules(page, rulePageSize);
  };

  pageRuleChangeSize = (currentPage, pageSize) => {
    this.setState({ rulePage: 1, rulePageSize: pageSize });
    this.getAllRules(1, pageSize);
  };

  // select
  rowClick = (record) => {
    const { id } = record;
    const { dispatch } = this.props;
    const { selectorPageSize } = this.state;
    dispatch({
      type: "common/saveCurrentSelector",
      payload: {
        currentSelector: record,
      },
    });
    dispatch({
      type: "common/fetchRule",
      payload: {
        currentPage: 1,
        pageSize: selectorPageSize,
        selectorId: id,
      },
    });
  };

  editRule = (record) => {
    const { dispatch, currentSelector, plugins, currentNamespaceId } =
      this.props;
    const { rulePage, rulePageSize, pluginId } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : "";
    const plugin = this.getPlugin(plugins, name);
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
            <Rule
              {...rule}
              pluginId={pluginId}
              pluginName={name}
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
                    currentPage: rulePage,
                    pageSize: rulePageSize,
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

  enableRule = ({ list, enabled }) => {
    const { rulePage, rulePageSize } = this.state;
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
        currentPage: rulePage,
        pageSize: rulePageSize,
        namespaceId: currentNamespaceId,
      },
    });
  };

  onRuleSelectChange = (ruleSelectedRowKeys) => {
    this.setState({ ruleSelectedRowKeys });
  };

  openRuleClick = () => {
    const { ruleSelectedRowKeys } = this.state;
    const { ruleList } = this.props;
    if (ruleSelectedRowKeys && ruleSelectedRowKeys.length > 0) {
      let anyEnabled = ruleList.some(
        (rule) => ruleSelectedRowKeys.includes(rule.id) && rule.enabled,
      );
      this.enableRule({
        list: ruleSelectedRowKeys,
        enabled: !anyEnabled,
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  deleteRule = (record) => {
    const { dispatch, currentSelector, ruleList, currentNamespaceId } =
      this.props;
    const { rulePage, rulePageSize } = this.state;
    const currentPage =
      rulePage > 1 && ruleList.length === 1 ? rulePage - 1 : rulePage;
    dispatch({
      type: "common/deleteRule",
      payload: {
        list: [record.id],
        namespaceId: currentNamespaceId,
      },
      fetchValue: {
        selectorId: currentSelector.id,
        currentPage,
        pageSize: rulePageSize,
        namespaceId: currentNamespaceId,
      },
    });
  };

  asyncClick = () => {
    const { dispatch, plugins, currentNamespaceId } = this.props;
    let name = this.props.match.params ? this.props.match.params.id : "";
    const id = this.getPluginId(plugins, name);
    dispatch({
      type: "global/asyncPlugin",
      payload: {
        id,
        namespaceId: currentNamespaceId,
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
    const {
      popup,
      selectorPage,
      selectorPageSize,
      selectorSelectedRowKeys,
      rulePage,
      rulePageSize,
      ruleSelectedRowKeys,
    } = this.state;
    const {
      selectorList,
      ruleList,
      selectorTotal,
      ruleTotal,
      currentSelector,
    } = this.props;
    const name = this.props.match.params ? this.props.match.params.id : "";
    const role = this.props.match.params ? this.props.match.params.index : "";

    const selectColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SELECTOR.EXEORDER"),
        dataIndex: "sort",
        key: "sort",
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME"),
        dataIndex: "name",
        key: "name",
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
              this.enableSelector({ list: [row.id], enabled: checked });
            }}
          />
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        render: (text, record) => {
          return (
            <div>
              <AuthButton perms={`plugin:${name}Selector:edit`}>
                <span
                  style={{ marginRight: 8 }}
                  className="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    this.editSelector(record);
                  }}
                >
                  {getIntlContent("SHENYU.COMMON.CHANGE")}
                </span>
              </AuthButton>
              <AuthButton perms={`plugin:${name}Selector:delete`}>
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  placement="bottom"
                  onCancel={(e) => {
                    e.stopPropagation();
                  }}
                  onConfirm={(e) => {
                    e.stopPropagation();
                    this.deleteSelector(record);
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
    const selectorRowSelection = {
      selectedRowKeys: selectorSelectedRowKeys,
      onChange: this.onSelectorSelectChange,
    };

    const ruleRowSelection = {
      selectedRowKeys: ruleSelectedRowKeys,
      onChange: this.onRuleSelectChange,
    };

    const rulesColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SELECTOR.EXEORDER"),
        dataIndex: "sort",
        key: "sort",
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.RULE.NAME"),
        dataIndex: "name",
        key: "name",
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
              this.enableRule({ list: [row.id], enabled: checked });
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
              <AuthButton perms={`plugin:${name}Rule:edit`}>
                <span
                  className="edit"
                  style={{ marginRight: 8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    this.editRule(record);
                  }}
                >
                  {getIntlContent("SHENYU.COMMON.CHANGE")}
                </span>
              </AuthButton>
              <AuthButton perms={`plugin:${name}Rule:delete`}>
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  placement="bottom"
                  onCancel={(e) => {
                    e.stopPropagation();
                  }}
                  onConfirm={(e) => {
                    e.stopPropagation();
                    this.deleteRule(record);
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
              {name}
            </Title>
            <Title level={3} type="secondary" style={{ margin: "0 20px 0 0" }}>
              {role}
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
          <Col span={10}>
            <div className="table-header">
              <h3>{getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.TITLE")}</h3>
              <div className={styles.headerSearch}>
                <AuthButton perms={`plugin:${name}Selector:query`}>
                  <Search
                    className={styles.search}
                    style={{ minWidth: "130px" }}
                    placeholder={getIntlContent(
                      "SHENYU.PLUGIN.SEARCH.SELECTOR.NAME",
                    )}
                    enterButton={getIntlContent("SHENYU.SYSTEM.SEARCH")}
                    size="default"
                    onChange={this.searchSelectorOnchange}
                    onSearch={this.searchSelector}
                  />
                </AuthButton>
                <AuthButton perms={`plugin:${name}Selector:add`}>
                  <Button type="primary" onClick={this.addSelector}>
                    {getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.ADD")}
                  </Button>
                </AuthButton>
                <AuthButton perms={`plugin:${name}Selector:edit`}>
                  <Button
                    type="primary"
                    onClick={this.openSelectorClick}
                    style={{ marginLeft: 10 }}
                  >
                    {getIntlContent(
                      selectorList.some(
                        (selector) =>
                          selectorSelectedRowKeys.includes(selector.id) &&
                          selector.enabled,
                      )
                        ? "SHENYU.PLUGIN.SELECTOR.BATCH.CLOSED"
                        : "SHENYU.PLUGIN.SELECTOR.BATCH.OPENED",
                    )}
                  </Button>
                </AuthButton>
              </div>
            </div>
            <Table
              size="small"
              onRow={(record) => {
                return {
                  onClick: () => {
                    this.rowClick(record);
                  },
                };
              }}
              style={{ marginTop: 30 }}
              bordered
              columns={selectColumns}
              dataSource={selectorList}
              rowSelection={selectorRowSelection}
              pagination={{
                total: selectorTotal,
                showTotal: (showTotal) => `${showTotal}`,
                showSizeChanger: true,
                pageSizeOptions: ["12", "20", "50", "100"],
                current: selectorPage,
                pageSize: selectorPageSize,
                onChange: this.pageSelectorChange,
                onShowSizeChange: this.pageSelectorChangeSize,
              }}
              rowClassName={(item) => {
                if (currentSelector && currentSelector.id === item.id) {
                  return "table-selected";
                } else {
                  return "";
                }
              }}
            />
          </Col>
          <Col span={14}>
            <div className="table-header">
              <div style={{ display: "flex", alignItems: "center" }}>
                <h3>{getIntlContent("SHENYU.PLUGIN.SELECTOR.RULE.LIST")}</h3>
                <AuthButton perms={`plugin:${name}:modify`}>
                  <Button
                    icon="reload"
                    onClick={this.asyncClick}
                    type="primary"
                  >
                    {getIntlContent("SHENYU.COMMON.SYN")} {name}
                  </Button>
                </AuthButton>
              </div>

              <div className={styles.headerSearch}>
                <AuthButton perms={`plugin:${name}Rule:query`}>
                  <Search
                    className={styles.search}
                    placeholder={getIntlContent(
                      "SHENYU.PLUGIN.SEARCH.RULE.NAME",
                    )}
                    enterButton={getIntlContent("SHENYU.SYSTEM.SEARCH")}
                    size="default"
                    onChange={this.searchRuleOnchange}
                    onSearch={this.searchRule}
                  />
                </AuthButton>
                <AuthButton perms={`plugin:${name}Rule:add`}>
                  <Button type="primary" onClick={this.addRule}>
                    {getIntlContent("SHENYU.COMMON.ADD.RULE")}
                  </Button>
                </AuthButton>
                <AuthButton perms={`plugin:${name}Rule:edit`}>
                  <Button
                    type="primary"
                    onClick={this.openRuleClick}
                    style={{ marginLeft: 10 }}
                  >
                    {getIntlContent(
                      ruleList.some(
                        (rule) =>
                          ruleSelectedRowKeys.includes(rule.id) && rule.enabled,
                      )
                        ? "SHENYU.PLUGIN.SELECTOR.BATCH.CLOSED"
                        : "SHENYU.PLUGIN.SELECTOR.BATCH.OPENED",
                    )}
                  </Button>
                </AuthButton>
              </div>
            </div>
            <Table
              size="small"
              style={{ marginTop: 30 }}
              bordered
              columns={rulesColumns}
              expandedRowRender={expandedRowRender}
              dataSource={ruleList}
              rowSelection={ruleRowSelection}
              pagination={{
                total: ruleTotal,
                showTotal: (showTotal) => `${showTotal}`,
                showSizeChanger: true,
                pageSizeOptions: ["12", "20", "50", "100"],
                current: rulePage,
                pageSize: rulePageSize,
                onChange: this.pageRuleChange,
                onShowSizeChange: this.pageRuleChangeSize,
              }}
            />
          </Col>
        </Row>
        {popup}
      </div>
    );
  }
}
