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
import Tree from "@douyinfe/semi-ui/lib/es/tree";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Row from "@douyinfe/semi-ui/lib/es/grid/row";
import Col from "@douyinfe/semi-ui/lib/es/grid/col";
import Empty from "@douyinfe/semi-ui/lib/es/empty";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import { getIntlContent } from "../../../utils/IntlUtils";
import { titleCase } from "../../../utils/utils";
import { defaultNamespaceId } from "../../../components/_utils/utils";

@connect(({ dataPermission, resource, global, loading }) => ({
  dataPermission,
  resource,
  namespaces: global.namespaces,
  language: global.language,
  selectorPermisionLoading:
    loading.effects["dataPermission/fetchDataPermisionSelectors"],
  rulePermisionLoading:
    loading.effects["dataPermission/fetchDataPermisionRules"],
}))
export default class DataPermModal extends Component {
  pluginRequestId = 0;

  scopeVersion = 0;

  selectorRequestId = 0;

  ruleRequests = new Map();

  ruleRequestId = 0;

  constructor(props) {
    super(props);
    this.state = {
      currentPlugin: null,
      plugins: [],
      currentPermissionSelectorPage: 1,
      selectorData: null,
      pageSize: 12,
      ruleListMap: {},
      searchValue: "",
      currentNamespaceId: defaultNamespaceId,
      selectorExpandedRowKeys: [],
    };
  }

  componentDidMount() {
    this.getPluginTreeData();
  }

  componentDidUpdate(previous) {
    if (previous.userId !== this.props.userId) {
      this.scopeVersion += 1;
      this.ruleRequests.clear();
      this.setState(
        {
          selectorData: null,
          currentPermissionSelectorPage: 1,
          ruleListMap: {},
          selectorExpandedRowKeys: [],
        },
        () => this.getPermissionSelectorList(1),
      );
    }
  }

  componentWillUnmount() {
    this.pluginRequestId += 1;
    this.scopeVersion += 1;
  }

  getPluginTreeData = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "resource/fetchMenuTree",
    });
    this.loadPlugins();
  };

  loadPlugins = () => {
    const { dispatch } = this.props;
    const { currentNamespaceId } = this.state;
    this.pluginRequestId += 1;
    const requestId = this.pluginRequestId;
    dispatch({
      type: "global/fetchPluginsByNamespace",
      payload: {
        namespaceId: currentNamespaceId,
        callback: (plugins) => {
          if (requestId === this.pluginRequestId) {
            this.setState({ plugins });
          }
        },
      },
    });
  };

  getPermissionSelectorList = (page) => {
    const { dispatch, userId } = this.props;
    const { currentPlugin, pageSize, currentNamespaceId } = this.state;
    if (!currentPlugin) return;
    const scope = this.scopeVersion;
    this.selectorRequestId += 1;
    const requestId = this.selectorRequestId;
    dispatch({
      type: "dataPermission/fetchDataPermisionSelectors",
      payload: {
        currentPage: page,
        pageSize,
        userId,
        pluginId: currentPlugin.pluginId,
        namespaceId: currentNamespaceId,
      },
      callback: (res) => {
        if (scope === this.scopeVersion && requestId === this.selectorRequestId)
          this.setState({ selectorData: res });
      },
    });
  };

  getPermissionRuleList = (selectorId, page) => {
    const { dispatch, userId } = this.props;
    const { currentPlugin, pageSize, currentNamespaceId } = this.state;
    if (!currentPlugin) return;
    const scope = this.scopeVersion;
    this.ruleRequestId += 1;
    const requestId = this.ruleRequestId;
    this.ruleRequests.set(selectorId, requestId);
    dispatch({
      type: "dataPermission/fetchDataPermisionRules",
      payload: {
        currentPage: page,
        pageSize,
        userId,
        pluginId: currentPlugin.pluginId,
        selectorId,
        namespaceId: currentNamespaceId,
      },
      callback: (res) => {
        if (
          scope !== this.scopeVersion ||
          requestId !== this.ruleRequests.get(selectorId)
        )
          return;
        this.setState((previous) => ({
          ruleListMap: {
            ...previous.ruleListMap,
            [selectorId]: {
              ...res,
              currentRulePage: page,
              dataList: (res.dataList || []).map((row) => ({
                ...row,
                selectorId,
              })),
            },
          },
        }));
      },
    });
  };

  onSelectPlugin = (key, selected, currentPlugin) => {
    if (!selected || !currentPlugin.pluginId) return;
    this.scopeVersion += 1;
    this.ruleRequests.clear();
    this.setState(
      {
        currentPlugin,
        currentPermissionSelectorPage: 1,
        selectorData: null,
        ruleListMap: {},
        selectorExpandedRowKeys: [],
      },
      () => this.getPermissionSelectorList(1),
    );
  };

  refreshGrant = (scope, selectorId) => {
    if (scope !== this.scopeVersion) return;
    const {
      currentPermissionSelectorPage,
      selectorExpandedRowKeys,
      ruleListMap,
    } = this.state;
    this.getPermissionSelectorList(currentPermissionSelectorPage);
    if (selectorExpandedRowKeys.includes(selectorId))
      this.getPermissionRuleList(
        selectorId,
        ruleListMap[selectorId]?.currentRulePage || 1,
      );
  };

  handleCheckSelector = (record) => {
    const { dispatch, userId } = this.props;
    const scope = this.scopeVersion;
    dispatch({
      type: record.isChecked
        ? "dataPermission/deletePermisionSelector"
        : "dataPermission/addPermisionSelector",
      payload: { dataId: record.dataId, userId },
      callback: () => this.refreshGrant(scope, record.dataId),
    });
  };

  handleCheckRule = (record) => {
    const { dispatch, userId } = this.props;
    const scope = this.scopeVersion;
    dispatch({
      type: record.isChecked
        ? "dataPermission/deletePermisionRule"
        : "dataPermission/addPermisionRule",
      payload: { dataId: record.dataId, userId },
      callback: () => this.refreshGrant(scope, record.selectorId),
    });
  };

  handleExpandRuleTable = (expanded, record) => {
    this.setState((previous) => ({
      selectorExpandedRowKeys: expanded
        ? [...new Set([...previous.selectorExpandedRowKeys, record.dataId])]
        : previous.selectorExpandedRowKeys.filter((id) => id !== record.dataId),
    }));
    if (expanded) this.getPermissionRuleList(record.dataId, 1);
    else this.ruleRequests.delete(record.dataId);
  };

  selectorPageOnchange = (page) => {
    this.ruleRequests.clear();
    this.setState({
      currentPermissionSelectorPage: page,
      selectorExpandedRowKeys: [],
      ruleListMap: {},
    });
    this.getPermissionSelectorList(page);
  };

  rulePageOnchange = (page, selectorId) =>
    this.getPermissionRuleList(selectorId, page);

  filterPlugin = () => {
    let {
      resource: { menuTree },
    } = this.props;
    const { searchValue, plugins } = this.state;
    let pluginMenuList = menuTree.filter((e) => e.url === "/plug");
    if (pluginMenuList && pluginMenuList.length > 0) {
      pluginMenuList = pluginMenuList[0].children;
      const treeData = [];
      pluginMenuList.forEach((plugin) => {
        if (
          typeof searchValue === "string" &&
          searchValue.length &&
          !plugin.name
            .toLocaleLowerCase()
            .includes(searchValue.toLocaleLowerCase())
        ) {
          return;
        }
        const currentPluginInfo = plugins.find((v) => v.name === plugin.name);
        if (currentPluginInfo) {
          let currentCategory = treeData.find(
            (tree) => tree.title === currentPluginInfo.role,
          );
          if (!currentCategory) {
            treeData.push({
              title: currentPluginInfo.role,
              key: `role:${currentPluginInfo.role}`,
              disabled: true,
              icon: <ResourceIcon type="unordered-list" />,
              sort: plugin.sort,
              children: [],
            });
            currentCategory = treeData[treeData.length - 1];
          }
          currentCategory.children.push({
            key: currentPluginInfo.pluginId,
            title: titleCase(currentPluginInfo.name),
            selectable: true,
            sort: plugin.sort,
            icon: <ResourceIcon type={plugin.meta.icon} />,
            pluginId: currentPluginInfo.pluginId,
          });
        }
      });

      pluginMenuList = treeData;
    }
    return pluginMenuList;
  };

  onSearch = (e) => {
    const { value } = e.target;
    this.setState({
      searchValue: value,
    });
  };

  renderPluginTree = () => {
    let pluginMenuList = this.filterPlugin();
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Input
            placeholder={getIntlContent("SHENYU.PLUGIN.INPUTNAME")}
            onChange={this.onSearch}
          />
        </Col>
        {pluginMenuList.length > 0 ? (
          <Col span={24}>
            <Tree
              expandAll
              value={this.state.currentPlugin?.pluginId}
              keyMaps={{ label: "title" }}
              treeData={pluginMenuList}
              style={{ background: "white" }}
              onSelect={this.onSelectPlugin}
            />
          </Col>
        ) : (
          <Col span={24}>
            <Empty />
          </Col>
        )}
      </Row>
    );
  };

  renderSelectorRuleTable = () => {
    const { currentPermissionSelectorPage, pageSize } = this.state;
    const { selectorData, ruleListMap, selectorExpandedRowKeys } = this.state;
    const ruleColumns = [
      {
        title: getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.CHECKED"),
        dataIndex: "isChecked",
        width: 90,
        key: "isChecked",
        render: (isChecked, record) => {
          return (
            <Checkbox
              checked={isChecked}
              onChange={() => this.handleCheckRule(record)}
              aria-label={record.dataName}
            />
          );
        },
      },
      {
        title: getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.RULENAME"),
        dataIndex: "dataName",
        key: "dataName",
      },
    ];
    const expandedRowRender = (record) => {
      let ruleData = ruleListMap && ruleListMap[record.dataId];
      let currentRulePage = ruleData && ruleData.currentRulePage;
      return (
        <Table
          size="small"
          rowKey="dataId"
          loading={this.props.rulePermisionLoading}
          bordered
          columns={ruleColumns}
          dataSource={ruleData?.dataList || []}
          pagination={{
            total: (ruleData && ruleData.total) || 0,
            currentPage: currentRulePage || 1,
            pageSize,
            onChange: (page) => {
              this.rulePageOnchange(page, record.dataId);
            },
          }}
        />
      );
    };

    const columns = [
      {
        title: getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.CHECKED"),
        dataIndex: "isChecked",
        width: 120,
        key: "isChecked",
        render: (isChecked, record) => {
          return (
            <Checkbox
              checked={isChecked}
              onChange={() => this.handleCheckSelector(record)}
              aria-label={record.dataName}
            />
          );
        },
      },
      {
        title: getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.SELECTORNAME"),
        dataIndex: "dataName",
        key: "dataName",
      },
    ];

    return (
      <Table
        style={{ width: "100%" }}
        loading={this.props.selectorPermisionLoading}
        size="small"
        bordered
        columns={columns}
        expandedRowRender={expandedRowRender}
        dataSource={selectorData?.dataList || []}
        rowKey="dataId"
        expandedRowKeys={selectorExpandedRowKeys}
        onExpand={this.handleExpandRuleTable}
        pagination={{
          total: selectorData?.total || 0,
          currentPage: currentPermissionSelectorPage,
          pageSize,
          onChange: this.selectorPageOnchange,
        }}
      />
    );
  };

  handleNamespacesValueChange = (value) => {
    this.scopeVersion += 1;
    this.ruleRequests.clear();
    this.setState(
      {
        currentNamespaceId: value.key,
        plugins: [],
        currentPlugin: null,
        selectorData: null,
        currentPermissionSelectorPage: 1,
        selectorExpandedRowKeys: [],
        ruleListMap: {},
      },
      this.loadPlugins,
    );
  };

  render() {
    let { handleCancel, namespaces } = this.props;
    let { currentNamespaceId } = this.state;
    return (
      <LocaleProvider locale={this.props.language === "zh-CN" ? zhCN : enUS}>
        <Modal
          width={1000}
          centered
          title={
            <div
              style={{
                minHeight: 32,
                flexWrap: "wrap",
                gap: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                {getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.CONFIG")}
              </div>
              <div style={{ marginRight: 30 }}>
                <Select
                  aria-label={getIntlContent("SHENYU.SYSTEM.NAMESPACE")}
                  value={currentNamespaceId}
                  style={{ minWidth: 160, maxWidth: 260 }}
                  onChange={(key) => this.handleNamespacesValueChange({ key })}
                >
                  {namespaces.map((namespace) => (
                    <Select.Option
                      key={namespace.namespaceId}
                      value={namespace.namespaceId}
                    >
                      {namespace.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          }
          visible
          cancelText={getIntlContent("SHENYU.COMMON.CLOSE")}
          onCancel={handleCancel}
          footer={[
            <Button key="back" onClick={handleCancel}>
              {getIntlContent("SHENYU.COMMON.CLOSE")}
            </Button>,
          ]}
        >
          <Row gutter={20}>
            <Col xs={24} md={8}>
              {this.renderPluginTree()}
            </Col>
            <Col xs={24} md={16}>
              {this.renderSelectorRuleTable()}
            </Col>
          </Row>
        </Modal>
      </LocaleProvider>
    );
  }
}
