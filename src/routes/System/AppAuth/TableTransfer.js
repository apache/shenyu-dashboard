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

import React from "react";
import Transfer from "@douyinfe/semi-ui/lib/es/transfer";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Input from "@douyinfe/semi-ui/lib/es/input";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { getIntlContent } from "../../../utils/IntlUtils";

const pageSize = 10;
const panelStyle = {
  flex: "1 1 420px",
  minWidth: 0,
  padding: 12,
  border: "1px solid var(--semi-color-border)",
  borderRadius: 6,
  boxSizing: "border-box",
};
const matches = (input, row) =>
  String(row.appName || "").includes(input) ||
  String(row.path || "").includes(input);

export default class TableTransferComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sourceKeys: [],
      selectedKeys: [],
      sourcePage: 1,
      selectedPage: 1,
      selectedSearch: "",
    };
  }

  getResourceRows = () => {
    const { auth, datalist } = this.props;
    const granted = new Set(auth.map((row) => row.path));
    return datalist.filter((row) => !granted.has(row.path)).concat(auth);
  };

  getDisplayRows = () => {
    const rows = new Map();
    this.getResourceRows().forEach((row) => {
      const existing = rows.get(row.path);
      rows.set(row.path, {
        ...row,
        key: row.path,
        value: row.path,
        label: row.path,
        disabled: Boolean(row.disabled || (existing && existing.disabled)),
      });
    });
    return [...rows.values()];
  };

  applyTargets = (targetKeys) => {
    const selected = new Set(targetKeys);
    this.props.handleGetUpdateMetas(
      this.getResourceRows().filter((row) => selected.has(row.path)),
    );
    this.setState({
      sourceKeys: [],
      selectedKeys: [],
      sourcePage: 1,
      selectedPage: 1,
    });
  };

  move = (direction) => {
    const targets = new Set(this.props.targetKeys);
    const rows = new Map(this.getDisplayRows().map((row) => [row.path, row]));
    const marked =
      direction === "source" ? this.state.sourceKeys : this.state.selectedKeys;
    marked.forEach((path) => {
      if (!rows.has(path) || rows.get(path).disabled) return;
      if (direction === "source") targets.add(path);
      else targets.delete(path);
    });
    this.applyTargets([...targets]);
  };

  renderPanel = (direction, rows, search, onSearch, title) => {
    const keysField = direction === "source" ? "sourceKeys" : "selectedKeys";
    const pageField = direction === "source" ? "sourcePage" : "selectedPage";
    const marked = this.state[keysField];
    const currentPage = Math.max(
      1,
      Math.min(this.state[pageField], Math.ceil(rows.length / pageSize)),
    );
    const pageRows = rows.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );
    const disabledGrants = new Set(
      this.props.auth
        .filter((row) => row.enabled === false)
        .map((row) => row.path),
    );
    const columns = [
      {
        key: "path",
        dataIndex: "path",
        title: getIntlContent("SHENYU.AUTH.RESOUCE.PATH"),
        width: 280,
        ellipsis: true,
        render: (path) => (
          <>
            <span>{path}</span>
            {direction === "selected" && disabledGrants.has(path) && (
              <small
                style={{ marginLeft: 8, color: "var(--semi-color-danger)" }}
              >
                {getIntlContent("SHENYU.AUTH.RESOURCE.CONTAINS.DISABLED")}
              </small>
            )}
          </>
        ),
      },
      {
        key: "appName",
        dataIndex: "appName",
        title: getIntlContent("SHENYU.AUTH.APPNAME"),
        width: 140,
        ellipsis: true,
      },
    ];
    return (
      <section aria-label={title} style={panelStyle}>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <strong style={{ overflowWrap: "anywhere" }}>{title}</strong>
          <Button
            theme="solid"
            type={direction === "source" ? "primary" : "danger"}
            disabled={!marked.length}
            onClick={() => this.move(direction)}
          >
            {getIntlContent(
              direction === "source"
                ? "SHENYU.AUTH.RESOURCE.GRANT"
                : "SHENYU.AUTH.RESOURCE.REMOVE",
            )}{" "}
            ({marked.length})
          </Button>
        </div>
        <Input
          value={search}
          showClear
          aria-label={getIntlContent(
            direction === "source"
              ? "SHENYU.AUTH.RESOURCE.SEARCH.AVAILABLE"
              : "SHENYU.AUTH.RESOURCE.SEARCH.SELECTED",
          )}
          placeholder={getIntlContent("SHENYU.AUTH.RESOURCE.SEARCH")}
          onChange={onSearch}
        />
        <Table
          style={{ marginTop: 12 }}
          size="small"
          rowKey="path"
          columns={columns}
          dataSource={pageRows}
          scroll={{ x: 460 }}
          pagination={{
            currentPage,
            pageSize,
            total: rows.length,
            showSizeChanger: false,
            formatPageText: ({ total }) => String(total),
            onChange: (page) => this.setState({ [pageField]: page }),
          }}
          rowSelection={{
            selectedRowKeys: marked,
            getCheckboxProps: (row) => ({ disabled: row.disabled }),
            onChange: (keys) => this.setState({ [keysField]: keys }),
          }}
          onRow={(row) => ({
            onClick: (event) => {
              if (
                row.disabled ||
                event.target.closest("input,button,label,.semi-checkbox")
              )
                return;
              this.setState((prev) => ({
                [keysField]: prev[keysField].includes(row.path)
                  ? prev[keysField].filter((key) => key !== row.path)
                  : [...prev[keysField], row.path],
              }));
            },
          })}
        />
      </section>
    );
  };

  render() {
    const { targetKeys, authName } = this.props;
    const selected = new Set(targetKeys);
    return (
      <Transfer
        style={{
          width: "100%",
          minWidth: 0,
          height: "auto",
          gap: 16,
          flexWrap: "wrap",
        }}
        dataSource={this.getDisplayRows()}
        value={[...selected]}
        onChange={this.applyTargets}
        filter={matches}
        renderSourcePanel={({ filterData, inputValue, onSearch }) =>
          this.renderPanel(
            "source",
            filterData.filter((row) => !selected.has(row.path)),
            inputValue,
            (value) => {
              this.setState({ sourcePage: 1 });
              onSearch(value);
            },
            getIntlContent("SHENYU.AUTH.RESOURCE.AVAILABLE"),
          )
        }
        renderSelectedPanel={({ selectedData }) =>
          this.renderPanel(
            "selected",
            selectedData.filter((row) =>
              matches(this.state.selectedSearch, row),
            ),
            this.state.selectedSearch,
            (value) =>
              this.setState({ selectedSearch: value, selectedPage: 1 }),
            authName,
          )
        }
      />
    );
  }
}
