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
import Select from "../../../components/ui/Select";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

const { Option } = Select;

export const getHandleDetails = (record) => {
  try {
    const fields = JSON.parse(record.extObj || "{}");
    return {
      ...record,
      required: fields?.required ?? record.required,
      defaultValue: fields?.defaultValue ?? record.defaultValue,
      placeholder: fields?.placeholder ?? record.placeholder,
      rule: fields?.rule ?? record.rule,
    };
  } catch {
    return { ...record };
  }
};

@connect(({ pluginHandle, loading, global }) => ({
  pluginHandle,
  language: global.language,
  loading: loading.effects["pluginHandle/fetch"],
}))
export default class PluginHandle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      pluginDict: [],
      popup: "",
      pluginId: "",
      field: "",
      localeName: window.sessionStorage.getItem("locale")
        ? window.sessionStorage.getItem("locale")
        : "en-US",
      columns: [],
    };
  }

  async componentDidMount() {
    this.mounted = true;
    await this.loadPluginDict();
    if (!this.mounted) return;

    this.initPluginColumns();

    this.query();
  }

  componentDidUpdate(prevProps) {
    const { language } = this.props;
    if (language !== prevProps.language) {
      this.initPluginColumns();
      this.changeLocale(language);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  /**
   * condition query page list
   */
  currentQueryPayload = (override = {}) => {
    const { pluginId, field, currentPage, pageSize } = this.state;
    return { pluginId, field, currentPage, pageSize, ...override };
  };

  query = () => {
    this.props.dispatch({
      type: "pluginHandle/fetch",
      payload: this.currentQueryPayload(),
    });
  };

  /**
   * load plugin drop dict
   */
  loadPluginDict = async () => {
    const { dispatch } = this.props;
    await dispatch({
      type: "pluginHandle/fetchPluginList",
    });
    const pluginDict = this.props.pluginHandle.pluginDropDownList;
    if (this.mounted) this.setState({ pluginDict });
    return pluginDict;
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

  /**
   * close model
   * @param reset after is reset search condition
   */
  closeModal = (reset = false) => {
    this.setState(
      reset
        ? { popup: "", currentPage: 1, pluginId: "", field: "" }
        : { popup: "" },
    );
  };

  searchOnchange = (e) => {
    this.setState({ pluginId: e, currentPage: 1 }, this.query);
  };

  fieldOnchange = (e) => {
    this.setState({ field: e.target.value, currentPage: 1 }, this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  editClick = async (record, copy) => {
    const { dispatch } = this.props;
    const pluginDropDownList = await this.loadPluginDict();
    if (!this.mounted) return;
    dispatch({
      type: "pluginHandle/fetchItem",
      payload: {
        id: record.id,
      },
      callback: (pluginHandle) => {
        if (!this.mounted) return;
        const details = getHandleDetails(pluginHandle);
        this.setState({
          popup: (
            <AddModal
              pluginDropDownList={pluginDropDownList}
              disabled={true}
              {...details}
              handleOk={(values) => {
                const {
                  field,
                  label,
                  id,
                  pluginId,
                  dataType,
                  type,
                  sort,
                  required,
                  defaultValue,
                  placeholder,
                  rule,
                } = values;
                let extObj;
                if (required || defaultValue || placeholder || rule) {
                  extObj = JSON.stringify({
                    required,
                    defaultValue,
                    placeholder,
                    rule: rule || "",
                  });
                }
                let payload = {
                  field,
                  label,
                  id,
                  pluginId,
                  dataType,
                  type,
                  sort,
                  defaultValue,
                  placeholder,
                  rule,
                  extObj,
                };
                if (copy) {
                  delete payload.id;
                }
                dispatch({
                  type: `pluginHandle/${copy ? "add" : "update"}`,
                  payload,
                  fetchValue: this.currentQueryPayload({
                    pluginId: "",
                    field: "",
                    currentPage: 1,
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

  addClick = async () => {
    const pluginDropDownList = await this.loadPluginDict();
    if (!this.mounted) return;
    this.setState({
      popup: (
        <AddModal
          pluginDropDownList={pluginDropDownList}
          handleOk={(values) => {
            const { dispatch } = this.props;
            const {
              pluginId,
              label,
              field,
              dataType,
              type,
              sort,
              required,
              defaultValue,
              placeholder,
              rule,
            } = values;
            let extObj;
            if (required || defaultValue || placeholder || rule) {
              extObj = JSON.stringify({
                required,
                defaultValue,
                placeholder,
                rule: rule || "",
              });
            }
            dispatch({
              type: "pluginHandle/add",
              payload: {
                pluginId,
                label,
                field,
                dataType,
                type,
                sort,
                defaultValue,
                placeholder,
                rule,
                extObj,
              },
              fetchValue: this.currentQueryPayload({
                pluginId: "",
                field: "",
                currentPage: 1,
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
        type: "pluginHandle/delete",
        payload: {
          list: selectedRowKeys,
        },
        fetchValue: this.currentQueryPayload({ currentPage: 1 }),
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: 1 });
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
          dataIndex: "pluginId",
          key: "pluginId",
          ellipsis: true,
          sorter: (a, b) => a.pluginId - b.pluginId,
          width: 140,
          render: (text) => {
            const pluginDropDownList = this.state.pluginDict;
            if (pluginDropDownList) {
              let arr = pluginDropDownList.filter((item) => item.id === text);
              if (arr && arr.length > 0) {
                return (
                  <div style={{ color: "#260033", fontWeight: "bold" }}>
                    {arr[0].name}
                  </div>
                );
              } else {
                return <div>{text}</div>;
              }
            }
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.FIELDTYPE"),
          dataIndex: "type",
          key: "type",
          ellipsis: true,
          width: 120,
          sorter: (a, b) => a.type - b.type,
          render: (text) => {
            if (text === 1) {
              return (
                <Tag color="cyan">{getIntlContent("SHENYU.SELECTOR.NAME")}</Tag>
              );
            } else if (text === 2) {
              return (
                <Tag color="purple">
                  {getIntlContent("SHENYU.PLUGIN.RULES")}
                </Tag>
              );
            } else if (text === 3) {
              return <Tag color="blue">{getIntlContent("SHENYU.PLUGIN")}</Tag>;
            }
            return (
              <Tag color="red">
                {getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}
              </Tag>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.FIELDNAME"),
          dataIndex: "field",
          key: "field",
          ellipsis: true,
          width: 200,
          render: (text, record) => {
            let content = (
              <div>
                <p>{record.label}</p>
                <p>
                  {getIntlContent("SHENYU.SYSTEM.CREATETIME")}:
                  {record.dateCreated}
                </p>
                <p>
                  {getIntlContent("SHENYU.SYSTEM.UPDATETIME")}:
                  {record.dateUpdated}
                </p>
              </div>
            );
            return (
              <Popover
                position="topLeft"
                content={
                  <div className={styles.detail}>
                    <strong>{getIntlContent("SHENYU.PLUGIN.LABEL")}</strong>
                    {content}
                  </div>
                }
              >
                <div style={{ color: "#1f640a" }}>{text || "----"}</div>
              </Popover>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.REQUIRED"),
          dataIndex: "required",
          key: "required",
          ellipsis: true,
          width: 120,
          sorter: (a, b) =>
            (a.required || "0") > (b.required || "0") ? 1 : -1,
          render: (text) => {
            if (text === "1") {
              return (
                <span style={{ color: "green", fontWeight: "bold" }}>
                  {getIntlContent("SHENYU.COMMON.YES")}
                </span>
              );
            } else {
              return (
                <span style={{ color: "red", fontWeight: "bold" }}>
                  {getIntlContent("SHENYU.COMMON.NO")}
                </span>
              );
            }
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.DEFAULTVALUE"),
          dataIndex: "defaultValue",
          key: "defaultValue",
          ellipsis: true,
          width: 120,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.DATATYPE"),
          dataIndex: "dataType",
          key: "dataType",
          ellipsis: true,
          width: 100,
          render: (text) => {
            if (text === 1) {
              return (
                <Tag color="green">
                  {getIntlContent("SHENYU.PLUGIN.DIGITAL")}
                </Tag>
              );
            } else if (text === 2) {
              return (
                <Tag color="orange">
                  {getIntlContent("SHENYU.PLUGIN.STRING")}
                </Tag>
              );
            } else if (text === 3) {
              return (
                <Tag color="pink">
                  {getIntlContent("SHENYU.PLUGIN.DROPDOWN")}
                </Tag>
              );
            }
            return (
              <Tag color="red">
                {getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}
              </Tag>
            );
          },
        },

        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.SORT"),
          dataIndex: "sort",
          key: "sort",
          ellipsis: true,
          width: 80,
          sorter: (a, b) => a.sort - b.sort,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          dataIndex: "time",
          key: "time",
          ellipsis: true,
          fixed: "right",
          width: 180,
          render: (text, record) => {
            return (
              <div className={styles.actions}>
                <AuthButton perms="system:pluginHandler:edit">
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
                <AuthButton perms="system:pluginHandler:add">
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
    const { pluginHandle, loading, language } = this.props;
    const { pluginHandleList, total } = pluginHandle;
    const pluginDropDownList = this.state.pluginDict;
    const {
      currentPage,
      pageSize,
      selectedRowKeys,
      pluginId,
      field,
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
            <Select
              value={pluginId || undefined}
              onChange={this.searchOnchange}
              placeholder={getIntlContent("SHENYU.PLUGIN.SELECTNAME")}
              style={{ width: 240 }}
              allowClear
              showSearch
            >
              {pluginDropDownList &&
                pluginDropDownList.map((item, i) => {
                  return (
                    <Option key={i} value={item.id}>
                      {item.name}
                    </Option>
                  );
                })}
            </Select>
            <Input
              allowClear
              value={field}
              onChange={this.fieldOnchange}
              placeholder={getIntlContent("SHENYU.PLUGIN.FIELDNAME")}
              className={styles.filter}
            />
            <AuthButton perms="system:pluginHandler:list">
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
            <AuthButton perms="system:pluginHandler:delete">
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
                    {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                  </Button>
                </Popconfirm>
              )}
            </AuthButton>
            <AuthButton perms="system:pluginHandler:add">
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
            style={{ marginTop: 30 }}
            bordered
            loading={loading}
            columns={columns}
            scroll={{ x: 1208 }}
            dataSource={pluginHandleList.map(getHandleDetails)}
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
