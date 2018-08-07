import React, { Component } from 'react';
import { Table } from 'antd';
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
    }
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    dispatch({
      type: 'manage/fetchUsers',
      payload: {
        userName: '',
        currentPage,
        pageSize: 10,
      },
    })
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  }

  pageOnchange = (page) => {
    this.setState({ currentPage: page });
  }

  editClick = (record) => {
    console.log(record);
  }

  render() {
    const { manage, loading } = this.props;
    const { userList } = manage;
    const { currentPage, selectedRowKeys } = this.state;
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
              className='edit'
              onClick={() => {
                this.editClick(record);
              }}
            >
              编辑
            </div>)
        },
      },
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <div>
        <div>search</div>
        <Table
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
