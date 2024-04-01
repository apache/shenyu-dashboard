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
import { Table, Button, message, Popconfirm, Switch } from "antd";
import dayjs from "dayjs";
import { connect } from "dva";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { Type } from "./globalData";

const DEFAULT_ALERT_TYPE = 1;

@connect(({ alert, loading }) => ({
  alert,
  loading: loading.effects["alert/fetch"],
}))
export default class Alert extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
    };
  }

  componentDidMount() {
    this.getAllAlerts();
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  getAllAlerts = () => {
    const { dispatch } = this.props;
    const { currentPage, pageSize } = this.state;
    dispatch({
      type: "alert/fetch",
      payload: {
        currentPage,
        pageSize,
      },
    });
  };

  pageOnchange = (page) => {
    this.setState({ currentPage: page }, this.getAllAlerts);
  };

  onShowSizeChange = (currentPage, pageSize) => {
    this.setState({ currentPage: 1, pageSize }, this.getAllAlerts);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = (record) => {
    const { dispatch } = this.props;
    const { currentPage, pageSize } = this.state;
    dispatch({
      type: "alert/fetchItem",
      payload: {
        id: record.id,
      },
      callback: (alert) => {
        this.setState({
          popup: (
            <AddModal
              {...alert}
              handleOk={(values) => {
                dispatch({
                  type: "alert/update",
                  payload: { ...alert, ...values },
                  fetchValue: {
                    currentPage,
                    pageSize,
                  },
                  callback: () => {
                    this.setState({ selectedRowKeys: [] });
                    this.closeModal();
                    this.getAllAlerts();
                  },
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
              handleSendTest={(values) => {
                dispatch({
                  type: "alert/sendTest",
                  payload: values,
                });
              }}
            />
          ),
        });
      },
    });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "alert/delete",
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
        <AddModal
          type={DEFAULT_ALERT_TYPE}
          handleOk={(values) => {
            const { dispatch } = this.props;
            dispatch({
              type: "alert/add",
              payload: values,
              fetchValue: {
                currentPage,
                pageSize,
              },
              callback: () => {
                this.setState({ selectedRowKeys: [] });
                this.closeModal();
                this.getAllAlerts();
              },
            });
          }}
          handleCancel={() => {
            this.closeModal();
          }}
          handleSendTest={(values) => {
            this.props.dispatch({
              type: "alert/sendTest",
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
    const { alert, loading, dispatch } = this.props;
    const { alertList, total } = alert;
    const { currentPage, pageSize, selectedRowKeys, popup } = this.state;
    const alertColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ALERT.NAME"),
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        sorter: (a, b) => (a.name > b.name ? 1 : -1),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ALERT.TYPE"),
        dataIndex: "type",
        key: "type",
        render: (type) => getIntlContent(Type[type]),
        ellipsis: true,
        sorter: (a, b) => (a.type > b.type ? 1 : -1),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ALERT.CONFIGURATION"),
        dataIndex: "config",
        render: (_, row) => {
          switch (row.type) {
            case 1:
              return row.email;
            case 5:
              return row.accessToken;
            default:
              return null;
          }
        },
        key: "config",
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ALERT.ENABLE"),
        dataIndex: "enable",
        key: "enable",
        ellipsis: true,
        render: (text, row) => (
          <Switch
            checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
            unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
            checked={text}
            onChange={(checked) => {
              dispatch({
                type: "alert/update",
                payload: {
                  ...row,
                  enable: checked,
                },
                callback: () => {
                  this.getAllAlerts();
                },
              });
            }}
          />
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
        dataIndex: "dateUpdated",
        key: "dateUpdated",
        render: (dateUpdated) =>
          dayjs(dateUpdated).format("YYYY-MM-DD HH:mm:ss"),
        ellipsis: true,
        sorter: (a, b) => (a.dateUpdated > b.dateUpdated ? 1 : -1),
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
              <AuthButton perms="system:alert:edit">
                <span
                  className="edit"
                  onClick={() => {
                    this.editClick(record);
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
        <div style={{ display: "flex" }}>
          <AuthButton perms="system:alert:delete">
            <Popconfirm
              title={getIntlContent("SHENYU.COMMON.DELETE")}
              placement="bottom"
              onConfirm={() => {
                this.deleteClick();
              }}
              okText={getIntlContent("SHENYU.COMMON.SURE")}
              cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
            >
              <Button type="danger">
                {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
              </Button>
            </Popconfirm>
          </AuthButton>
          <AuthButton perms="system:alert:add">
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
          loading={loading}
          columns={alertColumns}
          dataSource={alertList}
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
