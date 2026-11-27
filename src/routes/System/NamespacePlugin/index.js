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
import Popover from "@douyinfe/semi-ui/lib/es/popover";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Table from "@douyinfe/semi-ui/lib/es/table";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import Input from "../../../components/ui/Input";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "../../../components/ui/ManagementList.module.less";
import Select from "../../../components/ui/Select";
import { message } from "../../../components/ui/feedback";
import { Link } from "../../../runtime/router";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { sortByNumber } from "../../../utils/sorter";
import { formatJsonObject } from "../../../utils/jsonObject";
import { refreshAuthMenus } from "../../../utils/AuthRoute";
import {
  getUpdateModal,
  updateNamespacePluginsEnabled,
} from "../../../utils/namespacePlugin";
import { getLocale } from "../../../utils/localePreference";

const { Option } = Select;

@connect(({ namespacePlugin, resource, loading, global }) => ({
  namespacePlugin,
  authMenu: resource.authMenu,
  language: global.language,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["namespacePlugin/fetch"],
}))
export default class NamespacePlugin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      name: "",
      enabled: null,
      popup: "",
      localeName: getLocale(),
      columns: [],
    };
  }

  componentDidMount() {
    this.query();
    this.initNamespacePluginColumns();
  }

  componentDidUpdate(prevProps) {
    const { language, currentNamespaceId } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initNamespacePluginColumns();
      this.changeLocale(language);
    }
    if (prevProps.currentNamespaceId !== currentNamespaceId) {
      this.setState(
        { currentPage: 1, selectedRowKeys: [], popup: "" },
        this.query,
      );
    }
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  currentQueryPayload = (override) => {
    const { name, enabled, currentPage, pageSize } = this.state;
    const { currentNamespaceId } = this.props;
    return {
      name,
      enabled,
      namespaceId: currentNamespaceId,
      currentPage,
      pageSize,
      ...override,
    };
  };

  query = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "namespacePlugin/fetch",
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

  closeModal = (refresh = false) => {
    if (refresh) {
      this.setState({ popup: "", currentPage: 1 });
      return;
    }
    this.setState({ popup: "" });
  };

  editClick = (record) => {
    const { dispatch, currentNamespaceId } = this.props;
    getUpdateModal({
      id: record.id,
      namespaceId: currentNamespaceId,
      dispatch,
      fetchValue: this.currentQueryPayload({ currentPage: 1 }),
      callback: (popup) => {
        if (this.props.currentNamespaceId !== currentNamespaceId) return;
        this.setState({ popup });
      },
      updatedCallback: () => {
        this.setState({ selectedRowKeys: [] });
        this.closeModal(true);
      },
      canceledCallback: () => {
        this.closeModal();
      },
    });
  };

  searchOnchange = (e) => {
    this.setState({ name: e.target.value, currentPage: 1 }, this.query);
  };

  enabledOnchange = (e) => {
    this.setState({ enabled: e, currentPage: 1 }, this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  deleteClick = () => {
    const { dispatch, currentNamespaceId } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "namespacePlugin/delete",
        payload: {
          list: selectedRowKeys,
          namespaceId: currentNamespaceId,
        },
        fetchValue: this.currentQueryPayload(),
        callback: () => {
          this.setState({ selectedRowKeys: [] });
          refreshAuthMenus({ dispatch });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  // change status
  statusSwitch = ({ list, enabled, namespaceId, callback }) => {
    const { dispatch } = this.props;
    updateNamespacePluginsEnabled({
      list,
      dispatch,
      callback,
      enabled,
      namespaceId,
      fetchValue: this.currentQueryPayload(),
    });
  };

  // batch enable or disable
  enableClick = () => {
    const { dispatch, currentNamespaceId } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "namespacePlugin/fetchItem",
        payload: { id: selectedRowKeys[0], namespaceId: currentNamespaceId },
        callback: (plugin) => {
          this.statusSwitch({
            list: selectedRowKeys,
            enabled: !plugin.enabled,
            namespaceId: currentNamespaceId,
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

  // sync all
  syncAllClick = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "namespacePlugin/asyncAll",
      payload: { namespaceId: this.props.currentNamespaceId },
    });
  };

  changeLocale(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  initNamespacePluginColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.PLUGIN.NAME"),
          dataIndex: "name",
          key: "name",
          ellipsis: true,
          width: 120,
          render: (text, record) => {
            return record.url ? (
              <Link to={record.url}>
                <div
                  style={{
                    color: "#1890ff",
                    fontWeight: "bold",
                    textDecorationLine: "underline",
                  }}
                >
                  {text || "----"}
                </div>
              </Link>
            ) : (
              <div style={{ color: "#260033", fontWeight: "bold" }}>
                {text || "----"}
              </div>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.ROLE"),
          dataIndex: "role",
          ellipsis: true,
          key: "role",
          width: 120,
          sorter: (a, b) => (a.role > b.role ? 1 : -1),
          render: (text) => {
            return <div style={{ color: "#1f640a" }}>{text || "----"}</div>;
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.SORT"),
          dataIndex: "sort",
          ellipsis: true,
          key: "sort",
          width: 120,
          sorter: sortByNumber("sort"),
          render: (text) => {
            return <div style={{ color: "#014955" }}>{text}</div>;
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.SETTING"),
          dataIndex: "config",
          key: "config",
          ellipsis: true,
          width: 300,
          render: (text, record) => {
            const tag = (
              <div>
                <Tag color="green">{record.name}</Tag>
                <Tag color="grey">{record.role}</Tag>
                <Tag color="teal">{record.sort}</Tag>
              </div>
            );
            const t = formatJsonObject(text);
            const content = (
              <div>
                <span
                  className={styles.secondary}
                >{`${getIntlContent("SHENYU.SYSTEM.CREATETIME")}: ${record.dateCreated}`}</span>
                <br />
                <span
                  className={styles.secondary}
                >{`${getIntlContent("SHENYU.SYSTEM.UPDATETIME")}: ${record.dateUpdated}`}</span>
                <hr />
                <div style={{ fontWeight: "bold" }}>
                  <pre>
                    <code>{t}</code>
                  </pre>
                </div>
              </div>
            );
            return (
              <Popover
                content={
                  <div className={styles.detail}>
                    {tag}
                    {content}
                  </div>
                }
              >
                <div>{text || "----"}</div>
              </Popover>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.STATUS"),
          dataIndex: "enabled",
          key: "enabled",
          ellipsis: true,
          width: 140,
          sorter: (a, b) =>
            (a.enabled || "-1") > (b.enabled || "-1") ? 1 : -1,
          render: (text, row) => (
            <AuthButton
              perms="system:plugin:disable"
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
                  aria-label={`${row.name || row.path}: ${getIntlContent("SHENYU.SYSTEM.STATUS")}`}
                  checked={text}
                  onChange={(checked) => {
                    this.statusSwitch({
                      list: [row.id],
                      enabled: checked,
                      namespaceId: row.namespaceId,
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
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          dataIndex: "time",
          key: "time",
          ellipsis: true,
          width: 160,
          fixed: "right",
          render: (text, record) => {
            return (
              <div className={styles.actions}>
                <AuthButton perms="system:namespacePlugin:edit">
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
      ],
    });
  }

  render() {
    const { namespacePlugin, loading, authMenu, language } = this.props;
    const { namespacePluginList, total } = namespacePlugin;
    const { currentPage, pageSize, selectedRowKeys, name, enabled, popup } =
      this.state;
    const { columns } = this.state;
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

    const rows = namespacePluginList.map((record) => ({
      ...record,
      url: (flatAuthMenu[record.id] ?? {}).path,
    }));

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
              placeholder={getIntlContent("SHENYU.PLUGIN.INPUTNAME")}
              className={styles.filter}
            />
            <Select
              value={enabled != null ? enabled : undefined}
              onChange={this.enabledOnchange}
              placeholder={getIntlContent("SHENYU.PLUGIN.SELECT.STATUS")}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="0">{getIntlContent("SHENYU.COMMON.CLOSE")}</Option>
              <Option value="1">{getIntlContent("SHENYU.COMMON.OPEN")}</Option>
            </Select>
            <AuthButton perms="system:plugin:list">
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
            <AuthButton perms="system:plugin:delete">
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
            <AuthButton perms="system:plugin:modify">
              {({ icon }) => (
                <Button
                  type="primary"
                  theme="solid"
                  htmlType="button"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.syncAllClick}
                >
                  {getIntlContent("SHENYU.PLUGIN.SYNCALLDATA")}
                </Button>
              )}
            </AuthButton>
            <AuthButton perms="system:plugin:disable">
              {({ icon }) => (
                <Button
                  type="primary"
                  theme="solid"
                  htmlType="button"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.enableClick}
                >
                  {getIntlContent("SHENYU.PLUGIN.BATCH")}
                </Button>
              )}
            </AuthButton>
          </form>
          <Table
            size="small"
            resizable
            rowKey="id"
            scroll={{ x: 1200 }}
            style={{ marginTop: 30 }}
            bordered
            loading={loading}
            columns={columns}
            dataSource={rows}
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
