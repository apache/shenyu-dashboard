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
import { connect } from "react-redux";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Pagination from "@douyinfe/semi-ui/lib/es/pagination";
import Row from "@douyinfe/semi-ui/lib/es/grid/row";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import Input from "../../../components/ui/Input";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import { message } from "../../../components/ui/feedback";
import { serializeUpstreamProps } from "../../../utils/upstreamLabels";
import { getIntlContent } from "../../../utils/IntlUtils";
import discoveryStyles from "./discovery.module.less";
import DiscoveryConfigModal from "./DiscoveryConfigModal";
import ConnectedProxySelectorModal from "./ProxySelectorModal";
import { DiscoveryCard } from "./DiscoveryCard";
import AuthButton from "../../../utils/AuthButton";
import { getUpdateModal, updatePluginsEnabled } from "../../../utils/plugin";

const { Title } = Typography;

@connect(({ global, discovery, loading, shenyuDict }) => ({
  ...global,
  ...discovery,
  ...shenyuDict,
  loading: loading.effects["global/fetchPlatform"],
}))
export default class DiscoveryProxy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchKey: "",
      cardData: {
        discoveryType: "",
        name: "",
        forwardPort: "",
        type: "tcp",
        props: {},
        listenerNode: "",
        handler: {},
        discovery: {
          serverList: "",
          props: {},
        },
        discoveryUpstreams: [
          // {
          //   protocol: '1',
          //   url: '1',
          //   status:'1',
          //   weight: '1',
          //   key: '1'
          // }
        ],
      },
      isPluginEnabled: false,
      popup: "",
      pluginName: "tcp",
    };
  }

  componentDidMount() {
    const { dispatch, currentPage, pageSize, currentNamespaceId, plugins } =
      this.props;
    if (plugins && plugins.length > 0) {
      this.syncPluginEnabled(plugins);
    }
    dispatch({
      type: "discovery/fetchProxySelectors",
      payload: {
        name: "",
        currentPage,
        pageSize,
        namespaceId: currentNamespaceId,
      },
    });

    dispatch({
      type: "discovery/fetchEnumType",
    });

    dispatch({
      type: "shenyuDict/fetchByType",
      payload: {
        type: "discoveryMode",
        callBack: (dics) => {
          this.state.discoveryDics = dics;
        },
      },
    });
  }

  componentDidUpdate(prevProps) {
    const { plugins } = this.props;
    if (plugins && plugins !== prevProps.plugins) {
      this.syncPluginEnabled(plugins);
    }
  }

  syncPluginEnabled = (plugins) => {
    const { pluginName } = this.state;
    const plugin = this.getPlugin(plugins, pluginName);
    if (plugin) {
      this.setState({ isPluginEnabled: plugin.enabled ?? false });
    }
  };

  // eslint-disable-next-line react/sort-comp
  renderCards(proxySelectorList = []) {
    return proxySelectorList.map((selector) => (
      <DiscoveryCard
        key={selector.id}
        updateSelector={this.updateSelector}
        data={selector}
        handleDelete={this.handleDelete}
        handleRefresh={this.handleRefresh}
      />
    ));
  }

  onPageChange = (page, pageSize) => {
    const { currentNamespaceId } = this.props;
    this.props.dispatch({
      type: "discovery/setCurrentPage",
      payload: {
        currentPage: page,
        pageSize,
      },
    });
    const { searchKey } = this.state;
    this.props.dispatch({
      type: "discovery/fetchProxySelectors",
      payload: {
        currentPage: page,
        pageSize,
        name: searchKey,
        namespaceId: currentNamespaceId,
      },
    });
  };

  getPlugin = (plugins, name) => {
    const plugin = plugins.filter((item) => {
      return item.name === name;
    });
    return plugin && plugin.length > 0 ? plugin[0] : null;
  };

  togglePluginStatus = () => {
    const { dispatch, plugins } = this.props;
    const { pluginName } = this.state;
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

  closeModal = () => {
    this.setState({ popup: "" });
  };

  closeUpdateModal = () => {
    this.setState({ popup: "" });
    this.setState({
      cardData: {
        discoveryType: "",
        name: "",
        forwardPort: "",
        type: "tcp",
        props: {},
        listenerNode: "",
        handler: {},
        discovery: {
          serverList: "",
          props: {},
        },
        discoveryUpstreams: [],
      },
    });
  };

  addConfiguration = () => {
    const { dispatch, typeEnums, currentNamespaceId } = this.props;
    const { discoveryDics, pluginName } = this.state;
    dispatch({
      type: "discovery/fetchDiscovery",
      payload: {
        pluginName,
        level: "1",
        namespaceId: currentNamespaceId,
      },
      callback: (discoveryConfigList) => {
        let discoveryId = "";
        let isSetConfig = false;
        if (discoveryConfigList !== null) {
          discoveryId = discoveryConfigList.id;
          isSetConfig = true;
        }
        this.setState({
          popup: (
            <DiscoveryConfigModal
              data={discoveryConfigList}
              typeEnums={typeEnums}
              isSetConfig={isSetConfig}
              discoveryDicts={discoveryDics}
              handleConfigDelete={this.handleConfigDelete}
              handleOk={(values) => {
                const { name, serverList, props, discoveryType } = values;
                dispatch({
                  type: "discovery/set",
                  payload: {
                    type: discoveryType,
                    serverList,
                    name,
                    props,
                    pluginName,
                    level: 1,
                    id: discoveryId,
                    namespaceId: currentNamespaceId,
                  },
                  callback: () => {
                    this.closeModal();
                  },
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
            />
          ),
        });
      },
    });
  };

  editClick = () => {
    const { dispatch, plugins } = this.props;
    const { pluginName } = this.state;
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

  searchSelectorOnchange = (e) => {
    const searchKey = e.target.value;
    this.setState({ searchKey });
  };

  searchSelector = () => {
    this.onPageChange(1, this.props.pageSize);
  };

  addSelector = () => {
    const {
      dispatch,
      currentPage,
      pageSize,
      plugins,
      typeEnums,
      currentNamespaceId,
    } = this.props;
    const { cardData, discoveryDics, pluginName } = this.state;
    const plugin = this.getPlugin(plugins, pluginName);
    dispatch({
      type: "discovery/fetchDiscovery",
      payload: {
        pluginName,
        level: "1",
        namespaceId: currentNamespaceId,
      },
      callback: (discoveryConfigList) => {
        let discoveryType = "";
        let id = null;
        let isSetConfig = false;
        if (discoveryConfigList !== null) {
          discoveryType = discoveryConfigList.type;
          id = discoveryConfigList.id;
          isSetConfig = true;
        }
        this.setState({
          popup: (
            <ConnectedProxySelectorModal
              pluginId={plugin.id}
              recordCount={cardData.discoveryUpstreams.length}
              typeEnums={typeEnums}
              data={cardData}
              discoveryUpstreams={cardData.discoveryUpstreams}
              discoveryType={discoveryType}
              isAdd={true}
              isSetConfig={isSetConfig}
              discoveryDicts={discoveryDics}
              handleOk={(values) => {
                const {
                  name,
                  forwardPort,
                  props,
                  listenerNode,
                  handler,
                  discoveryProps,
                  serverList,
                  selectedDiscoveryType,
                  upstreams,
                } = values;
                const upstreamsWithProps = upstreams.map((item) => ({
                  protocol: item.protocol,
                  url: item.url,
                  status: parseInt(item.status, 10),
                  weight: item.weight,
                  startupTime: item.startupTime,
                  props: serializeUpstreamProps(item),
                }));
                dispatch({
                  type: "discovery/add",
                  payload: {
                    name,
                    forwardPort,
                    type: pluginName,
                    props,
                    listenerNode,
                    handler,
                    pluginName,
                    discovery: {
                      id,
                      level: "0", // 0 selector
                      pluginName,
                      discoveryType: selectedDiscoveryType,
                      serverList,
                      props: discoveryProps,
                    },
                    discoveryUpstreams: upstreamsWithProps,
                    namespaceId: currentNamespaceId,
                  },
                  callback: () => {
                    this.closeModal();
                  },
                  fetchValue: {
                    currentPage,
                    pageSize,
                    namespaceId: currentNamespaceId,
                  },
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
            />
          ),
        });
      },
    });
  };

  updateSelector = (id) => {
    const {
      dispatch,
      proxySelectorList,
      discoveryType,
      currentPage,
      pageSize,
      plugins,
      typeEnums,
      currentNamespaceId,
    } = this.props;
    const { discoveryDics, pluginName } = this.state;
    const data = proxySelectorList.find((value) => value.id === id);
    const plugin = this.getPlugin(plugins, pluginName);
    let isSetConfig = false;
    this.setState({
      cardData: data,
    });
    if (data.discovery.serverList === null && data.type !== "local") {
      isSetConfig = true;
    }
    const updateArray = data.discoveryUpstreams.map((item) => {
      let propsObj = JSON.parse(item.props || "{}");
      if (item.props === null) {
        propsObj = {
          warmupTime: 10,
          gray: "false",
        };
      }
      return {
        ...item,
        key: item.id,
        warmupTime: propsObj.warmupTime,
        gray: propsObj.gray,
      };
    });
    this.setState({
      popup: (
        <ConnectedProxySelectorModal
          recordCount={updateArray.length}
          discoveryUpstreams={updateArray}
          discoveryType={data.discovery.type}
          typeEnums={typeEnums}
          isAdd={false}
          isSetConfig={isSetConfig}
          data={data}
          pluginId={plugin.id}
          discoveryDicts={discoveryDics}
          handleOk={(values) => {
            const {
              name,
              forwardPort,
              props,
              listenerNode,
              handler,
              discoveryProps,
              serverList,
              upstreams,
            } = values;
            const upstreamsWithProps = upstreams.map((item) => ({
              protocol: item.protocol,
              url: item.url,
              status: parseInt(item.status, 10),
              weight: item.weight,
              startupTime: item.startupTime,
              props: serializeUpstreamProps(item),
            }));
            dispatch({
              type: "discovery/update",
              payload: {
                id: data.id,
                name,
                forwardPort,
                type: pluginName,
                props,
                listenerNode,
                handler,
                pluginName,
                discovery: {
                  discoveryType,
                  serverList,
                  props: discoveryProps,
                },
                discoveryUpstreams: upstreamsWithProps,
                namespaceId: currentNamespaceId,
              },
              callback: () => {
                this.closeUpdateModal();
              },
              fetchValue: {
                currentPage,
                pageSize,
                namespaceId: currentNamespaceId,
              },
            });
          }}
          handleCancel={() => {
            this.closeUpdateModal();
          }}
        />
      ),
    });
  };

  handleDelete = (id) => {
    const { currentPage, pageSize, currentNamespaceId } = this.props;
    this.props.dispatch({
      type: "discovery/delete",
      payload: {
        list: [id],
      },
      fetchValue: {
        currentPage,
        pageSize,
        namespaceId: currentNamespaceId,
      },
    });
  };

  handleRefresh = (id) => {
    this.props.dispatch({
      type: "discovery/refresh",
      payload: {
        discoveryHandlerId: id,
      },
    });
  };

  handleConfigDelete = (id) => {
    if (id !== undefined) {
      const { currentNamespaceId } = this.props;
      this.props.dispatch({
        type: "discovery/deleteConfig",
        payload: {
          discoveryId: id,
          namespaceId: currentNamespaceId,
        },
      });
    } else {
      message.error(
        getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.DELETE.ERROR"),
      );
    }

    this.closeModal();
  };

  render() {
    const { popup } = this.state;
    const { proxySelectorList, totalPage, currentPage, pageSize } = this.props;
    const tag = {
      text: this.state.isPluginEnabled
        ? getIntlContent("SHENYU.COMMON.OPEN")
        : getIntlContent("SHENYU.COMMON.CLOSE"),
      color: this.state.isPluginEnabled ? "green" : "red",
    };
    return (
      <LocaleProvider locale={this.props.language === "zh-CN" ? zhCN : enUS}>
        <div className={discoveryStyles.main}>
          <Row
            style={{
              marginBottom: "0px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "end", flex: 1, margin: 0 }}
            >
              <Title
                heading={2}
                style={{ textTransform: "capitalize", margin: "0 20px 0 0" }}
              >
                TCP
              </Title>
              <Title
                heading={3}
                type="secondary"
                style={{ margin: "0 20px 0 0" }}
              >
                Proxy
              </Title>
              <Tag color={tag.color}>{tag.text}</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
              <Switch
                checked={this.state.isPluginEnabled ?? false}
                onChange={this.togglePluginStatus}
              />
              <AuthButton perms="system:plugin:edit">
                {({ icon }) => (
                  <Button
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    theme="borderless"
                    onClick={this.editClick}
                  >
                    {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                  </Button>
                )}
              </AuthButton>
            </div>
          </Row>

          <Row>
            <div className={discoveryStyles["header-bar"]}>
              <h3 style={{ overflow: "visible", margin: 0 }}>
                {getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.TITLE")}
              </h3>
              <AuthButton perms="plugin:tcpSelector:add">
                {({ icon }) => (
                  <Button
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    type="primary"
                    onClick={this.addConfiguration}
                  >
                    {getIntlContent(
                      "SHENYU.PLUGIN.SELECTOR.LIST.CONFIGURATION",
                    )}
                  </Button>
                )}
              </AuthButton>
              {/* <div className={styles.headerSearch}> */}
              <div>
                <AuthButton perms="plugin:tcpSelector:query">
                  {({ icon }) => (
                    <form
                      className={discoveryStyles.search}
                      onSubmit={(event) => {
                        event.preventDefault();
                        this.searchSelector();
                      }}
                    >
                      <Input
                        value={this.state.searchKey}
                        placeholder={getIntlContent(
                          "SHENYU.PLUGIN.SEARCH.SELECTOR.NAME",
                        )}
                        onChange={this.searchSelectorOnchange}
                      />
                      <Button
                        icon={icon ? <ResourceIcon type={icon} /> : undefined}
                        htmlType="submit"
                      >
                        {getIntlContent("SHENYU.SYSTEM.SEARCH")}
                      </Button>
                    </form>
                  )}
                </AuthButton>
              </div>

              <AuthButton perms="plugin:tcpSelector:add">
                {({ icon }) => (
                  <Button
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    type="primary"
                    onClick={this.addSelector}
                    style={{ marginRight: "20px" }}
                  >
                    {getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.ADD")}
                  </Button>
                )}
              </AuthButton>
            </div>
          </Row>

          <Row>
            <div className={discoveryStyles.cards}>
              {this.renderCards(proxySelectorList)}
            </div>
          </Row>

          <Row style={{ marginTop: "20px" }}>
            <Pagination
              onChange={(page, size) =>
                this.onPageChange(size === pageSize ? page : 1, size)
              }
              currentPage={currentPage}
              pageSize={pageSize}
              total={totalPage}
            />
          </Row>
          {popup}
        </div>
      </LocaleProvider>
    );
  }
}
