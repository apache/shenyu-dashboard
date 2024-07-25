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
import { Button, Input, message, Popconfirm, Table } from "antd";
import { connect } from "dva";
import { resizableComponents } from "../../../utils/resizable";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { refreshAuthMenus } from "../../../utils/AuthRoute";

@connect(({ namespace, resource, loading, global }) => ({
  namespace,
  authMenu: resource.authMenu,
  language: global.language,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["namespace/fetch"],
}))
export default class Namespace extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      name: "",
      // eslint-disable-next-line react/no-unused-state
      enabled: null,
      popup: "",
      localeName: window.sessionStorage.getItem("locale")
        ? window.sessionStorage.getItem("locale")
        : "en-US",
      columns: [],
    };
  }

  componentDidMount() {
    this.query();
    this.initNamespaceColumns();
  }

  componentDidUpdate() {
    const { language } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initNamespaceColumns();
      this.changeLocale(language);
    }
  }

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

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys }, this.query);
  };

  currentQueryPayload = (override) => {
    const { name, currentPage, pageSize } = this.state;
    const { namespaceId } = this.props;
    return {
      name,
      namespaceId,
      currentPage,
      pageSize,
      ...override,
    };
  };

  query = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "namespace/fetch",
      payload: this.currentQueryPayload(),
    });
  };

  pageOnchange = (page) => {
    this.setState({ currentPage: page }, this.query);
  };

  onShowSizeChange = (currentPage, pageSize) => {
    this.setState({ currentPage: 1, pageSize }, this.query);
  };

  closeModal = (refresh = false) => {
    if (refresh) {
      this.setState({ popup: "", currentPage: 1 }, this.query);
      return;
    }
    this.setState({ popup: "", currentPage: 1 });
  };

  editClick = (record) => {
    const { dispatch } = this.props;

    dispatch({
      type: "namespace/fetchItem",
      payload: {
        id: record.namespaceId,
      },
      callback: (namespace) => {
        this.setState({
          popup: (
            <AddModal
              {...namespace}
              handleOk={(values) => {
                const { name, description } = values;
                dispatch({
                  type: "namespace/update",
                  payload: {
                    id: record.id,
                    name,
                    description,
                    namespaceId: record.namespaceId,
                  },
                  fetchValue: this.currentQueryPayload(),
                  callback: () => {
                    dispatch({ type: "global/fetchNamespaces" });
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
    this.setState({ name: e.target.value }, this.query);
  };

  searchNamespaceIdOnchange = (e) => {
    this.setState({ namespaceId: e.target.value }, this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  deleteClick = (record) => {
    const {
      dispatch,
      currentNamespaceId,
      namespace: { namespaceList },
    } = this.props;
    const { selectedRowKeys } = this.state;
    if (record) {
      selectedRowKeys.push(record.id);
    }
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "namespace/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: this.currentQueryPayload({
          pageSize: 12,
        }),
        callback: () => {
          this.setState({ selectedRowKeys: [] });
          refreshAuthMenus({ dispatch });
          let deletedCurrentNamespace =
            namespaceList.find((namespace) =>
              selectedRowKeys.some(
                (namespaceId) => namespaceId === namespace.id,
              ),
            )?.namespaceId === currentNamespaceId;
          if (deletedCurrentNamespace) {
            dispatch({
              type: "global/saveCurrentNamespaceId",
              payload: "649330b6-c2d7-4edc-be8e-8a54df9eb385",
            });
          }
          dispatch({ type: "global/fetchNamespaces" });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    this.setState({
      popup: (
        <AddModal
          disabled={false}
          handleOk={(values) => {
            const { dispatch } = this.props;
            const { name, description } = values;
            dispatch({
              type: "namespace/add",
              payload: {
                name,
                description,
              },
              fetchValue: this.currentQueryPayload(),
              callback: () => {
                this.closeModal(true);
                refreshAuthMenus({ dispatch });
                dispatch({ type: "global/fetchNamespaces" });
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

  changeLocale(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  initNamespaceColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.NAMESPACE.NAMESPACEID"),
          dataIndex: "namespaceId",
          key: "namespaceId",
          ellipsis: true,
          width: 300,
          render: (text) => {
            return <div style={{ color: "#1f640a" }}>{text || "----"}</div>;
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.NAMESPACE.NAME"),
          dataIndex: "name",
          ellipsis: true,
          key: "name",
          width: 240,
          render: (text) => {
            return <div style={{ color: "#1f640a" }}>{text || "----"}</div>;
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.NAMESPACE.DESC"),
          dataIndex: "description",
          ellipsis: true,
          key: "desc",
          render: (text) => {
            return <div style={{ color: "#014955" }}>{text}</div>;
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          dataIndex: "time",
          key: "time",
          ellipsis: true,
          width: 160,
          fixed: "right",
          render: (text, record) => {
            return record.namespaceId ===
              "649330b6-c2d7-4edc-be8e-8a54df9eb385" ? (
              ""
            ) : (
              <div className="optionParts">
                <AuthButton perms="system:namespace:edit">
                  <div
                    className="edit"
                    onClick={() => {
                      this.editClick(record);
                    }}
                  >
                    {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                  </div>
                </AuthButton>
                <AuthButton perms="system:namespace:delete">
                  <Popconfirm
                    title={getIntlContent("SHENYU.COMMON.DELETE")}
                    placement="bottom"
                    onCancel={(e) => {
                      e.stopPropagation();
                    }}
                    onConfirm={(e) => {
                      e.stopPropagation();
                      this.deleteClick(record);
                    }}
                    okText={getIntlContent("SHENYU.COMMON.SURE")}
                    cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                  >
                    <span
                      className="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                    </span>
                  </Popconfirm>
                </AuthButton>
              </div>
            );
          },
        },
      ],
    });
  }

  render() {
    const { namespace, loading, authMenu } = this.props;
    const { namespaceList, total } = namespace;
    const { currentPage, pageSize, selectedRowKeys, name, namespaceId, popup } =
      this.state;
    const columns = this.state.columns.map((col, index) => ({
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
    const flatList = (map, list) => {
      list.forEach((element) => {
        if (!element.children) {
          map[element.id] = element;
        } else {
          flatList(map, element.children);
        }
      });
      return map;
    };
    const flatAuthMenu = flatList({}, authMenu);

    namespaceList.forEach((p) => {
      p.url = (flatAuthMenu[p.id] ?? {}).path;
    });

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            allowClear
            value={name}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SHENYU.NAMESPACE.INPUTNAME")}
            style={{ width: 240 }}
          />
          <Input
            allowClear
            value={namespaceId}
            onChange={this.searchNamespaceIdOnchange}
            placeholder={getIntlContent("SHENYU.NAMESPACE.INPUTNAMESPACEID")}
            style={{ width: 300, marginLeft: 20 }}
          />
          <AuthButton perms="system:plugin:list">
            <Button
              type="primary"
              style={{ marginLeft: 20 }}
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:plugin:delete">
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
          <AuthButton perms="system:plugin:add">
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
          components={this.components}
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={columns}
          dataSource={namespaceList}
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
