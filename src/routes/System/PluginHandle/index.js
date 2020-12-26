import React, {Component} from "react";
import {Table, Button, Popconfirm, message, Select} from "antd";
import {connect} from "dva";
import { resizableComponents } from '../../../utils/resizable';
import AddModal from "./AddModal";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import { emit } from '../../../utils/emit';

const { Option } = Select;

@connect(({pluginHandle, loading}) => ({
  pluginHandle,
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
      localeName:'',
      initColumns: false
    };
  }

  componentWillMount() {
    const {currentPage} = this.state;
    this.getAllPluginHandles(currentPage);
    this.getPluginDropDownList();
    this.initPluginColumns();
  }

  componentDidMount(){
    emit.on('change_language', lang => this.changeLocale(lang))
  }


  getAllPluginHandles = page => {
    const {dispatch} = this.props;
    const {pluginId} = this.state;
    dispatch({
      type: "pluginHandle/fetch",
      payload: {
        pluginId,
        currentPage: page,
        pageSize: 12
      }
    });
  };

  getPluginDropDownList = () => {
    const {dispatch} = this.props;
    dispatch({
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
                const { field, label, id, pluginId,dataType,type,sort,required,defaultValue } = values;
                let extObj
                if(required || defaultValue){
                  extObj=JSON.stringify({
                    'required':required,
                    'defaultValue':defaultValue
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
            const {pluginId, label, field, dataType,type,sort,required,defaultValue} = values;
            let extObj
            if(required || defaultValue){
              extObj=JSON.stringify({
                'required':required,
                'defaultValue':defaultValue
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
      message.warn("请选择数据");
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
    if (this.state.initColumns) {
      return;
    }
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.PLUGIN.NAME"),
          dataIndex: "pluginId",
          key: "pluginId",
          ellipsis: true,
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
          title: getIntlContent("SOUL.PLUGIN.FIELDNAME"),
          dataIndex: "field",
          key: "field",
          ellipsis: true,
          width: 180,
        },
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.LABEL"),
          dataIndex: "label",
          key: "label",
          ellipsis: true,
          width: 180,
        },
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.DATATYPE"),
          dataIndex: "dataType",
          key: "dataType",
          ellipsis: true,
          render: text => {
            if (text === 1) {
              return <div>{getIntlContent("SOUL.PLUGIN.DIGITAL")}</div>;
            } else if (text === 2) {
              return <div>{getIntlContent("SOUL.PLUGIN.STRING")}</div>;
            } else if (text === 3) {
              return <div>{getIntlContent("SOUL.PLUGIN.DROPDOWN")}</div>;
            }
            return <div>{getIntlContent("SOUL.PLUGIN.UNDEFINETYPE")}</div>;
          }
        },
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.FIELDTYPE"),
          dataIndex: "type",
          key: "type",
          ellipsis: true,
          render: text => {
            if (text === 1) {
              return <div>{getIntlContent("SOUL.SELECTOR.NAME")}</div>;
            } else if (text === 2) {
              return <div>{getIntlContent("SOUL.PLUGIN.RULES")}</div>;
            }
            return <div>{getIntlContent("SOUL.PLUGIN.UNDEFINETYPE")}</div>;
          }
        },
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.SORT"),
          dataIndex: "sort",
          key: "sort",
          ellipsis: true,
        },
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.REQUIRED"),
          dataIndex: "required",
          key: "required",
          ellipsis: true,
          render: text => {
            if (text === "1") {
              return <div>{getIntlContent("SOUL.COMMON.YES")}</div>;
            } else if (text === "0") {
              return <div>{getIntlContent("SOUL.COMMON.NO")}</div>;
            }
          }
        },
        {
          align: "center",
          title: getIntlContent("SOUL.PLUGIN.DEFAULTVALUE"),
          dataIndex: "defaultValue",
          key: "defaultValue",
          ellipsis: true,
        },
        {
          align: "center",
          title: getIntlContent("SOUL.SYSTEM.CREATETIME"),
          dataIndex: "dateCreated",
          key: "dateCreated",
          ellipsis: true,
        },
        {
          align: "center",
          title: getIntlContent("SOUL.SYSTEM.UPDATETIME"),
          dataIndex: "dateUpdated",
          key: "dateUpdated",
          ellipsis: true,
        },

        {
          align: "center",
          title: getIntlContent("SOUL.COMMON.OPERAT"),
          dataIndex: "time",
          key: "time",
          ellipsis: true,
          render: (text, record) => {
            return (
              <div>
                <div
                  className="edit"
                  onClick={() => {
                    this.editClick(record);
                  }}
                >
                  {getIntlContent("SOUL.SYSTEM.EDITOR")}
                </div>
              </div>

            );
          }
        }
      ]
    })
    this.setState({"initColumns":true})
  }

  render() {
    const {pluginHandle, loading} = this.props;
    const {pluginHandleList, total, pluginDropDownList} = pluginHandle;
    const {currentPage, selectedRowKeys, pluginId, popup} = this.state;


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
        <div style={{display: "flex"}}>
          <Select
            value={pluginId || undefined}
            onChange={this.searchOnchange}
            placeholder={getIntlContent("SOUL.PLUGIN.SELECTNAME")}
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
          <Button
            type="primary"
            style={{ marginLeft: 20 }}
            onClick={this.searchClick}
          >
            {getIntlContent("SOUL.SYSTEM.SEARCH")}
          </Button>
          <Popconfirm
            title={getIntlContent("SOUL.COMMON.DELETE")}
            placement='bottom'
            onConfirm={() => {
              this.deleteClick()
            }}
            okText={getIntlContent("SOUL.COMMON.SURE")}
            cancelText={getIntlContent("SOUL.COMMON.CALCEL")}
          >
            <Button
              style={{marginLeft: 20}}
              type="danger"
            >
              {getIntlContent("SOUL.COMMON.DELETE")}
            </Button>
          </Popconfirm>
          <Button
            style={{marginLeft: 20}}
            type="primary"
            onClick={this.addClick}
          >
            {getIntlContent("SOUL.SYSTEM.ADDDATA")}
          </Button>
        </div>
        <Table
          size="small"
          components={this.components}
          style={{marginTop: 30}}
          bordered
          loading={loading}
          columns={columns}
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
