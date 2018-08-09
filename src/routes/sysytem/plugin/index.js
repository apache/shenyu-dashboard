import React, { Component } from 'react';
import { Table, Row, Col, Input, Button } from 'antd';
import { connect } from 'dva';

@connect(({ plugin, loading }) => ({
  plugin,
  loading: loading.effects['plugin/fetchList'],
}))
export default class Plugin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      name: '',
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const { currentPage, name } = this.state;
    dispatch({
      type: 'plugin/fetchList',
      payload: {
        name,
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
    const name = e.target.value;
    this.setState({ name });
  };

  searchClick = () => { 
    const { dispatch } = this.props;
    const { name } = this.state;
    dispatch({
      type: 'plugin/fetchList',
      payload: {
        name,
        currentPage: 1,
        pageSize: 10,
      },
    });
  };

  render() {
    const { plugin, loading } = this.props;
    const { pluginList } = plugin;
    const { currentPage, selectedRowKeys, name } = this.state;
    const pluginColumns = [
      {
        title: '插件名',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '状态',
        dataIndex: 'enabled',
        key: 'enabled',
        render: (text) => {
          if (text) {
            return <div>开启</div>
          } else {
            return <div>关闭</div>
          }
        },
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
        <Row type="flex" justify="flex-start" align="middle" gutter={20}>
          <Col span={8} className="searchblock">
            <Input
              value={name}
              onChange={this.searchOnchange}
              placeholder="请输入用户名"
            />
            <Button type="primary" onClick={this.searchClick}>
              查询
            </Button>
          </Col>
          <Col span={4}>
            <Button
              type="danger"
              onClick={this.deleteClick}
            >
              删除勾选数据
            </Button>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              onClick={this.addClick}
            >
              添加数据
            </Button>
          </Col>
        </Row>
        <Table
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={pluginColumns}
          dataSource={pluginList}
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
