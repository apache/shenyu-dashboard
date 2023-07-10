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

import React, {Component} from "react";
import {Button, Card} from "antd";
import {getIntlContent} from "../../../utils/IntlUtils";
import tcpStyles from "./tcp.less";

import { formatTimestamp } from "../../../utils/utils";
import AuthButton from "../../../utils/AuthButton";



export class TcpCard extends Component {

  renderCardItems = () => {
    const {forwardPort, createTime, updateTime} = this.props.data

    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div className={tcpStyles.cardItem}>
          <div style={{ fontSize: '18px', marginLeft: '30px' }}>{getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT")}</div>
          <div className={tcpStyles.cardTag}>{forwardPort}</div>
        </div>
        <div className={tcpStyles.cardItem}>
          <div style={{ fontSize: '18px', marginLeft: '30px' }}>{getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.DateCreated")}</div>
          <div className={tcpStyles.cardTag}>{formatTimestamp(createTime)}</div>
        </div>
        <div className={tcpStyles.cardItem}>
          <div style={{ fontSize: '18px', marginLeft: '30px'  }}>{getIntlContent("SHENYU.DISCOVERY.SELECTOR.UPSTREAM.DateUpdated")}</div>
          <div className={tcpStyles.cardTag}>{formatTimestamp(updateTime)}</div>
        </div>
      </div>
    )
  }

  render() {
    const {updateSelector, data, handleDelete} = this.props
    return (
      <Card
        title={<div style={{ marginLeft: '30px', fontSize: '20px' }}>{data.name}</div>}
        style={{  borderRadius: '5px' , boxShadow: '1px 2px 2px rgba(191, 189, 189, 0.5)' }}
        extra={(
          <div>
            <AuthButton perms="plugin:tcp:modify">
              <Button
                type="primary"
                onClick={() => {
                  updateSelector(data.id)
                }}
                style={{ marginRight: '20px' }}
              >
                {getIntlContent("SHENYU.COMMON.CHANGE")}
              </Button>
            </AuthButton>
            <AuthButton perms="plugin:tcpSelector:delete">
              <Button
                type="primary"
                onClick={() => {
                  handleDelete(data.id)
                }}
                style={{ marginRight: '30px' }}
              >
                {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
              </Button>
            </AuthButton>
          </div>
        )}
      >
        {this.renderCardItems()}
      </Card>

    )
  }
}
