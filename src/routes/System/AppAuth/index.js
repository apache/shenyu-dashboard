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
import { Table, Button, message,Popconfirm } from "antd";
import { connect } from "dva";
import dayjs from "dayjs";
import { resizableComponents } from '../../../utils/resizable';
import AddModal from "./AddModal";
import RelateMetadata from "./RelateMetadata"
import AddTable from "./AddTable"
import SearchContent from "./SearchContent"
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

@connect(({ auth, loading, global }) => ({
  auth,
  language: global.language,
  loading: loading.effects["auth/fetch"]
}))
export default class Auth extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      appKey: "",
      phone: "",
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

  query = () =>{
    const { dispatch } = this.props;
    const { appKey,phone,currentPage,pageSize} = this.state;
    dispatch({
      type: "auth/fetch",
      payload: {
        appKey,
        phone,
        currentPage,
        pageSize
      }
    });
  }

  getAllAuths = page => {
    const { dispatch } = this.props;
    const { appKey,phone,pageSize } = this.state;
    dispatch({
      type: "auth/fetch",
      payload: {
        appKey,
        phone,
        currentPage: page,
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

  closeModal = (refresh) => {
    if (refresh) {
      this.setState({ popup: "" }, this.query);
    }
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    dispatch({
      type: "auth/fetchItem",
      payload: {
        id: record.id
      },
      callback: (auth) => {
        this.setState({
          popup: (
            <AddModal
              {...auth}
              handleOk={values => {
                dispatch({
                  type: "auth/update",
                  payload: {
                    extInfo:null,
                    ...values
                  },
                  fetchValue: {

                    currentPage,
                    pageSize: 20
                  },
                  callback: () => {
                    this.closeModal(true);
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

  editClickMeta = record => {
    const { currentPage } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: "auth/fetchItemDel",
      payload: {
        id: record.id
      },
      callback: (auth)=>{

        dispatch({
          type: "auth/fetchMeta",
          payload: {
            // currentPage,
            // pageSize: 10
          },
          callback: datas => {
            // remove duplicate elements and add
            const pathArr =  auth.auth.map(e => e.path);
            datas.dataList = datas.dataList.filter(item=>!pathArr.includes(item.path)).concat(auth.auth);
            this.setState({
              popup: (
                <RelateMetadata
                  {...auth}
                  {...datas}
                  authName={`appKey:  ${  record.appKey}`}
                  id={record.id}
                  handleCancel={() => {
                    this.closeModal();
                  }}
                  handleOk={values => {
                    dispatch({
                      type: "auth/updateDel",
                      payload: values,
                      fetchValue: {

                        currentPage,
                        pageSize: 20
                      },
                      callback: () => {
                        this.closeModal(true);
                      }
                    });
                  }}
                />
              )
            })
          }
        })
      }
    })
  }

  searchClick = res => {
    this.setState({ currentPage: 1, appKey : res.appKey, phone: res.phone, }, this.query);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "auth/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {},
        callback: () => {
          this.setState({ selectedRowKeys: [], currentPage: 1,},this.query)
        }
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

  // 添加表格数据事件

  addClick = () => {
    const { currentPage } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: "auth/fetchMetaGroup",
      payload: {},
      callback: (metaGroup)=>{
        this.setState({
          popup: (
            <AddTable
              metaGroup={metaGroup}
              handleOk={values => {
                dispatch({
                  type: "auth/add",
                  payload: values,
                  fetchValue: {
                    currentPage,
                    pageSize: 20
                  },
                  callback: () => {
                    this.setState({ selectedRowKeys: [], currentPage : 1 })
                    this.closeModal(true);
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
    })
  };

  enableClick = () => {
    const {dispatch} = this.props;
    const {selectedRowKeys} = this.state;
    if(selectedRowKeys && selectedRowKeys.length>0) {
      dispatch({
        type: "auth/fetchItem",
        payload: {
          id: selectedRowKeys[0]
        },
        callback: user => {
          dispatch({
            type: "auth/updateEn",
            payload: {
              list: selectedRowKeys,
              enabled: !user.enabled
            },
            fetchValue: {},
            callback: () => {
              this.setState({selectedRowKeys: []}, this.query);
            }
          })
        }
      })
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  }

  // 同步数据事件

  syncData = () => {
    const {dispatch} = this.props;
    dispatch({
      type: "auth/syncDa",
      payload: {}
    })
  }

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
          title: "AppKey",
          dataIndex: "appKey",
          key: "appKey",
          ellipsis:true,
          width: 320,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.ENCRYPTKEY"),
          dataIndex: "appSecret",
          key: "appSecret",
          ellipsis:true,
          width: 320,
        },
        {
          align: "center",
          title: `${getIntlContent("SHENYU.SYSTEM.USER")}Id`,
          dataIndex: "userId",
          key: "userId",
          ellipsis:true,
          width: 80,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.TEL"),
          dataIndex: "phone",
          key: "phone",
          ellipsis:true,
          width: 120,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.OPENPATH"),
          dataIndex: "open",
          key: "open",
          ellipsis:true,
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
          title: getIntlContent("SHENYU.SYSTEM.STATUS"),
          dataIndex: "enabled",
          key: "enabled",
          ellipsis:true,
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
          title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
          dataIndex: "dateUpdated",
          render: dateUpdated => dayjs(dateUpdated).format('YYYY-MM-DD HH:mm:ss' ),
          key: "dateUpdated",
          ellipsis:true,
          sorter: (a,b) => a.dateUpdated > b.dateUpdated ? 1 : -1,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          dataIndex: "operate",
          key: "operate",
          ellipsis:true,
          width: 80,
          fixed: "right",
          render: (text, record) => {
            return (
              <AuthButton perms="system:authen:edit">
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
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.AUTH.OPERATPATH"),
          dataIndex: "operates",
          key: "operates",
          ellipsis:true,
          width: 140,
          fixed: "right",
          render: (text, record) => {
            if(record.open){
              return (
                // 弹窗中的编辑事件
                <AuthButton perms="system:authen:editResourceDetails">
                  <div
                    className="edit"
                    onClick={() => {
                      this.editClickMeta(record);
                    }}
                  >
                    {getIntlContent("SHENYU.AUTH.EDITOR.RESOURCE")}
                  </div>
                </AuthButton>
              );
            } else {
              return null;
            }
          }
        }
      ]
    })
  }

  render() {
    const { auth, loading } = this.props;
    const { authList, total } = auth;
    const { currentPage, pageSize, selectedRowKeys, popup } = this.state;
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
        <div style={{ display: "flex",alignItems: 'center' }}>
          <SearchContent onClick={this.searchClick} />
          <AuthButton perms="system:authen:delete">
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
          <AuthButton perms="system:authen:add">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.addClick}
            >
              {getIntlContent("SHENYU.SYSTEM.ADDDATA")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:authen:disable">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.enableClick}
            >
              {getIntlContent("SHENYU.PLUGIN.BATCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:authen:modify">
            <Button
              style={{ marginLeft: 20 }}
              type="primary"
              onClick={this.syncData}
            >
              {getIntlContent("SHENYU.AUTH.SYNCDATA")}
            </Button>
          </AuthButton>
        </div>
        {/* 表格 */}
        <Table
          size="small"
          components={this.components}
          style={{ marginTop: 30 }}
          bordered
          rowKey={record => record.id}
          loading={loading}
          columns={columns}
          scroll={{ x: 1450 }}
          dataSource={authList}
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
