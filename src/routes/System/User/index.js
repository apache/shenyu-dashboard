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
import { Table, Input, Button, message, Popconfirm, Switch } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";
import DataPermModal from "./DataPermModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

@connect(({ manage, role, loading }) => ({
  manage,
  role,
  loading: loading.effects["manage/fetch"]
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
      localeName: ""
    };
  }

  componentWillMount() {
    this.getAllUsers();
    this.getAllRoles();
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllUsers = () => {
    const { dispatch } = this.props;
    const { userName,currentPage,pageSize } = this.state;
    dispatch({
      type: "manage/fetch",
      payload: {
        userName,
        currentPage,
        pageSize
      }
    });
  };

  getAllRoles = () => {
    const {
      dispatch,
      role: { allRoles }
    } = this.props;
    if (!allRoles || allRoles.length === 0) {
      dispatch({
        type: "role/fetchAll"
      });
    }
  };

  pageOnchange = page => {
    this.setState({ currentPage: page },this.getAllUsers);
  };

  onShowSizeChange = (currentPage,pageSize) => {
    this.setState({ currentPage: 1, pageSize}, this.getAllUsers);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const {
      dispatch,
      role: { allRoles }
    } = this.props;
    const { currentPage,pageSize } = this.state;
    const name = this.state.userName;
    dispatch({
      type: "manage/fetchItem",
      payload: {
        id: record.id
      },
      callback: user => {
        this.setState({
          popup: (
            <AddModal
              {...user}
              allRoles={allRoles}
              handleOk={values => {
                const { userName, password, roles, enabled, id } = values;
                dispatch({
                  type: "manage/update",
                  payload: {
                    userName,
                    password,
                    roles,
                    enabled,
                    id
                  },
                  fetchValue: {
                    userName: name,
                    currentPage,
                    pageSize
                  },
                  callback: () => {
                    this.closeModal();
                  }
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
            />
          )
        });
      }
    });
  };

  permissionConfig = record => {
    this.setState({
      popup: (
        <DataPermModal
          userId={record.id}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      )
    });
  };

  searchOnchange = e => {
    const userName = e.target.value;
    this.setState({ userName });
  };

  searchClick = () => {
    this.getAllUsers();
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { userName, currentPage,pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "manage/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          userName,
          currentPage,
          pageSize
        },
        callback: () => {
          this.setState({ selectedRowKeys: [] });
        }
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    const {
      role: { allRoles }
    } = this.props;
    const { currentPage,pageSize } = this.state;
    const name = this.state.userName;
    this.setState({
      popup: (
        <AddModal
          allRoles={allRoles}
          handleOk={values => {
            const { dispatch } = this.props;
            const { userName, password, roles, enabled } = values;
            dispatch({
              type: "manage/add",
              payload: {
                userName,
                password,
                roles,
                enabled
              },
              fetchValue: {
                userName: name,
                currentPage,
                pageSize
              },
              callback: () => {
                this.setState({ selectedRowKeys: [] });
                this.closeModal();
              }
            });
          }}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      )
    });
  };

  changeLocale(locale) {
    this.setState({
      localeName: locale
    });
    getCurrentLocale(this.state.localeName);
  }

  render() {
    const { manage, loading, dispatch } = this.props;
    const { userList, total } = manage;
    const { currentPage, pageSize, selectedRowKeys, userName, popup } = this.state;
    const userColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.USERNAME"),
        dataIndex: "userName",
        key: "userName",
        ellipsis: true
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.STATUS"),
        dataIndex: "enabled",
        key: "enabled",
        ellipsis: true,
        render: (text, row) => (
          <Switch
            checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
            unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
            checked={text}
            onChange={checked => {
              dispatch({
                type: "manage/updateUserStatus",
                payload: {
                  id: row.id,
                  enabled: checked,
                  userName: row.userName
                },
                callback: () => {
                  this.getAllUsers();
                }
              });
            }}
          />
        )
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.CREATETIME"),
        dataIndex: "dateCreated",
        key: "dateCreated",
        ellipsis: true,
        sorter: (a, b) => (a.dateCreated > b.dateCreated ? 1 : -1)
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
        dataIndex: "dateUpdated",
        key: "dateUpdated",
        ellipsis: true,
        sorter: (a, b) => (a.dateUpdated > b.dateUpdated ? 1 : -1)
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
              <AuthButton perms="system:manager:edit">
                <span
                  className="edit"
                  onClick={() => {
                    this.editClick(record);
                  }}
                >
                  {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                </span>
              </AuthButton>
              {record.userName !== "admin" && (
                <AuthButton perms="system:manager:configureDataPermission">
                  &nbsp;&nbsp;&nbsp;
                  <span
                    className="edit"
                    onClick={() => {
                      this.permissionConfig(record);
                    }}
                  >
                    {getIntlContent("SHENYU.BUTTON.DATA.PERMISSION.CONFIG")}
                  </span>
                </AuthButton>
              )}
            </div>
          );
        }
      }
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            value={userName}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SHENYU.SYSTEM.USER.NAME")}
            style={{ width: 240 }}
          />
          <AuthButton perms="system:manager:list">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:manager:delete">
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
          <AuthButton perms="system:manager:add">
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
          columns={userColumns}
          dataSource={userList}
          rowSelection={rowSelection}
          pagination={{
            total,
            showTotal: (showTotal) => `${showTotal}`,
            showSizeChanger: true,
            pageSizeOptions: ["12", "20", "50", "100"],
            current: currentPage,
            pageSize,
            onShowSizeChange: this.onShowSizeChange,
            onChange: this.pageOnchange
          }}
        />
        {popup}
      </div>
    );
  }
}
