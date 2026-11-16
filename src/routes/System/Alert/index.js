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
import Table from "@douyinfe/semi-ui/lib/es/table";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import dayjs from "dayjs";
import { connect } from "react-redux";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import { message } from "../../../components/ui/feedback";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { Type } from "./globalData";

const DEFAULT_ALERT_TYPE = 1;

export const getAlertPageAfterDelete = (
  total,
  deletedCount,
  currentPage,
  pageSize,
) => {
  const remainingPages = Math.max(
    1,
    Math.ceil((total - deletedCount) / pageSize),
  );
  return Math.min(currentPage, remainingPages);
};

export class AlertComponent extends Component {
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
    const { dispatch, currentNamespaceId } = this.props;
    const { currentPage, pageSize } = this.state;
    dispatch({
      type: "alert/fetch",
      payload: {
        currentPage,
        pageSize,
        namespaceId: currentNamespaceId,
      },
    });
  };

  onPaginationChange = (page, pageSize) => {
    this.setState(
      (state) => ({
        currentPage: pageSize === state.pageSize ? page : 1,
        pageSize,
      }),
      this.getAllAlerts,
    );
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = (record) => {
    const { dispatch, currentNamespaceId } = this.props;
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
                  payload: {
                    ...alert,
                    ...values,
                    namespaceId: currentNamespaceId,
                  },
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
    const {
      dispatch,
      currentNamespaceId,
      alert: { total },
    } = this.props;
    const { currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      const nextPage = getAlertPageAfterDelete(
        total,
        selectedRowKeys.length,
        currentPage,
        pageSize,
      );
      dispatch({
        type: "alert/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: {
          currentPage: nextPage,
          pageSize,
          namespaceId: currentNamespaceId,
        },
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: nextPage });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    const { currentPage, pageSize } = this.state;
    const { currentNamespaceId } = this.props;
    this.setState({
      popup: (
        <AddModal
          type={DEFAULT_ALERT_TYPE}
          handleOk={(values) => {
            const { dispatch } = this.props;
            dispatch({
              type: "alert/add",
              payload: { ...values, namespaceId: currentNamespaceId },
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
    const { alert, loading, dispatch, currentNamespaceId, language } =
      this.props;
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
          <span className={styles.status}>
            <Switch
              aria-label={`${row.name}: ${getIntlContent("SHENYU.SYSTEM.ALERT.ENABLE")}`}
              checked={text}
              onChange={(checked) => {
                dispatch({
                  type: "alert/update",
                  payload: {
                    ...row,
                    enable: checked,
                    namespaceId: currentNamespaceId,
                  },
                  callback: () => {
                    this.getAllAlerts();
                  },
                });
              }}
            />
            <span>
              {getIntlContent(
                text ? "SHENYU.COMMON.OPEN" : "SHENYU.COMMON.CLOSE",
              )}
            </span>
          </span>
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
                {({ icon }) => (
                  <Button
                    theme="borderless"
                    htmlType="button"
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                    onClick={() => this.editClick(record)}
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
      <LocaleProvider locale={language === "zh-CN" ? zhCN : enUS}>
        <div className="plug-content-wrap">
          <div className={styles.toolbar}>
            <AuthButton perms="system:alert:delete">
              {({ icon }) => (
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  position="bottom"
                  motion={false}
                  okType="danger"
                  onConfirm={this.deleteClick}
                  okText={getIntlContent("SHENYU.COMMON.SURE")}
                  cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                >
                  <Button
                    type="danger"
                    theme="solid"
                    htmlType="button"
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  >
                    {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
                  </Button>
                </Popconfirm>
              )}
            </AuthButton>
            <AuthButton perms="system:alert:add">
              {({ icon }) => (
                <Button
                  type="primary"
                  theme="solid"
                  htmlType="button"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.addClick}
                >
                  {getIntlContent("SHENYU.SYSTEM.ADDDATA")}
                </Button>
              )}
            </AuthButton>
          </div>

          <Table
            size="small"
            scroll={{ x: 1000 }}
            style={{ marginTop: 30 }}
            bordered
            loading={loading}
            columns={alertColumns}
            dataSource={alertList}
            rowSelection={rowSelection}
            rowKey="id"
            pagination={{
              total,
              showTotal: true,
              showSizeChanger: true,
              pageSizeOpts: [12, 20, 50, 100],
              currentPage,
              pageSize,
              onChange: this.onPaginationChange,
            }}
          />
          {popup}
        </div>
      </LocaleProvider>
    );
  }
}

const ConnectedAlert = connect(({ alert, loading, global }) => ({
  alert,
  loading: loading.effects["alert/fetch"],
  currentNamespaceId: global.currentNamespaceId,
  language: global.language,
}))(AlertComponent);

export default ConnectedAlert;
