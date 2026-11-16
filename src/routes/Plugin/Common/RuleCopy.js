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
import TreeSelect from "@douyinfe/semi-ui/lib/es/treeSelect";
import { connect } from "react-redux";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import { message } from "../../../components/ui/feedback";
import {
  getPluginDropDownListByNamespace,
  getAllSelectors,
  getAllRules,
  findRule,
} from "../../../services/api";
import { getIntlContent } from "../../../utils/IntlUtils";
import { defaultNamespaceId } from "../../../components/_utils/utils";

@connect(({ global }) => ({
  currentNamespaceId: global.currentNamespaceId,
  namespaces: global.namespaces,
}))
class RuleCopy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ruleTree: [],
      value: undefined,
      loading: false,
      currentNamespaceId: props.currentNamespaceId || defaultNamespaceId,
    };
    this.ruleRequestId = 0;
    this.detailRequestId = 0;
  }

  componentDidMount() {
    this.getAllRule();
  }

  componentWillUnmount() {
    this.ruleRequestId += 1;
    this.detailRequestId += 1;
  }

  handleNamespacesValueChange = (value) => {
    this.detailRequestId += 1;
    this.setState(
      {
        currentNamespaceId: value.key,
        value: undefined,
        ruleTree: [],
        loading: false,
      },
      () => {
        this.getAllRule();
      },
    );
  };

  getAllRule = async () => {
    const { currentNamespaceId } = this.state;
    this.ruleRequestId += 1;
    const requestId = this.ruleRequestId;
    const pageSize = 9999;

    const { code: pluginCode, data: pluginList = [] } =
      await getPluginDropDownListByNamespace({
        namespace: currentNamespaceId,
      });
    if (requestId !== this.ruleRequestId) {
      return;
    }

    const selectorResponse = await getAllSelectors({
      currentPage: 1,
      pageSize,
      namespaceId: currentNamespaceId,
    });
    if (requestId !== this.ruleRequestId) {
      return;
    }

    const ruleResponse = await getAllRules({
      currentPage: 1,
      pageSize,
      namespaceId: currentNamespaceId,
    });
    if (requestId !== this.ruleRequestId) {
      return;
    }

    const { code: selectorCode, data: selectorData = {} } = selectorResponse;
    const { dataList: selectorList = [], page: selectorPage = {} } =
      selectorData;
    const { code: ruleCode, data: ruleData = {} } = ruleResponse;
    const { dataList: ruleList = [], page: rulePage = {} } = ruleData;

    const pluginMap = {};
    const selectorMap = {};
    const ruleTree = [];
    let incomplete =
      pluginCode !== 200 ||
      selectorCode !== 200 ||
      ruleCode !== 200 ||
      Number(selectorPage.totalCount || 0) > selectorList.length ||
      Number(rulePage.totalCount || 0) > ruleList.length;

    if (ruleCode === 200) {
      ruleList.forEach((rule) => {
        if (!selectorMap[rule.selectorId]) {
          selectorMap[rule.selectorId] = [];
        }
        selectorMap[rule.selectorId].push({
          title: rule.name,
          value: rule.id,
        });
      });
    }

    if (Object.keys(selectorMap).length && selectorCode === 200) {
      Object.keys(selectorMap).forEach((selectorId) => {
        const currentSelector = selectorList.find(
          (selector) => selector.id === selectorId,
        );
        if (!currentSelector) {
          incomplete = true;
          return;
        }
        if (!pluginMap[currentSelector.pluginId]) {
          pluginMap[currentSelector.pluginId] = [];
        }
        pluginMap[currentSelector.pluginId].push({
          title: currentSelector.name,
          value: currentSelector.id,
          disabled: true,
          children: selectorMap[selectorId],
        });
      });
    }

    if (Object.keys(pluginMap).length && pluginCode === 200) {
      Object.keys(pluginMap).forEach((pluginId) => {
        const plugin = pluginList.find((item) => item.id === pluginId);
        if (!plugin) {
          incomplete = true;
          return;
        }
        ruleTree.push({
          title: plugin.name,
          value: plugin.id,
          disabled: true,
          children: pluginMap[pluginId],
        });
      });
    }

    if (requestId !== this.ruleRequestId) {
      return;
    }
    if (incomplete) {
      message.warn(
        "Some source rules could not be loaded. Please refresh and try again.",
      );
    }
    this.setState({ ruleTree });
  };

  handleChangeRule = (value) => {
    this.detailRequestId += 1;
    this.setState({ value, loading: false });
  };

  handleCancel = () => {
    this.detailRequestId += 1;
    const { onCancel } = this.props;
    // eslint-disable-next-line no-unused-expressions
    onCancel && onCancel();
    this.setState({
      value: undefined,
      loading: false,
    });
  };

  handleOk = async () => {
    const { onOk } = this.props;
    const { value, loading } = this.state;
    if (!value || loading) return;
    this.detailRequestId += 1;
    const requestId = this.detailRequestId;
    this.setState({ loading: true });
    try {
      const { code, data } = await findRule({ id: value });
      if (requestId !== this.detailRequestId) return;
      if (code === 200 && data && onOk) onOk(data);
    } catch (error) {
      if (requestId === this.detailRequestId)
        message.warn("Source details could not be loaded. Please try again.");
    } finally {
      if (requestId === this.detailRequestId) this.setState({ loading: false });
    }
  };

  render() {
    const { visible = false, namespaces } = this.props;
    const { ruleTree, value, loading, currentNamespaceId } = this.state;
    return (
      <Modal
        visible={visible}
        centered
        title={getIntlContent("SHENYU.COMMON.SOURCE")}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
        okButtonProps={{ disabled: !value || loading }}
      >
        <Select
          aria-label={getIntlContent("SHENYU.SYSTEM.NAMESPACE")}
          style={{ marginBottom: 20 }}
          value={currentNamespaceId}
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
        <TreeSelect
          style={{ width: "100%" }}
          filterTreeNode
          motion={false}
          value={value}
          onChange={this.handleChangeRule}
          placeholder={getIntlContent("SHENYU.RULE.SOURCE.PLACEHOLDER")}
          treeData={ruleTree}
          expandAll
          keyMaps={{ label: "title", key: "value", value: "value" }}
          treeNodeFilterProp="title"
        />
      </Modal>
    );
  }
}

export default RuleCopy;
