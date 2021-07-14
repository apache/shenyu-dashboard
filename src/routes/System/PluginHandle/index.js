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

import React, {Component} from "react";
import {Table, Button, Popconfirm, message, Select, Input} from "antd";
import {connect} from "dva";
import { resizableComponents } from '../../../utils/resizable';
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from '../../../utils/AuthButton';

const { Option } = Select;

@connect(({pluginHandle, loading, global}) => ({
  pluginHandle,
  language: global.language,
  loading: loading.effects["pluginHandle/fetch"]
}))
export default class PluginHandle extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      popup: "",
      pluginId:'',
      field: '',
      localeName: window.sessionStorage.getItem('locale') ? window.sessionStorage.getItem('locale') : 'en-US',
    };
  }

  componentWillMount = async () => {
    await this.getPluginDropDownList();

    this.initPluginColumns();

    const {currentPage} = this.state;
    this.getAllPluginHandles(currentPage);
  }

  componentDidUpdate() {
    const { language } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initPluginColumns();
      this.changeLocale(language);
    }
  }

  getAllPluginHandles = page => {
    const {dispatch} = this.props;
    const {pluginId, field} = this.state;
    dispatch({
      type: "pluginHandle/fetch",
      payload: {
        pluginId,
        field,
        currentPage: page,
        pageSize: 12
      }
    });
  };

  getPluginDropDownList = async () => {
    const {dispatch} = this.props;
    await dispatch({
      type: "pluginHandle/fetchPluginList",
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllPluginHandles(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  searchOnchange = e => {
    const pluginId = e;
    this.setState({ pluginId });
  };

  fieldOnchange = e => {
    const field = e.target.value;
    this.setState({ field });
  };

  searchClick = () => {
    this.getAllPluginHandles(1);
    this.setState({ currentPage: 1 });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const searchPluginId = this.state.pluginId;
    const pluginDropDownList = this.props.pluginHandle.pluginDropDownList
    dispatch({
      type: "pluginHandle/fetchItem",
      payload: {
        id: record.id
      },
      callback: pluginHandle => {
        let obj = JSON.parse(pluginHandle.extObj)
        Object.assign(
          pluginHandle,
          obj
        )
        this.setState({
          popup: (
            <AddModal
              pluginDropDownList={pluginDropDownList}
              disabled={true}
              {...pluginHandle}
              handleOk={values => {
                const { field, label, id, pluginId,dataType,type,sort,required,defaultValue,placeholder,rule } = values;
                let extObj
                if(required || defaultValue || placeholder || rule){
                  extObj=JSON.stringify({
                    'required':required,
                    'defaultValue':defaultValue,
                    'placeholder':placeholder,
                    'rule':rule || ""
                  })
                }
                dispatch({
                  type: "pluginHandle/update",
                  payload: {
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
                    extObj
                  },
                  fetchValue: {
                    currentPage,
                    pageSize: 12
                  },
                  callback: () => {
                    this.closeModal();
                    dispatch({
                      type: "pluginHandle/fetch",
                      payload: {
                        pluginId: searchPluginId,
                        currentPage: {currentPage},
                        pageSize: 12
                      }
                    });
                    this.getPluginDropDownList()
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

  addClick = () => {
    const {currentPage} = this.state;
    const searchPluginId = this.state.pluginId;
    const pluginDropDownList = this.props.pluginHandle.pluginDropDownList
    this.setState({
      popup: (
        <AddModal
          pluginDropDownList={pluginDropDownList}
          handleOk={values => {
            const {dispatch} = this.props;
            const {pluginId, label, field, dataType,type,sort,required,defaultValue,placeholder,rule} = values;
            let extObj
            if(required || defaultValue || placeholder || rule){
              extObj=JSON.stringify({
                'required':required,
                'defaultValue':defaultValue,
                'placeholder':placeholder,
                'rule': rule || ""
              })
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
                extObj
              },
              fetchValue: {
                currentPage,
                pageSize: 12
              },
              callback: () => {
                this.closeModal();
                dispatch({
                  type: "pluginHandle/fetch",
                  payload: {
                    pluginId: searchPluginId,
                    currentPage: {currentPage},
                    pageSize: 12
                  }
                });
                this.getPluginDropDownList()
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

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { currentPage, selectedRowKeys } = this.state;
    const searchPluginId = this.state.pluginId;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "pluginHandle/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          currentPage,
          pageSize: 12
        },
        callback: () => {
          this.setState({ selectedRowKeys: [] });
          dispatch({
            type: "global/fetchPlugins",
            payload: {
              callback: () => { }
            }
          });

          dispatch({
            type: "pluginHandle/fetch",
            payload: {
              pluginId: searchPluginId,
              currentPage: {currentPage},
              pageSize: 12
            }
          });
          this.getPluginDropDownList()
        }
      });
    } else {
      message.destroy();
      message.warn("Please select data");
    }
  };

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

  changeLocale(locale){
    this.setState({
      localeName:locale
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
          sorter: (a,b)=> a.pluginId - b.pluginId,
          width: 120,
          render: text => {
            const {pluginHandle} = this.props;
            const {pluginHandleList, pluginDropDownList} = pluginHandle;
            if (pluginHandleList) {
              pluginHandleList.forEach(item => {
                if (item.extObj) {
                  let obj = JSON.parse(item.extObj)
                  if (obj.required) {
                    item.required = obj.required
                  }
                  if (obj.defaultValue) {
                    item.defaultValue = obj.defaultValue
                  }
                  if (obj.placeholder) {
                    item.placeholder = obj.placeholder
                  }
                }
              })
            }
            if (pluginDropDownList) {
              let arr = pluginDropDownList.filter(item => item.id === text)
              if (arr && arr.length > 0) {
                return <div>{arr[0].name}</div>
              } else {
                return <div>111</div>
              }
            }
          }
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.FIELDNAME"),
          dataIndex: "field",
          key: "field",
          ellipsis: true,
          width: 200,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.LABEL"),
          dataIndex: "label",
          key: "label",
          ellipsis: true,
          width: 200,
          sorter: (a,b) => a.label > b.label ? 1 : -1,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.DATATYPE"),
          dataIndex: "dataType",
          key: "dataType",
          ellipsis: true,
          width: 100,
          render: text => {
            if (text === 1) {
              return <div>{getIntlContent("SHENYU.PLUGIN.DIGITAL")}</div>;
            } else if (text === 2) {
              return <div>{getIntlContent("SHENYU.PLUGIN.STRING")}</div>;
            } else if (text === 3) {
              return <div>{getIntlContent("SHENYU.PLUGIN.DROPDOWN")}</div>;
            }
            return <div>{getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}</div>;
          }
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.PLUGIN.FIELDTYPE"),
        dataIndex: "type",
        key: "type",
        ellipsis:true,
        width: 120,
        sorter: (a,b)=> a.type - b.type,
        render: text => {
          if (text === 1) {
            return <div>{getIntlContent("SHENYU.SELECTOR.NAME")}</div>;
          } else if (text === 2) {
            return <div>{getIntlContent("SHENYU.PLUGIN.RULES")}</div>;
          } else if (text === 3) {
            return <div>{getIntlContent("SHENYU.PLUGIN")}</div>;
          }return <div>{getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}</div>;
        }
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.PLUGIN.SORT"),
        dataIndex: "sort",
        key: "sort",
        ellipsis:true,
        width: 80,
        sorter: (a,b)=> a.sort - b.sort,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.PLUGIN.REQUIRED"),
        dataIndex: "required",
        key: "required",
        ellipsis:true,
        width: 120,
        sorter: (a,b) => (a.required || "-1") > (b.required || "-1") ? 1 : -1,
        render: text => {
          if (text === "1") {
            return <div>{getIntlContent("SHENYU.COMMON.YES")}</div>;
          } else if (text === "0") {
            return <div>{getIntlContent("SHENYU.COMMON.NO")}</div>;
          }return <div>{getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}</div>;
        }
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
          title: getIntlContent("SHENYU.SYSTEM.CREATETIME"),
          dataIndex: "dateCreated",
          key: "dateCreated",
          ellipsis: true,
          width: 180,
          sorter: (a,b) => a.dateCreated > b.dateCreated ? 1 : -1,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
          dataIndex: "dateUpdated",
          key: "dateUpdated",
          ellipsis: true,
          sorter: (a,b) => a.dateUpdated > b.dateUpdated ? 1 : -1,
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.COMMON.OPERAT"),
          dataIndex: "time",
          key: "time",
          ellipsis: true,
          fixed: 'right',
          width: 100,
          render: (text, record) => {
            return (
              <AuthButton perms="system:pluginHandler:edit">
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
    const {pluginHandle, loading} = this.props;
    const {pluginHandleList, total, pluginDropDownList} = pluginHandle;
    const {currentPage, selectedRowKeys, pluginId, field, popup, columns = []} = this.state;


    const tableColumns = columns.map((col, index) => ({
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
        <div style={{display: "flex"}}>
          <Select
            value={pluginId || undefined}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SHENYU.PLUGIN.SELECTNAME")}
            style={{ width: 240 }}
            allowClear
          >
            {
              pluginDropDownList && pluginDropDownList.map((item,i)=>{
              return(
                <Option key={i} value={item.id}>{item.name}</Option>
              )
              })
            }
          </Select>
          <Input
            value={field}
            onChange={this.fieldOnchange}
            placeholder={getIntlContent("SHENYU.PLUGIN.FIELDNAME")}
            style={{ width: 240, marginLeft: 20 }}
          />
          <AuthButton perms="system:pluginHandler:list">
            <Button
              type="primary"
              style={{ marginLeft: 20 }}
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
          <AuthButton perms="system:pluginHandler:delete">
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
                style={{marginLeft: 20}}
                type="danger"
              >
                {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
              </Button>
            </Popconfirm>
          </AuthButton>
          <AuthButton perms="system:pluginHandler:add">
            <Button
              style={{marginLeft: 20}}
              type="primary"
              onClick={this.addClick}
            >
              {getIntlContent("SHENYU.SYSTEM.ADDDATA")}
            </Button>
          </AuthButton>
        </div>
        <Table
          size="small"
          components={this.components}
          style={{marginTop: 30}}
          bordered
          loading={loading}
          columns={tableColumns}
          scroll={{ x: 1550 }}
          dataSource={pluginHandleList}
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
