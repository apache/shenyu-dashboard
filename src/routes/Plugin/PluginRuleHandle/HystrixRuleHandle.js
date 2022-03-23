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

import React, { Component, Fragment } from "react";
import { Form, Select, Input} from "antd";
import classnames from 'classnames';
import { connect } from "dva";
import styles from "../index.less";
import { getIntlContent } from '../../../utils/IntlUtils'

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ global }) => ({
  platform: global.platform
}))
export default class HystrixRuleHandle extends Component {

  constructor(props) {
    super(props);
    props.onRef(this);
    let requestVolumeThreshold = "20",
        errorThresholdPercentage = "50",
        maxConcurrentRequests = "100",
        sleepWindowInMilliseconds = "5000",
        groupKey = "",
        commandKey = "",
        callBackUri="",
        executionIsolationStrategy=1,
        hystrixThreadPoolConfig = {
            coreSize: 10,
            maximumSize: 10,
            maxQueueSize: 12
        };
    if (props.handle) {
        const myHandle = JSON.parse(props.handle);
        requestVolumeThreshold = myHandle.requestVolumeThreshold;
        errorThresholdPercentage = myHandle.errorThresholdPercentage;
        maxConcurrentRequests = myHandle.maxConcurrentRequests;
        sleepWindowInMilliseconds = myHandle.sleepWindowInMilliseconds;
        groupKey = myHandle.groupKey;
        commandKey = myHandle.commandKey;
        if (typeof(myHandle.executionIsolationStrategy) !== 'undefined' ) {
            executionIsolationStrategy = myHandle.executionIsolationStrategy;
        }
        if (myHandle.hystrixThreadPoolConfig) {
            hystrixThreadPoolConfig = myHandle.hystrixThreadPoolConfig;
        }
        callBackUri = myHandle.callBackUri;
    }
    this.state = {
        requestVolumeThreshold,
        errorThresholdPercentage,
        maxConcurrentRequests,
        sleepWindowInMilliseconds,
        groupKey,
        commandKey,
        executionIsolationStrategy,
        hystrixThreadPoolConfig,
        callBackUri
    };
  }

  getData = () => {
      const {
        requestVolumeThreshold,
        errorThresholdPercentage,
        maxConcurrentRequests,
        sleepWindowInMilliseconds,
        groupKey,
        commandKey,
        executionIsolationStrategy,
        hystrixThreadPoolConfig,
        callBackUri
      } = this.state;
      const myRequestVolumeThreshold =
      requestVolumeThreshold > 0 ? requestVolumeThreshold : "0";
    const myErrorThresholdPercentage =
      errorThresholdPercentage > 0 ? errorThresholdPercentage : "0";
    const myMaxConcurrentRequests =
      maxConcurrentRequests > 0 ? maxConcurrentRequests : "0";
    const mySleepWindowInMilliseconds =
      sleepWindowInMilliseconds > 0 ? sleepWindowInMilliseconds : "0";
    const myCoreSize = hystrixThreadPoolConfig.coreSize > 0 ? hystrixThreadPoolConfig.coreSize : "0";
    const myMaximumSize = hystrixThreadPoolConfig.maximumSize > 0 ? hystrixThreadPoolConfig.maximumSize : "0";
    const myMaxQueueSize = hystrixThreadPoolConfig.maxQueueSize > 0 ? hystrixThreadPoolConfig.maxQueueSize : "0";
    const handle = {
        requestVolumeThreshold: myRequestVolumeThreshold,
        errorThresholdPercentage: myErrorThresholdPercentage,
        sleepWindowInMilliseconds: mySleepWindowInMilliseconds,
        executionIsolationStrategy,
        callBackUri,
        groupKey,
        commandKey
      };
      if (handle.executionIsolationStrategy === 1) {
        handle.maxConcurrentRequests = myMaxConcurrentRequests;
      } else{
        handle.hystrixThreadPoolConfig={
          coreSize: myCoreSize,
          maximumSize: myMaximumSize,
          maxQueueSize: myMaxQueueSize
        }
      }
      return JSON.stringify(handle);
  }

  onHandleChange = (key, value) => {
    this.setState({ [key]: value });
  };

  onHandleNumberChange = (key, value) => {
    if (/^\d*$/.test(value)) {
      this.setState({ [key]: value });
    }
  };


  render() {
    const labelWidth = 160
    const { form, platform: {hystrixIsolationModeEnums} } = this.props;
    const { getFieldDecorator } = form;;
    const {
        requestVolumeThreshold,
        errorThresholdPercentage,
        maxConcurrentRequests,
        sleepWindowInMilliseconds,
        groupKey,
        commandKey,
        executionIsolationStrategy,
        hystrixThreadPoolConfig,
        callBackUri
      } = this.state;
      const formItemLayout = {
        labelCol: {
          sm: { span: 3 }
        },
        wrapperCol: {
          sm: { span: 21 }
        }
      };
    // eslint-disable-next-line
    return (
      <Fragment>
        <FormItem label={getIntlContent("SHENYU.HYSTRIX.LSOLATION.MODE")} {...formItemLayout}>
          {getFieldDecorator("executionIsolationStrategy", {
            rules: [{ required: true, message: getIntlContent("SHENYU.HYSTRIX.LSOLATION.SELECT") }],
            initialValue: executionIsolationStrategy
          })(
            <Select
              onChange={value => {
                this.onHandleChange("executionIsolationStrategy", value);
              }}
            >
              {hystrixIsolationModeEnums.map(item => {
                return (
                  <Option key={item.code} value={item.code}>
                    {item.name}
                  </Option>
                );
              })}
            </Select>
          )}
        </FormItem>
        <div className={styles.handleWrap}>
          <div className={styles.header}>
            <h3>{getIntlContent("SHENYU.COMMON.DEAL")}: </h3>
          </div>
          <ul
            className={classnames({
              [styles.handleUl]: true,
              [styles.springUl]: true
            })}
          >
            <li>
              <Input
                addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.TRIPPING.REQUEST.NUMBER")}</div>}
                value={requestVolumeThreshold}
                placeholder="requestVolumeThreshold"
                onChange={e => {
                  const value = e.target.value;
                  this.onHandleNumberChange("requestVolumeThreshold", value);
                }}
              />
            </li>
            <li>
              <Input
                addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.ERROR.PERCENT")}</div>}
                value={errorThresholdPercentage}
                placeholder="errorThresholdPercentage"
                onChange={e => {
                  const value = e.target.value;
                  this.onHandleNumberChange(
                  "errorThresholdPercentage",
                  value
                  );
                }}
              />
            </li>
            {
              this.state.executionIsolationStrategy === 1&&(
              <li>
                <Input
                  addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.MAX.CONCURRENCY")}</div>}
                  value={maxConcurrentRequests}
                  placeholder="maxConcurrentRequests"
                  onChange={e => {
                  const value = e.target.value;
                  this.onHandleNumberChange("maxConcurrentRequests", value);
                  }}
                />
              </li>
              )
            }
            <li>
              <Input
                addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.TRIPPING.SLEEPTIME")}</div>}
                value={sleepWindowInMilliseconds}
                placeholder="sleepWindowInMilliseconds"
                onChange={e => {
                  const value = e.target.value;
                  this.onHandleNumberChange(
                  "sleepWindowInMilliseconds",
                  value
                  );
                }}
              />
            </li>
            <li>
              <Input
                addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.GROUPKEY")}</div>}
                value={groupKey}
                placeholder="GroupKey"
                onChange={e => {
                  const value = e.target.value;
                  this.onHandleChange("groupKey", value);
                }}
              />
            </li>
            <li>
              <Input
                addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.FAILEDDEMOTION")}</div>}
                value={callBackUri}
                placeholder={getIntlContent("SHENYU.HYSTRIX.FAILEDCALLBACK")}
                onChange={e => {
                  const value = e.target.value;
                  this.onHandleChange("callBackUri", value);
                }}
              />
            </li>
            <li>
              <Input
                addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.COMMANDKEY")}</div>}
                value={commandKey}
                placeholder="CommandKey"
                onChange={e => {
                  const value = e.target.value;
                  this.onHandleChange("commandKey", value);
                }}
              />
            </li>
            {
                this.state.executionIsolationStrategy === 0 && (
                <li>
                  <Input
                    addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.CORETHREADSIZE")}</div>}
                    value={hystrixThreadPoolConfig.coreSize}
                    placeholder={getIntlContent("SHENYU.HYSTRIX.CORENUM")}
                    onChange={e => {
                    const value = e.target.value;
                    hystrixThreadPoolConfig.coreSize = value;
                    this.setState({hystrixThreadPoolConfig})
                    }}
                  />
                </li>
            )}

            {
              this.state.executionIsolationStrategy === 0 && (
              <li>
                <Input
                  addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.MAXSIZE")}</div>}
                  value={hystrixThreadPoolConfig.maximumSize}
                  placeholder={getIntlContent("SHENYU.HYSTRIX.MAXTHREADNUM")}
                  onChange={e => {
                  const value = e.target.value;
                  hystrixThreadPoolConfig.maximumSize = value;
                  this.setState({hystrixThreadPoolConfig})
                  }}
                />
              </li>
            )}
            {
              this.state.executionIsolationStrategy === 0&& (
              <li>
                <Input
                  addonBefore={<div style={{width: labelWidth}}>{getIntlContent("SHENYU.HYSTRIX.MAXTHREADQUEUE")}</div>}
                  value={hystrixThreadPoolConfig.maxQueueSize}
                  placeholder={getIntlContent("SHENYU.HYSTRIX.MAXTHREAD")}
                  onChange={e => {
                  const value = e.target.value;
                  hystrixThreadPoolConfig.maxQueueSize = value;
                  this.setState({hystrixThreadPoolConfig})
                  }}
                />
              </li>
            )}
          </ul>
        </div>
      </Fragment>
     );
  }
}
