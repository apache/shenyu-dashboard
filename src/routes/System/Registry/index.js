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
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Popover from "@douyinfe/semi-ui/lib/es/popover";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import Input from "../../../components/ui/Input";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import { message } from "../../../components/ui/feedback";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

@connect(({ registry, loading, global }) => ({
  registry,
  language: global.language,
  loading: loading.effects["registry/fetch"],
}))
export default class Registry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      registryId: "",
      address: "",
      popup: "",
      localeName: window.localStorage.getItem("locale")
        ? window.localStorage.getItem("locale")
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
  currentQueryPayload = (overrides) => {
    const { registryId, address, currentPage, pageSize } = this.state;
    return { registryId, address, currentPage, pageSize, ...overrides };
  };

  query = () =>
    this.props.dispatch({
      type: "registry/fetch",
      payload: this.currentQueryPayload(),
    });

  onPaginationChange = (page, pageSize) => {
    this.setState(
      (state) => ({
        currentPage: pageSize === state.pageSize ? page : 1,
        pageSize,
      }),
      this.query,
    );
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
                  fetchValue: this.currentQueryPayload({
                    currentPage: 1,
                    registryId: "",
                    address: "",
                  }),
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
    this.setState({
      popup: (
        <AddModal
          handleOk={(values) => {
            const { dispatch } = this.props;
            dispatch({
              type: "registry/add",
              payload: values,
              fetchValue: this.currentQueryPayload({
                currentPage: 1,
                registryId: "",
                address: "",
              }),
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
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "registry/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: this.currentQueryPayload({ currentPage: 1 }),
        callback: () => {
          this.setState((state) => ({
            selectedRowKeys: state.selectedRowKeys.filter(
              (id) => !selectedRowKeys.includes(id),
            ),
            currentPage: 1,
          }));
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
              trigger="hover"
              position="top"
              content={
                <div style={{ wordBreak: "break-all", maxWidth: 360 }}>
                  {text}
                </div>
              }
            >
              <Button
                theme="borderless"
                type="tertiary"
                htmlType="button"
                className={styles.address}
              >
                {text || "--"}
              </Button>
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
          width: 110,
          render: (text, record) => {
            return (
              <div className="optionParts">
                <AuthButton perms="system:registry:edit">
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
    const { registry, loading, language } = this.props;
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
              value={registryId}
              onChange={this.registryIdOnchange}
              placeholder={getIntlContent("SHENYU.REGISTRY.REGISTRY_ID")}
              className={styles.filter}
            />
            <Input
              allowClear
              value={address}
              onChange={this.addressOnchange}
              placeholder={getIntlContent("SHENYU.REGISTRY.ADDRESS")}
              className={styles.filter}
            />
            <AuthButton perms="system:registry:list">
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
            <AuthButton perms="system:registry:delete">
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
                    {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                  </Button>
                </Popconfirm>
              )}
            </AuthButton>
            <AuthButton perms="system:registry:add">
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
            dataSource={registryList}
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
