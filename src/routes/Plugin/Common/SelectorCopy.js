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
  findSelector
} from "../../../services/api";
import { getIntlContent } from "../../../utils/IntlUtils";

class SelectorCopy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorTree: [],
      value: undefined,
      loading: false
    };
  }

  componentDidMount() {
    this.getAllSelectors();
  }

  getAllSelectors = async () => {
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
    const pluginMap = {};
    const selectorTree = [];
    if (pluginCode === 200 && selectorCode === 200) {
      selectorList.forEach(v => {
        if (!pluginMap[v.pluginId]) {
          pluginMap[v.pluginId] = [];
        }
        pluginMap[v.pluginId].push({ title: v.name, value: v.id });
      });
    }
    if (Object.keys(pluginMap).length) {
      Object.keys(pluginMap).forEach(key => {
        const plugin = pluginList.find(v => v.id === key);
        selectorTree.push({
          title: plugin.name,
          value: plugin.id,
          disabled: true,
          children: pluginMap[key]
        });
      });
    }
    this.setState({ selectorTree });
  };

  handleChangeSelect = value => {
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
    const { data = {} } = await findSelector({ id: value });
    this.setState({
      loading: false
    });
    // eslint-disable-next-line no-unused-expressions
    onOk && onOk(data);
  };

  render() {
    const { visible = false } = this.props;
    const { selectorTree, value, loading } = this.state;
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
          onChange={this.handleChangeSelect}
          placeholder={getIntlContent("SHENYU.SELECTOR.SOURCE.PLACEHOLDER")}
          treeData={selectorTree}
          treeDefaultExpandAll
          treeNodeFilterProp="title"
        />
      </Modal>
    );
  }
}

export default SelectorCopy;
