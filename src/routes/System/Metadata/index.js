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
import {Table, Input, Button, message, Popconfirm, Tag, Popover} from "antd";
import { connect } from "dva";
import { resizableComponents } from '../../../utils/resizable';
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';

@connect(({ metadata, loading, global }) => ({
  metadata,
  language: global.language,
  loading: loading.effects["metadata/fetch"]
}))
export default class Metadata extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      appName: "",
      path: "",
      popup: "",
      localeName: window.sessionStorage.getItem('locale') ? window.sessionStorage.getItem('locale') : 'en-US',
    };
  }

  componentWillMount() {
    this.query()
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
    this.setState({ selectedRowKeys }, this.query);
  };

  query = () => {
    const { dispatch } = this.props;
    const { path, currentPage, pageSize } = this.state;
    dispatch({
      type: "metadata/fetch",
      payload: {
        path,
        currentPage,
        pageSize
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page }, this.query);
  };

  onShowSizeChange = (currentPage,pageSize) => {
    this.setState({ currentPage: 1, pageSize }, this.query);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage,pageSize } = this.state;
    const name = this.state.appName;
    dispatch({
      type: "metadata/fetchItem",
      payload: {
        id: record.id
      },
      callback: user => {
        this.setState({
          popup: (
            <AddModal
              isShow={false}
              {...user}
              handleOk={values => {
                const { appName,enabled, methodName,id, parameterTypes,path,pathDesc, rpcExt, rpcType, serviceName } = values;
                dispatch({
                  type: "metadata/update",
                  payload: {
                    appName,
                    methodName,
                    parameterTypes,
                    enabled,
                    pathDesc,
                    id,
                    path,
                    rpcExt,
                    rpcType,
                    serviceName
                  },
                  fetchValue: {
                    appName: name,
                    currentPage,
                    pageSize
                  },
                  callback: () => {
                    this.closeModal();
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

  searchOnchange = e => {
    this.setState({ path: e.target.value, currentPage: 1 },this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { appName, currentPage,pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "metadata/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          appName,
          currentPage,
          pageSize
        },
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: 1 }, this.query);
        }
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  addClick = () => {
    const { currentPage,pageSize } = this.state;
    const name = this.state.appName;
    this.setState({
      popup: (
        <AddModal
          isShow={true}
          handleOk={values => {
            const { dispatch } = this.props;
            const { appName, enabled, methodName, parameterTypes,path,pathDesc, rpcExt, rpcType, serviceName } = values;
            dispatch({
              type: "metadata/add",
              payload: {
                appName,
                methodName,
                enabled,
                parameterTypes,
                path,
                pathDesc,
                rpcExt,
                rpcType,
                serviceName
              },
              fetchValue: {
                appName: name,
                currentPage,
                pageSize
              },
              callback: () => {
                this.setState({ selectedRowKeys: [], currentPage: 1 }, this.query);
                this.closeModal();
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
    const { appName, currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {

      dispatch({
        type: "metadata/fetchItem",
        payload: {
          id: selectedRowKeys[0]
        },
        callback: user => {

          dispatch({
            type: "metadata/updateEn",
            payload: {
              list: selectedRowKeys ,
              enabled: !user.enabled
            },
            fetchValue: {
              appName,
              currentPage,
              pageSize
            },
            callback: () => {
              this.setState({ selectedRowKeys: [] }, this.query);
            }
          });
        }
      })
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  syncData = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "metadata/syncDa"

    })
  };

  changeLocale(locale){
    this.setState({
      localeName: locale
    });
    getCurrentLocale(this.state.localeName);
  }

  initPluginColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.APPNAME"),
          dataIndex: "appName",
          key: "appName",
          ellipsis:true,
          width: 150,
          sorter: (a,b) => a.appName > b.appName ? 1 : -1,
          render: text => {
            return <div style={{color: "#260033","fontWeight":"bold"}}>{text}</div>
          }
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.META.PATH"),
          dataIndex: "path",
          key: "path",
          ellipsis:true,
          render: (text,record) => {
            let content =(
              <div>
                <p>{record.pathDesc}</p>
                <hr />
                <p>
                  <span style={{color:"#204969"}}>{getIntlContent("SHENYU.META.SERVER.INTER")}</span> :
                  <span style={{color:"#1f640a"}}>{record.serviceName}</span>
                </p>
                <p>
                  <span style={{color:"#204969"}}>{getIntlContent("SHENYU.META.FUNC.NAME")}</span>:
                  <span style={{color:"#1f640a"}}>{record.methodName}</span>
                </p>
                <p>
                  <span style={{color:"#204969"}}>{getIntlContent("SHENYU.AUTH.PARAMS")}</span> :
                  <span style={{color:"#1f640a"}}>{record.parameterTypes}</span>
                </p>
                <p>
                  <span style={{color:"#204969"}}>{getIntlContent("SHENYU.META.EXPAND.PARAMS")}</span> :
                  <span style={{color:"#1f640a"}}>{record.rpcExt}</span>
                </p>
                <hr />
                <p>
                  <span style={{color:"#204969"}}>{getIntlContent("SHENYU.SYSTEM.CREATETIME")}</span> :
                  <span style={{color:"#1f640a"}}>{record.dateCreated}</span>
                </p>
                <p>
                  <span style={{color:"#204969"}}>{getIntlContent("SHENYU.SYSTEM.UPDATETIME")}</span> :
                  <span style={{color:"#1f640a"}}>{record.dateUpdated}</span>
                </p>
              </div>
            );
            return <Popover placement="topLeft" content={content} title={getIntlContent("SHENYU.AUTH.PATH.DESCRIBE")}><div style={{color: "#1f640a"}}>{text || "----"}</div></Popover>

          }
        },
        {
          align: "center",
          title: `Rpc${getIntlContent("SHENYU.COMMON.TYPE")}`,
          dataIndex: "rpcType",
          key: "rpcType",
          ellipsis:true,
          width: 120,
          sorter: (a,b) => a.rpcType > b.rpcType ? 1 : -1,
          render: text => {
            if (text.length < 5) {
              return <Tag color="cyan">{text}</Tag>;
            } else if (text.length < 15) {
              return <Tag color="purple">{text}</Tag>;
            } else if (text.length < 25) {
              return <Tag color="blue">{text}</Tag>;
            }
            return <Tag color="red">{text}</Tag>;
          }
        },

        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.STATUS"),
          dataIndex: "enabled",
          key: "enabled",
          ellipsis:true,
          width: 60,
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
              <AuthButton perms="system:meta:edit">
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
    const { metadata, loading } = this.props;
    const { userList, total } = metadata;

    const { currentPage, pageSize, selectedRowKeys, path, popup } = this.state;
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
            value={path}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SHENYU.META.INPUTPATH")}
            style={{ width: 240 }}
          />
          <AuthButton perms="system:meta:list">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:meta:delete">
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
          <AuthButton perms="system:meta:add">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.addClick}
            >
              {getIntlContent("SHENYU.COMMON.ADD")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:meta:disable">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.enableClick}
            >
              {getIntlContent("SHENYU.PLUGIN.BATCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:meta:modify">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.syncData}
            >
              {getIntlContent("SHENYU.AUTH.SYNCDATA")}
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
          // scroll={{ x: 1350 }}
          dataSource={userList}
          rowSelection={rowSelection}
          pagination={{
            total,
            showTotal: (showTotal) => `${showTotal}`,
            showSizeChanger: true,
            pageSizeOptions: ["12", "20", "50", "100"],
            current: currentPage,
            pageSize,
            onShowSizeChange: this.onShowSizeChange,
            onChange: this.pageOnchange
          }}
        />
        {popup}
      </div>
    );
  }
}
