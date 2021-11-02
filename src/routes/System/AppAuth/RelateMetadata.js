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
import { Modal, Form } from "antd";
// import styles from "./index.less";
import TableTransferComponent from "./TableTransfer"
import { getIntlContent } from "../../../utils/IntlUtils";

class RelateMetadata extends Component {
  constructor(props) {
    super(props);
    this.state= {
    authPathDTOList: [],
    id: this.props.id
    }
  }

  // 获取穿梭框中右侧数据以便更新
  getUpdateMetas = data => {

    this.setState({
      authPathDTOList: data,
    })
  }


  handleSubmit = () => {
    const {handleOk} = this.props;
    // 需要传值更新
    handleOk(this.state);

  };

  render(){
    let { authName, handleCancel,auth,dataList }=this.props;
    return (
      <Modal
        width={1200}
        centered
        visible
        title={getIntlContent("SHENYU.AUTH.EDITOR.RESOURCE")}
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        {/* 放置穿梭框组件 */}
        <TableTransferComponent authName={authName} auth={auth} datalist={dataList} handleGetUpdateMetas={(data)=>this.getUpdateMetas(data)} />
      </Modal>
    )
  }


}

export default Form.create()(RelateMetadata);
