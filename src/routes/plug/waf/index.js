import React, { Component } from "react";
import { Table, Row, Col, Button } from "antd";
import { connect } from "dva";
import Selector from "./Selector";
import Rule from "./Rule";

@connect(({ waf, global, loading }) => ({
  waf,
  platform: global.platform,
  loading: loading.effects["global/fetchPlatform"]
}))
export default class Waf extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorPage: 1,
      rulePage: 1,
      popup: ""
    };
  }

  componentDidMount() {
    this.getAllSelectors(1);
  }

  getAllSelectors = page => {
    const { dispatch } = this.props;

    dispatch({
      type: "waf/fetchSelector",
      payload: {
        pluginId: this.getPluginId("waf"),
        currentPage: page,
        pageSize: 12
      }
    });
  };

  getPluginId = name => {
    const { platform } = this.props;
    const { pluginEnums } = platform;
    const plugin = pluginEnums.filter(item => {
      return item.name === name;
    });
    if (plugin && plugin.length > 0) {
      return plugin[0].code;
    } else {
      return "";
    }
  };

  closeModal = () => {
    this.setState({ popup: "" });
  };

  addSelector = () => {
    const { selectorPage } = this.state;
    const { dispatch } = this.props;
    const pluginId = this.getPluginId("waf");
    this.setState({
      popup: (
        <Selector
          pluginId={this.getPluginId()}
          handleOk={selector => {
            dispatch({
              type: "waf/addSelector",
              payload: { pluginId, ...selector },
              fetchValue: { pluginId, currentPage: selectorPage, pageSize: 12 },
              callback: () => {
                this.closeModal();
              }
            });
          }}
          onCancel={this.closeModal}
        />
      )
    });
  };

  addRule = () => {
    this.setState({ popup: <Rule onCancel={this.closeModal} /> });
  };

  editSelector = record => {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    const pluginId = this.getPluginId("waf");
    dispatch({
      type: "waf/fetchSeItem",
      payload: {
        id: record.id
      },
      callback: selector => {
        this.setState({
          popup: (
            <Selector
              {...selector}
              handleOk={values => {
                const { appKey, appSecret, enabled, id } = values;
                dispatch({
                  type: "waf/update",
                  payload: {
                    appKey,
                    appSecret,
                    enabled,
                    id
                  },
                  fetchValue: {
                    pluginId,
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

  deleteSelector = record => {
    console.log(record);
  };

  pageSelectorChange = page => {
    this.setSate({ selectorPage: page });
  };

  pageRuleChange = page => {
    this.setState({ rulePage: page });
  };

  render() {
    const { popup, selectorPage, rulePage } = this.state;
    const { waf } = this.props;
    const { selectorList, ruleList, selectorTotal, ruleTotal } = waf;
    const selectColumns = [
      {
        title: "名称",
        dataIndex: "name",
        key: "name"
      },
      {
        title: "开启",
        dataIndex: "open",
        key: "open"
      },
      {
        title: "操作",
        dataIndex: "operate",
        key: "operate",
        render: (text, record) => {
          return (
            <div>
              <span
                className="edit"
                onClick={() => {
                  this.editSelector(record);
                }}
              >
                修改
              </span>
              <span
                className="edit"
                onClick={() => {
                  this.deleteSelector(record);
                }}
              >
                删除
              </span>
            </div>
          );
        }
      }
    ];

    const rulesColumns = [
      {
        title: "规则名称",
        dataIndex: "name",
        key: "name"
      },
      {
        title: "开启",
        dataIndex: "open",
        key: "open"
      },
      {
        title: "更新时间",
        dataIndex: "time",
        key: "time"
      },
      {
        title: "操作",
        dataIndex: "operate",
        key: "operate",
        render: () => {
          return (
            <div>
              <span className="edit">修改</span>
              <span className="edit">删除</span>
            </div>
          );
        }
      }
    ];

    return (
      <div>
        <Row gutter={20}>
          <Col span={8}>
            <div className="table-header">
              <h3>选择器列表</h3>
              <Button type="primary" onClick={this.addSelector}>
                添加选择器
              </Button>
            </div>
            <Table
              size="small"
              style={{ marginTop: 30 }}
              bordered
              columns={selectColumns}
              dataSource={selectorList}
              pagination={{
                total: selectorTotal,
                current: selectorPage,
                pageSize: 12,
                onChange: this.pageSelectorChange
              }}
            />
          </Col>
          <Col span={16}>
            <div className="table-header">
              <h3>选择器规则列表</h3>
              <Button type="primary" onClick={this.addRule}>
                添加规则
              </Button>
            </div>
            <Table
              size="small"
              style={{ marginTop: 30 }}
              bordered
              columns={rulesColumns}
              expandedRowRender={() => <p>111</p>}
              dataSource={ruleList}
              pagination={{
                total: ruleTotal,
                current: rulePage,
                pageSize: 12,
                onChange: this.pageRuleChange
              }}
            />
          </Col>
        </Row>
        {popup}
      </div>
    );
  }
}
