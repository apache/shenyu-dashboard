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
import Popover from "@douyinfe/semi-ui/lib/es/popover";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import { message } from "../../../components/ui/feedback";
import Input from "../../../components/ui/Input";
import Switch from "../../../components/ui/Switch";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

@connect(({ shenyuDict, loading, global }) => ({
  shenyuDict,
  language: global.language,
  loading: loading.effects["shenyuDict/fetch"],
}))
export default class ShenYuDict extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      type: "",
      dictName: "",
      dictCode: "",
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

  currentQueryPayload = (override = {}) => {
    const { type, dictName, dictCode, currentPage, pageSize } = this.state;
    return { type, dictName, dictCode, currentPage, pageSize, ...override };
  };

  query = () => {
    this.props.dispatch({
      type: "shenyuDict/fetch",
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

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = (record, copy) => {
    const { dispatch } = this.props;
    const { currentPage, pageSize } = this.state;
    const currentType = this.state.type;
    const currentDictCode = this.state.dictCode;
    const currentDictName = this.state.dictName;
    dispatch({
      type: "shenyuDict/fetchItem",
      payload: {
        id: record.id,
      },
      callback: (user) => {
        this.setState({
          popup: (
            <AddModal
              isShow={false}
              {...user}
              handleOk={(values) => {
                const {
                  type,
                  dictCode,
                  id,
                  dictName,
                  dictValue,
                  desc,
                  sort,
                  enabled,
                } = values;
                let payload = {
                  type,
                  dictCode,
                  dictName,
                  dictValue,
                  id,
                  desc,
                  sort,
                  enabled,
                };
                if (copy) {
                  delete payload.id;
                }
                dispatch({
                  type: `shenyuDict/${copy ? "add" : "update"}`,
                  payload,
                  fetchValue: {
                    type: currentType,
                    dictCode: currentDictCode,
                    dictName: currentDictName,
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

  searchTypeOnchange = (e) => {
    this.setState({ type: e.target.value, currentPage: 1 }, this.query);
  };

  searchDictCodeOnchange = (e) => {
    this.setState({ dictCode: e.target.value, currentPage: 1 }, this.query);
  };

  searchDictNameOnchange = (e) => {
    this.setState({ dictName: e.target.value, currentPage: 1 }, this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { type, dictCode, dictName, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "shenyuDict/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: {
          type,
          dictCode,
          dictName,
          currentPage: 1,
          pageSize,
        },
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: 1 });
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
          isShow={true}
          handleOk={(values) => {
            const { dispatch } = this.props;
            const { type, dictCode, dictName, dictValue, desc, sort, enabled } =
              values;
            dispatch({
              type: "shenyuDict/add",
              payload: {
                type,
                dictCode,
                dictName,
                desc,
                dictValue,
                sort,
                enabled,
              },
              fetchValue: this.currentQueryPayload({ currentPage: 1 }),
              callback: () => {
                this.closeModal();
                this.setState({ selectedRowKeys: [], currentPage: 1 });
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

  statusSwitch = ({
    list,
    enabled,
    callback = () => {},
    currentPage = this.state.currentPage,
  }) => {
    const { dispatch } = this.props;
    dispatch({
      type: "shenyuDict/updateEn",
      payload: {
        list,
        enabled,
      },
      fetchValue: this.currentQueryPayload({ currentPage }),
      callback,
    });
  };

  enableClick = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "shenyuDict/fetchItem",
        payload: {
          id: selectedRowKeys[0],
        },
        callback: (user) => {
          this.statusSwitch({
            list: selectedRowKeys,
            enabled: !user.enabled,
            currentPage: 1,
            callback: () => {
              this.setState({ selectedRowKeys: [], currentPage: 1 });
            },
          });
        },
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  commonPopover = (record, value) => {
    let content = (
      <div>
        <p>
          <span style={{ color: "#204969" }}>
            {getIntlContent("SHENYU.DIC.CODE")}
          </span>
          :<span style={{ color: "#1f640a" }}> {record.dictCode}</span>
        </p>
        <p>
          <span style={{ color: "#204969" }}>
            {getIntlContent("SHENYU.DIC.TYPE")}
          </span>
          :<span style={{ color: "#1f640a" }}> {record.type}</span>
        </p>
        <p>
          <span style={{ color: "#204969" }}>
            {getIntlContent("SHENYU.DIC.NAME")}
          </span>
          :<span style={{ color: "#1f640a" }}> {record.dictName}</span>
        </p>
        <p>
          <span style={{ color: "#204969" }}>
            {getIntlContent("SHENYU.DIC.VALUE")}
          </span>
          :<span style={{ color: "#1f640a" }}> {record.dictValue}</span>
        </p>
        <p>
          <span style={{ color: "#204969" }}>
            {getIntlContent("SHENYU.DIC.DESCRIBE")}
          </span>
          :<span style={{ color: "#1f640a" }}> {record.desc}</span>
        </p>
        <p>
          <span style={{ color: "#204969" }}>
            {getIntlContent("SHENYU.SYSTEM.CREATETIME")}
          </span>
          :<span style={{ color: "#1f640a" }}> {record.dateCreated}</span>
        </p>
        <p>
          <span style={{ color: "#204969" }}>
            {getIntlContent("SHENYU.SYSTEM.UPDATETIME")}
          </span>
          :<span style={{ color: "#1f640a" }}> {record.dateUpdated}</span>
        </p>
      </div>
    );
    return (
      <Popover
        position="topLeft"
        content={
          <div className={styles.detail}>
            <strong>{getIntlContent("SHENYU.DIC")}</strong>
            {content}
          </div>
        }
      >
        {value}
      </Popover>
    );
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
          title: getIntlContent("SHENYU.DIC.TYPE"),
          dataIndex: "type",
          key: "type",
          ellipsis: true,
          width: 180,
          sorter: (a, b) => (a.type > b.type ? 1 : -1),
          render: (text) => {
            if (text.length < 5) {
              return <Tag color="cyan">{text}</Tag>;
            } else if (text.length < 15) {
              return <Tag color="purple">{text}</Tag>;
            } else if (text.length < 25) {
              return <Tag color="blue">{text}</Tag>;
            }
            return <Tag color="red">{text}</Tag>;
          },
        },

        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.NAME"),
          dataIndex: "dictName",
          key: "dictName",
          ellipsis: true,
          width: 200,
          render: (text, record) =>
            this.commonPopover(
              record,
              <div style={{ color: "#1f640a" }}>{text || "----"}</div>,
            ),
        },

        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.CODE"),
          dataIndex: "dictCode",
          key: "dictCode",
          ellipsis: true,
          width: 200,
          render: (text, record) =>
            this.commonPopover(
              record,
              <div style={{ color: "#1f640a" }}>{text || "----"}</div>,
            ),
        },

        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.VALUE"),
          dataIndex: "dictValue",
          key: "dictValue",
          ellipsis: true,
          width: 140,
          render: (text, record) =>
            this.commonPopover(
              record,
              <div style={{ color: "#260033", fontWeight: "bold" }}>
                {text || "----"}
              </div>,
            ),
        },

        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.SORT"),
          dataIndex: "sort",
          key: "sort",
          ellipsis: true,
          width: 80,
        },

        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.STATUS"),
          dataIndex: "enabled",
          ellipsis: true,
          key: "enabled",
          width: 140,
          render: (text, row) => (
            <AuthButton
              perms="system:dict:disable"
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
                  aria-label={`${row.dictName}: ${getIntlContent("SHENYU.SYSTEM.STATUS")}`}
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
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          ellipsis: true,
          dataIndex: "operate",
          key: "operate",
          width: 180,
          fixed: "right",
          render: (text, record) => {
            return (
              <div className={styles.actions}>
                <AuthButton perms="system:dict:edit">
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
                <AuthButton perms="system:dict:add">
                  {({ icon }) => (
                    <Button
                      theme="borderless"
                      htmlType="button"
                      icon={icon ? <ResourceIcon type={icon} /> : undefined}
                      onClick={() => this.editClick(record, true)}
                    >
                      {getIntlContent("SHENYU.COMMON.COPY")}
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
    const { shenyuDict, loading, language } = this.props;
    const { shenyuDictList, total } = shenyuDict;

    const {
      currentPage,
      pageSize,
      selectedRowKeys,
      type,
      dictCode,
      dictName,
      popup,
    } = this.state;
    const { columns } = this.state;
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
              value={type}
              placeholder={getIntlContent("SHENYU.DIC.INPUTTYPE")}
              onChange={this.searchTypeOnchange}
              className={styles.filter}
            />
            <Input
              allowClear
              value={dictCode}
              placeholder={getIntlContent("SHENYU.DIC.INPUTCODE")}
              onChange={this.searchDictCodeOnchange}
              className={styles.filter}
            />
            <Input
              allowClear
              value={dictName}
              placeholder={getIntlContent("SHENYU.DIC.INPUTNAME")}
              onChange={this.searchDictNameOnchange}
              className={styles.filter}
            />
            <AuthButton perms="system:dict:list">
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
            <AuthButton perms="system:dict:delete">
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
            <AuthButton perms="system:dict:add">
              {({ icon }) => (
                <Button
                  type="primary"
                  theme="solid"
                  htmlType="button"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                  onClick={this.addClick}
                >
                  {getIntlContent("SHENYU.COMMON.ADD")}
                </Button>
              )}
            </AuthButton>
            <AuthButton perms="system:dict:disable">
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
            style={{ marginTop: 30 }}
            bordered
            rowKey="id"
            loading={loading}
            columns={columns}
            scroll={{ x: 1168 }}
            dataSource={shenyuDictList}
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
