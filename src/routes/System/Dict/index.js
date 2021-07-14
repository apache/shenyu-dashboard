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
import {Table, Input, Button, message, Popconfirm} from "antd";
import { connect } from "dva";
import { resizableComponents } from '../../../utils/resizable';
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';

@connect(({ shenyuDict, loading, global }) => ({
  shenyuDict,
  language: global.language,
  loading: loading.effects["shenyuDict/fetch"]
}))
export default class ShenYuDict extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      type: "",
      dictName: "",
      dictCode: "",
      popup: "",
      localeName: window.sessionStorage.getItem('locale') ? window.sessionStorage.getItem('locale') : 'en-US',
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllDict(currentPage);
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

  handleResize = index => (e, { size }) => {
    this.setState(({ columns }) => {
      const nextColumns = [...columns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      return { columns: nextColumns };
    });
  };

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllDict = page => {
    const { dispatch } = this.props;
    const { type, dictName, dictCode } = this.state;
    dispatch({
      type: "shenyuDict/fetch",
      payload: {
        type,
        dictName,
        dictCode,
        currentPage: page,
        pageSize: 12
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllDict(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const currentType = this.state.type;
    const currentDictCode = this.state.dictCode;
    const currentDictName = this.state.dictName;
    dispatch({
      type: "shenyuDict/fetchItem",
      payload: {
        id: record.id
      },
      callback: user => {
        // console.log(user)
        this.setState({

          popup: (
            <AddModal
              isShow={false}
              {...user}
              handleOk={values => {
                const { type, dictCode, id, dictName, dictValue, desc, sort, enabled } = values;

                dispatch({
                  type: "shenyuDict/update",
                  payload: {
                    type,
                    dictCode,
                    dictName,
                    dictValue,
                    id,
                    desc,
                    sort,
                    enabled
                  },
                  fetchValue: {
                    type: currentType,
                    dictCode: currentDictCode,
                    dictName: currentDictName,
                    currentPage,
                    pageSize: 12
                  },
                  callback: () => {
                    this.closeModal();
                    dispatch({
                      type: "shenyuDict/fetch",
                      payload: {
                        type: currentType,
                        dictName:currentDictName,
                        dictCode:currentDictCode,
                        pageSize: 12,
                        callback: () => { }
                      }
                    });
                  }
                });
              }}
              handleCancel={() => {
                this.closeModal();
              }}
            />
          )
        });
      }
    });
  };

  searchTypeOnchange = e => {
    const type = e.target.value;
    this.setState({ type });
  };

  searchDictCodeOnchange = e => {
    const dictCode = e.target.value;
    this.setState({ dictCode });
  };

  searchDictNameOnchange = e => {
    const dictName = e.target.value;
    this.setState({ dictName });
  };

  searchClick = () => {
    this.getAllDict(1);
    this.setState({ currentPage: 1 });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { type, dictCode, dictName, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "shenyuDict/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          type,
          dictCode,
          dictName,
          currentPage,
          pageSize: 12
        },
        callback: () => {
          this.setState({ selectedRowKeys: [] });
          dispatch({
            type: "shenyuDict/fetch",
            payload: {
              type,
              dictName,
              dictCode,
              pageSize: 12,
              callback: () => { }
            }
          });
        }
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    const { currentPage } = this.state;
    this.setState({
      popup: (
        <AddModal
          isShow={true}
          handleOk={values => {
            const { dispatch } = this.props;
            const { type, dictCode, dictName, dictValue, desc, sort, enabled } = values;
            dispatch({
              type: "shenyuDict/add",
              payload: {
                type,
                dictCode,
                dictName,
                desc,
                dictValue,
                sort,
                enabled
              },
              fetchValue: {
                currentPage,
                pageSize: 12
              },
              callback: () => {
                this.setState({ selectedRowKeys: [] });
                this.closeModal();
                dispatch({
                  type: "shenyuDict/fetch",
                  payload: {
                    callback: () => { }
                  }
                });
              }
            });
          }}
          handleCancel={() => {
            this.closeModal();
          }}
        />
      )
    });
  };

  enableClick = () => {
    const { dispatch } = this.props;
    const { type, dictName, dictCode, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {

      dispatch({
        type: "shenyuDict/fetchItem",
        payload: {
          id: selectedRowKeys[0]
        },
        callback: user => {

          dispatch({
            type: "shenyuDict/updateEn",
            payload: {
              list: selectedRowKeys ,
              enabled: !user.enabled
            },
            fetchValue: {},
            callback: () => {
              this.setState({ selectedRowKeys: [] });
              dispatch({
                type: "shenyuDict/fetch",
                payload: {
                  type,
                  dictName,
                  dictCode,
                  pageSize: 12,
                  callback: () => { }
                }
              });
            }
          });
        }
      })
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  changeLocale(locale) {
    this.setState({
      localeName: locale
    });
    getCurrentLocale(this.state.localeName);
  };

  initPluginColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.TYPE"),
          dataIndex: "type",
          key: "type",
          ellipsis:true,
          width: 180,
          sorter: (a,b) => a.type > b.type ? 1 : -1,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.CODE"),
          dataIndex: "dictCode",
          key: "dictCode",
          ellipsis:true,
          width: 350,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.NAME"),
          dataIndex: "dictName",
          key: "dictName",
          ellipsis:true,
          width: 200,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.VALUE"),
          dataIndex: "dictValue",
          key: "dictValue",
          ellipsis:true,
          width: 140,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.DIC.DESCRIBE"),
          dataIndex: "desc",
          key: "desc",
          ellipsis:true,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.SORT"),
          dataIndex: "sort",
          key: "sort",
          ellipsis:true,
          width: 80,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.STATUS"),
          dataIndex: "enabled",
          ellipsis:true,
          key: "enabled",
          width: 80,
          render: text => {
            if (text) {
              return <div className="open">{getIntlContent("SHENYU.COMMON.OPEN")}</div>;
            } else {
              return <div className="close">{getIntlContent("SHENYU.COMMON.CLOSE")}</div>;
            }
          }
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          ellipsis:true,
          dataIndex: "operate",
          key: "operate",
          width: 80,
          fixed: "right",
          render: (text, record) => {
            return (
              <AuthButton perms="system:dict:edit">
                <div
                  className="edit"
                  onClick={() => {
                    this.editClick(record);
                  }}
                >
                  {getIntlContent("SHENYU.SYSTEM.EDITOR")}
                </div>
              </AuthButton>
            );
          }
        }
      ]
    })
  }

  render() {
    const { shenyuDict, loading } = this.props;
    const { shenyuDictList, total } = shenyuDict;

    const { currentPage, selectedRowKeys, type, dictCode, dictName, popup } = this.state;
    const columns = this.state.columns.map((col, index) => ({
      ...col,
      onHeaderCell: column => ({
        width: column.width,
        onResize: this.handleResize(index),
      }),
    }));
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            value={type}
            placeholder={getIntlContent("SHENYU.DIC.INPUTTYPE")}
            onChange={this.searchTypeOnchange}
            style={{ width: 240 }}
          />&nbsp;&nbsp;
          <Input
            value={dictCode}
            placeholder={getIntlContent("SHENYU.DIC.INPUTCODE")}
            onChange={this.searchDictCodeOnchange}
            style={{ width: 240 }}
          />&nbsp;&nbsp;
          <Input
            value={dictName}
            placeholder={getIntlContent("SHENYU.DIC.INPUTNAME")}
            onChange={this.searchDictNameOnchange}
            style={{ width: 240 }}
          />
          <AuthButton perms="system:dict:list">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:dict:delete">
            <Popconfirm
              title={getIntlContent("SHENYU.COMMON.DELETE")}
              placement='bottom'
              onConfirm={() => {
                this.deleteClick()
              }}
              okText={getIntlContent("SHENYU.COMMON.SURE")}
              cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
            >
              <Button
                style={{ marginLeft: 20 }}
                type="danger"
              >
                {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
              </Button>
            </Popconfirm>
          </AuthButton>
          <AuthButton perms="system:dict:add">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.addClick}
            >
              {getIntlContent("SHENYU.COMMON.ADD")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:dict:disable">
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
          rowKey={record => record.id}
          loading={loading}
          columns={columns}
          scroll={{ x: 1350 }}
          dataSource={shenyuDictList}
          rowSelection={rowSelection}
          pagination={{
            total,
            current: currentPage,
            pageSize: 12,
            onChange: this.pageOnchange
          }}
        />
        {popup}
      </div>
    );
  }
}
