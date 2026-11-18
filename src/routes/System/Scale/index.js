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
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Row from "@douyinfe/semi-ui/lib/es/grid/row";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import moment from "moment";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "../../../components/ui/ManagementList.module.less";
import { message } from "../../../components/ui/feedback";
import PolicyModal from "./PolicyModal";
import RuleModal from "./RuleModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { ConfigType, PolicyType } from "./globalData";

const DEFAULT_SCALE_TYPE = 0;
const { Option } = Select;
const { Title } = Typography;

@connect(({ scale, loading, global }) => ({
  language: global.language,
  scale,
  loadingRule: loading.effects["scale/fetchRule"],
  loadingPolicy: loading.effects["scale/fetchPolicy"],
}))
export default class Scale extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      metricName: "",
      type: undefined,
      status: undefined,
    };
  }

  componentDidMount() {
    this.getScaleRules();
    this.getAllPolicies();
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  getRuleQuery = () => {
    const { currentPage, pageSize, metricName, type, status } = this.state;
    return { currentPage, pageSize, metricName, type, status };
  };

  getScaleRules = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "scale/fetchRule",
      payload: this.getRuleQuery(),
    });
  };

  getAllPolicies = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "scale/fetchPolicy",
    });
  };

  pageOnchange = (page) => {
    this.setState({ currentPage: page }, this.getScaleRules);
  };

  onShowSizeChange = (currentPage, pageSize) => {
    this.setState({ currentPage: 1, pageSize }, this.getScaleRules);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editPolicyClick = (record) => {
    const { dispatch } = this.props;
    dispatch({
      type: "scale/fetchPolicyItem",
      payload: {
        id: record.id,
      },
      callback: (policy) => {
        this.setState({
          popup: (
            <PolicyModal
              {...policy}
              handleOk={(values) => {
                dispatch({
                  type: "scale/updatePolicy",
                  payload: { ...policy, ...values },
                  callback: () => {
                    this.setState({ selectedRowKeys: [] });
                    this.closeModal();
                    this.getAllPolicies();
                  },
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
              handleSendTest={(values) => {
                dispatch({
                  type: "scale/sendTest",
                  payload: values,
                });
              }}
            />
          ),
        });
      },
    });
  };

  editRuleClick = (record) => {
    const { dispatch } = this.props;
    const { currentPage, pageSize } = this.state;
    dispatch({
      type: "scale/fetchRuleItem",
      payload: {
        id: record.id,
      },
      callback: (scale) => {
        this.setState({
          popup: (
            <RuleModal
              {...scale}
              handleOk={(values) => {
                dispatch({
                  type: "scale/updateRule",
                  payload: { ...scale, ...values },
                  fetchValue: {
                    currentPage,
                    pageSize,
                  },
                  callback: () => {
                    this.setState({ selectedRowKeys: [] });
                    this.closeModal();
                    this.getScaleRules();
                  },
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
              handleSendTest={(values) => {
                dispatch({
                  type: "scale/sendTest",
                  payload: values,
                });
              }}
            />
          ),
        });
      },
    });
  };

  searchMetricNameOnchange = (e) => {
    const metricName = e.target.value;
    this.setState({ metricName });
  };

  searchTypeOnchange = (type) => {
    this.setState({ type });
  };

  searchStatusOnchange = (status) => {
    this.setState({ status });
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.getScaleRules);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      const targetPage = Math.min(
        currentPage,
        Math.max(
          1,
          Math.ceil(
            (this.props.scale.total - selectedRowKeys.length) / pageSize,
          ),
        ),
      );
      dispatch({
        type: "scale/deleteRules",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: {
          ...this.getRuleQuery(),
          currentPage: targetPage,
        },
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: targetPage });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    const { currentPage, pageSize } = this.state;
    this.setState({
      popup: (
        <RuleModal
          type={DEFAULT_SCALE_TYPE}
          handleOk={(values) => {
            const { dispatch } = this.props;
            dispatch({
              type: "scale/addRule",
              payload: values,
              fetchValue: {
                currentPage,
                pageSize,
              },
              callback: () => {
                this.setState({ selectedRowKeys: [] });
                this.closeModal();
                this.getScaleRules();
              },
            });
          }}
          handleCancel={() => {
            this.closeModal();
          }}
          handleSendTest={(values) => {
            this.props.dispatch({
              type: "scale/sendTest",
              payload: values,
            });
          }}
        />
      ),
    });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  changeLocale(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  render() {
    const { scale, loadingRule, loadingPolicy, dispatch } = this.props;
    const { ruleList, total, policyList } = scale;
    const {
      currentPage,
      pageSize,
      selectedRowKeys,
      popup,
      metricName,
      type,
      status,
    } = this.state;

    const policyColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.POLICY_TYPE"),
        dataIndex: "id",
        key: "id",
        render: (id) => getIntlContent(PolicyType[id]),
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.POLICY_NUMBER"),
        dataIndex: "num",
        key: "num",
        render: (value) => value ?? getIntlContent("SHENYU.SYSTEM.SCALE.NONE"),
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.SORT"),
        dataIndex: "sort",
        key: "sort",
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.STATUS"),
        dataIndex: "status",
        key: "status",
        ellipsis: true,
        render: (text, row) => (
          <AuthButton
            perms="system:scale:edit"
            noAuth={<Switch disabled checked={Number(text) === 1} />}
          >
            {() => (
              <Switch
                checked={Number(text) === 1}
                onChange={(checked) => {
                  dispatch({
                    type: "scale/updatePolicy",
                    payload: {
                      ...row,
                      status: Number(checked),
                      beginTime:
                        row.beginTime &&
                        moment(row.beginTime, "YYYY-MM-DD HH:mm:ss").format(
                          "YYYY-MM-DDTHH:mm:ss[Z]",
                        ),
                      endTime:
                        row.endTime &&
                        moment(row.endTime, "YYYY-MM-DD HH:mm:ss").format(
                          "YYYY-MM-DDTHH:mm:ss[Z]",
                        ),
                    },
                    callback: () => {
                      this.setState({ selectedRowKeys: [] });
                      this.closeModal();
                      this.getAllPolicies();
                    },
                  });
                }}
              />
            )}
          </AuthButton>
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.BEGIN_TIME"),
        dataIndex: "beginTime",
        key: "beginTime",
        width: 220,
        render: (value) =>
          value ? (
            <time dateTime={moment(value).format("YYYY-MM-DDTHH:mm:ss")}>
              {moment(value).format("YYYY-MM-DD HH:mm:ss")}
            </time>
          ) : (
            getIntlContent("SHENYU.SYSTEM.SCALE.NONE")
          ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.END_TIME"),
        dataIndex: "endTime",
        key: "endTime",
        width: 220,
        render: (value) =>
          value ? (
            <time dateTime={moment(value).format("YYYY-MM-DDTHH:mm:ss")}>
              {moment(value).format("YYYY-MM-DD HH:mm:ss")}
            </time>
          ) : (
            getIntlContent("SHENYU.SYSTEM.SCALE.NONE")
          ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        ellipsis: true,
        render: (text, record) => {
          return (
            <div>
              <AuthButton perms="system:scale:edit">
                {({ icon }) => (
                  <Button
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    theme="borderless"
                    className="edit"
                    onClick={() => {
                      this.editPolicyClick(record);
                    }}
                  >
                    {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                  </Button>
                )}
              </AuthButton>
            </div>
          );
        },
      },
    ];

    const ruleColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.CONFIG_NAME"),
        dataIndex: "metricName",
        key: "metricName",
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.CONFIG_TYPE"),
        dataIndex: "type",
        key: "type",
        render: (t) => getIntlContent(ConfigType[t]),
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.SORT"),
        dataIndex: "sort",
        key: "sort",
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.STATUS"),
        dataIndex: "status",
        key: "status",
        ellipsis: true,
        render: (text, row) => (
          <AuthButton
            perms="system:scale:edit"
            noAuth={<Switch disabled checked={Number(text) === 1} />}
          >
            {() => (
              <Switch
                checked={Number(text) === 1}
                onChange={(checked) => {
                  dispatch({
                    type: "scale/updateRule",
                    payload: {
                      ...row,
                      status: Number(checked),
                    },
                    callback: () => {
                      this.getScaleRules();
                    },
                  });
                }}
              />
            )}
          </AuthButton>
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.MINIMUM"),
        dataIndex: "minimum",
        key: "minimum",
        render: (value) => value ?? getIntlContent("SHENYU.SYSTEM.SCALE.NONE"),
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.MAXIMUM"),
        dataIndex: "maximum",
        key: "maximum",
        render: (value) => value ?? getIntlContent("SHENYU.SYSTEM.SCALE.NONE"),
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        ellipsis: true,
        render: (text, record) => {
          return (
            <div>
              <AuthButton perms="system:scale:edit">
                {({ icon }) => (
                  <Button
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    theme="borderless"
                    className="edit"
                    onClick={() => {
                      this.editRuleClick(record);
                    }}
                  >
                    {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                  </Button>
                )}
              </AuthButton>
            </div>
          );
        },
      },
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <LocaleProvider locale={this.props.language === "zh-CN" ? zhCN : enUS}>
        <div className="plug-content-wrap">
          <Row
            style={{
              marginBottom: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "end", flex: 1, margin: 0 }}
            >
              <Title
                heading={2}
                style={{ textTransform: "capitalize", margin: "0 20px 0 0" }}
              >
                {getIntlContent("SHENYU.SYSTEM.SCALE.TITLE")}
              </Title>
            </div>
          </Row>
          <Table
            size="small"
            style={{ marginTop: 30, marginBottom: 30 }}
            bordered
            loading={loadingPolicy}
            scroll={{ x: 1000 }}
            columns={policyColumns}
            dataSource={policyList}
            pagination={false}
            rowKey="id"
          />

          <div className={styles.toolbar}>
            <AuthButton perms="system:scale:list">
              {({ icon }) => (
                <form
                  className={styles.toolbar}
                  onSubmit={(event) => {
                    event.preventDefault();
                    this.searchClick();
                  }}
                >
                  <Input
                    allowClear
                    value={metricName}
                    onChange={this.searchMetricNameOnchange}
                    placeholder={getIntlContent(
                      "SHENYU.SYSTEM.SCALE.SEARCH.CONFIG_NAME",
                    )}
                    style={{ width: 240 }}
                  />
                  <Select
                    value={type}
                    onChange={this.searchTypeOnchange}
                    placeholder={getIntlContent(
                      "SHENYU.SYSTEM.SCALE.SEARCH.CONFIG_TYPE",
                    )}
                    style={{ width: 150, marginLeft: 20 }}
                    allowClear
                  >
                    {Object.entries(ConfigType).map(([value, text]) => (
                      <Option key={value} value={value}>
                        {getIntlContent(text)}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    value={status}
                    onChange={this.searchStatusOnchange}
                    placeholder={getIntlContent(
                      "SHENYU.SYSTEM.SCALE.SEARCH.STATUS",
                    )}
                    style={{ width: 150, marginLeft: 20 }}
                    allowClear
                  >
                    <Option value="0">
                      {getIntlContent("SHENYU.COMMON.CLOSE")}
                    </Option>
                    <Option value="1">
                      {getIntlContent("SHENYU.COMMON.OPEN")}
                    </Option>
                  </Select>
                  <Button
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    style={{ marginLeft: 20 }}
                    type="primary"
                    htmlType="submit"
                  >
                    {getIntlContent("SHENYU.SYSTEM.SEARCH")}
                  </Button>
                </form>
              )}
            </AuthButton>
            <AuthButton perms="system:scale:delete">
              {({ icon }) => (
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  position="bottom"
                  motion={false}
                  onConfirm={() => {
                    this.deleteClick();
                  }}
                  okText={getIntlContent("SHENYU.COMMON.SURE")}
                  cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                >
                  <Button
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    style={{ marginLeft: 20 }}
                    type="danger"
                  >
                    {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
                  </Button>
                </Popconfirm>
              )}
            </AuthButton>
            <AuthButton perms="system:scale:add">
              {({ icon }) => (
                <Button
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  style={{ marginLeft: 20 }}
                  type="primary"
                  onClick={this.addClick}
                >
                  {getIntlContent("SHENYU.SYSTEM.ADDDATA")}
                </Button>
              )}
            </AuthButton>
          </div>

          <Table
            size="small"
            style={{ marginTop: 30 }}
            bordered
            loading={loadingRule}
            scroll={{ x: 850 }}
            columns={ruleColumns}
            dataSource={ruleList}
            rowSelection={rowSelection}
            rowKey="id"
            pagination={{
              total,
              showTotal: true,
              showSizeChanger: true,
              pageSizeOpts: [12, 20, 50, 100],
              currentPage,
              pageSize,
              onChange: (page, size) =>
                size === pageSize
                  ? this.pageOnchange(page)
                  : this.onShowSizeChange(page, size),
            }}
          />
          {popup}
        </div>
      </LocaleProvider>
    );
  }
}
