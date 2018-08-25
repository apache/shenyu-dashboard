import React, { Component } from "react";
import { Table, Row, Col, Input, Button, message } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";

@connect(({ auth, loading }) => ({
  auth,
  loading: loading.effects["auth/fetchAuths"]
}))
export default class AppAuth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      appKey: "",
      popup: ""
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllAuths(currentPage);
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllAuths = page => {
    const { dispatch } = this.props;
    const { appKey } = this.state;
    dispatch({
      type: "auth/fetchAuths",
      payload: {
        appKey,
        currentPage: page,
        pageSize: 10
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllAuths(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    dispatch({
      type: "auth/fetchItem",
      payload: {
        id: record.id
      },
      callback: auth => {
        this.setState({
          popup: (
            <AddModal
              {...auth}
              handleOk={values => {
                const { appKey, password, role, enabled, id } = values;
                dispatch({
                  type: "auth/update",
                  payload: {
                    appKey,
                    password,
                    role,
                    enabled,
                    id
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
    const appKey = e.target.value;
    this.setState({ appKey });
  };

  searchClick = () => {
    this.getAllAuths(1);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { appKey, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "auth/delete",
        payload: {
          appKey,
          currentPage,
          pageSize: 10,
          list: selectedRowKeys
        }
      });
    } else {
      message.destroy();
      message.warn("请选择数据");
    }
  };

  addClick = () => {
    this.setState({
      popup: (
        <AddModal
          handleOk={values => {
            const { dispatch } = this.props;
            const { appKey, password, role, enabled } = values;
            dispatch({
              type: "auth/add",
              payload: {
                appKey,
                password,
                role,
                enabled
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
  };

  render() {
    const { auth, loading } = this.props;
    const { authList } = auth;
    const { currentPage, selectedRowKeys, appKey, popup } = this.state;
    const authColumns = [
      {
        title: "appKey",
        dataIndex: "appKey",
        key: "appKey"
      },
      {
        title: "appSecret",
        dataIndex: "appSecret",
        key: "appSecret"
      },
      {
        title: "状态",
        dataIndex: "enabled",
        key: "enabled",
        render: text => {
          if (text) {
            return <div>开启</div>;
          } else {
            return <div>关闭</div>;
          }
        }
      },
      {
        title: "创建时间",
        dataIndex: "dateCreated",
        key: "dateCreated"
      },
      {
        title: "更新时间",
        dataIndex: "dateUpdated",
        key: "dateUpdated"
      },
      {
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
      <div>
        <Row type="flex" justify="flex-start" align="middle" gutter={20}>
          <Col span={8} className="searchblock">
            <Input
              value={appKey}
              onChange={this.searchOnchange}
              placeholder="请输入"
            />
            <Button type="primary" onClick={this.searchClick}>
              查询
            </Button>
          </Col>
          <Col span={4}>
            <Button type="danger" onClick={this.deleteClick}>
              删除勾选数据
            </Button>
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={this.addClick}>
              添加数据
            </Button>
          </Col>
        </Row>
        <Table
          size="small"
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={authColumns}
          dataSource={authList}
          rowSelection={rowSelection}
          pagination={{
            total: 3,
            current: currentPage,
            pageSize: 10,
            onChange: this.pageOnchange
          }}
        />
        {popup}
      </div>
    );
  }
}
