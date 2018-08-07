import React, { Component } from 'react';
import { Table } from 'antd';
import { connect } from 'dva';

@connect(({ manage }) => ({
  manage,
}))
export default class Manage extends Component {
  componentDidMount() {}

  render() {
    const userColumns = [
      {
        title: '用户名',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '创建时间',
        dataIndex: 'open',
        key: 'open',
      },
      {
        title: '更新时间',
        dataIndex: 'operate',
        key: 'operate',
      },
    ];
    return (
      <div>
        <div>search</div>
        <Table columns={userColumns} dataSource={[]} />
      </div>
    );
  }
}
