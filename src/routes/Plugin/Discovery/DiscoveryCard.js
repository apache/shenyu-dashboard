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
import Card from "@douyinfe/semi-ui/lib/es/card";
import Popover from "@douyinfe/semi-ui/lib/es/popover";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import ResourceIcon from "../../../components/ui/ResourceIcon";

import { getIntlContent } from "../../../utils/IntlUtils";
import discoveryStyles from "./discovery.module.less";

import { formatTimestamp } from "../../../utils/utils";
import {
  ConsulIcon,
  EtcdIcon,
  LocalIcon,
  NacosIcon,
  ZkIcon,
  EurekaIcon,
} from "./DiscoveryIcon";
import AuthButton from "../../../utils/AuthButton";

const { Text } = Typography;
const { Meta } = Card;

export class DiscoveryCard extends Component {
  render() {
    const { updateSelector, data, handleDelete, handleRefresh } = this.props;
    const {
      createTime,
      updateTime,
      props: selectorProps,
      forwardPort,
      discovery,
    } = this.props.data;
    const propsJson = JSON.stringify(
      JSON.parse(
        selectorProps !== null && selectorProps.length > 0
          ? selectorProps
          : "{}",
      ),
      null,
      4,
    );
    const content = (
      <div>
        <Text>{`${getIntlContent("SHENYU.SYSTEM.CREATETIME")}: ${formatTimestamp(createTime)}`}</Text>
        <br />
        <Text>{`${getIntlContent("SHENYU.SYSTEM.UPDATETIME")}: ${formatTimestamp(updateTime)}`}</Text>
        <hr />
        <div>
          {getIntlContent("SHENYU.DISCOVERY.SELECTOR.PROPS")}
          <span style={{ marginLeft: "2px", fontWeight: "500" }}>:</span>
        </div>
        <div>
          <pre>
            <code>{propsJson}</code>
          </pre>
        </div>
      </div>
    );

    const typeIconMap = {
      local: <LocalIcon style={{ fontSize: "40px", color: "#354458" }} />,
      zookeeper: <ZkIcon style={{ fontSize: "40px", color: "#354458" }} />,
      nacos: <NacosIcon style={{ fontSize: "40px", color: "#354458" }} />,
      consul: <ConsulIcon style={{ fontSize: "40px", color: "#354458" }} />,
      etcd: <EtcdIcon style={{ fontSize: "40px", color: "#354458" }} />,
      eureka: <EurekaIcon style={{ fontSize: "40px", color: "#354458" }} />,
    };

    const getAvatarIcon = () => {
      return typeIconMap[discovery.type] || null;
    };

    return (
      <Popover position="leftTop" content={content}>
        <Card
          title={
            <div style={{ fontSize: "17px", lineHeight: "1.5" }}>
              {data.name}
            </div>
          }
          bordered={false}
          className={discoveryStyles.discoveryCard}
          footer={
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <AuthButton perms="plugin:tcp:modify">
                {() => (
                  <Button
                    theme="borderless"
                    aria-label={getIntlContent("SHENYU.COMMON.REFRESH")}
                    icon={<ResourceIcon type="reload" />}
                    onClick={() => handleRefresh(data.discoveryHandlerId)}
                  />
                )}
              </AuthButton>
              <AuthButton perms="plugin:tcp:modify">
                {() => (
                  <Button
                    theme="borderless"
                    aria-label={getIntlContent("SHENYU.COMMON.CHANGE")}
                    icon={<ResourceIcon type="edit" />}
                    onClick={() => updateSelector(data.id)}
                  />
                )}
              </AuthButton>
              <AuthButton perms="plugin:tcpSelector:delete">
                {() => (
                  <Popconfirm
                    motion={false}
                    title={getIntlContent(
                      "SHENYU.DISCOVERY.SELECTOR.DELETE.CONFIRM",
                    )}
                    onConfirm={() => handleDelete(data.id)}
                    okText={getIntlContent("SHENYU.COMMON.YES")}
                    cancelText={getIntlContent("SHENYU.COMMON.NO")}
                  >
                    <Button
                      theme="borderless"
                      type="danger"
                      aria-label={getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      icon={<ResourceIcon type="delete" />}
                    />
                  </Popconfirm>
                )}
              </AuthButton>
            </div>
          }
          headerExtraContent={
            <div
              style={{
                fontSize: "15px",
                lineHeight: "1.5",
                marginRight: "14px",
              }}
            >
              {formatTimestamp(createTime)}
            </div>
          }
        >
          <Meta
            avatar={
              <div style={{ marginLeft: "20px", marginTop: "10px" }}>
                {getAvatarIcon()}
              </div>
            }
            title={
              <div
                style={{
                  marginLeft: "40px",
                  fontSize: "15px",
                  lineHeight: "30px",
                }}
              >
                {`${getIntlContent("SHENYU.DISCOVERY.SELECTOR.FORWARDPORT")}: ${forwardPort}`}
                <br />
                {`${getIntlContent("SHENYU.COMMON.TYPE")}: ${discovery.type}`}
              </div>
            }
          />
        </Card>
      </Popover>
    );
  }
}
