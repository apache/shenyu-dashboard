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
import { batch, connect } from "react-redux";
import Input from "../../../components/ui/Input";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import { message } from "../../../components/ui/feedback";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { refreshAuthMenus } from "../../../utils/AuthRoute";
import { defaultNamespaceId } from "../../../components/_utils/utils";
import { getLocale } from "../../../utils/localePreference";

@connect(({ namespace, loading, global }) => ({
  namespace,
  namespaces: global.namespaces,
  language: global.language,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["namespace/fetch"],
}))
export default class Namespace extends Component {
  constructor(props) {
    super(props);
    this.unmounted = false;
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      name: "",
      // eslint-disable-next-line react/no-unused-state
      enabled: null,
      popup: "",
      localeName: getLocale(),
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

  componentWillUnmount() {
    this.unmounted = true;
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  currentQueryPayload = (override) => {
    const { name, namespaceId, currentPage, pageSize } = this.state;
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

  onPaginationChange = (page, pageSize) => {
    this.setState(
      (state) => ({
        currentPage: pageSize === state.pageSize ? page : 1,
        pageSize,
      }),
      this.query,
    );
  };

  closeModal = (resetPage = false) => {
    if (resetPage) {
      this.setState({ popup: "", currentPage: 1 });
      return;
    }
    this.setState({ popup: "" });
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
      namespaces = [],
      namespace: { namespaceList },
    } = this.props;
    const candidates = record ? [record.id] : this.state.selectedRowKeys;
    const knownNamespaces = [
      ...namespaces,
      ...namespaceList,
      ...(record ? [record] : []),
    ];
    const protectedIds = new Set(
      knownNamespaces
        .filter((item) => item.namespaceId === defaultNamespaceId)
        .map((item) => item.id),
    );
    const deleteKeys = candidates.filter((id) => !protectedIds.has(id));
    const deletedIds = new Set(deleteKeys);
    const deletedNamespaces = new Set(
      knownNamespaces
        .filter((item) => deletedIds.has(item.id) && item.namespaceId)
        .map((item) => item.namespaceId),
    );
    if (deleteKeys.length) {
      dispatch({
        type: "namespace/delete",
        payload: { list: deleteKeys },
        fetchValue: this.currentQueryPayload(),
        callback: ({ currentNamespaceId }) => {
          const permissionsCleared = deletedNamespaces.has(currentNamespaceId);
          batch(() => {
            if (!this.unmounted) {
              this.setState(({ selectedRowKeys }) => ({
                selectedRowKeys: selectedRowKeys.filter(
                  (id) => !deletedIds.has(id),
                ),
              }));
            }
            if (permissionsCleared) {
              dispatch({
                type: "global/saveCurrentNamespaceId",
                payload: defaultNamespaceId,
              });
            }
            refreshAuthMenus({ dispatch, permissionsCleared });
            dispatch({ type: "global/fetchNamespaces" });
          });
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
              fetchValue: this.currentQueryPayload({ currentPage: 1 }),
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
            return (
              <div style={{ color: "var(--semi-color-text-0)" }}>
                {text || "----"}
              </div>
            );
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
            return (
              <div style={{ color: "var(--semi-color-text-0)" }}>
                {text || "----"}
              </div>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.NAMESPACE.DESC"),
          dataIndex: "description",
          ellipsis: true,
          key: "desc",
          render: (text) => {
            return (
              <div style={{ color: "var(--semi-color-text-2)" }}>{text}</div>
            );
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
            return record.namespaceId === defaultNamespaceId ? (
              ""
            ) : (
              <div className={styles.rowActions}>
                <AuthButton perms="system:namespace:edit">
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
                <AuthButton perms="system:namespace:delete">
                  <Popconfirm
                    title={getIntlContent("SHENYU.COMMON.DELETE")}
                    position="bottom"
                    motion={false}
                    okType="danger"
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
                    <Button
                      type="danger"
                      theme="borderless"
                      htmlType="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                    </Button>
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
    const { namespace, loading, language } = this.props;
    const { namespaceList, total } = namespace;
    const {
      currentPage,
      pageSize,
      selectedRowKeys,
      name,
      namespaceId,
      popup,
      columns,
    } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      getCheckboxProps: (record) => ({
        disabled: record.namespaceId === defaultNamespaceId,
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
              value={name}
              onChange={this.searchOnchange}
              placeholder={getIntlContent("SHENYU.NAMESPACE.INPUTNAME")}
              className={styles.nameFilter}
            />
            <Input
              allowClear
              value={namespaceId}
              onChange={this.searchNamespaceIdOnchange}
              placeholder={getIntlContent("SHENYU.NAMESPACE.INPUTNAMESPACEID")}
              className={styles.idFilter}
            />
            <AuthButton perms="system:namespace:list">
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
            <AuthButton perms="system:namespace:delete">
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
            <AuthButton perms="system:namespace:add">
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
            resizable
            rowKey="id"
            scroll={{ x: 1000 }}
            style={{ marginTop: 30 }}
            bordered
            loading={loading}
            columns={columns}
            dataSource={namespaceList}
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
