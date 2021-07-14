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

import React, { Component, Fragment } from 'react';
import { Modal, Card, Icon, Button, Input } from 'antd';
import styles from "./IconModal.less";
import { getIntlContent } from '../../../utils/IntlUtils';

const iconMap = {
    "SHENYU.SYSTEM.ICON.DIRECTIONAL": [
        "step-backward",
        "step-forward",
        "fast-backward",
        "fast-forward",
        "shrink",
        "arrows-alt",
        "down",
        "up",
        "left",
        "right",
        "caret-up",
        "caret-down",
        "caret-left",
        "caret-right",
        "up-circle",
        "down-circle",
        "left-circle",
        "right-circle",
        "double-right",
        "double-left",
        "vertical-left",
        "vertical-right",
        "vertical-align-top",
        "vertical-align-middle",
        "vertical-align-bottom",
        "forward",
        "backward",
        "rollback",
        "enter",
        "retweet",
        "swap",
        "swap-left",
        "swap-right",
        "arrow-up",
        "arrow-down",
        "arrow-left",
        "arrow-right",
        "play-circle",
        "up-square",
        "down-square",
        "left-square",
        "right-square",
        "login",
        "logout",
        "menu-fold",
        "menu-unfold",
        "border-bottom",
        "border-horizontal",
        "border-inner",
        "border-outer",
        "border-left",
        "border-right",
        "border-top",
        "border-verticle",
        "pic-center",
        "pic-left",
        "pic-right",
        "radius-bottomleft",
        "radius-bottomright",
        "radius-upleft",
        "radius-upright",
        "fullscreen",
        "fullscreen-exit",
    ],
    "SHENYU.SYSTEM.ICON.SUGGESTED": [
        "question",
        "question-circle",
        "plus",
        "plus-circle",
        "pause",
        "pause-circle",
        "minus",
        "minus-circle",
        "plus-square",
        "minus-square",
        "info",
        "info-circle",
        "exclamation",
        "exclamation-circle",
        "close",
        "close-circle",
        "close-square",
        "check",
        "check-circle",
        "check-square",
        "clock-circle",
        "warning",
        "issues-close",
        "stop",
    ],
    "SHENYU.SYSTEM.ICON.EDITOR": [
        "edit",
        "form",
        "copy",
        "scissor",
        "delete",
        "snippets",
        "diff",
        "highlight",
        "align-center",
        "align-left",
        "align-right",
        "bg-colors",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "redo",
        "undo",
        "zoom-in",
        "zoom-out",
        "font-colors",
        "font-size",
        "line-height",
        "dash",
        "small-dash",
        "sort-ascending",
        "sort-descending",
        "drag",
        "ordered-list",
        "unordered-list",
        "radius-setting",
        "column-width",
        "column-height",
    ],
    "SHENYU.SYSTEM.ICON.DATA": [
        "area-chart",
        "pie-chart",
        "bar-chart",
        "dot-chart",
        "line-chart",
        "radar-chart",
        "heat-map",
        "fall",
        "rise",
        "stock",
        "box-plot",
        "fund",
        "sliders",
    ],
    "SHENYU.SYSTEM.ICON.BRAND": [
        "android",
        "apple",
        "windows",
        "ie",
        "chrome",
        "github",
        "aliwangwang",
        "dingding",
        "weibo-square",
        "weibo-circle",
        "taobao-circle",
        "html5",
        "weibo",
        "twitter",
        "wechat",
        "youtube",
        "alipay-circle",
        "taobao",
        "skype",
        "qq",
        "medium-workmark",
        "gitlab",
        "medium",
        "linkedin",
        "google-plus",
        "dropbox",
        "facebook",
        "codepen",
        "code-sandbox",
        "amazon",
        "google",
        "codepen-circle",
        "alipay",
        "ant-design",
        "ant-cloud",
        "aliyun",
        "zhihu",
        "slack",
        "slack-square",
        "behance",
        "behance-square",
        "dribbble",
        "dribbble-square",
        "instagram",
        "yuque",
        "alibaba",
        "yahoo",
        "reddit",
        "sketch",
    ],
    "SHENYU.SYSTEM.ICON.APPLICATION": [

        "account-book",
        "alert",
        "api",
        "appstore",
        "audio",
        "bank",
        "bell",
        "book",
        "bug",
        "bulb",
        "calculator",
        "build",
        "calendar",
        "camera",
        "car",
        "carry-out",
        "cloud",
        "code",
        "compass",
        "contacts",
        "container",
        "control",
        "credit-card",
        "crown",
        "customer-service",
        "dashboard",
        "database",
        "dislike",
        "environment",
        "experiment",
        "eye-invisible",
        "eye",
        "file-add",
        "file-excel",
        "file-exclamation",
        "file-image",
        "file-markdown",
        "file-pdf",
        "file-ppt",
        "file-text",
        "file-unknown",
        "file-word",
        "file-zip",
        "file",
        "filter",
        "fire",
        "flag",
        "folder-add",
        "folder",
        "folder-open",
        "frown",
        "funnel-plot",
        "gift",
        "hdd",
        "heart",
        "home",
        "hourglass",
        "idcard",
        "insurance",
        "interaction",
        "layout",
        "like",
        "lock",
        "mail",
        "medicine-box",
        "meh",
        "message",
        "mobile",
        "money-collect",
        "pay-circle",
        "notification",
        "phone",
        "picture",
        "play-square",
        "printer",
        "profile",
        "project",
        "pushpin",
        "property-safety",
        "read",
        "reconciliation",
        "red-envelope",
        "rest",
        "rocket",
        "safety-certificate",
        "save",
        "schedule",
        "security-scan",
        "setting",
        "shop",
        "shopping",
        "skin",
        "smile",
        "sound",
        "star",
        "switcher",
        "tablet",
        "tag",
        "tags",
        "tool",
        "thunderbolt",
        "trophy",
        "unlock",
        "usb",
        "video-camera",
        "wallet",
        "apartment",
        "audit",
        "barcode",
        "bars",
        "block",
        "border",
        "branches",
        "ci",
        "cloud-download",
        "cloud-server",
        "cloud-sync",
        "cloud-upload",
        "cluster",
        "coffee",
        "copyright",
        "deployment-unit",
        "desktop",
        "disconnect",
        "dollar",
        "download",
        "ellipsis",
        "euro",
        "exception",
        "export",
        "file-done",
        "file-jpg",
        "file-protect",
        "file-sync",
        "file-search",
        "fork",
        "gateway",
        "global",
        "gold",
        "history",
        "import",
        "inbox",
        "key",
        "laptop",
        "link",
        "line",
        "loading-3-quarters",
        "loading",
        "man",
        "menu",
        "monitor",
        "more",
        "number",
        "percentage",
        "paper-clip",
        "pound",
        "poweroff",
        "pull-request",
        "qrcode",
        "reload",
        "safety",
        "robot",
        "scan",
        "search",
        "select",
        "shake",
        "share-alt",
        "shopping-cart",
        "solution",
        "sync",
        "table",
        "team",
        "to-top",
        "trademark",
        "transaction",
        "upload",
        "user-add",
        "user-delete",
        "usergroup-add",
        "user",
        "usergroup-delete",
        "wifi",
        "woman"
    ],
}

export default class IconModal extends Component {

  state = {
    filterText: null,
  }

  handleSearchTextChange = (e) => {
    if(e.target.value){
      this.setState({
        filterText: e.target.value.trim()
      })
    }else{
      this.setState({
        filterText: null
      })
    }

  }

  filterSearch = (icon ,filterText) => {
    if(!filterText) {
      return true;
    }else {
      return icon.indexOf(filterText) > -1;
    }
  }

  render() {
    const { handleCancel, onChooseIcon } = this.props;
    const { filterText } = this.state;
    return (
      <Modal
        width={1250}
        centered
        title={getIntlContent("SHENYU.SYSTEM.ICON")}
        visible
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            {getIntlContent("SHENYU.COMMON.CALCEL")}
          </Button>
        ]}
      >
        <Input.Search
          placeholder={getIntlContent("SHENYU.SYSTEM.ICON.SEARCH")}
          style={{marginBottom:20}}
          onChange={this.handleSearchTextChange}
        />
        <Card className={styles.iconCard}>
          {
            Object.keys(iconMap).map(groupName=>{
                return (
                  <Fragment>
                    <h4>{getIntlContent(groupName) || groupName}</h4>
                    <div className={styles.iconList}>
                      {iconMap[groupName].map(icon => {
                          return this.filterSearch(icon,filterText) ? (
                            <div key={icon} onClick={()=>{onChooseIcon(icon);}} className={styles.iconContent}>
                              <Icon style={{fontSize:20}} type={icon} />
                              <span>{icon}</span>
                            </div>
                          ) : null;
                      })}
                    </div>
                  </Fragment>
                )
            })
           }
        </Card>
      </Modal>
    )
  }
}
