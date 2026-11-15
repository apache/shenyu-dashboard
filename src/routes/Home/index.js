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
import Button from "@douyinfe/semi-ui/lib/es/button";
import Steps from "@douyinfe/semi-ui/lib/es/steps";
import Divider from "@douyinfe/semi-ui/lib/es/divider";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Timeline from "@douyinfe/semi-ui/lib/es/timeline";
import Popover from "@douyinfe/semi-ui/lib/es/popover";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Banner from "@douyinfe/semi-ui/lib/es/banner";
import { connect } from "react-redux";
import Modal from "../../components/ui/Modal";
import { routerRedux } from "../../runtime/router";
import styles from "./home.less";
import { getIntlContent } from "../../utils/IntlUtils";
import {
  activePluginSnapshotByNamespace,
  getNewEventRecodLogList,
} from "../../services/api";

const { Step } = Steps;
const colors = ["pink", "red", "green", "cyan", "purple", "blue", "orange"];

function formatConfig(config) {
  try {
    return JSON.stringify(JSON.parse(config || "{}"), null, 4);
  } catch {
    return config;
  }
}

@connect(({ global }) => ({ global }))
export default class Home extends Component {
  snapshotRequestId = 0;

  constructor(props) {
    super(props);
    this.state = {
      activePluginSnapshot: [],
      activeLog: [],
      snapshotError: false,
      logError: false,
      selectedLog: null,
    };
  }

  componentDidMount() {
    this.mounted = true;
    if (window.sessionStorage.getItem("token"))
      this.props.dispatch({ type: "global/fetchPlatform" });
    this.loadPluginSnapshot();
    getNewEventRecodLogList()
      .then((res) => {
        if (this.mounted)
          this.setState({
            activeLog:
              res?.code === 200 && Array.isArray(res.data) ? res.data : [],
            logError: res?.code !== 200 || !Array.isArray(res.data),
          });
      })
      .catch(() => {
        if (this.mounted) this.setState({ logError: true });
      });
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.global?.currentNamespaceId !==
      this.props.global?.currentNamespaceId
    )
      this.loadPluginSnapshot();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.snapshotRequestId += 1;
  }

  loadPluginSnapshot = () => {
    const namespaceId =
      this.props.global?.currentNamespaceId ||
      window.sessionStorage.getItem("currentNamespaceId");
    this.snapshotRequestId += 1;
    const requestId = this.snapshotRequestId;
    this.setState({ activePluginSnapshot: [], snapshotError: false });
    activePluginSnapshotByNamespace({ namespaceId })
      .then((res) => {
        if (this.mounted && requestId === this.snapshotRequestId)
          this.setState({
            activePluginSnapshot:
              res?.code === 200 && Array.isArray(res.data) ? res.data : [],
            snapshotError: res?.code !== 200 || !Array.isArray(res.data),
          });
      })
      .catch(() => {
        if (this.mounted && requestId === this.snapshotRequestId)
          this.setState({ snapshotError: true });
      });
  };

  pluginOnClick = (plugin) => {
    this.props.dispatch(
      routerRedux.push(`/plug/${plugin.role}/${plugin.name}`),
    );
  };

  getEventLogTitle = (log) => (
    <span className={styles.logTitle}>
      <Tag color="blue">{log.operationTime}</Tag>
      <strong>{log.operationType}</strong> by <strong>{log.operator}</strong>
    </span>
  );

  showEventLogDetail = (event, log) => {
    event.stopPropagation();
    event.preventDefault();
    this.setState({ selectedLog: log });
  };

  closeLog = () => this.setState({ selectedLog: null });

  render() {
    const {
      activePluginSnapshot,
      activeLog,
      snapshotError,
      logError,
      selectedLog,
    } = this.state;
    return (
      <div>
        <div className={styles.content}>
          <span>{getIntlContent("SHENYU.HOME.WELCOME")}</span>
        </div>
        <div className={styles.processContent}>
          <Steps type="basic" current={1}>
            <Step title="User Request" />
            <Step
              title="Shenyu-Gateway BootStrap Proxy"
              description="plugin list · Admin manager."
            />
            <Step title="Server Waiting" description="do server processing" />
          </Steps>
          <Divider />
          <div className={styles.cards}>
            <Card title="Activity plugin list" className={styles.card}>
              {snapshotError && (
                <Banner
                  type="danger"
                  closeIcon={null}
                  description="Unable to load active plugins."
                />
              )}
              <Steps
                type="basic"
                size="small"
                current={activePluginSnapshot.length}
                direction="vertical"
              >
                {activePluginSnapshot.map((plugin, index) => (
                  <Step
                    key={`${plugin.role}/${plugin.name}`}
                    title={
                      <Popover
                        position="topLeft"
                        content={
                          <div className={styles.pluginDetail}>
                            <strong>{plugin.name}</strong>
                            <p>
                              <Tag
                                color={
                                  colors[
                                    ((plugin.role || "").length + index) %
                                      colors.length
                                  ]
                                }
                              >
                                {plugin.role}
                              </Tag>
                            </p>
                            <p>
                              the plugin has handle is :{" "}
                              <strong>{plugin.handleCount}</strong>
                            </p>
                            <p>
                              the plugin has selector is :{" "}
                              <strong>{plugin.selectorCount}</strong>
                            </p>
                            <pre>
                              <code>{formatConfig(plugin.config)}</code>
                            </pre>
                          </div>
                        }
                      >
                        <Button
                          theme="borderless"
                          htmlType="button"
                          onClick={() => this.pluginOnClick(plugin)}
                        >
                          {plugin.name}
                        </Button>
                      </Popover>
                    }
                    description={
                      <span>
                        <Tag
                          color={
                            colors[
                              ((plugin.role || "").length + index) %
                                colors.length
                            ]
                          }
                        >
                          {plugin.role}
                        </Tag>{" "}
                        handle is <strong>{plugin.handleCount}</strong> selector
                        is <strong>{plugin.selectorCount}</strong>
                      </span>
                    }
                  />
                ))}
              </Steps>
            </Card>
            <Card title="Event log" className={styles.card}>
              {logError && (
                <Banner
                  type="danger"
                  closeIcon={null}
                  description="Unable to load event logs."
                />
              )}
              <Timeline>
                {activeLog.map((log, index) => (
                  <Timeline.Item key={log.id || index}>
                    <Banner
                      className={styles.logItem}
                      fullMode={false}
                      closeIcon={null}
                      type={
                        (log.operationType || "").startsWith("CREATE")
                          ? "success"
                          : (log.operationType || "").startsWith("DELETE")
                            ? "warning"
                            : "info"
                      }
                      description={
                        <Button
                          className={styles.logButton}
                          theme="borderless"
                          htmlType="button"
                          onClick={(event) =>
                            this.showEventLogDetail(event, log)
                          }
                        >
                          {this.getEventLogTitle(log)}
                          <span>Detail</span>
                        </Button>
                      }
                    />
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </div>
        </div>
        {selectedLog && (
          <Modal
            visible
            width={500}
            title={this.getEventLogTitle(selectedLog)}
            onCancel={this.closeLog}
            footer={
              <Button
                theme="solid"
                type="primary"
                htmlType="button"
                onClick={this.closeLog}
              >
                {getIntlContent("SHENYU.COMMON.SURE")}
              </Button>
            }
          >
            <div className={styles.logContext}>{selectedLog.context}</div>
          </Modal>
        )}
      </div>
    );
  }
}
