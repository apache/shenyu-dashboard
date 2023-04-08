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
import { Steps, Divider, Card, Col, Row, Timeline, Statistic, Icon, Popover, Tag, Alert } from 'antd';
import { connect } from "dva";
import { routerRedux } from 'dva/router';
import styles from "./home.less";
import { getIntlContent } from '../../utils/IntlUtils';
import { activePluginSnapshot, getNewEventRecodLogList } from "../../services/api";

const { Step } = Steps;

const colors = ["magenta", "red", "green", "cyan", "purple", "blue", "orange"];

@connect(({ global }) => ({
  global
}))
export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      // eslint-disable-next-line react/no-unused-state
      localeName: '',
      activePluginSnapshot: [],
      activeLog: [],
    }
  }

  componentDidMount() {
    const token = window.sessionStorage.getItem("token");
    if (token) {
      const { dispatch } = this.props;
      dispatch({
        type: "global/fetchPlatform"
      });
    }
    activePluginSnapshot().then(res => {
      if (res) {
        this.setState({ activePluginSnapshot: res.data || [] })
      }
    });
    getNewEventRecodLogList().then(res => {
      if (res) {
        this.setState({ activeLog: res.data || [] })
      }
    })

  }

  componentWillUnmount() {
    this.setState = () => false;
  }

  pluginOnClick = (plugin) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(`plug/${plugin.role}/${plugin.name}`));

  }

  render() {
    const contextStyle = { "fontWeight": "bold", color: "#3b9a9c" }
    const pluginSteps = this.state.activePluginSnapshot.map((p, index) => {
      const content = (
        <div>
          <p><Tag color={colors[(p.role.length + index) % colors.length]}>{p.role}</Tag></p>
          <p>the plugin has handle is : <span style={contextStyle}>{p.handleCount}</span></p>
          <p>the plugin has selector is : <span style={contextStyle}>{p.selectorCount} </span></p>
          <hr />
          <div style={contextStyle}>
            <pre><code>{JSON.stringify(JSON.parse(p.config  ? p.config : '{}'), null, 4)}</code></pre>
          </div>
        </div>
      );
      const title = (
        <Popover placement="topLeft" content={content} title={<Tag color="geekblue" onClick={this.pluginOnClick.bind(this, p)}>{p.name} </Tag>}>
          <Tag color="geekblue" onClick={this.pluginOnClick.bind(this, p)} style={{ "fontWeight": "bold" }}>{p.name} </Tag>
          <Tag color={colors[(p.role.length + index) % colors.length]}>{p.role}</Tag>
        </Popover>
      );
      const description = <span>handle is <span style={contextStyle}>{p.handleCount}</span>  selector is <span style={contextStyle}>{p.selectorCount} </span></span>;
      return <Step title={title} key={index} description={description} />;
    })
    const activeLogItems = this.state.activeLog.map((log, index) => {
      const textStyle = { "fontWeight": "bold", color: "#4f6eee" };
      const type = log.operationType.startsWith("CREATE") ? "success" : log.operationType.startsWith("DELETE") ? "warning" : "info";
      return (
        <Timeline.Item color="#e8e8e8" label={index} key={index}>
          <Alert
            className={styles.logItem}
            message={<p><span style={textStyle}>{log.operationType}</span> by <span style={textStyle}>{log.operator}</span></p>}
            description={<p className={styles.contextHide}>{log.operationTime} : <span>{log.context}</span></p>}
            type={type}
          />
        </Timeline.Item>
      )
    })

    return (
      <div>
        <div className={styles.content}>
          <span style={{ textShadow: '1px 1px 3px' }}>{getIntlContent("SHENYU.HOME.WELCOME")}</span>
        </div>
        <div className={styles.processContent}>
          <Steps current={1}>
            <Step title="User Request" />
            <Step title="Shenyu-Gateway BootStrap Proxy" subTitle="plugin list" description="Admin manager." />
            <Step title="Server Waiting" description="do server processing" />
          </Steps>
          <Divider />
          <Row gutter={16} className={styles.row}>
            <Col span={10}>
              <Card title="Activity plugin list" bordered={false} className={styles.card}>
                <Steps size="small" current={this.state.activePluginSnapshot.length} direction="vertical">
                  {pluginSteps}
                </Steps>
                <Divider />
              </Card>
            </Col>
            <Col span={0}>
              <Card title="Monitor" bordered={false}>
                <div style={{ padding: '10px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="RPC plugin" value={5} prefix={<Icon type="plugin" />} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Active/Plugin" value={7} suffix="/ 28" />
                    </Col>
                  </Row>
                </div>
                <div style={{ padding: '10px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="rule" value={238} prefix={<Icon type="plugin" />} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Selector" value={87} suffix="/ 3 plugin" />
                    </Col>
                  </Row>
                </div>
                <div style={{ padding: '10px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="metadata" value={0} prefix={<Icon type="plugin" />} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Dictionary" value={55} />
                    </Col>
                  </Row>
                </div>
                <div style={{ padding: '10px' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Proxy count"
                        value={11280}
                        precision={0}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<Icon type="arrow-up" />}
                        suffix=""
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Fail count"
                        value={930}
                        precision={0}
                        valueStyle={{ color: '#cf1322' }}
                        prefix={<Icon type="arrow-down" />}
                        suffix=""
                      />
                    </Col>
                  </Row>
                </div>
                <Divider />
              </Card>
            </Col>
            <Col span={14}>
              <Card title="Event log" bordered={false} className={styles.card}>
                <Timeline>
                  {activeLogItems}
                </Timeline>
                <Divider />
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}
