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
import { Table, Button, Popconfirm, message, Input, Tag, Popover } from "antd";
import { connect } from "dva";
import { resizableComponents } from "../../../utils/resizable";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

@connect(({ registry, loading, global }) => ({
  registry,
  language: global.language,
  loading: loading.effects["registry/fetch"],
}))
export default class Registry extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      registryId: "",
      address: "",
      popup: "",
      localeName: window.sessionStorage.getItem("locale")
        ? window.sessionStorage.getItem("locale")
        : "en-US",
      columns: [],
    };
  }

  componentDidMount() {
    this.initColumns();
    this.query();
  }

  componentDidUpdate() {
    const { language } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initColumns();
      this.changeLocale(language);
    }
  }

  /**
   * condition query page list
   */
  query = () => {
    const { dispatch } = this.props;
    const { registryId, address, currentPage, pageSize } = this.state;
    dispatch({
      type: "registry/fetch",
      payload: {
        registryId,
        address,
        currentPage,
        pageSize,
      },
    });
  };

  pageOnchange = (page) => {
    this.setState({ currentPage: page }, this.query);
  };

  onShowSizeChange = (currentPage, pageSize) => {
    this.setState({ currentPage: 1, pageSize }, this.query);
  };

  /**
   * close model
   * @param reset after is reset search condition
   */
  closeModal = (reset = false) => {
    this.setState(
      reset
        ? { popup: "", currentPage: 1, registryId: "", address: "" }
        : { popup: "" },
      this.query,
    );
  };

  registryIdOnchange = (e) => {
    this.setState({ registryId: e.target.value, currentPage: 1 });
  };

  addressOnchange = (e) => {
    this.setState({ address: e.target.value, currentPage: 1 });
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  editClick = (record) => {
    const { dispatch } = this.props;
    const { currentPage, pageSize } = this.state;
    dispatch({
      type: "registry/getDetail",
      payload: {
        id: record.id,
      },
      callback: (registry) => {
        this.setState({
          popup: (
            <AddModal
              detail={registry}
              handleOk={(values) => {
                dispatch({
                  type: "registry/update",
                  payload: values,
                  fetchValue: {
                    currentPage,
                    pageSize,
                  },
                  callback: () => {
                    this.closeModal(true);
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

  addClick = () => {
    const { currentPage, pageSize } = this.state;
    this.setState({
      popup: (
        <AddModal
          handleOk={(values) => {
            const { dispatch } = this.props;
            dispatch({
              type: "registry/add",
              payload: values,
              fetchValue: {
                currentPage,
                pageSize,
              },
              callback: () => {
                this.closeModal(true);
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

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "registry/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: {
          currentPage,
          pageSize,
        },
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: 1 }, this.query);
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  handleResize =
    (index) =>
    (e, { size }) => {
      this.setState(({ columns }) => {
        const nextColumns = [...columns];
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        return { columns: nextColumns };
      });
    };

  changeLocale(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  initColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SHENYU.REGISTRY.REGISTRY_ID"),
          dataIndex: "registryId",
          key: "registryId",
          ellipsis: true,
          width: 150,
          sorter: (a, b) =>
            (a.registryId || "").localeCompare(b.registryId || ""),
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.REGISTRY.PROTOCOL"),
          dataIndex: "protocol",
          key: "protocol",
          ellipsis: true,
          width: 120,
          render: (text) => {
            return <Tag color="red">{text ? text.toUpperCase() : ""}</Tag>;
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.REGISTRY.ADDRESS"),
          dataIndex: "address",
          key: "address",
          ellipsis: true,
          width: 120,
          render: (text) => (
            <Popover
              content={<div style={{ wordBreak: "break-all" }}>{text}</div>}
            >
              <div>{text || "--"}</div>
            </Popover>
          ),
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.REGISTRY.USERNAME"),
          dataIndex: "username",
          key: "username",
          ellipsis: true,
          width: 100,
          render: (username) => <span>{username || "--"}</span>,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.REGISTRY.NAMESPACE"),
          dataIndex: "namespace",
          key: "namespace",
          ellipsis: true,
          width: 100,
          render: (namespace) => <span>{namespace || "--"}</span>,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.REGISTRY.GROUP"),
          dataIndex: "group",
          key: "group",
          ellipsis: true,
          width: 100,
          render: (group) => <span>{group || "--"}</span>,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          dataIndex: "operate",
          key: "operate",
          ellipsis: true,
          width: 80,
          render: (text, record) => {
            return (
              <div className="optionParts">
                <AuthButton perms="system:registry:edit">
                  <div
                    className="edit"
                    onClick={() => {
                      this.editClick(record);
                    }}
                  >
                    {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                  </div>
                </AuthButton>
              </div>
            );
          },
        },
      ],
    });
  }

  render() {
    const { registry, loading } = this.props;
    const { registryList, total } = registry;
    const {
      currentPage,
      pageSize,
      selectedRowKeys,
      registryId,
      address,
      popup,
      columns = [],
    } = this.state;

    const tableColumns = columns.map((col, index) => ({
      ...col,
      onHeaderCell: (column) => ({
        width: column.width,
        onResize: this.handleResize(index),
      }),
    }));

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            allowClear
            value={registryId}
            onChange={this.registryIdOnchange}
            placeholder={getIntlContent("SHENYU.REGISTRY.REGISTRY_ID")}
            style={{ width: 240 }}
          />
          <Input
            allowClear
            value={address}
            onChange={this.addressOnchange}
            placeholder={getIntlContent("SHENYU.REGISTRY.ADDRESS")}
            style={{ width: 240, marginLeft: 20 }}

            // onSearch={this.searchClick}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <AuthButton perms="system:registry:list">
              <Button
                type="primary"
                onClick={this.searchClick}
                style={{ marginLeft: 20 }}
              >
                {getIntlContent("SHENYU.SYSTEM.SEARCH")}
              </Button>
            </AuthButton>
            <AuthButton perms="system:registry:delete">
              <Popconfirm
                title={getIntlContent("SHENYU.COMMON.DELETE")}
                placement="bottom"
                onConfirm={() => {
                  this.deleteClick();
                }}
                okText={getIntlContent("SHENYU.COMMON.SURE")}
                cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
              >
                <Button type="danger" style={{ marginLeft: 20 }}>
                  {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                </Button>
              </Popconfirm>
            </AuthButton>
            <AuthButton perms="system:registry:add">
              <Button
                type="primary"
                onClick={this.addClick}
                style={{ marginLeft: 20 }}
              >
                {getIntlContent("SHENYU.SYSTEM.ADDDATA")}
              </Button>
            </AuthButton>
          </div>
        </div>

        <Table
          size="small"
          components={this.components}
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={tableColumns}
          dataSource={registryList}
          rowSelection={rowSelection}
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
