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
import {
  Button,
  Input,
  message,
  Popconfirm,
  Popover,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { connect } from "dva";
import { Link } from "dva/router";
import { resizableComponents } from "../../../utils/resizable";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { refreshAuthMenus } from "../../../utils/AuthRoute";
import {
  getUpdateModal,
  updateNamespacePluginsEnabled,
} from "../../../utils/namespacePlugin";

const { Text } = Typography;

const { Option } = Select;

@connect(({ namespacePlugin, resource, loading, global }) => ({
  namespacePlugin,
  authMenu: resource.authMenu,
  language: global.language,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["namespacePlugin/fetch"],
}))
export default class NamespacePlugin extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      name: "",
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
      this.query();
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
    const { dispatch, currentNamespaceId } = this.props;
    getUpdateModal({
      pluginId: record.pluginId,
      namespaceId: currentNamespaceId,
      dispatch,
      fetchValue: this.currentQueryPayload(),
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

  resourceClick = (record) => {
    // code here...
    const { dispatch } = this.props;
    const { name, role, sort, config, pluginId, enabled } = record;
    dispatch({
      type: "plugin/createPluginResource",
      payload: {
        name,
        role,
        sort,
        config,
        id: pluginId,
        enabled,
      },
      callback: () => {
        refreshAuthMenus({ dispatch });
      },
    });
  };

  searchOnchange = (e) => {
    this.setState({ name: e.target.value }, this.query);
  };

  enabledOnchange = (e) => {
    this.setState({ enabled: e }, this.query);
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
        fetchValue: this.currentQueryPayload({
          pageSize: 12,
        }),
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

  // 数据状态切换
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

  // 批量启用或禁用
  enableClick = () => {
    const {
      dispatch,
      currentNamespaceId,
      namespacePlugin: { namespacePluginList },
    } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "namespacePlugin/fetchItem",
        payload: {
          pluginId: namespacePluginList.find((i) => i.id === selectedRowKeys[0])
            ?.pluginId,
          namespaceId: currentNamespaceId,
        },
        callback: (user) => {
          this.statusSwitch({
            list: selectedRowKeys,
            enabled: !user.enabled,
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

  // 同步插件数据
  syncAllClick = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "namespacePlugin/asyncAll",
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
          sorter: (a, b) => (a.role > b.role ? 1 : -1),
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
          render: (text, record) => {
            const tag = (
              <div>
                <Tag color="#9dd3a8">{record.name}</Tag>
                <Tag color="#CCCC99">{record.role}</Tag>
                <Tag color="#3b9a9c">{record.sort}</Tag>
              </div>
            );
            const t = JSON.stringify(
              JSON.parse(text !== null && text.length > 0 ? text : "{}"),
              null,
              4,
            );
            const content = (
              <div>
                <Text type="secondary">{`${getIntlContent("SHENYU.SYSTEM.CREATETIME")}: ${record.dateCreated}`}</Text>
                <br />
                <Text type="secondary">{`${getIntlContent("SHENYU.SYSTEM.UPDATETIME")}: ${record.dateUpdated}`}</Text>
                <hr />
                <div style={{ fontWeight: "bold" }}>
                  <pre>
                    <code>{t}</code>
                  </pre>
                </div>
              </div>
            );
            return (
              <Popover content={content} title={tag}>
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
          width: 80,
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
              <Switch
                checkedChildren={getIntlContent("SHENYU.COMMON.OPEN")}
                unCheckedChildren={getIntlContent("SHENYU.COMMON.CLOSE")}
                checked={text}
                onChange={(checked) => {
                  this.statusSwitch({
                    list: [row.id],
                    enabled: checked,
                    namespaceId: row.namespaceId,
                  });
                }}
              />
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
              <div className="optionParts">
                <AuthButton perms="system:namespacePlugin:edit">
                  <div
                    className="edit"
                    onClick={() => {
                      this.editClick(record);
                    }}
                  >
                    {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                  </div>
                </AuthButton>
                <AuthButton perms="system:namespacePlugin:resource">
                  <div
                    className="edit"
                    onClick={() => {
                      this.resourceClick(record);
                    }}
                  >
                    {getIntlContent("SHENYU.BUTTON.SYSTEM.RESOURCE")}
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
    const { namespacePlugin, loading, authMenu } = this.props;
    const { namespacePluginList, total } = namespacePlugin;
    const { currentPage, pageSize, selectedRowKeys, name, enabled, popup } =
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

    namespacePluginList.forEach((p) => {
      p.url = (flatAuthMenu[p.id] ?? {}).path;
    });

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            allowClear
            value={name}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SHENYU.PLUGIN.INPUTNAME")}
            style={{ width: 240 }}
          />
          <Select
            value={enabled != null ? enabled : undefined}
            onChange={this.enabledOnchange}
            placeholder={getIntlContent("SHENYU.PLUGIN.SELECT.STATUS")}
            style={{ width: 150, marginLeft: 20 }}
            allowClear
          >
            <Option value="0">{getIntlContent("SHENYU.COMMON.CLOSE")}</Option>
            <Option value="1">{getIntlContent("SHENYU.COMMON.OPEN")}</Option>
          </Select>
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
          {/* <AuthButton perms="system:plugin:add"> */}
          {/*  <Button */}
          {/*    style={{ marginLeft: 20 }} */}
          {/*    type="primary" */}
          {/*    onClick={this.addClick} */}
          {/*  > */}
          {/*    {getIntlContent("SHENYU.SYSTEM.ADDDATA")} */}
          {/*  </Button> */}
          {/* </AuthButton> */}
          <AuthButton perms="system:plugin:modify">
            <Button
              style={{ marginLeft: 20 }}
              icon="reload"
              type="primary"
              onClick={this.syncAllClick}
            >
              {getIntlContent("SHENYU.PLUGIN.SYNCALLDATA")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:plugin:disable">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.enableClick}
            >
              {getIntlContent("SHENYU.PLUGIN.BATCH")}
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
          dataSource={namespacePluginList}
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
