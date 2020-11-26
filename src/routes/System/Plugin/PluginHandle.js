import React, {Component} from "react";
import {Table, Button, Popconfirm, message} from "antd";
import {connect} from "dva";
import AddPluginHandle from "./AddPluginHandle";

@connect(({pluginHandle, loading}) => ({
  pluginHandle,
  loading: loading.effects["pluginHandle/fetch"]
}))
export default class PluginHandle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      pluginId: this.props.match.params.pluginId,
      popup: ""
    };
  }

  componentWillMount() {
    let {currentPage} = this.state;
    this.getPluginHandlesByPluginId(currentPage);
  }


  getPluginHandlesByPluginId = page => {
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


  closeModal = () => {
    this.setState({ popup: "" });
  };


  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const localPluginId = this.state.pluginId;
    dispatch({
      type: "pluginHandle/fetchItem",
      payload: {
        id: record.id
      },
      callback: pluginHandle => {
        this.setState({
          popup: (
            <AddPluginHandle
              disabled={true}
              {...pluginHandle}
              handleOk={values => {
                const { field, label, id, pluginId,dataType,type,sort } = values;
                dispatch({
                  type: "pluginHandle/update",
                  payload: {
                    field,
                    label,
                    id,
                    pluginId,
                    dataType,
                    type,
                    sort
                  },
                  fetchValue: {
                    name: localPluginId,
                    currentPage,
                    pageSize: 12
                  },
                  callback: () => {
                    this.closeModal();
                    dispatch({
                      type: "pluginHandle/fetch",
                      payload: {
                        pluginId,
                        currentPage: {currentPage},
                        pageSize: 12
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


  addClick = () => {
    const {currentPage} = this.state;
    const localPluginId = this.state.pluginId;
    this.setState({
      popup: (
        <AddPluginHandle
          pluginId={localPluginId}
          handleOk={values => {
            const {dispatch} = this.props;
            const {pluginId, label, field, dataType,type,sort} = values;
            dispatch({
              type: "pluginHandle/add",
              payload: {
                pluginId,
                label,
                field,
                dataType,
                type,
                sort
              },
              fetchValue: {
                pluginId: localPluginId,
                currentPage,
                pageSize: 12
              },
              callback: () => {
                this.closeModal();
                dispatch({
                  type: "pluginHandle/fetch",
                  payload: {
                    pluginId,
                    currentPage: {currentPage},
                    pageSize: 12
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

  onSelectChange = selectedRowKeys => {

    this.setState({ selectedRowKeys });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { pluginId, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "pluginHandle/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          pluginId,
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
              pluginId,
              currentPage: {currentPage},
              pageSize: 12
            }
          });
        }
      });
    } else {
      message.destroy();
      message.warn("请选择数据");
    }
  };

  render() {
    const {pluginHandle, loading} = this.props;
    const {pluginHandleList, total} = pluginHandle;
    const {currentPage, selectedRowKeys, popup} = this.state;

    const pluginColumns = [
      {
        align: "center",
        title: "字段名",
        dataIndex: "field",
        key: "field",
        width: 200
      },
      {
        align: "center",
        title: "标签",
        dataIndex: "label",
        key: "label",
        width: 200
      },
      {
        align: "center",
        title: "数据类型",
        dataIndex: "dataType",
        key: "dataType",
        width: 200,
        render: text => {
          if (text === "1") {
            return <div>数字</div>;
          } else if (text === "2") {
            return <div>字符串</div>;
          } else if (text === "3") {
            return <div>下拉框</div>;
          }
          return <div>未知类型</div>;
        }
      },
      {
        align: "center",
        title: "字段所属类型",
        dataIndex: "type",
        key: "type",
        width: 200,
        render: text => {
          if (text === "1") {
            return <div>选择器</div>;
          } else if (text === "2") {
            return <div>规则</div>;
          }return <div>未知类型</div>;
        }
      },
      {
        align: "center",
        title: "排序",
        dataIndex: "sort",
        key: "sort",
        width: 160
      },
      {
        align: "center",
        title: "创建时间",
        dataIndex: "dateCreated",
        key: "dateCreated",
        width: 160
      },
      {
        align: "center",
        title: "更新时间",
        dataIndex: "dateUpdated",
        key: "dateUpdated",
        width: 160
      },

      {
        align: "center",
        title: "操作",
        dataIndex: "time",
        key: "time",
        width: 300,
        render: (text, record) => {
          return (
            <div>
              <div
                className="edit"
                onClick={() => {
                  this.editClick(record);
                }}
              >
                编辑
              </div>
            </div>

          );
        }
      }
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };

    return (
      <div className="plug-content-wrap">
        <div style={{display: "flex"}}>
          <Popconfirm
            title="你确认删除吗"
            placement='bottom'
            onConfirm={() => {
              this.deleteClick()
            }}
            okText="确认"
            cancelText="取消"
          >
            <Button
              style={{marginLeft: 20}}
              type="danger"
            >
              删除勾选数据
            </Button>
          </Popconfirm>
          <Button
            style={{marginLeft: 20}}
            type="primary"
            onClick={this.addClick}
          >
            添加数据
          </Button>
        </div>

        <Table
          size="small"
          style={{marginTop: 30}}
          bordered
          loading={loading}
          columns={pluginColumns}
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
