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
import Dropdown from "@douyinfe/semi-ui/lib/es/dropdown";
import { connect } from "react-redux";
import Input from "../../../components/ui/Input";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "../../../components/ui/ManagementList.module.less";
import Select from "../../../components/ui/Select";
import { message } from "../../../components/ui/feedback";
import { Link } from "../../../runtime/router";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { sortByNumber } from "../../../utils/sorter";
import { refreshAuthMenus } from "../../../utils/AuthRoute";
import { getUpdateModal, updatePluginsEnabled } from "../../../utils/plugin";

const { Option } = Select;

@connect(({ plugin, resource, loading, global }) => ({
  plugin,
  authMenu: resource.authMenu,
  language: global.language,
  loading: loading.effects["plugin/fetch"],
  namespaces: global.namespaces,
}))
export default class Plugin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      namespaceId: this.props.currentNamespaceId,
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      name: "",
      role: "",
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
    this.initPluginColumns();
  }

  componentDidUpdate() {
    const { language } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initPluginColumns();
      this.changeLocale(language);
    }
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  currentQueryPayload = (override) => {
    const { name, role, namespaceId, enabled, currentPage, pageSize } =
      this.state;
    return {
      name,
      role,
      namespaceId,
      enabled,
      currentPage,
      pageSize,
      ...override,
    };
  };

  query = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "plugin/fetch",
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
    const { dispatch } = this.props;
    getUpdateModal({
      pluginId: record.id,
      dispatch,
      fetchValue: this.currentQueryPayload({ currentPage: 1 }),
      callback: (popup) => {
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

  getNamespaceMenus = (record) => (
    <Dropdown.Menu>
      {this.props.namespaces.map((namespace) => (
        <Dropdown.Item
          key={namespace.id}
          onClick={() => this.generateClick(record, namespace)}
        >
          {namespace.name}
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  );

  generateClick = (record, namespace) => {
    const { dispatch } = this.props;
    dispatch({
      type: "plugin/generate",
      payload: {
        pluginId: record.id,
        namespaceId: namespace.namespaceId,
      },
      fetchValue: this.currentQueryPayload(),
      callback: () => {
        refreshAuthMenus({ dispatch });
      },
    });
  };

  resourceClick = (record) => {
    // code here...
    const { dispatch } = this.props;
    const { name, role, sort, config, id, enabled } = record;
    dispatch({
      type: "plugin/createPluginResource",
      payload: {
        name,
        role,
        sort,
        config,
        id,
        enabled,
      },
      callback: () => {
        refreshAuthMenus({ dispatch });
      },
    });
  };

  searchOnNamechange = (e) => {
    this.setState({ name: e.target.value, currentPage: 1 }, this.query);
  };

  searchOnRolechange = (e) => {
    this.setState({ role: e.target.value, currentPage: 1 }, this.query);
  };

  enabledOnchange = (e) => {
    this.setState({ enabled: e, currentPage: 1 }, this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "plugin/delete",
        payload: {
          list: selectedRowKeys,
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

  addClick = () => {
    this.setState({
      popup: (
        <AddModal
          disabled={false}
          handleOk={(values) => {
            const { dispatch } = this.props;
            const { name, enabled, role, config, sort, file } = values;
            dispatch({
              type: "plugin/add",
              payload: {
                name,
                config,
                role,
                enabled,
                sort,
                file,
              },
              fetchValue: this.currentQueryPayload({ currentPage: 1 }),
              callback: () => {
                this.closeModal(true);
                refreshAuthMenus({ dispatch });
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

  // 数据状态切换
  statusSwitch = ({ list, enabled, callback }) => {
    const { dispatch } = this.props;
    updatePluginsEnabled({
      list,
      dispatch,
      callback,
      enabled,
      fetchValue: this.currentQueryPayload(),
    });
  };

  // 批量启用或禁用
  enableClick = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "plugin/fetchItem",
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
            let t = text;
            try {
              t = JSON.stringify(JSON.parse(text || "{}"), null, 4);
            } catch {
              /* Keep malformed configuration readable. */
            }
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
                    this.statusSwitch({ list: [row.id], enabled: checked });
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
          width: 320,
          fixed: "right",
          render: (text, record) => {
            return (
              <div className={styles.actions}>
                <AuthButton perms="system:plugin:edit">
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
                <AuthButton perms="system:plugin:resource">
                  {({ icon }) => (
                    <Button
                      theme="borderless"
                      htmlType="button"
                      icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      onClick={() => this.resourceClick(record)}
                    >
                      {getIntlContent("SHENYU.BUTTON.SYSTEM.RESOURCE")}
                    </Button>
                  )}
                </AuthButton>
                <AuthButton perms="system:plugin:add">
                  {({ icon }) => (
                    <Dropdown
                      trigger="click"
                      render={this.getNamespaceMenus(record)}
                    >
                      <Button
                        theme="borderless"
                        htmlType="button"
                        icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      >
                        {getIntlContent("SHENYU.BUTTON.SYSTEM.GENERATE")}
                      </Button>
                    </Dropdown>
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
    const { plugin, loading, authMenu, language } = this.props;
    const { pluginList, total } = plugin;
    const {
      currentPage,
      pageSize,
      selectedRowKeys,
      name,
      role,
      enabled,
      popup,
    } = this.state;
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

    const rows = pluginList.map((record) => ({
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
              onChange={this.searchOnNamechange}
              placeholder={getIntlContent("SHENYU.PLUGIN.INPUTNAME")}
              className={styles.filter}
            />
            <Input
              allowClear
              value={role}
              onChange={this.searchOnRolechange}
              placeholder={getIntlContent("SHENYU.SYSTEM.ROLE")}
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
            <AuthButton perms="system:plugin:add">
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
