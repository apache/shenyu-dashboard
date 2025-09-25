/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Popover,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { connect } from "dva";
import { format } from "date-fns";
import * as echarts from "echarts";
import { resizableComponents } from "../../../utils/resizable";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

const { Text } = Typography;

const { Option } = Select;

@connect(({ instance, loading, global }) => ({
  instance,
  language: global.language,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["instance/fetch"],
}))
export default class Instance extends Component {
  components = resizableComponents;

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      instanceIp: "",
      instanceType: null,
      localeName: window.sessionStorage.getItem("locale")
        ? window.sessionStorage.getItem("locale")
        : "en-US",
      columns: [],
    };
  }

  componentDidMount() {
    this.query();
    this.initInstanceColumns();
    this.queryAnalysis();
    this.pieChartInstance = echarts.init(document.getElementById("pieDataDiv"));
    this.lineChartInstance = echarts.init(
      document.getElementById("lineDataDiv"),
    );
  }

  componentDidUpdate(prevProps) {
    const { language, currentNamespaceId, instance } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initInstanceColumns();
      this.changeLocale(language);
    }
    if (prevProps.currentNamespaceId !== currentNamespaceId) {
      this.query();
    }
    if (prevProps.instance.pieData !== instance.pieData) {
      this.renderPieChart(instance.pieData);
    }
    if (prevProps.instance.lineData !== instance.lineData) {
      this.renderLineChart(instance.lineData);
    }
  }

  handleResize =
    (index) =>
    (e, { size }) => {
      this.setState(({ columns }) => {
        const nextColumns = [...columns];
        nextColumns[index] = {
          ...nextColumns[index],
          width: size.width,
        };
        return { columns: nextColumns };
      });
    };

  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };

  currentQueryPayload = (override) => {
    const { instanceIp, instanceType, currentPage, pageSize } = this.state;
    const { currentNamespaceId } = this.props;
    return {
      instanceIp,
      instanceType,
      namespaceId: currentNamespaceId,
      currentPage,
      pageSize,
      ...override,
    };
  };

  query = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "instance/fetch",
      payload: this.currentQueryPayload(),
    });
  };

  queryAnalysis = () => {
    const { dispatch, currentNamespaceId } = this.props;
    dispatch({
      type: "instance/fetchAnalysis",
      payload: {
        namespaceId: currentNamespaceId,
      },
    });
  };

  renderPieChart = (pieData) => {
    if (!pieData || !this.pieChartInstance) {
      return;
    }
    const chartData =
      pieData && pieData.length > 0
        ? pieData
        : [{ value: 0, name: getIntlContent("SHENYU.INSTANCE.NO_DATA") }];

    const option = {
      title: {
        text: getIntlContent("SHENYU.INSTANCE.PIE_DATA"),
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
      },
      series: [
        {
          name: getIntlContent("SHENYU.INSTANCE.DISTRIBUTION"),
          type: "pie",
          radius: "50%",
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };

    this.pieChartInstance.setOption(option);

    window.addEventListener("resize", () => {
      this.pieChartInstance.resize();
    });
  };

  renderLineChart = (lineData) => {
    if (!lineData || !this.lineChartInstance) {
      return;
    }

    const chartData =
      lineData && lineData.length > 0
        ? lineData
        : [
            {
              name: getIntlContent("SHENYU.INSTANCE.NO_DATA"),
              type: "line",
              data: [0, 0, 0, 0, 0],
            },
          ];

    const formattedSeries = chartData.map((item) => ({
      name: item.name || "Unknown",
      type: "line",
      data: Array.isArray(item.data) ? item.data : [],
    }));

    const option = {
      title: {
        text: getIntlContent("SHENYU.INSTANCE.LINE_DATA"),
      },
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: formattedSeries.map((series) => series.name),
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        show: false,
      },
      yAxis: {
        type: "value",
        show: true,
        min: 0,
        max: 4,
        minInterval: 1,
        interval: 1,
        name: "数量",
        nameTextStyle: {
          color: "#333",
          fontSize: 12,
          padding: [0, 0, 0, 0],
        },
        axisLabel: {
          formatter: "{value}",
        },
      },
      series: formattedSeries,
    };

    this.lineChartInstance.setOption(option);

    window.addEventListener("resize", () => {
      this.lineChartInstance.resize();
    });
  };

  pageOnchange = (page) => {
    this.setState({ currentPage: page }, this.query);
  };

  onShowSizeChange = (currentPage, pageSize) => {
    this.setState({ currentPage: 1, pageSize }, this.query);
  };

  instanceIpOnchange = (e) => {
    this.setState({ instanceIp: e.target.value }, this.query);
  };

  instanceTypeOnchange = (e) => {
    this.setState({ instanceType: e }, this.query);
  };

  searchClick = () => {
    this.setState({ currentPage: 1 }, this.query);
  };

  changeLocale(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  initInstanceColumns() {
    this.setState({
      columns: [
        {
          align: "center",
          title: getIntlContent("SHENYU.INSTANCE.IP"),
          dataIndex: "instanceIp",
          key: "instanceIp",
          ellipsis: true,
          width: 120,
          render: (text, record) => {
            return record.instanceIp ? (
              <div
                style={{
                  color: "#1890ff",
                  fontWeight: "bold",
                }}
              >
                {text || "----"}
              </div>
            ) : (
              <div style={{ color: "#260033", fontWeight: "bold" }}>
                {text || "----"}
              </div>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.INSTANCE.PORT"),
          dataIndex: "instancePort",
          key: "instancePort",
          ellipsis: true,
          width: 120,
          render: (text, record) => {
            return record.instancePort ? (
              <div
                style={{
                  color: "#1890ff",
                  fontWeight: "bold",
                }}
              >
                {text || "----"}
              </div>
            ) : (
              <div style={{ color: "#260033", fontWeight: "bold" }}>
                {text || "----"}
              </div>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.INSTANCE.SELECT.TYPE"),
          dataIndex: "instanceType",
          ellipsis: true,
          key: "instanceType",
          width: 150,
          sorter: (a, b) => (a.instanceType > b.instanceType ? 1 : -1),
          render: (text) => {
            return <div style={{ color: "#1f640a" }}>{text || "----"}</div>;
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.INSTANCE.INFO"),
          dataIndex: "instanceInfo",
          key: "instanceInfo",
          ellipsis: true,
          width: 200,
          render: (text, record) => {
            const tag = (
              <div>
                <Tag color="#9dd3a8">{record.instanceType}</Tag>
                <Tag color="#CCCC99">{record.instanceIp}</Tag>
                <Tag color="#DCDC17">{record.instancePort}</Tag>
              </div>
            );
            const t = JSON.stringify(
              JSON.parse(text !== null && text.length > 0 ? text : "{}"),
              null,
              4,
            );
            const content = (
              <div>
                <Text type="secondary">{`${getIntlContent("SHENYU.SYSTEM.CREATETIME")}: ${record.dateCreated ? new Date(record.dateCreated).toLocaleString() : "----"}`}</Text>
                <br />
                <Text type="secondary">{`${getIntlContent("SHENYU.SYSTEM.UPDATETIME")}: ${record.dateUpdated ? new Date(record.dateUpdated).toLocaleString() : "----"}`}</Text>
                <hr />
                <div style={{ fontWeight: "bold" }}>
                  <pre>
                    <code>{t}</code>
                  </pre>
                </div>
              </div>
            );
            return (
              <Popover content={content} title={tag}>
                <div>{text || "----"}</div>
              </Popover>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.INSTANCE.SELECT.LASTBEATTIME"),
          dataIndex: "lastHeartBeatTime",
          ellipsis: true,
          key: "lastHeartBeatTime",
          width: 120,
          sorter: (a, b) => (a.instanceType > b.instanceType ? 1 : -1),
          render: (text) => {
            return (
              <div style={{ color: "#1f640a" }}>
                {format(new Date(text), "YYYY-MM-DD HH:mm:ss") || "----"}
              </div>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.INSTANCE.SELECT.CREATETIME"),
          dataIndex: "dateCreated",
          ellipsis: true,
          key: "dateCreated",
          width: 120,
          sorter: (a, b) => (a.instanceType > b.instanceType ? 1 : -1),
          render: (text) => {
            return (
              <div style={{ color: "#1f640a" }}>
                {format(new Date(text), "YYYY-MM-DD HH:mm:ss") || "----"}
              </div>
            );
          },
        },
        {
          align: "center",
          title: getIntlContent("SHENYU.INSTANCE.SELECT.STATE"),
          dataIndex: "instanceState",
          ellipsis: true,
          key: "instanceState",
          width: 120,
          sorter: (a, b) => (a.instanceType > b.instanceType ? 1 : -1),
          render: (state) => {
            if (state === 1) {
              return (
                <Tag color="green">
                  {getIntlContent("SHENYU.INSTANCE.SELECT.STATE.ONLINE")}
                </Tag>
              );
            } else if (state === 0) {
              return (
                <Tag color="orange">
                  {getIntlContent("SHENYU.INSTANCE.SELECT.STATE.UNKNOWN")}
                </Tag>
              );
            } else if (state === 2) {
              return (
                <Tag color="red">
                  {getIntlContent("SHENYU.INSTANCE.SELECT.STATE.OFFLINE")}
                </Tag>
              );
            }
          },
        },
      ],
    });
  }

  render() {
    const { instance, loading } = this.props;
    const { instanceList, total } = instance;
    const { currentPage, pageSize, selectedRowKeys, instanceIp, instanceType } =
      this.state;
    const columns = this.state.columns.map((col, index) => ({
      ...col,
      onHeaderCell: (column) => ({
        width: column.width,
        onResize: this.handleResize(index),
      }),
    }));
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <div className="plug-content-wrap">
        <div style={{ display: "flex" }}>
          <Input
            allowClear
            value={instanceIp}
            onChange={this.instanceIpOnchange}
            placeholder={getIntlContent("SHENYU.INSTANCE.IP")}
            style={{ width: 240 }}
          />
          <Select
            value={instanceType != null ? instanceType : undefined}
            onChange={this.instanceTypeOnchange}
            placeholder={getIntlContent("SHENYU.INSTANCE.SELECT.TYPE")}
            style={{ width: 150, marginLeft: 20 }}
            allowClear
          >
            <Option value="bootstrap">
              {getIntlContent("SHENYU.INSTANCE.SELECT.TYPE.BOOTSTRAP")}
            </Option>
            <Option value="client">
              {getIntlContent("SHENYU.INSTANCE.SELECT.TYPE.CLIENT")}
            </Option>
          </Select>
          <AuthButton perms="system:instance:list">
            <Button
              type="primary"
              style={{ marginLeft: 20 }}
              onClick={this.searchClick}
            >
              {getIntlContent("SHENYU.SYSTEM.SEARCH")}
            </Button>
          </AuthButton>
        </div>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card>
              <div
                id="pieDataDiv"
                style={{ width: "800px", height: "400px" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <div
                id="lineDataDiv"
                style={{ width: "800px", height: "400px" }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          size="small"
          components={this.components}
          style={{ marginTop: 30 }}
          bordered
          loading={loading}
          columns={columns}
          dataSource={instanceList}
          rowSelection={rowSelection}
          pagination={{
            total,
            showTotal: (showTotal) => `${showTotal}`,
            showSizeChanger: true,
            pageSizeOptions: ["12", "20", "50", "100"],
            current: currentPage,
            pageSize,
            onShowSizeChange: this.onShowSizeChange,
            onChange: this.pageOnchange,
          }}
        />
      </div>
    );
  }
}
