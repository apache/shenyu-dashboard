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
import {
  Button,
  DatePicker,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Switch,
  Table,
  Typography,
} from "antd";
import { connect } from "dva";
import moment from "moment";
import PolicyModal from "./PolicyModal";
import RuleModal from "./RuleModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { ConfigType, PolicyType } from "./globalData";

const DEFAULT_SCALE_TYPE = 0;
const { Option } = Select;
const { Title } = Typography;

@connect(({ scale, loading }) => ({
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

  getScaleRules = () => {
    const { dispatch } = this.props;
    const { currentPage, pageSize, metricName, type, status } = this.state;
    dispatch({
      type: "scale/fetchRule",
      payload: {
        currentPage,
        pageSize,
        metricName,
        type,
        status,
      },
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
    this.getScaleRules();
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "scale/deleteRules",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: {
          currentPage,
          pageSize,
        },
        callback: () => {
          this.setState({ selectedRowKeys: [] });
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
          <Switch
            checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
            unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
            checked={Boolean(text)}
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
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.BEGIN_TIME"),
        dataIndex: "beginTime",
        key: "beginTime",
        render: (value) =>
          value ? (
            <DatePicker showTime disabled value={moment(value)} />
          ) : (
            getIntlContent("SHENYU.SYSTEM.SCALE.NONE")
          ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.END_TIME"),
        dataIndex: "endTime",
        key: "endTime",
        render: (value) =>
          value ? (
            <DatePicker showTime disabled value={moment(value)} />
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
                <span
                  className="edit"
                  onClick={() => {
                    this.editPolicyClick(record);
                  }}
                >
                  {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                </span>
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
          <Switch
            checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
            unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
            checked={Boolean(text)}
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
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.MINIMUM"),
        dataIndex: "minimum",
        key: "minimum",
        render: (value) => value || getIntlContent("SHENYU.SYSTEM.SCALE.NONE"),
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.SCALE.MAXIMUM"),
        dataIndex: "maximum",
        key: "maximum",
        render: (value) => value || getIntlContent("SHENYU.SYSTEM.SCALE.NONE"),
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
                <span
                  className="edit"
                  onClick={() => {
                    this.editRuleClick(record);
                  }}
                >
                  {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                </span>
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
              level={2}
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
          columns={policyColumns}
          dataSource={policyList}
          pagination={false}
          rowKey="id"
        />

        <div style={{ display: "flex" }}>
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
            placeholder={getIntlContent("SHENYU.SYSTEM.SCALE.SEARCH.STATUS")}
            style={{ width: 150, marginLeft: 20 }}
            allowClear
          >
            <Option value="0">{getIntlContent("SHENYU.COMMON.CLOSE")}</Option>
            <Option value="1">{getIntlContent("SHENYU.COMMON.OPEN")}</Option>
          </Select>
          <AuthButton perms="system:scale:list">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:scale:delete">
            <Popconfirm
              title={getIntlContent("SHENYU.COMMON.DELETE")}
              placement="bottom"
              onConfirm={() => {
                this.deleteClick();
              }}
              okText={getIntlContent("SHENYU.COMMON.SURE")}
              cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
            >
              <Button style={{ marginLeft: 20 }} type="danger">
                {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
              </Button>
            </Popconfirm>
          </AuthButton>
          <AuthButton perms="system:scale:add">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.addClick}
            >
              {getIntlContent("SHENYU.SYSTEM.ADDDATA")}
            </Button>
          </AuthButton>
        </div>

        <Table
          size="small"
          style={{ marginTop: 30 }}
          bordered
          loading={loadingRule}
          columns={ruleColumns}
          dataSource={ruleList}
          rowSelection={rowSelection}
          rowKey="id"
          pagination={{
            total,
            showTotal: (showTotal) => `${showTotal}`,
            showSizeChanger: true,
            pageSizeOptions: ["12", "20", "50", "100"],
            current: currentPage,
            pageSize,
            onShowSizeChange: this.onShowSizeChange,
            onChange: this.pageOnchange,
          }}
        />
        {popup}
      </div>
    );
  }
}
