import React, { Component } from "react";
import { Table, Input, Button, message, Popconfirm } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";

@connect(({ metadata, loading }) => ({
  metadata,
  loading: loading.effects["metadata/fetch"]
}))
export default class Metadata extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      appName: "",
      popup: ""
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllMetadata(currentPage);
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllMetadata = page => {
    const { dispatch } = this.props;
    const { appName } = this.state;
    dispatch({
      type: "metadata/fetch",
      payload: {
        appName,
        currentPage: page,
        pageSize: 12
      }
    });
  };
  
  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllMetadata(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const name = this.state.appName;
    dispatch({
      type: "metadata/fetchItem",
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
                const { appName, methodName,id, parameterTypes,path, rpcExt, rpcType, serviceName } = values;
                dispatch({
                  type: "metadata/update",
                  payload: {
                    appName,
                    methodName,
                    parameterTypes,
                    // enabled,
                    id,
                    path,
                    rpcExt,
                    rpcType,
                    serviceName
                  },
                  fetchValue: {
                    appName: name,
                    currentPage,
                    pageSize: 12
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
    const appName = e.target.value;
    this.setState({ appName });
  };

  searchClick = () => {
    this.getAllMetadata(1);
    this.setState({ currentPage: 1 });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { appName, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      // console.log('000000000000000000')
      // console.log(selectedRowKeys)
      // console.log('000000000000000000')
      dispatch({
        type: "metadata/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          appName,
          currentPage,
          pageSize: 12
        },
        callback: () => {
          this.setState({ selectedRowKeys: [] });
        }
      });
    } else {
      message.destroy();
      message.warn("请选择数据");
    }
  };

  addClick = () => {
    const { currentPage } = this.state;
    const name = this.state.appName;
    this.setState({
      popup: (
        <AddModal
          isShow={true}
          handleOk={values => {
            const { dispatch } = this.props;
            const { appName, enabled, methodName, parameterTypes,path, rpcExt, rpcType, serviceName } = values;
            dispatch({
              type: "metadata/add",
              payload: {
                appName,
                methodName,
                enabled,
                parameterTypes,
                path,
                rpcExt,
                rpcType,
                serviceName
              },
              fetchValue: {
                appName: name,
                currentPage,
                pageSize: 12
              },
              callback: () => {
                this.setState({ selectedRowKeys: [] });
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
    const { appName, currentPage, selectedRowKeys } = this.state;
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
              pageSize: 12
            },
            callback: () => {
              this.setState({ selectedRowKeys: [] });
            }
          });
        }
      })
    } else {
      message.destroy();
      message.warn("请选择数据");
    }
  };
  syncData = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "metadata/syncDa"
      
    })
  };

  render() {
    const { metadata, loading } = this.props;
    const { userList, total } = metadata;
    
    const { currentPage, selectedRowKeys, appName, popup } = this.state;
    const userColumns = [
      {
        align: "center",
        title: "应用名称",
        dataIndex: "appName",
        key: "appName"
      },
      {
        align: "center",
        title: "路径",
        dataIndex: "path",
        key: "path"
      },
      {
        align: "center",
        title: "服务接口",
        dataIndex: "serviceName",
        key: "serviceName"
      },
      {
        align: "center",
        title: "方法名称",
        dataIndex: "methodName",
        key: "methodName"
      },
      {
        align: "center",
        title: "参数类型",
        dataIndex: "parameterTypes",
        key: "parameterTypes"
      },
      {
        align: "center",
        title: "rpc类型",
        dataIndex: "rpcType",
        key: "rpcType"
      },
      {
        align: "center",
        title: "rpc扩展参数",
        dataIndex: "rpcExt",
        key: "rpcExt"
      },
      {
        align: "center",
        title: "状态",
        dataIndex: "enabled",
        key: "enabled",
        render: text => {
          if (text) {
            return <div className="open">开启</div>;
          } else {
            return <div className="close">关闭</div>;
          }
        }
      },
      {
        align: "center",
        title: "操作",
        dataIndex: "operate",
        key: "operate",
        render: (text, record) => {
          return (
            <div
              className="edit"
              onClick={() => {
                this.editClick(record);
              }}
            >
              编辑
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
        <div style={{ display: "flex" }}>
          <Input
            value={appName}
            onChange={this.searchOnchange}
            placeholder="请输入appName"
            style={{ width: 240 }}
          />
          <Button
            style={{ marginLeft: 20 }}
            type="primary"
            onClick={this.searchClick}
          >
            分页查询
          </Button>
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
              style={{ marginLeft: 20 }}
              type="danger"
            >
              删除勾选数据
            </Button>
          </Popconfirm>
          <Button
            style={{ marginLeft: 20 }}
            type="primary"
            onClick={this.addClick}
          >
            创建
          </Button>
          <Button
            style={{ marginLeft: 20 }}
            type="primary"
            onClick={this.enableClick}
          >
            批量启用或禁用
          </Button>
          <Button
            style={{ marginLeft: 20 }}
            type="primary"
            onClick={this.syncData}
          >
            同步数据
          </Button>
          
          
          
          
        </div>

        <Table
          size="small"
          style={{ marginTop: 30 }}
          bordered
          rowKey={record => record.id} 
          loading={loading}
          columns={userColumns}
          dataSource={userList}
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
