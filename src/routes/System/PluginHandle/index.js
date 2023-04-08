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
import {Table, Button, Popconfirm, message, Select, Input, Popover, Tag} from "antd";
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
      pageSize: 12,
      selectedRowKeys: [],
      pluginDict: [],
      popup: "",
      pluginId:'',
      field: '',
      localeName: window.sessionStorage.getItem('locale') ? window.sessionStorage.getItem('locale') : 'en-US',
    };
  }

  componentWillMount = async () => {
    await this.loadPluginDict();

    this.initPluginColumns();

    this.query()
  }

  componentDidUpdate = async () => {
    const { language } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      await this.loadPluginDict();
      this.initPluginColumns();
      this.changeLocale(language);
    }
  }

  /**
   * condition query page list
   */
  query = () => {
    const {dispatch} = this.props;
    const {pluginId, field, currentPage, pageSize} = this.state;
    dispatch({
      type: "pluginHandle/fetch",
      payload: {
        pluginId,
        field,
        currentPage,
        pageSize
      }
    });
  };

  /**
   * load plugin drop dict
   */
  loadPluginDict = async () => {
    const {dispatch} = this.props;
    await dispatch({
      type: "pluginHandle/fetchPluginList",
    });
    this.setState({pluginDict: this.props.pluginHandle.pluginDropDownList})
  };

  pageOnchange = page => {
    this.setState({ currentPage: page },this.query);
  };

  onShowSizeChange = (currentPage,pageSize) => {
    this.setState({ currentPage: 1,pageSize }, this.query);
  };

  /**
   * close model
   * @param reset after is reset search condition
   */
  closeModal = (reset = false) => {
    this.setState(reset ? { popup: "" ,currentPage: 1, pluginId: '',field: ''} : {popup: ""},this.query);
  };

  searchOnchange = e => {
    this.setState({ pluginId: e, currentPage: 1}, this.query);
  };

  fieldOnchange = e => {
    this.setState({ field: e.target.value, currentPage: 1}, this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1}, this.query);
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage,pageSize } = this.state;
    this.loadPluginDict()
    const pluginDropDownList = this.state.pluginDict
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
                    pageSize
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

  addClick = () => {
    const {currentPage,pageSize} = this.state;
    this.loadPluginDict()
    const pluginDropDownList = this.state.pluginDict
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
                pageSize
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
  };

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { currentPage, pageSize, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "pluginHandle/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          currentPage,
          pageSize
        },
        callback: () => {
          this.setState({ selectedRowKeys: [],currentPage:1 },this.query);
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
          width: 140,
          render: text => {
            const {pluginHandle} = this.props;
            const {pluginHandleList} = pluginHandle;
            const pluginDropDownList = this.state.pluginDict;
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
                return <div style={{color: "#260033","fontWeight":"bold"}}>{arr[0].name}</div>
              } else {
                return <div>text</div>
              }
            }
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
              return <Tag color="cyan">{getIntlContent("SHENYU.SELECTOR.NAME")}</Tag>;
            } else if (text === 2) {
              return <Tag color="purple">{getIntlContent("SHENYU.PLUGIN.RULES")}</Tag>;
            } else if (text === 3) {
              return <Tag color="blue">{getIntlContent("SHENYU.PLUGIN")}</Tag>;
            }
            return <Tag color="red">{getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}</Tag>;
          }
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.PLUGIN.FIELDNAME"),
          dataIndex: "field",
          key: "field",
          ellipsis: true,
          // width: 200,
          render: (text, record) => {
            let content =(
              <div>
                <p>{record.label}</p>
                <p>{getIntlContent("SHENYU.SYSTEM.CREATETIME")}:{record.dateCreated}</p>
                <p>{getIntlContent("SHENYU.SYSTEM.UPDATETIME")}:{record.dateUpdated}</p>
              </div>
            );
            return <Popover placement="topLeft" content={content} title={getIntlContent("SHENYU.PLUGIN.LABEL")}><div style={{color: "#1f640a"}}>{text || "----"}</div></Popover>
          }
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
              return <span style={{color:"green",fontWeight:"bold"}}>{getIntlContent("SHENYU.COMMON.YES")}</span>;
            } else if (text === "0") {
              return <span style={{color:"red",fontWeight:"bold"}}>{getIntlContent("SHENYU.COMMON.NO")}</span>;
            }
            return <span style={{color:"orange",fontWeight:"bold"}}>{getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}</span>;
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
          title: getIntlContent("SHENYU.PLUGIN.DATATYPE"),
          dataIndex: "dataType",
          key: "dataType",
          ellipsis: true,
          width: 100,
          render: text => {
            if (text === 1) {
              return <Tag color="green">{getIntlContent("SHENYU.PLUGIN.DIGITAL")}</Tag>;
            } else if (text === 2) {
              return <Tag color="orange">{getIntlContent("SHENYU.PLUGIN.STRING")}</Tag>;
            } else if (text === 3) {
              return <Tag color="magenta">{getIntlContent("SHENYU.PLUGIN.DROPDOWN")}</Tag>;
            }
            return <Tag color="red">{getIntlContent("SHENYU.PLUGIN.UNDEFINETYPE")}</Tag>;
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
    const {pluginHandleList, total} = pluginHandle;
    const pluginDropDownList = this.state.pluginDict
    const {currentPage, pageSize, selectedRowKeys, pluginId, field, popup, columns = []} = this.state;


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
            showSearch
            filterOption={(input, option) =>
                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
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
          // scroll={{ x: 1550 }}
          dataSource={pluginHandleList}
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
