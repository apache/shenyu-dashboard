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
  Modal,
  Tree,
  Icon,
  Button,
  Checkbox,
  Table,
  Row,
  Col,
  Input,
  Empty
} from "antd";
import { connect } from "dva";
import { getIntlContent } from "../../../utils/IntlUtils";
import { titleCase } from "../../../utils/utils";

const { TreeNode } = Tree;
const { Search } = Input;

@connect(({ dataPermission, resource, global, loading }) => ({
  dataPermission,
  resource,
  global,
  selectorPermisionLoading:
    loading.effects["dataPermission/fetchDataPermisionSelectors"],
  rulePermisionLoading:
    loading.effects["dataPermission/fetchDataPermisionRules"]
}))
export default class DataPermModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPlugin: null,
      currentPermissionSelectorPage: 1,
      selectorData: null,
      pageSize: 12,
      ruleListMap: {},
      searchValue: ""
    };
  }

  componentWillMount() {
    this.getPluginTreeData();
  }

  getPluginTreeData = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "resource/fetchMenuTree"
    });
    dispatch({
      type: "global/fetchPlugins",
      payload: {
        callback: () => {}
      }
    });
  };

  getPermissionSelectorList = page => {
    const { dispatch, userId } = this.props;
    const { currentPlugin, pageSize } = this.state;
    dispatch({
      type: "dataPermission/fetchDataPermisionSelectors",
      payload: {
        currentPage: page,
        pageSize,
        userId,
        pluginId: currentPlugin.pluginId
      },
      callback: res => {
        this.setState({
          selectorData: res
        });
      }
    });
  };

  getPermissionRuleList = (selectorId, page) => {
    const { dispatch, userId } = this.props;
    let { currentPlugin, ruleListMap, pageSize } = this.state;
    dispatch({
      type: "dataPermission/fetchDataPermisionRules",
      payload: {
        currentPage: page,
        pageSize,
        userId,
        pluginId: currentPlugin.pluginId,
        selectorId
      },
      callback: res => {
        if (res.dataList && res.dataList.length > 0) {
          res.dataList.forEach(e => {
            e.selectorId = selectorId;
          });
        }
        if (
          ruleListMap[selectorId] &&
          ruleListMap[selectorId].currentRulePage
        ) {
          res.currentRulePage = ruleListMap[selectorId].currentRulePage;
        } else {
          res.currentRulePage = 1;
        }
        ruleListMap[selectorId] = res;
        this.setState({
          ruleListMap
        });
      }
    });
  };

  onSelectPlugin = (selectedKeys, e) => {
    const currentPlugin = e.node.props.dataRef;
    this.setState(
      {
        currentPlugin,
        currentPermissionSelectorPage: 1,
        ruleListMap: {}
      },
      () => {
        this.getPermissionSelectorList(1);
      }
    );
  };

  handleCheckSelector = record => {
    const { dispatch, userId } = this.props;
    const { currentPermissionSelectorPage } = this.state;
    let type = record.isChecked
      ? "dataPermission/deletePermisionSelector"
      : "dataPermission/addPermisionSelector";
    dispatch({
      type,
      payload: {
        dataId: record.dataId,
        userId
      },
      callback: () => {
        this.getPermissionSelectorList(currentPermissionSelectorPage);
        this.getPermissionRuleList(record.dataId, 1);
      }
    });
  };

  handleCheckRule = record => {
    const { dispatch, userId } = this.props;
    const { currentPermissionSelectorPage, ruleListMap } = this.state;
    let type = record.isChecked
      ? "dataPermission/deletePermisionRule"
      : "dataPermission/addPermisionRule";
    dispatch({
      type,
      payload: {
        dataId: record.dataId,
        userId
      },
      callback: () => {
        this.getPermissionSelectorList(currentPermissionSelectorPage);
        let page = ruleListMap[record.selectorId].currentRulePage || 1;
        this.getPermissionRuleList(record.selectorId, page);
      }
    });
  };

  handleExpandRuleTable = (expanded, record) => {
    this.getPermissionRuleList(record.dataId, 1);
  };

  selectorPageOnchange = page => {
    this.setState({ currentPermissionSelectorPage: page });
    this.getPermissionSelectorList(page);
  };

  rulePageOnchange = (page, selectorId) => {
    let { ruleListMap } = this.state;
    ruleListMap[selectorId].currentRulePage = page;
    this.setState(
      {
        ruleListMap
      },
      () => {
        this.getPermissionRuleList(selectorId, page);
      }
    );
  };

  filterPlugin = () => {
    let {
      global: { plugins },
      resource: { menuTree }
    } = this.props;
    const { searchValue } = this.state;
    let pluginMenuList = menuTree.filter(e => e.url === "/plug");
    if (pluginMenuList && pluginMenuList.length > 0) {
      pluginMenuList = pluginMenuList[0].children;
      const treeData = [];
      pluginMenuList.forEach(plugin => {
        if (
          typeof searchValue === "string" &&
          searchValue.length &&
          !plugin.name
            .toLocaleLowerCase()
            .includes(searchValue.toLocaleLowerCase())
        ) {
          return;
        }
        const currentPluginInfo = plugins.find(v => v.name === plugin.name);
        let currentCategory = treeData.find(
          tree => tree.title === currentPluginInfo.role
        );
        if (!currentCategory) {
          treeData.push({
            title: currentPluginInfo.role,
            key: currentPluginInfo.role,
            selectable: false,
            icon: "unordered-list",
            sort: plugin.sort,
            children: []
          });
          currentCategory = treeData[treeData.length - 1];
        }
        currentCategory.children.push({
          key: currentPluginInfo.id,
          title: titleCase(currentPluginInfo.name),
          selectable: true,
          sort: plugin.sort,
          icon: plugin.meta.icon,
          pluginId: currentPluginInfo.id
        });
      });

      pluginMenuList = treeData;
    }
    return pluginMenuList;
  };

  onSearch = e => {
    const { value } = e.target;
    this.setState({
      searchValue: value
    });
  };

  renderPluginTree = () => {
    let pluginMenuList = this.filterPlugin();
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Search
            placeholder={getIntlContent("SHENYU.PLUGIN.INPUTNAME")}
            onChange={this.onSearch}
          />
        </Col>
        {pluginMenuList.length > 0 ? (
          <Col span={24}>
            <Tree
              defaultExpandAll
              style={{ background: "white" }}
              onSelect={this.onSelectPlugin}
              showIcon
            >
              {this.renderTreeNodes(pluginMenuList)}
            </Tree>
          </Col>
        ) : (
          <Col span={24}>
            <Empty />
          </Col>
        )}
      </Row>
    );
  };

  renderTreeNodes = data => {
    return data.map(item => {
      if (item.children && item.children.length > 0) {
        return (
          <TreeNode
            selectable={item.selectable}
            title={item.title}
            icon={<Icon type={item.icon} />}
            key={item.key}
            dataRef={item}
          >
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      } else {
        return (
          <TreeNode
            icon={<Icon type={item.icon} />}
            title={item.title}
            key={item.key}
            dataRef={item}
          />
        );
      }
    });
  };

  renderSelectorRuleTable = () => {
    const { currentPermissionSelectorPage, pageSize } = this.state;
    const { selectorData, ruleListMap } = this.state;
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
              onClick={this.handleCheckRule.bind(this, record)}
            />
          );
        }
      },
      {
        title: getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.RULENAME"),
        dataIndex: "dataName",
        key: "dataName"
      }
    ];
    const expandedRowRender = record => {
      let ruleData = ruleListMap && ruleListMap[record.dataId];
      let currentRulePage = ruleData && ruleData.currentRulePage;
      return (
        <Table
          size="small"
          bordered
          columns={ruleColumns}
          dataSource={ruleData && ruleData.dataList}
          pagination={{
            total: (ruleData && ruleData.total) || 0,
            current: currentRulePage || 1,
            pageSize,
            onChange: page => {
              this.rulePageOnchange(page, record.dataId);
            }
          }}
        />
      );
    };

    const columns = [
      {
        title: getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.CHECKED"),
        dataIndex: "isChecked",
        width: 90,
        key: "isChecked",
        render: (isChecked, record) => {
          return (
            <Checkbox
              checked={isChecked}
              onClick={this.handleCheckSelector.bind(this, record)}
            />
          );
        }
      },
      {
        title: getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.SELECTORNAME"),
        dataIndex: "dataName",
        key: "dataName"
      }
    ];

    return (
      <Table
        style={{ width: "350px" }}
        size="small"
        bordered
        columns={columns}
        expandedRowRender={expandedRowRender}
        dataSource={selectorData && selectorData.dataList}
        onExpand={this.handleExpandRuleTable}
        pagination={{
          total: selectorData && selectorData.total,
          current: currentPermissionSelectorPage,
          pageSize,
          onChange: this.selectorPageOnchange
        }}
      />
    );
  };

  render() {
    let { handleCancel } = this.props;
    return (
      <Modal
        width={800}
        centered
        title={getIntlContent("SHENYU.SYSTEM.DATA.PERMISSION.CONFIG")}
        visible
        cancelText={getIntlContent("SHENYU.COMMON.CLOSE")}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            {getIntlContent("SHENYU.COMMON.CLOSE")}
          </Button>
        ]}
      >
        <Row gutter={20}>
          <Col span={10} style={{ minWidth: 280 }}>
            {this.renderPluginTree()}
          </Col>
          <Col span={14}>{this.renderSelectorRuleTable()}</Col>
        </Row>
      </Modal>
    );
  }
}
