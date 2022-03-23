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

import React from 'react';
// import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';

import { Transfer, Table } from 'antd';
import difference from 'lodash/difference';
import {getIntlContent} from "../../../utils/IntlUtils";
// import uniqBy from 'lodash/uniqBy';
// import reqwest from 'reqwest';

const columns = [
  {
    dataIndex: 'path',
    title: getIntlContent('SHENYU.AUTH.RESOUCE.PATH'),
    width: 200,
    textWrap: 'word-break',
    align: 'center',
    ellipsis: true
  },
  {
    dataIndex: 'appName',
    title: getIntlContent('SHENYU.AUTH.APPNAME'),
    width: 100,
    textWrap: 'word-break',
    align: 'center',
    ellipsis: true
  },

];

class TableTransfer extends React.Component {
  state = {
    dataSource: this.props.datalist,
    pagination: {
      current: 1,
      pageSize: 10,
    },

  };





  render() {
    const { authName } = this.props;
    const { dataSource, pagination } = this.state;
    return (
      <Transfer titles={['ALL',authName]} {...this.props} dataSource={dataSource} rowKey={record => record.path}>
        {({
          direction, // 渲染列表的方向
          filteredItems,
          onItemSelectAll, // 勾选一组条目
          onItemSelect, // 勾选条目
          selectedKeys: listSelectedKeys, // 选中的条目
          disabled: listDisabled, // 是否禁用列表
        }) => {
          const rowSelection = {
            getCheckboxProps: item => ({
              disabled: listDisabled || item.disabled,
            }),
            onSelectAll(selected, selectedRows) {
              const treeSelectedKeys = selectedRows
                .filter(item => !item.disabled)
                .map(({ path }) => path);
              const diffKeys = selected
                ? difference(treeSelectedKeys, listSelectedKeys)
                : difference(listSelectedKeys, treeSelectedKeys);
              onItemSelectAll(diffKeys, selected);
            },
            onSelect({ path }, selected) {
              onItemSelect(path, selected);
            },
            selectedRowKeys: listSelectedKeys,
          };

          const handleTableChange = paginationObj => {
            if (direction === 'left') {
              // eslint-disable-next-line react/no-access-state-in-setstate
              const pager = { ...this.state.pagination };
              pager.current = paginationObj.current;
              this.setState({
                pagination: pager,
              });
              // this.fetch(paginationObj);
            }
          };

          // const rightDataSource = this.props.auth
          // const rightDataSource = dataSource.filter(item=>targetKeys.includes(item.path))
          // const judgeArr = rightDataSource.map(it=>it.path)
          // const leftDataSource = dataSource.map(item => ({
          //   ...item,
          //   disabled: judgeArr.includes(item.path) ,

          // }));

          return (
            <Table
              rowSelection={rowSelection}
              columns={columns}
              rowKey={record =>record.path}
              style={{ pointerEvents: listDisabled ? 'none' : null }}
              dataSource={filteredItems}
              // dataSource={direction === 'left' ? leftDataSource : rightDataSource}
              size="small"
              onChange={handleTableChange}
              onRow={({ path, disabled: itemDisabled }) => ({
                onClick: () => {
                  if (itemDisabled || listDisabled) return;
                  onItemSelect(path, !listSelectedKeys.includes(path));
                },
              })}
              pagination={direction === 'left' ? pagination : true}
            />
          );
        }}
      </Transfer>
    );
  }
}

class TableTransferComponent extends React.Component {
  state = {
    targetKeys: this.props.auth.map(item=>item.path),
    authName: this.props.authName,
    datalist: this.props.datalist,
    auth: this.props.auth.map(item=>{item.key=item.id; return item})

  };



  onChange = targetKeys => {
    this.setState({
      targetKeys,
    });

    // 传递更数据
    let data = this.state.datalist.filter(item=>targetKeys.includes(item.path))

    this.props.handleGetUpdateMetas(data);
  };

  render() {
    // eslint-disable-next-line
    return (
      <TableTransfer
        auth={this.state.auth}
        authName={this.state.authName}
        datalist={this.state.datalist}
        targetKeys={this.state.targetKeys}
        onChange={this.onChange}
        showSearch={true}
        filterOption={(inputValue, item) =>
              item.appName.indexOf(inputValue) !== -1 || item.path.indexOf(inputValue) !== -1
            }
      />
);
  }
}
export default TableTransferComponent
