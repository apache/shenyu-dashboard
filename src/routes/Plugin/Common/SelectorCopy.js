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
  findSelector,
} from "../../../services/api";
import { getIntlContent } from "../../../utils/IntlUtils";
import { defaultNamespaceId } from "../../../components/_utils/utils";

@connect(({ global }) => ({
  namespaces: global.namespaces,
}))
class SelectorCopy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorTree: [],
      value: undefined,
      loading: false,
      currentNamespaceId: defaultNamespaceId,
    };
    this.ruleRequestId = 0;
    this.detailRequestId = 0;
  }

  componentDidMount() {
    this.getAllSelectors();
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
        selectorTree: [],
        loading: false,
      },
      () => {
        this.getAllSelectors();
      },
    );
  };

  getAllSelectors = async () => {
    const { currentNamespaceId } = this.state;
    this.ruleRequestId += 1;
    const requestId = this.ruleRequestId;
    const { code: pluginCode, data: pluginList = [] } =
      await getPluginDropDownListByNamespace({
        namespace: currentNamespaceId,
      });
    if (requestId !== this.ruleRequestId) return;
    const {
      code: selectorCode,
      data: { dataList: selectorList = [], page = {} } = {},
    } = await getAllSelectors({
      currentPage: 1,
      pageSize: 9999,
      namespaceId: currentNamespaceId,
    });
    if (requestId !== this.ruleRequestId) return;
    let incomplete =
      pluginCode !== 200 ||
      selectorCode !== 200 ||
      Number(page.totalCount || 0) > selectorList.length;
    const pluginMap = {};
    const selectorTree = [];
    if (pluginCode === 200 && selectorCode === 200) {
      selectorList.forEach((v) => {
        if (!pluginMap[v.pluginId]) {
          pluginMap[v.pluginId] = [];
        }
        pluginMap[v.pluginId].push({ title: v.name, value: v.id });
      });
    }
    if (Object.keys(pluginMap).length) {
      Object.keys(pluginMap).forEach((key) => {
        const plugin = pluginList.find((v) => v.id === key);
        if (plugin) {
          selectorTree.push({
            title: plugin.name,
            value: plugin.id,
            disabled: true,
            children: pluginMap[key],
          });
        } else {
          incomplete = true;
        }
      });
    }
    if (incomplete)
      message.warn(
        "Some source selectors could not be loaded. Please refresh and try again.",
      );
    this.setState({ selectorTree });
  };

  handleChangeSelect = (value) => {
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
    const { value, currentNamespaceId, loading } = this.state;
    if (!value || loading) return;
    this.detailRequestId += 1;
    const requestId = this.detailRequestId;
    this.setState({ loading: true });
    try {
      const { code, data } = await findSelector({
        id: value,
        namespaceId: currentNamespaceId,
      });
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
    const { selectorTree, value, loading, currentNamespaceId } = this.state;
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
          onChange={this.handleChangeSelect}
          placeholder={getIntlContent("SHENYU.SELECTOR.SOURCE.PLACEHOLDER")}
          treeData={selectorTree}
          expandAll
          keyMaps={{ label: "title", key: "value", value: "value" }}
          treeNodeFilterProp="title"
        />
      </Modal>
    );
  }
}

export default SelectorCopy;
