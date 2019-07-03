import React, { Component } from "react";
import { Table, Input, Button, message, Popconfirm } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";

@connect(({ manage, loading }) => ({
  manage,
  loading: loading.effects["manage/fetch"]
}))
export default class Manage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      userName: "",
      popup: ""
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllUsers(currentPage);
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllUsers = page => {
    const { dispatch } = this.props;
    const { userName } = this.state;
    dispatch({
      type: "manage/fetch",
      payload: {
        userName,
        currentPage: page,
        pageSize: 12
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllUsers(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const name = this.state.userName;
    dispatch({
      type: "manage/fetchItem",
      payload: {
        id: record.id
      },
      callback: user => {
        this.setState({
          popup: (
            <AddModal
              {...user}
              handleOk={values => {
                const { userName, password, role, enabled, id } = values;
                dispatch({
                  type: "manage/update",
                  payload: {
                    userName,
                    password,
                    role,
                    enabled,
                    id
                  },
                  fetchValue: {
                    userName: name,
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
    const userName = e.target.value;
    this.setState({ userName });
  };

  searchClick = () => {
    this.getAllUsers(1);
    this.setState({ currentPage: 1 });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { userName, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "manage/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          userName,
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
    const name = this.state.userName;
    this.setState({
      popup: (
        <AddModal
          handleOk={values => {
            const { dispatch } = this.props;
            const { userName, password, role, enabled } = values;
            dispatch({
              type: "manage/add",
              payload: {
                userName,
                password,
                role,
                enabled
              },
              fetchValue: {
                userName: name,
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

  render() {
    const { manage, loading } = this.props;
    const { userList, total } = manage;
    const { currentPage, selectedRowKeys, userName, popup } = this.state;
    const userColumns = [
      {
        align: "center",
        title: "用户名",
        dataIndex: "userName",
        key: "userName"
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
        title: "创建时间",
        dataIndex: "dateCreated",
        key: "dateCreated"
      },
      {
        align: "center",
        title: "更新时间",
        dataIndex: "dateUpdated",
        key: "dateUpdated"
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
            value={userName}
            onChange={this.searchOnchange}
            placeholder="请输入用户名"
            style={{ width: 240 }}
          />
          <Button
            style={{ marginLeft: 20 }}
            type="primary"
            onClick={this.searchClick}
          >
            查询
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
            添加数据
          </Button>
        </div>

        <Table
          size="small"
          style={{ marginTop: 30 }}
          bordered
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
