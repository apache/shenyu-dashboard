import React, { Component } from 'react';
import { Table, Row, Col, Input, Button } from 'antd';
import { connect } from 'dva';
import AddModal from './AddModal';

@connect(({ plugin, loading }) => ({
  plugin,
  loading: loading.effects['plugin/fetch'],
}))
export default class Plugin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      name: '',
      popup: '',
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllPlugins(currentPage);
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllPlugins = (page) => {
    const { dispatch } = this.props;
    const { name } = this.state;
    dispatch({
      type: 'plugin/fetch',
      payload: {
        name,
        currentPage: page,
        pageSize: 10,
      },
    });
  }

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllPlugins(page);
  };

  closeModal = () => {
    this.setState({ popup: '' });
  }

  editClick = record => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/fetchItem',
      payload: {
        id: record.id,
      },
      callback: (user) => {
        this.setState({
          popup: <AddModal
            {...user}
            handleOk={(values) => {
              const { name, password, role, enabled, id } = values;
              dispatch({
                type: 'plugin/update',
                payload: {
                  name,
                  password,
                  role,
                  enabled,
                  id,
                },
                callback: () => {
                  this.closeModal();
                },
              });

            }}
            handleCancel={() => {
              this.closeModal();
            }}
          />,
        })
      },
    });
  };

  searchOnchange = e => {
    const name = e.target.value;
    this.setState({ name });
  };

  searchClick = () => {
    this.getAllPlugins(1);
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { name, currentPage, selectedRowKeys } = this.state;
    dispatch({
      type: 'plugin/delete',
      payload: {
        name,
        currentPage,
        pageSize: 10,
        list: selectedRowKeys,
      },
    });
  }

  addClick = () => {
    this.setState({
      popup: <AddModal
        handleOk={(values) => {
          const { dispatch } = this.props;
          const { name, password, role, enabled } = values;
          dispatch({
            type: 'plugin/add',
            payload: {
              name,
              password,
              role,
              enabled,
            },
            callback: () => {
              this.closeModal();
            },
          });
        }}
        handleCancel={() => {
          this.closeModal();
        }}
      />,
    })
  }

  render() {
    const { plugin, loading } = this.props;
    const { pluginList } = plugin;
    const { currentPage, selectedRowKeys, name, popup } = this.state;
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
              placeholder="请输入插件名"
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
          size='small'
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
        {popup}
      </div>
    );
  }
}