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
import { Modal, Select } from "antd";
import { fetchProxySelector } from "../../../services/api";
import { getIntlContent } from "../../../utils/IntlUtils";

class ProxySelectorCopy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorList: [],
      selectedValue: undefined,
      loading: false,
    };
  }

  componentDidMount() {
    this.getAllSelectors();
  }

  handleChangeSelect = (key) => {
    this.setState({ selectedValue: key });
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    // eslint-disable-next-line no-unused-expressions
    onCancel && onCancel();
    this.setState({
      selectedValue: undefined,
    });
  };

  handleOk = async () => {
    const { onOk } = this.props;
    const { selectedValue, selectorList } = this.state;
    this.setState({
      loading: true,
    });
    const data = selectorList.find((selector) => selector.id === selectedValue);
    this.setState({
      loading: false,
    });
    // eslint-disable-next-line no-unused-expressions
    onOk && onOk(data);
  };

  handleOptions() {
    const { Option } = Select;
    return this.state.selectorList.map((selector) => (
      <Option key={selector.id} value={selector.id}>
        {selector.name}
      </Option>
    ));
  }

  getAllSelectors = async () => {
    const {
      data: { dataList: selectors = [] },
    } = await fetchProxySelector({
      currentPage: 1,
      pageSize: 9999,
    });
    this.setState({ selectorList: selectors });
  };

  render() {
    const { visible = false, disabled } = this.props;
    const { loading } = this.state;
    return (
      <Modal
        visible={visible}
        centered
        title={getIntlContent("SHENYU.COMMON.SOURCE")}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <Select
          disabled={disabled}
          style={{ width: "100%" }}
          showSearch
          onChange={this.handleChangeSelect}
          placeholder={getIntlContent("SHENYU.SELECTOR.SOURCE.PLACEHOLDER")}
          filterOption={(inputValue, option) =>
            option.props.children
              .toLowerCase()
              .indexOf(inputValue.toLowerCase()) >= 0
          }
        >
          {this.handleOptions()}
        </Select>
      </Modal>
    );
  }
}

export default ProxySelectorCopy;
