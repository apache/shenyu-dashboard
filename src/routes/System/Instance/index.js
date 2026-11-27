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
import Button from "@douyinfe/semi-ui/lib/es/button";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Popover from "@douyinfe/semi-ui/lib/es/popover";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import { connect } from "react-redux";
import dayjs from "dayjs";
import * as echarts from "echarts";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import ResourceIcon from "../../../components/ui/ResourceIcon";
import styles from "./index.module.less";
import { getCurrentLocale, getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";
import { sortByDate, sortByNumber } from "../../../utils/sorter";
import { getLocale } from "../../../utils/localePreference";

const { Option } = Select;

export const resizeCharts = (...charts) => {
  charts.filter(Boolean).forEach((chart) => chart.resize());
};

export const disposeCharts = (...charts) => {
  charts.filter(Boolean).forEach((chart) => chart.dispose());
};

@connect(({ instance, loading, global }) => ({
  instance,
  language: global.language,
  currentNamespaceId: global.currentNamespaceId,
  loading: loading.effects["instance/fetch"],
}))
export default class Instance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageSize: 12,
      selectedRowKeys: [],
      instanceIp: "",
      instanceType: null,
      localeName: getLocale(),
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
    window.addEventListener("resize", this.handleChartResize);
    if (typeof ResizeObserver !== "undefined") {
      this.chartObserver = new ResizeObserver(this.handleChartResize);
      this.chartObserver.observe(document.getElementById("pieDataDiv"));
      this.chartObserver.observe(document.getElementById("lineDataDiv"));
    }
  }

  componentDidUpdate(prevProps) {
    const { language, currentNamespaceId, instance } = this.props;
    const { localeName } = this.state;
    if (language !== localeName) {
      this.initInstanceColumns();
      this.changeLocale(language);
    }
    if (prevProps.currentNamespaceId !== currentNamespaceId) {
      this.setState({ currentPage: 1, selectedRowKeys: [] }, this.query);
      this.queryAnalysis();
    }
    if (prevProps.instance.pieData !== instance.pieData) {
      this.renderPieChart(instance.pieData);
    }
    if (prevProps.instance.lineData !== instance.lineData) {
      this.renderLineChart(instance.lineData);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleChartResize);
    if (this.chartObserver) this.chartObserver.disconnect();
    disposeCharts(this.pieChartInstance, this.lineChartInstance);
    this.pieChartInstance = null;
    this.lineChartInstance = null;
  }

  handleChartResize = () => {
    resizeCharts(this.pieChartInstance, this.lineChartInstance);
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
        name: getIntlContent("SHENYU.SYSTEM.INSTANCE.CHART.COUNT"),
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

    // Replace the series instead of merging them by index, so that lines of the
    // previous namespace don't stay on the chart when the new one has fewer.
    this.lineChartInstance.setOption(option, { replaceMerge: ["series"] });
  };

  onPaginationChange = (page, pageSize) => {
    this.setState(
      (state) => ({
        currentPage: pageSize === state.pageSize ? page : 1,
        pageSize,
      }),
      this.query,
    );
  };

  instanceIpOnchange = (e) => {
    this.setState({ instanceIp: e.target.value, currentPage: 1 }, this.query);
  };

  instanceTypeOnchange = (e) => {
    this.setState({ instanceType: e, currentPage: 1 }, this.query);
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
                <Tag color="green">{record.instanceType}</Tag>
                <Tag color="grey">{record.instanceIp}</Tag>
                <Tag color="yellow">{record.instancePort}</Tag>
              </div>
            );
            const t = JSON.stringify(
              JSON.parse(text !== null && text.length > 0 ? text : "{}"),
              null,
              4,
            );
            const content = (
              <div>
                <span
                  className={styles.detailDate}
                >{`${getIntlContent("SHENYU.SYSTEM.CREATETIME")}: ${record.dateCreated ? new Date(record.dateCreated).toLocaleString() : "----"}`}</span>
                <br />
                <span
                  className={styles.detailDate}
                >{`${getIntlContent("SHENYU.SYSTEM.UPDATETIME")}: ${record.dateUpdated ? new Date(record.dateUpdated).toLocaleString() : "----"}`}</span>
                <hr />
                <div style={{ fontWeight: "bold" }}>
                  <pre>
                    <code>{t}</code>
                  </pre>
                </div>
              </div>
            );
            return (
              <Popover
                content={
                  <div className={styles.detail}>
                    {tag}
                    {content}
                  </div>
                }
              >
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
          sorter: sortByDate("lastHeartBeatTime"),
          render: (text) => {
            return (
              <div style={{ color: "#1f640a" }}>
                {dayjs(text).format("YYYY-MM-DD HH:mm:ss") || "----"}
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
          sorter: sortByDate("dateCreated"),
          render: (text) => {
            return (
              <div style={{ color: "#1f640a" }}>
                {dayjs(text).format("YYYY-MM-DD HH:mm:ss") || "----"}
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
          sorter: sortByNumber("instanceState"),
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
                  {getIntlContent("SHENYU.INSTANCE.SELECT.STATE.DELETED")}
                </Tag>
              );
            } else if (state === 2) {
              return (
                <Tag color="red">
                  {getIntlContent("SHENYU.INSTANCE.SELECT.STATE.OFFLINE")}
                </Tag>
              );
            }
            return (
              <Tag>
                {getIntlContent("SHENYU.INSTANCE.SELECT.STATE.UNKNOWN")}
              </Tag>
            );
          },
        },
      ],
    });
  }

  render() {
    const { instance, loading, language } = this.props;
    const { instanceList, total } = instance;
    const { currentPage, pageSize, selectedRowKeys, instanceIp, instanceType } =
      this.state;
    const { columns } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };

    return (
      <LocaleProvider locale={language === "zh-CN" ? zhCN : enUS}>
        <div className="plug-content-wrap">
          <form
            className={styles.toolbar}
            onSubmit={(event) => {
              event.preventDefault();
              this.searchClick();
            }}
          >
            <Input
              allowClear
              value={instanceIp}
              onChange={this.instanceIpOnchange}
              placeholder={getIntlContent("SHENYU.INSTANCE.IP")}
              className={styles.ipFilter}
            />
            <Select
              value={instanceType != null ? instanceType : undefined}
              onChange={this.instanceTypeOnchange}
              placeholder={getIntlContent("SHENYU.INSTANCE.SELECT.TYPE")}
              style={{ width: 150 }}
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
              {({ icon }) => (
                <Button
                  type="primary"
                  theme="solid"
                  htmlType="submit"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                >
                  {getIntlContent("SHENYU.SYSTEM.SEARCH")}
                </Button>
              )}
            </AuthButton>
          </form>

          <div className={styles.charts}>
            <Card>
              <div id="pieDataDiv" className={styles.chart} />
            </Card>
            <Card>
              <div id="lineDataDiv" className={styles.chart} />
            </Card>
          </div>

          <Table
            size="small"
            resizable
            rowKey="id"
            scroll={{ x: 950 }}
            style={{ marginTop: 30 }}
            bordered
            loading={loading}
            columns={columns}
            dataSource={instanceList}
            rowSelection={rowSelection}
            pagination={{
              total,
              showTotal: true,
              showSizeChanger: true,
              pageSizeOpts: [12, 20, 50, 100],
              currentPage,
              pageSize,
              onChange: this.onPaginationChange,
            }}
          />
        </div>
      </LocaleProvider>
    );
  }
}
