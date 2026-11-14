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
import Table from "@douyinfe/semi-ui/lib/es/table";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import "@douyinfe/semi-ui/lib/es/_base/base.css";

export default function MetadataTable({
  language,
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  ...props
}) {
  const locale = language || window.sessionStorage.getItem("locale") || "en-US";
  return (
    <LocaleProvider locale={locale.toLowerCase() === "en-us" ? enUS : zhCN}>
      <Table
        {...props}
        rowKey="id"
        resizable
        bordered
        size="small"
        scroll={{ x: 950 }}
        pagination={{
          total,
          currentPage,
          pageSize,
          showSizeChanger: true,
          pageSizeOpts: [12, 20, 50, 100],
          formatPageText: ({ total: count }) => `${count}`,
          onChange: (page, size) => {
            if (size !== pageSize) {
              onPageSizeChange(page, size);
            } else {
              onPageChange(page);
            }
          },
        }}
      />
    </LocaleProvider>
  );
}
