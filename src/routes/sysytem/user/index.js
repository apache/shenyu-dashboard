import React, { Component } from 'react';
import { Table, Row, Col, Input, Button } from 'antd';
import { connect } from 'dva';

@connect(({ manage, loading }) => ({
  manage,
  loading: loading.effects['manage/fetchUsers'],
}))
export default class Manage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      userName: '',
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const { currentPage, userName } = this.state;
    dispatch({
      type: 'manage/fetchUsers',
      payload: {
        userName,
        currentPage,
        pageSize: 10,
      },
    });
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
  };

  editClick = record => {
    console.log(record);
  };

  searchOnchange = e => {
    const userName = e.target.value;
    this.setState({ userName });
  };

  searchClick = () => {};

  render() {
    const { manage, loading } = this.props;
    const { userList } = manage;
    const { currentPage, selectedRowKeys, userName } = this.state;
    const userColumns = [
      {
        title: '用户名',
        dataIndex: 'userName',
        key: 'userName',
      },
      {
        title: '创建时间',
        dataIndex: 'dateCreated',
        key: 'dateCreated',
      },
      {
        title: '更新时间',
        dataIndex: 'dateUpdated',
        key: 'dateUpdated',
      },
      {
        title: '操作',
        dataIndex: 'operate',
        key: 'operate',
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
        },
      },
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <div>
        <Row type="flex" justify="flex-start" align="middle" gutter={50}>
          <Col span={10} className="searchblock">
            <Input
              value={userName}
              onChange={this.searchOnchange}
              size="large"
              placeholder="请输入用户名"
            />
            <Button type="primary" size="large" onClick={this.searchClick}>
              查询
            </Button>
          </Col>
          <Col span={6}>
            <Button type="danger" size="large">
              删除勾选数据
            </Button>
          </Col>
          <Col span={6}>
            <Button type="primary" size="large">
              添加数据
            </Button>
          </Col>
        </Row>
        <Table
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={userColumns}
          dataSource={userList}
          rowSelection={rowSelection}
          pagination={{
            total: 3,
            current: currentPage,
            pageSize: 10,
            onChange: this.pageOnchange,
          }}
        />
      </div>
    );
  }
}
