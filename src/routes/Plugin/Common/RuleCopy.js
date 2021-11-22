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
import { Modal, TreeSelect } from "antd";
import {
  getPluginDropDownList,
  getAllSelectors,
  getAllRules,
  findRule
} from "../../../services/api";
import { getIntlContent } from "../../../utils/IntlUtils";

class RuleCopy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ruleTree: [],
      value: undefined,
      loading: false
    };
  }

  componentDidMount() {
    this.getAllRule();
  }

  getAllRule = async () => {
    const {
      code: pluginCode,
      data: pluginList = []
    } = await getPluginDropDownList();
    const {
      code: selectorCode,
      data: { dataList: selectorList = [] }
    } = await getAllSelectors({
      currentPage: 1,
      pageSize: 9999
    });
    const {
      code: ruleCode,
      data: { dataList: ruleList = [] }
    } = await getAllRules({
      currentPage: 1,
      pageSize: 9999
    });

    const pluginMap = {};
    const selectorMap = {};
    const ruleTree = [];
    if (ruleCode === 200) {
      ruleList.forEach(v => {
        if (!selectorMap[v.selectorId]) {
          selectorMap[v.selectorId] = [];
        }
        selectorMap[v.selectorId].push({ title: v.name, value: v.id });
      });
    }
    if (Object.keys(selectorMap).length && selectorCode === 200) {
      Object.keys(selectorMap).forEach(selectorId => {
        const currentSelector = selectorList.find(v => v.id === selectorId);
        if (!pluginMap[currentSelector.pluginId]) {
          pluginMap[currentSelector.pluginId] = [];
        }
        pluginMap[currentSelector.pluginId].push({
          title: currentSelector.name,
          value: currentSelector.id,
          disabled: true,
          children: selectorMap[selectorId]
        });
      });
    }
    if (Object.keys(pluginMap).length && pluginCode === 200) {
      Object.keys(pluginMap).forEach(key => {
        const plugin = pluginList.find(v => v.id === key);
        ruleTree.push({
          title: plugin.name,
          value: plugin.id,
          disabled: true,
          children: pluginMap[key]
        });
      });
    }
    this.setState({ ruleTree });
  };

  handleChangeRule = value => {
    this.setState({ value });
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    // eslint-disable-next-line no-unused-expressions
    onCancel && onCancel();
    this.setState({
      value: undefined
    });
  };

  handleOk = async () => {
    const { onOk } = this.props;
    const { value } = this.state;
    this.setState({
      loading: true
    });
    const { data = {} } = await findRule({ id: value });
    this.setState({
      loading: false
    });
    // eslint-disable-next-line no-unused-expressions
    onOk && onOk(data);
  };

  render() {
    const { visible = false } = this.props;
    const { ruleTree, value, loading } = this.state;
    return (
      <Modal
        visible={visible}
        centered
        title={getIntlContent("SHENYU.COMMON.SOURCE")}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <TreeSelect
          style={{ width: "100%" }}
          showSearch
          value={value}
          onChange={this.handleChangeRule}
          placeholder={getIntlContent("SHENYU.RULE.SOURCE.PLACEHOLDER")}
          treeData={ruleTree}
          treeDefaultExpandAll
          treeNodeFilterProp="title"
        />
      </Modal>
    );
  }
}

export default RuleCopy;
