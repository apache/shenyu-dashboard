import React, { Component } from 'react';
import { Table, Row, Col, Button } from 'antd';
import { connect } from 'dva';

@connect(({ waf }) => ({
  waf,
}))
export default class Waf extends Component {
  componentDidMount() { }

  render() {
    const selectColumns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '开启',
        dataIndex: 'open',
        key: 'open',
      },
      {
        title: '操作',
        dataIndex: 'operate',
        key: 'operate',
      },
    ];

    const rulesColumns = [
      {
        title: '规则名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '开启',
        dataIndex: 'open',
        key: 'open',
      },
      {
        title: '更新时间',
        dataIndex: 'time',
        key: 'time',
      },
      {
        title: '操作',
        dataIndex: 'operate',
        key: 'operate',
      },
    ];

    return (
      <div>
        <Row gutter={20}>
          <Col span={8}>
            <div className="table-header">
              <h3>选择器列表</h3>
              <Button type='primary'>添加选择器</Button>
            </div>
            <Table
              bordered
              size='small'
              columns={selectColumns}
              dataSource={[]}
            />
          </Col>
          <Col span={16}>
            <div className="table-header">
              <h3>选择器规则列表</h3>
              <Button type='primary'>添加规则</Button>
            </div>
            <Table
              bordered
              size='small'
              columns={rulesColumns}
              expandedRowRender={() => <p>111</p>}
              dataSource={[]}
            />
          </Col>
        </Row>
      </div>
    );
  }
}
