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
import Table from "@douyinfe/semi-ui/lib/es/table";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import Input from "../../../components/ui/Input";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import { message } from "../../../components/ui/feedback";
import AddModal from "./AddModal";
import DataPermModal from "./DataPermModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

@connect(({ manage, role, loading, global }) => ({
  manage,
  role,
  language: global.language,
  loading: loading.effects["manage/fetch"],
}))
export default class Manage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      userName: "",
      popup: "",
      localeName: "",
    };
  }

  componentDidMount() {
    this.getAllUsers();
    this.getAllRoles();
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  getAllUsers = () => {
    const { dispatch } = this.props;
    const { userName, currentPage, pageSize } = this.state;
    dispatch({
      type: "manage/fetch",
      payload: {
        userName,
        currentPage,
        pageSize,
      },
    });
  };

  getAllRoles = () => {
    const {
      dispatch,
      role: { allRoles },
    } = this.props;
    if (!allRoles || allRoles.length === 0) {
      dispatch({
        type: "role/fetchAll",
      });
    }
  };

  onPaginationChange = (page, pageSize) => {
    this.setState(
      (state) => ({
        currentPage: pageSize === state.pageSize ? page : 1,
        pageSize,
      }),
      this.getAllUsers,
    );
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = (record) => {
    const {
      dispatch,
      role: { allRoles },
    } = this.props;
    const { currentPage, pageSize } = this.state;
    const name = this.state.userName;
    dispatch({
      type: "manage/fetchItem",
      payload: {
        id: record.id,
      },
      callback: (user) => {
        this.setState({
          popup: (
            <AddModal
              {...user}
              allRoles={allRoles}
              handleOk={(values) => {
                dispatch({
                  type: "manage/update",
                  payload: values,
                  fetchValue: {
                    userName: name,
                    currentPage,
                    pageSize,
                  },
                  callback: () => {
                    this.closeModal();
                  },
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
            />
          ),
        });
      },
    });
  };

  permissionConfig = (record) => {
    this.setState({
      popup: (
        <DataPermModal
          userId={record.id}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      ),
    });
  };

  searchOnchange = (e) => {
    const userName = e.target.value;
    this.setState({ userName });
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.getAllUsers);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { userName, currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "manage/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: {
          userName,
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
    const {
      role: { allRoles },
    } = this.props;
    const { currentPage, pageSize } = this.state;
    const name = this.state.userName;
    this.setState({
      popup: (
        <AddModal
          allRoles={allRoles}
          handleOk={(values) => {
            const { dispatch } = this.props;
            const { userName, password, roles, enabled } = values;
            dispatch({
              type: "manage/add",
              payload: {
                userName,
                password,
                roles,
                enabled,
              },
              fetchValue: {
                userName: name,
                currentPage,
                pageSize,
              },
              callback: () => {
                this.setState({ selectedRowKeys: [] });
                this.closeModal();
              },
            });
          }}
          handleCancel={() => {
            this.closeModal();
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
    const { manage, loading, dispatch, language } = this.props;
    const { userList, total } = manage;
    const { currentPage, pageSize, selectedRowKeys, userName, popup } =
      this.state;
    const userColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.USERNAME"),
        dataIndex: "userName",
        key: "userName",
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.STATUS"),
        dataIndex: "enabled",
        key: "enabled",
        ellipsis: true,
        render: (text, row) => (
          <AuthButton
            perms="system:manager:edit"
            noAuth={
              text ? (
                <div className="open">
                  {getIntlContent("SHENYU.COMMON.OPEN")}
                </div>
              ) : (
                <div className="close">
                  {getIntlContent("SHENYU.COMMON.CLOSE")}
                </div>
              )
            }
          >
            <span className={styles.status}>
              <Switch
                aria-label={`${row.userName}: ${getIntlContent("SHENYU.SYSTEM.STATUS")}`}
                disabled={row.userName === "admin"}
                checked={text}
                onChange={(checked) => {
                  dispatch({
                    type: "manage/updateUserStatus",
                    payload: {
                      id: row.id,
                      enabled: checked,
                      userName: row.userName,
                    },
                    callback: () => {
                      this.getAllUsers();
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
          </AuthButton>
        ),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.CREATETIME"),
        dataIndex: "dateCreated",
        key: "dateCreated",
        ellipsis: true,
        sorter: (a, b) => (a.dateCreated > b.dateCreated ? 1 : -1),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
        dataIndex: "dateUpdated",
        key: "dateUpdated",
        ellipsis: true,
        sorter: (a, b) => (a.dateUpdated > b.dateUpdated ? 1 : -1),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        width: 280,
        ellipsis: true,
        render: (text, record) => {
          return (
            record.userName !== "admin" && (
              <div className={styles.actions}>
                <AuthButton perms="system:manager:edit">
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
                <AuthButton perms="system:manager:configureDataPermission">
                  {({ icon }) => (
                    <Button
                      theme="borderless"
                      htmlType="button"
                      icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      onClick={() => this.permissionConfig(record)}
                    >
                      {getIntlContent("SHENYU.BUTTON.DATA.PERMISSION.CONFIG")}
                    </Button>
                  )}
                </AuthButton>
              </div>
            )
          );
        },
      },
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      getCheckboxProps: (record) => ({
        disabled: record.userName === "admin",
      }),
    };

    return (
      <LocaleProvider locale={language === "zh-CN" ? zhCN : enUS}>
        <div className="plug-content-wrap">
          <form
            className={styles.toolbar}
            onSubmit={(event) => {
              event.preventDefault();
              this.searchClick();
            }}
          >
            <Input
              allowClear
              value={userName}
              onChange={this.searchOnchange}
              placeholder={getIntlContent("SHENYU.SYSTEM.USER.NAME")}
              className={styles.filter}
            />
            <AuthButton perms="system:manager:list">
              {({ icon }) => (
                <Button
                  type="primary"
                  theme="solid"
                  htmlType="submit"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                >
                  {getIntlContent("SHENYU.SYSTEM.SEARCH")}
                </Button>
              )}
            </AuthButton>
            <AuthButton perms="system:manager:delete">
              {({ icon }) => (
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  position="bottom"
                  motion={false}
                  okType="danger"
                  onConfirm={() => this.deleteClick()}
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
            <AuthButton perms="system:manager:add">
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
          </form>

          <Table
            size="small"
            rowKey="id"
            scroll={{ x: 1100 }}
            style={{ marginTop: 30 }}
            bordered
            loading={loading}
            columns={userColumns}
            dataSource={userList}
            rowSelection={rowSelection}
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
