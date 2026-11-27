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
import dayjs from "dayjs";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "../../../components/ui/ManagementList.module.less";
import { message } from "../../../components/ui/feedback";
import AddModal from "./AddModal";
import RelateMetadata from "./RelateMetadataLoader";
import AddTable from "./AddTable";
import SearchContent from "./SearchContent";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { getLocale } from "../../../utils/localePreference";

@connect(({ auth, loading, global }) => ({
  auth,
  language: global.language,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["auth/fetch"],
}))
export default class Auth extends Component {
  resourceRequest = 0;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      appKey: "",
      phone: "",
      popup: "",
      localeName: getLocale(),
      columns: [],
    };
  }

  componentDidMount() {
    this.query();
    this.initPluginColumns();
  }

  componentDidUpdate(prevProps) {
    const { language } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initPluginColumns();
      this.changeLocale(language);
    }
    if (prevProps.currentNamespaceId !== this.props.currentNamespaceId) {
      this.closeModal();
      this.setState({ currentPage: 1, selectedRowKeys: [] }, this.query);
    }
  }

  componentWillUnmount() {
    this.resourceRequest += 1;
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  currentQueryPayload = (currentPage = this.state.currentPage) => {
    const { currentNamespaceId } = this.props;
    const { appKey, phone, pageSize } = this.state;
    return {
      appKey,
      phone,
      currentPage,
      pageSize,
      namespaceId: currentNamespaceId,
    };
  };

  query = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "auth/fetch",
      payload: this.currentQueryPayload(),
    });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  getAllAuths = (page) => {
    const { dispatch } = this.props;
    dispatch({
      type: "auth/fetch",
      payload: this.currentQueryPayload(page),
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

  closeModal = () => {
    this.resourceRequest += 1;
    this.setState({ popup: "" });
  };

  editClick = (record) => {
    this.resourceRequest += 1;
    const requestId = this.resourceRequest;
    const { dispatch, currentNamespaceId } = this.props;
    const { currentPage } = this.state;
    dispatch({
      type: "auth/fetchItem",
      payload: {
        id: record.id,
      },
      callback: (auth) => {
        if (
          requestId !== this.resourceRequest ||
          currentNamespaceId !== this.props.currentNamespaceId
        )
          return;
        this.setState({
          popup: (
            <AddModal
              {...auth}
              handleOk={(values) => {
                if (
                  requestId !== this.resourceRequest ||
                  currentNamespaceId !== this.props.currentNamespaceId
                )
                  return;
                dispatch({
                  type: "auth/update",
                  payload: {
                    extInfo: null,
                    ...values,
                    namespaceId: currentNamespaceId,
                  },
                  fetchValue: this.currentQueryPayload(currentPage),
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

  editClickMeta = (record) => {
    this.resourceRequest += 1;
    const requestId = this.resourceRequest;
    const namespaceId = this.props.currentNamespaceId;
    const isCurrent = () =>
      requestId === this.resourceRequest &&
      namespaceId === this.props.currentNamespaceId;
    const { currentPage } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: "auth/fetchItemDel",
      payload: {
        id: record.id,
      },
      callback: (auth) => {
        if (!isCurrent()) return;
        dispatch({
          type: "auth/fetchMeta",
          payload: {
            // currentPage,
            // pageSize: 10
          },
          callback: (datas) => {
            if (!isCurrent()) return;
            this.setState({
              popup: (
                <RelateMetadata
                  {...auth}
                  {...datas}
                  authName={`appKey:  ${record.appKey}`}
                  id={record.id}
                  language={this.props.language}
                  handleCancel={() => {
                    this.closeModal();
                  }}
                  handleOk={(values) => {
                    if (!isCurrent()) return;
                    dispatch({
                      type: "auth/updateDel",
                      payload: { ...values, id: record.id },
                      fetchValue: this.currentQueryPayload(currentPage),
                      callback: () => {
                        if (isCurrent()) this.closeModal();
                      },
                    });
                  }}
                />
              ),
            });
          },
        });
      },
    });
  };

  searchClick = (res) => {
    this.setState(
      { currentPage: 1, appKey: res.appKey, phone: res.phone },
      this.query,
    );
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "auth/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: this.currentQueryPayload(1),
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: 1 });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  // 添加表格数据事件

  addClick = () => {
    this.resourceRequest += 1;
    const requestId = this.resourceRequest;
    const { dispatch, currentNamespaceId } = this.props;
    dispatch({
      type: "auth/fetchMetaGroup",
      payload: {},
      callback: (metaGroup) => {
        if (
          requestId !== this.resourceRequest ||
          currentNamespaceId !== this.props.currentNamespaceId
        )
          return;
        this.setState({
          popup: (
            <AddTable
              metaGroup={metaGroup}
              handleOk={(values) => {
                if (
                  requestId !== this.resourceRequest ||
                  currentNamespaceId !== this.props.currentNamespaceId
                )
                  return;
                dispatch({
                  type: "auth/add",
                  payload: { ...values, namespaceId: currentNamespaceId },
                  fetchValue: this.currentQueryPayload(1),
                  callback: () => {
                    this.setState({ selectedRowKeys: [], currentPage: 1 });
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

  openSwitch = ({ list, enabled, callback }) => {
    const { dispatch } = this.props;
    dispatch({
      type: "auth/updateOp",
      payload: {
        list,
        enabled,
      },
      fetchValue: this.currentQueryPayload(),
      callback,
    });
  };

  openClick = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "auth/fetchItem",
        payload: {
          id: selectedRowKeys[0],
        },
        callback: (user) => {
          this.openSwitch({
            list: selectedRowKeys,
            enabled: !user.open,
            callback: () => {
              this.setState({ selectedRowKeys: [] });
            },
          });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  statusSwitch = ({ list, enabled, callback }) => {
    const { dispatch } = this.props;
    dispatch({
      type: "auth/updateEn",
      payload: {
        list,
        enabled,
      },
      fetchValue: this.currentQueryPayload(),
      callback,
    });
  };

  enableClick = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "auth/fetchItem",
        payload: {
          id: selectedRowKeys[0],
        },
        callback: (user) => {
          this.statusSwitch({
            list: selectedRowKeys,
            enabled: !user.enabled,
            callback: () => {
              this.setState({ selectedRowKeys: [] });
            },
          });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  // 同步数据事件

  syncData = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "auth/syncDa",
      payload: {},
    });
  };

  changeLocale(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  initPluginColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: "AppKey",
          dataIndex: "appKey",
          key: "appKey",
          ellipsis: true,
          width: 320,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.ENCRYPTKEY"),
          dataIndex: "appSecret",
          key: "appSecret",
          ellipsis: true,
          width: 320,
        },
        {
          align: "center",
          title: `${getIntlContent("SHENYU.SYSTEM.USER")}Id`,
          dataIndex: "userId",
          key: "userId",
          ellipsis: true,
          width: 80,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.TEL"),
          dataIndex: "phone",
          key: "phone",
          ellipsis: true,
          width: 120,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.OPENPATH"),
          dataIndex: "open",
          key: "open",
          ellipsis: true,
          width: 140,
          render: (text, row) => (
            <AuthButton
              perms="system:authen:open"
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
                  aria-label={`${row.userId}: ${getIntlContent("SHENYU.AUTH.OPENPATH")}`}
                  checked={text}
                  onChange={(checked) => {
                    this.openSwitch({
                      list: [row.id],
                      enabled: checked,
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
          title: getIntlContent("SHENYU.SYSTEM.STATUS"),
          dataIndex: "enabled",
          key: "enabled",
          ellipsis: true,
          width: 140,
          render: (text, row) => (
            <AuthButton
              perms="system:authen:disable"
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
                  aria-label={`${row.userId}: ${getIntlContent("SHENYU.SYSTEM.STATUS")}`}
                  checked={text}
                  onChange={(checked) => {
                    this.statusSwitch({
                      list: [row.id],
                      enabled: checked,
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
          title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
          dataIndex: "dateUpdated",
          render: (dateUpdated) =>
            dayjs(dateUpdated).format("YYYY-MM-DD HH:mm:ss"),
          key: "dateUpdated",
          width: 200,
          ellipsis: true,
          sorter: (a, b) => (a.dateUpdated > b.dateUpdated ? 1 : -1),
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          dataIndex: "operate",
          key: "operate",
          ellipsis: true,
          width: 110,
          fixed: "right",
          render: (text, record) => {
            return (
              <AuthButton perms="system:authen:edit">
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
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.OPERATPATH"),
          dataIndex: "operates",
          key: "operates",
          ellipsis: true,
          width: 220,
          fixed: "right",
          render: (text, record) => {
            if (record.open) {
              return (
                // 弹窗中的编辑事件
                <AuthButton perms="system:authen:editResourceDetails">
                  {({ icon }) => (
                    <Button
                      theme="borderless"
                      htmlType="button"
                      icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      onClick={() => this.editClickMeta(record)}
                    >
                      {getIntlContent("SHENYU.AUTH.EDITOR.RESOURCE")}
                    </Button>
                  )}
                </AuthButton>
              );
            } else {
              return null;
            }
          },
        },
      ],
    });
  }

  render() {
    const { auth, loading, language } = this.props;
    const { authList, total } = auth;
    const { currentPage, pageSize, selectedRowKeys, popup } = this.state;
    const { columns } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <LocaleProvider locale={language === "zh-CN" ? zhCN : enUS}>
        <div className="plug-content-wrap">
          <div className={styles.toolbar}>
            <SearchContent onClick={this.searchClick} />
            <AuthButton perms="system:authen:delete">
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
                    htmlType="button"
                    type="danger"
                    theme="solid"
                    icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  >
                    {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
                  </Button>
                </Popconfirm>
              )}
            </AuthButton>
            <AuthButton perms="system:authen:add">
              {({ icon }) => (
                <Button
                  htmlType="button"
                  type="primary"
                  theme="solid"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.addClick}
                >
                  {getIntlContent("SHENYU.SYSTEM.ADDDATA")}
                </Button>
              )}
            </AuthButton>
            <AuthButton perms="system:authen:open">
              {({ icon }) => (
                <Button
                  htmlType="button"
                  type="primary"
                  theme="solid"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.openClick}
                >
                  {getIntlContent("SHENYU.PLUGIN.BATCH.OPENED")}
                </Button>
              )}
            </AuthButton>
            <AuthButton perms="system:authen:disable">
              {({ icon }) => (
                <Button
                  htmlType="button"
                  type="primary"
                  theme="solid"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.enableClick}
                >
                  {getIntlContent("SHENYU.PLUGIN.BATCH")}
                </Button>
              )}
            </AuthButton>
            <AuthButton perms="system:authen:modify">
              {({ icon }) => (
                <Button
                  htmlType="button"
                  type="primary"
                  theme="solid"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.syncData}
                >
                  {getIntlContent("SHENYU.AUTH.SYNCDATA")}
                </Button>
              )}
            </AuthButton>
          </div>
          {/* 表格 */}
          <Table
            size="small"
            resizable
            style={{ marginTop: 30 }}
            bordered
            rowKey="id"
            loading={loading}
            columns={columns}
            scroll={{ x: 1800 }}
            dataSource={authList}
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
