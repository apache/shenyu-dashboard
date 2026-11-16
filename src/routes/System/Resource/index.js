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
import Tree from "@douyinfe/semi-ui/lib/es/tree";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import Input from "../../../components/ui/Input";
import { message } from "../../../components/ui/feedback";
import AddModal from "./AddModal";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import { getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { resetAuthMenuCache } from "../../../utils/AuthRoute";
import styles from "./index.module.less";

function resourceTitle(item) {
  const title = item.meta?.title || item.title || "";
  return title.startsWith("SHENYU.") ? getIntlContent(title) || title : title;
}

@connect(({ resource, role, global, loading }) => ({
  resource,
  role,
  global,
  loading: loading.effects["resource/fetchButtons"],
}))
export default class Resource extends Component {
  constructor(props) {
    super(props);
    this.buttonRequest = 0;
    this.unmounted = false;
    this.state = {
      selectedRowKeys: [],
      popup: "",
      buttons: [],
      currentMenu: null,
      menuName: "",
      menuQuery: "",
    };
  }

  componentDidMount() {
    this.getMenuTree();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  getMenuTree = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "resource/fetchMenuTree",
    });
  };

  getButtons = (menuId) => {
    if (this.unmounted || this.state.currentMenu?.id !== menuId) return;
    this.buttonRequest += 1;
    const request = this.buttonRequest;
    const { dispatch } = this.props;
    dispatch({
      type: "resource/fetchButtons",
      payload: { id: menuId },
      callback: (buttons) => {
        if (
          this.unmounted ||
          request !== this.buttonRequest ||
          this.state.currentMenu?.id !== menuId
        )
          return;
        this.setState({
          buttons,
        });
      },
    });
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = (record) => {
    const {
      resource: { menuTree },
      dispatch,
    } = this.props;
    dispatch({
      type: "resource/fetchItem",
      payload: {
        id: record.id,
      },
      callback: (resource) => {
        this.setState({
          popup: (
            <AddModal
              menuTree={menuTree}
              {...resource}
              handleOk={(values) => {
                const { icon, sort, parentId, id } = values;
                dispatch({
                  type: "resource/update",
                  payload: {
                    icon,
                    sort,
                    parentId,
                    id,
                  },
                  callback: () => {
                    if (resource.resourceType === 2) {
                      this.getButtons(resource.parentId);
                    } else {
                      this.getMenuTree();
                    }
                    this.closeModal();
                    this.refreshPermission();
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

  deleteClick = (resourceType, resourceId) => {
    const { dispatch } = this.props;
    const { selectedRowKeys, currentMenu } = this.state;
    if (
      resourceType === 2 &&
      (!selectedRowKeys || selectedRowKeys.length === 0)
    ) {
      message.destroy();
      message.warn("Please select data");
      return;
    }
    dispatch({
      type: "resource/delete",
      payload: {
        list: resourceType === 2 ? selectedRowKeys : [resourceId],
      },
      callback: () => {
        if (resourceType === 2) {
          const removed = new Set(selectedRowKeys);
          this.setState(
            (state) => {
              if (state.currentMenu?.id !== currentMenu.id) return null;
              return {
                buttons: state.buttons.filter(
                  (button) => !removed.has(button.id),
                ),
                selectedRowKeys: state.selectedRowKeys.filter(
                  (key) => !removed.has(key),
                ),
              };
            },
            () => this.getButtons(currentMenu.id),
          );
        } else {
          this.getMenuTree();
          if (this.state.currentMenu?.id === resourceId) {
            this.buttonRequest += 1;
            this.setState({
              buttons: [],
              selectedRowKeys: [],
              currentMenu: null,
            });
          }
        }
      },
    });
  };

  searchMenu = (menuName) => {
    this.setState({ menuName });
  };

  addClick = (resourceType) => {
    const {
      resource: { menuTree },
    } = this.props;
    const { currentMenu } = this.state;
    if (resourceType === 2 && !currentMenu) {
      message.warn(getIntlContent("SHENYU.SYSTEM.RESOURCE.SELECT.MENU.WARN"));
      return;
    }

    this.setState({
      popup: (
        <AddModal
          resourceType={resourceType}
          menuTree={menuTree}
          handleOk={(values) => {
            const { dispatch } = this.props;
            const { icon, sort, title, url, perms, parentId } = values;
            dispatch({
              type: "resource/add",
              payload: {
                icon: icon || "",
                sort: isNaN(sort) ? 0 : sort,
                title,
                url: url || "",
                parentId: resourceType === 2 ? currentMenu.id : parentId || "",
                resourceType,
                name: "",
                component: "",
                isLeaf: resourceType === 2,
                isRoute: 0,
                perms: perms || "",
                status: 1,
              },
              callback: () => {
                if (resourceType === 2) {
                  this.getButtons(currentMenu.id);
                } else {
                  this.getMenuTree();
                }
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

  refreshPermission = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/refreshPermission",
      payload: {
        callback: () => {
          resetAuthMenuCache();
        },
      },
    });
  };

  onSelectMenu = (key, selected, node) => {
    const currentMenu = node.dataRef;
    this.buttonRequest += 1;
    this.setState({ currentMenu, buttons: [], selectedRowKeys: [] }, () => {
      if (!currentMenu.children?.length) this.getButtons(currentMenu.id);
    });
  };

  filterTreeNode = (item) => {
    const { menuName } = this.state;
    return (
      resourceTitle(item).toUpperCase().includes(menuName.toUpperCase()) ||
      item.children?.some(this.filterTreeNode)
    );
  };

  treeData = (data) =>
    [...data]
      .sort((left, right) => (left.sort || 0) - (right.sort || 0))
      .filter(this.filterTreeNode)
      .map((item) => ({
        key: item.id,
        label: resourceTitle(item),
        icon: item.meta?.icon && <ResourceIcon type={item.meta.icon} />,
        dataRef: item,
        children: item.children?.length
          ? this.treeData(item.children)
          : undefined,
      }));

  renderTreeLabel = (label, node) => {
    const item = node.dataRef;
    const selected = this.state.currentMenu?.id === item.id;
    return (
      <span className={styles.menuLabel}>
        <button
          type="button"
          className={styles.menuTitle}
          title={label}
          onKeyDown={(event) => event.stopPropagation()}
          onKeyPress={(event) => event.stopPropagation()}
        >
          {label}
        </button>
        {selected && (
          <span className={styles.menuActions}>
            <AuthButton perms="system:resource:editMenu">
              <Button
                theme="borderless"
                type="tertiary"
                htmlType="button"
                aria-label={getIntlContent("SHENYU.BUTTON.RESOURCE.MENU.EDIT")}
                icon={<ResourceIcon type="edit" />}
                onKeyDown={(event) => event.stopPropagation()}
                onKeyPress={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  this.editClick(item);
                }}
              />
            </AuthButton>
            {!item.children?.length && !item.url.startsWith("/plug/") && (
              <AuthButton perms="system:resource:editMenu">
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  position="bottom"
                  motion={false}
                  okType="danger"
                  onConfirm={(event) => {
                    event.stopPropagation();
                    this.deleteClick(item.resourceType, item.id);
                  }}
                  onCancel={(event) => event.stopPropagation()}
                  okText={getIntlContent("SHENYU.COMMON.SURE")}
                  cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                >
                  <Button
                    theme="borderless"
                    type="tertiary"
                    htmlType="button"
                    aria-label={getIntlContent(
                      "SHENYU.BUTTON.RESOURCE.MENU.DELETE",
                    )}
                    icon={<ResourceIcon type="delete" />}
                    onKeyDown={(event) => event.stopPropagation()}
                    onKeyPress={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  />
                </Popconfirm>
              </AuthButton>
            )}
          </span>
        )}
      </span>
    );
  };

  render() {
    const {
      resource: { menuTree },
      loading,
      global = {},
    } = this.props;
    const language =
      global.language || sessionStorage.getItem("locale") || "en-US";
    const { selectedRowKeys, buttons, popup } = this.state;
    const buttonColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.BUTTON"),
        dataIndex: "title",
        key: "title",
        ellipsis: true,
        width: 100,
        render: (text) => {
          return getIntlContent(text) || text;
        },
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.ICON"),
        dataIndex: "icon",
        key: "icon",
        width: 60,
        render: (text) => {
          return <ResourceIcon type={text} />;
        },
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.RESOURCE.PERMS"),
        dataIndex: "perms",
        key: "perms",
        ellipsis: true,
        width: 140,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.CREATETIME"),
        dataIndex: "dateCreated",
        key: "dateCreated",
        ellipsis: true,
        width: 140,
        sorter: (a, b) => (a.dateCreated > b.dateCreated ? 1 : -1),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
        dataIndex: "dateUpdated",
        key: "dateUpdated",
        ellipsis: true,
        width: 140,
        sorter: (a, b) => (a.dateUpdated > b.dateUpdated ? 1 : -1),
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        ellipsis: true,
        width: 110,
        render: (text, record) => {
          return (
            <AuthButton perms="system:resource:editButton">
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
          <div className={styles.resourceLayout}>
            <section className={styles.resourcePane}>
              <h3>{getIntlContent("SHENYU.SYSTEM.RESOURCE.MENULIST.TITLE")}</h3>
              <div className={styles.headerSearch}>
                <AuthButton perms="system:resource:list">
                  {({ icon }) => (
                    <form
                      className={styles.search}
                      onSubmit={(event) => {
                        event.preventDefault();
                        this.searchMenu(this.state.menuQuery);
                      }}
                    >
                      <Input
                        className={styles.searchInput}
                        allowClear
                        value={this.state.menuQuery}
                        onChange={(event) =>
                          this.setState({ menuQuery: event.target.value })
                        }
                        aria-label={getIntlContent(
                          "SHENYU.SYSTEM.RESOURCE.MENU.INPUT.NAME",
                        )}
                        placeholder={getIntlContent(
                          "SHENYU.SYSTEM.RESOURCE.MENU.INPUT.NAME",
                        )}
                      />
                      <Button
                        type="primary"
                        theme="solid"
                        htmlType="submit"
                        icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      >
                        {getIntlContent("SHENYU.SYSTEM.SEARCH")}
                      </Button>
                    </form>
                  )}
                </AuthButton>
                <AuthButton perms="system:resource:addMenu">
                  {({ icon }) => (
                    <Button
                      type="primary"
                      theme="solid"
                      htmlType="button"
                      icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      onClick={() => this.addClick(1)}
                    >
                      {getIntlContent("SHENYU.BUTTON.RESOURCE.MENU.ADD")}
                    </Button>
                  )}
                </AuthButton>
              </div>
              {menuTree && menuTree.length > 0 ? (
                <Tree
                  className={styles.menuTree}
                  style={{
                    background: "var(--semi-color-bg-2)",
                    marginTop: 24,
                  }}
                  expandAll
                  blockNode
                  motion={false}
                  emptyContent={getIntlContent(
                    "SHENYU.SYSTEM.RESOURCE.NO_MATCH",
                  )}
                  value={this.state.currentMenu?.id}
                  onSelect={this.onSelectMenu}
                  treeData={this.treeData(menuTree)}
                  renderLabel={this.renderTreeLabel}
                />
              ) : null}
            </section>
            <section className={styles.resourcePane}>
              <h3>
                {getIntlContent("SHENYU.SYSTEM.RESOURCE.BUTTONLIST.TITLE")}
              </h3>
              <div className={styles.buttonToolbar}>
                <AuthButton perms="system:resource:deleteButton">
                  {({ icon }) => (
                    <Popconfirm
                      title={getIntlContent("SHENYU.COMMON.DELETE")}
                      position="bottom"
                      motion={false}
                      okType="danger"
                      onConfirm={() => this.deleteClick(2)}
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
                <AuthButton perms="system:resource:addButton">
                  {({ icon }) => (
                    <Button
                      type="primary"
                      theme="solid"
                      htmlType="button"
                      icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      onClick={() => this.addClick(2)}
                    >
                      {getIntlContent("SHENYU.BUTTON.RESOURCE.BUTTON.ADD")}
                    </Button>
                  )}
                </AuthButton>
              </div>
              <Table
                size="small"
                scroll={{ x: 780 }}
                bordered
                rowKey="id"
                loading={loading}
                columns={buttonColumns}
                dataSource={buttons}
                rowSelection={rowSelection}
                pagination={false}
              />
            </section>
          </div>
          {popup}
        </div>
      </LocaleProvider>
    );
  }
}
