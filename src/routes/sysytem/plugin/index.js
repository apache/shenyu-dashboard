import React, { Component } from "react";
import { Table,Input, Button, message } from "antd";
import { connect } from "dva";
import AddModal from "./AddModal";

@connect(({ plugin, loading }) => ({
  plugin,
  loading: loading.effects["plugin/fetch"]
}))
export default class Plugin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      selectedRowKeys: [],
      name: "",
      popup: ""
    };
  }

  componentWillMount() {
    const { currentPage } = this.state;
    this.getAllPlugins(currentPage);
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  getAllPlugins = page => {
    const { dispatch } = this.props;
    const { name } = this.state;
    dispatch({
      type: "plugin/fetch",
      payload: {
        name,
        currentPage: page,
        pageSize: 12
      }
    });
  };

  pageOnchange = page => {
    this.setState({ currentPage: page });
    this.getAllPlugins(page);
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  editClick = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const pluginName = this.state.name;
    dispatch({
      type: "plugin/fetchItem",
      payload: {
        id: record.id
      },
      callback: plugin => {
        this.setState({
          popup: (
            <AddModal
              disabled={true}
              {...plugin}
              handleOk={values => {
                const { code, enabled, id } = values;
                dispatch({
                  type: "plugin/update",
                  payload: {
                    code,
                    enabled,
                    id
                  },
                  fetchValue: {
                    name: pluginName,
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
    const name = e.target.value;
    this.setState({ name });
  };

  searchClick = () => {
    this.getAllPlugins(1);
    this.setState({ currentPage: 1 });
  };

  deleteClick = () => {
    const { dispatch } = this.props;
    const { name, currentPage, selectedRowKeys } = this.state;
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      dispatch({
        type: "plugin/delete",
        payload: {
          list: selectedRowKeys
        },
        fetchValue: {
          name,
          currentPage,
          pageSize: 12
        }
      });
    } else {
      message.destroy();
      message.warn("请选择数据");
    }
  };

  addClick = () => {
    const { currentPage } = this.state;
    const pluginName = this.state.name;
    this.setState({
      popup: (
        <AddModal
          disabled={false}
          handleOk={values => {
            const { dispatch } = this.props;
            const { code, enabled } = values;
            dispatch({
              type: "plugin/add",
              payload: {
                code,
                enabled
              },
              fetchValue: {
                name: pluginName,
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
  };

  // 同步插件数据
  syncAllClick = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "plugin/asyncAll"
    });
  };

  render() {
    const { plugin, loading } = this.props;
    const { pluginList, total } = plugin;
    const { currentPage, selectedRowKeys, name, popup } = this.state;
    const pluginColumns = [
      {
        align: "center",
        title: "插件名",
        dataIndex: "name",
        key: "name"
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
            value={name}
            onChange={this.searchOnchange}
            placeholder="请输入插件名"
            style={{ width: 240 }}
          />
          <Button
            type="primary"
            style={{ marginLeft: 20 }}
            onClick={this.searchClick}
          >
            查询
          </Button>
          <Button
            style={{ marginLeft: 20 }}
            type="danger"
            onClick={this.deleteClick}
          >
            删除勾选数据
          </Button>
          <Button
            style={{ marginLeft: 20 }}
            type="primary"
            onClick={this.addClick}
          >
            添加数据
          </Button>
          <Button
            style={{ marginLeft: 20 }}
            icon="reload"
            type="primary"
            onClick={this.syncAllClick}
          >
            同步所有数据
          </Button>
        </div>

        <Table
          size="small"
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={pluginColumns}
          dataSource={pluginList}
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
