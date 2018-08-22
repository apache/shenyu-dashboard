import React, { Component } from "react";
import { Table, Row, Col, Button } from "antd";
import { connect } from "dva";
import Selector from './Selector';
import Rule from './Rule';

@connect(({ waf, global, loading }) => ({
  waf,
  platform: global.platform,
  loading: loading.effects["global/fetchPlatform"]
}))
export default class Waf extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      popup: '',
    };
  }


  componentDidMount() {
    const { platform, dispatch } = this.props;
    const { currentPage } = this.state;
    const { pluginEnums } = platform;
    if (platform) {
      const wafCode =
        pluginEnums &&
        pluginEnums.filter(item => {
          return item.name === "waf";
        });
      dispatch({
        type: "waf/fetchSelector",
        playload: {
          pluginId: wafCode[0].code,
          currentPage,
          pageSize: 10
        }
      });
    }
  }

  closeModal = () => {
    this.setState({ popup: '' })
  }

  addSelector = () => {
    this.setState({ popup: <Selector onCancel={this.closeModal} /> })
  }

  addRule = () => {
    this.setState({ popup: <Rule onCancel={this.closeModal} /> })
  }

  editSelector = (record) => {
    console.log(record);
  }

  deleteSelector = (record) => {
    console.log(record);
  }

  render() {
    const { popup } = this.state;
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
              <span className="edit" onClick={() => { this.editSelector(record) }}>修改</span>
              <span className="edit" onClick={() => { this.deleteSelector(record) }}>删除</span>
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
              <Button type="primary" onClick={this.addSelector}>添加选择器</Button>
            </div>
            <Table
              bordered
              size="small"
              columns={selectColumns}
              dataSource={[]}
            />
          </Col>
          <Col span={16}>
            <div className="table-header">
              <h3>选择器规则列表</h3>
              <Button type="primary" onClick={this.addRule}>添加规则</Button>
            </div>
            <Table
              bordered
              size="small"
              columns={rulesColumns}
              expandedRowRender={() => <p>111</p>}
              dataSource={[]}
            />
          </Col>
        </Row>
        {popup}
      </div>
    );
  }
}
