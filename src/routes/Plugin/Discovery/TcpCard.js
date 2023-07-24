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
import {Button, Card, Popover, Typography} from "antd";
import {getIntlContent} from "../../../utils/IntlUtils";
import tcpStyles from "./tcp.less";

import { formatTimestamp } from "../../../utils/utils";
import AuthButton from "../../../utils/AuthButton";

const { Text } = Typography;

export class TcpCard extends Component {

  renderCardItems = () => {
    const {forwardPort, discovery} = this.props.data
    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div className={tcpStyles.cardItem}>
          <div style={{ fontSize: '17px', marginLeft: '30px' }}>{getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT")}</div>
          <div className={tcpStyles.cardTag}>{forwardPort}</div>
        </div>
        <div className={tcpStyles.cardItem}>
          <div style={{ fontSize: '17px', marginLeft: '30px' }}>{getIntlContent("SHENYU.COMMON.TYPE")}</div>
          <div className={tcpStyles.cardTag}>{discovery.type}</div>
        </div>
      </div>
    )
  }

  render() {
    const { updateSelector, data, handleDelete, handleRefresh } = this.props
    const { createTime, updateTime, props} = this.props.data
    const propsJson = JSON.stringify(JSON.parse(props!== null && props.length > 0? props:'{}'), null, 4) ;
    const content = (
      <div>
        <Text>{`${getIntlContent("SHENYU.SYSTEM.CREATETIME") }: ${formatTimestamp(createTime)}`}</Text>
        <br />
        <Text>{`${getIntlContent("SHENYU.SYSTEM.UPDATETIME") }: ${formatTimestamp(updateTime)}`}</Text>
        <hr />
        <div>
          {getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS")}
          <span style={{ marginLeft: '2px', fontWeight: '500' }}>:</span>
        </div>
        <div>
          <pre><code>{propsJson}</code></pre>
        </div>
      </div>
    );
    return (
      <Popover placement="leftTop" content={content}>
        <Card
          title={<div style={{ marginLeft: '30px', fontSize: '20px' }}>{data.name}</div>}
          style={{  borderRadius: '5px' , boxShadow: '1px 2px 2px rgba(191, 189, 189, 0.5)' }}
          extra={(
            <div>
              <AuthButton perms="plugin:tcp:modify">
                <Button
                  type="primary"
                  onClick={() => {
                    handleRefresh(data.discoveryHandlerId)
                  }}
                  style={{ marginRight: '20px' }}
                >
                  {getIntlContent("SHENYU.COMMON.REFRESH")}
                </Button>
              </AuthButton>
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
                  type="danger"
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
      </Popover>
    )
  }
}
