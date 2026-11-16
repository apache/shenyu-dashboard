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
import { connect } from "react-redux";
import Input from "../../../components/ui/Input";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import { message } from "../../../components/ui/feedback";
import AddModal from "./AddModal";
import { getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

@connect(({ role, resource, loading, global }) => ({
  role,
  resource,
  language: global.language,
  loading: loading.effects["role/fetch"],
}))
export default class Role extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      roleName: "",
      popup: "",
    };
  }

  componentDidMount() {
    this.getAllRoles();
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  getAllRoles = () => {
    const { dispatch } = this.props;
    const { roleName, currentPage, pageSize } = this.state;
    dispatch({
      type: "role/fetch",
      payload: {
        roleName,
        currentPage,
        pageSize,
      },
    });
  };

  onPaginationChange = (page, pageSize) => {
    this.setState(
      (state) => ({
        currentPage: pageSize === state.pageSize ? page : 1,
        pageSize,
      }),
      this.getAllRoles,
    );
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = (record) => {
    const { dispatch } = this.props;
    const { currentPage, pageSize } = this.state;
    const name = this.state.roleName;
    dispatch({
      type: "role/fetchItem",
      payload: {
        id: record.id,
      },
      callback: (role) => {
        this.setState({
          popup: (
            <AddModal
              {...role}
              handleOk={(values) => {
                const { roleName, description, id, currentPermissionIds } =
                  values;
                dispatch({
                  type: "role/update",
                  payload: {
                    roleName,
                    description,
                    currentPermissionIds,
                    id,
                  },
                  fetchValue: {
                    roleName: name,
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

  searchOnchange = (e) => {
    const roleName = e.target.value;
    this.setState({ roleName });
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.getAllRoles);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { roleName, currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "role/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: {
          roleName,
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
    const name = this.state.roleName;
    this.setState({
      popup: (
        <AddModal
          sysRole={{}}
          allPermissionInfo={{}}
          rolePermissionList={{}}
          handleOk={(values) => {
            const { dispatch } = this.props;
            const { roleName, description } = values;
            dispatch({
              type: "role/add",
              payload: {
                roleName,
                description,
              },
              fetchValue: {
                roleName: name,
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

  render() {
    const { role, loading, language } = this.props;
    const { roleList, total } = role;
    const { currentPage, pageSize, selectedRowKeys, roleName, popup } =
      this.state;
    const roleColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ROLENAME"),
        dataIndex: "roleName",
        key: "roleName",
        ellipsis: true,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ROLE.DESCRIPTION"),
        dataIndex: "description",
        key: "description",
        ellipsis: true,
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
        ellipsis: true,
        render: (text, record) => {
          return (
            <AuthButton perms="system:role:edit">
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
          <form
            className={styles.toolbar}
            onSubmit={(event) => {
              event.preventDefault();
              this.searchClick();
            }}
          >
            <Input
              allowClear
              value={roleName}
              onChange={this.searchOnchange}
              placeholder={getIntlContent("SHENYU.SYSTEM.ROLE.INPUT.NAME")}
              className={styles.filter}
            />
            <AuthButton perms="system:role:list">
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
            <AuthButton perms="system:role:delete">
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
            <AuthButton perms="system:role:add">
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
            scroll={{ x: 1000 }}
            style={{ marginTop: 30 }}
            bordered
            loading={loading}
            columns={roleColumns}
            dataSource={roleList}
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
