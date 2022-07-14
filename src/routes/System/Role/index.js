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
import { Table, Input, Button, message, Popconfirm } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";
import { getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';

@connect(({ role, resource, loading }) => ({
  role,
  resource,
  loading: loading.effects["role/fetch"]
}))
export default class Role extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      roleName: "",
      popup: ""
    };
  }

  componentWillMount() {
    this.getAllRoles();
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllRoles = () => {
    const { dispatch } = this.props;
    const { roleName,currentPage,pageSize } = this.state;
    dispatch({
      type: "role/fetch",
      payload: {
        roleName,
        currentPage,
        pageSize
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page },this.getAllRoles);
  };

  onShowSizeChange = (currentPage,pageSize) => {
    this.setState({ currentPage: 1, pageSize}, this.getAllRoles);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage,pageSize } = this.state;
    const name = this.state.roleName;
    dispatch({
      type: "role/fetchItem",
      payload: {
        id: record.id
      },
      callback: role => {
        this.setState({
          popup: (
            <AddModal
              {...role}
              handleOk={values => {
                const { roleName, description, id, currentPermissionIds } = values;
                dispatch({
                  type: "role/update",
                  payload: {
                    roleName,
                    description,
                    currentPermissionIds,
                    id
                  },
                  fetchValue: {
                    roleName: name,
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

  searchOnchange = e => {
    const roleName = e.target.value;
    this.setState({ roleName });
  };

  searchClick = () => {
    this.getAllRoles();
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { roleName, currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "role/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          roleName,
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
    const { currentPage,pageSize } = this.state;
    const name = this.state.roleName;
    this.setState({
      popup: (
        <AddModal
          sysRole={{}}
          allPermissionInfo={{}}
          rolePermissionList={{}}
          handleOk={values => {
            const { dispatch } = this.props;
            const { roleName, description } = values;
            dispatch({
              type: "role/add",
              payload: {
                roleName,
                description
              },
              fetchValue: {
                roleName: name,
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

  render() {
    const { role, loading } = this.props;
    const { roleList, total } = role;
    const { currentPage, pageSize, selectedRowKeys, roleName, popup } = this.state;
    const roleColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ROLENAME"),
        dataIndex: "roleName",
        key: "roleName",
        ellipsis:true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ROLE.DESCRIPTION"),
        dataIndex: "description",
        key: "description",
        ellipsis:true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.CREATETIME"),
        dataIndex: "dateCreated",
        key: "dateCreated",
        ellipsis:true,
        sorter: (a,b) => a.dateCreated > b.dateCreated ? 1 : -1,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
        dataIndex: "dateUpdated",
        key: "dateUpdated",
        ellipsis:true,
        sorter: (a,b) => a.dateUpdated > b.dateUpdated ? 1 : -1,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        ellipsis:true,
        render: (text, record) => {
          return (
            <AuthButton perms="system:role:edit">
              <div
                className="edit"
                onClick={() => {
                  this.editClick(record);
                }}
              >
                {getIntlContent("SHENYU.SYSTEM.EDITOR")}
              </div>
            </AuthButton>
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
            value={roleName}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.NAME")}
            style={{ width: 240 }}
          />
          <AuthButton perms="system:role:list">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:role:delete">
            <Popconfirm
              title={getIntlContent("SHENYU.COMMON.DELETE")}
              placement='bottom'
              onConfirm={() => {
                this.deleteClick()
              }}
              okText={getIntlContent("SHENYU.COMMON.SURE")}
              cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
            >
              <Button
                style={{ marginLeft: 20 }}
                type="danger"
              >
                {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
              </Button>
            </Popconfirm>
          </AuthButton>
          <AuthButton perms="system:role:add">
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
          columns={roleColumns}
          dataSource={roleList}
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
