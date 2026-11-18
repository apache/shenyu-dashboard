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

import React, { PureComponent } from "react";
import Layout from "@douyinfe/semi-ui/lib/es/layout";
import Nav from "@douyinfe/semi-ui/lib/es/navigation";
import pathToRegexp from "path-to-regexp";
import { Resizable } from "react-resizable";
import ResourceIcon from "../ui/ResourceIcon";
import { Link } from "../../runtime/router";
import { urlToList } from "../_utils/pathTools";
import { getCurrentLocale, getIntlContent } from "../../utils/IntlUtils";
import selectionStyles from "./selection.module.less";
// import { emit } from '../../utils/emit'

const { Sider } = Layout;

const getIcon = (icon) => {
  if (typeof icon === "string") {
    if (/^https?:\/\//.test(icon)) {
      return <img src={icon} alt="" width={20} height={20} />;
    }
    return <ResourceIcon type={icon} />;
  }
  return icon;
};

/**
 * Recursively flatten the data
 * [{path:string},{path:string}] => [path,path2]
 * @param  menu
 */
export const getFlatMenuKeys = (menu) => {
  return menu.reduce((keys, item) => {
    keys.push(item.path);
    if (item.children) {
      return keys.concat(getFlatMenuKeys(item.children));
    }
    return keys;
  }, []);
};

/**
 * Find all matched menu keys based on paths
 * @param  flatMenuKeys: [/abc, /abc/:id, /abc/:id/info]
 * @param  paths: [/abc, /abc/11, /abc/11/info]
 */
export const getMenuMatchKeys = (flatMenuKeys, paths) =>
  paths.reduce(
    (matchKeys, path) =>
      matchKeys.concat(
        flatMenuKeys.filter((item) => pathToRegexp(item).test(path)),
      ),
    [],
  );

export default class SiderMenu extends PureComponent {
  menuContainer = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      openKeys: SiderMenu.getDefaultCollapsedSubMenus(
        props,
        getFlatMenuKeys(props.menuData),
      ),
      localeName: "",
      width: 240,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const routeChanged = nextProps.location.pathname !== prevState.prevPathname;
    if (routeChanged || nextProps.menuData !== prevState.menuData) {
      const menuKeys = getFlatMenuKeys(nextProps.menuData);
      const availableKeys = new Set(menuKeys);
      const previousActiveKeys = new Set(
        routeChanged
          ? []
          : SiderMenu.getDefaultCollapsedSubMenus(
              nextProps,
              getFlatMenuKeys(prevState.menuData || []),
            ),
      );
      const activeKeys = SiderMenu.getDefaultCollapsedSubMenus(
        nextProps,
        menuKeys,
      ).filter((key) => !previousActiveKeys.has(key));
      return {
        prevPathname: nextProps.location.pathname,
        menuData: nextProps.menuData,
        openKeys: [
          ...new Set([
            ...(prevState.openKeys || []).filter((key) =>
              availableKeys.has(key),
            ),
            ...activeKeys,
          ]),
        ],
      };
    }
    // No state update necessary
    return null;
  }

  /**
   * Convert pathname to openKeys
   * /list/search/articles = > ['list','/list/search']
   * @param  props
   * @param  flatMenuKeys
   */
  static getDefaultCollapsedSubMenus(props, flatMenuKeys) {
    const {
      location: { pathname },
    } = props;
    return getMenuMatchKeys(flatMenuKeys, urlToList(pathname));
  }

  saveCurrentRoute = (route) => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/saveCurrentRoutr",
      payload: {
        currentRouter: route,
      },
    });
  };

  /**
   * Judge whether it is http link.return a or Link
   *
   * member of SiderMenu
   */
  getMenuItemPath = (item, content) => {
    const itemPath = this.conversionPath(item.path);
    let { target, name } = item;
    // Is it a http link
    if (/^https?:\/\//.test(itemPath)) {
      if (target === undefined) {
        target = "_blank";
      }
      return (
        <a
          href={itemPath}
          target={target}
          rel="noreferrer"
          style={{ textDecoration: "none" }}
          onClick={() => this.saveCurrentRoute(item)}
        >
          {content || <span>{name}</span>}
        </a>
      );
    }
    const { location, isMobile, onCollapse } = this.props;
    return (
      <Link
        to={itemPath}
        target={target}
        replace={itemPath === location.pathname}
        style={{ textDecoration: "none" }}
        onClick={() => {
          this.saveCurrentRoute(item);
          if (isMobile) onCollapse(true);
        }}
      >
        {content || <span>{name}</span>}
      </Link>
    );
  };

  /**
   * get SubMenu or Item
   */
  getSubMenuOrItem = (item, level = 0) => {
    const icon =
      level === 0
        ? getIcon(item.path === "/home" ? "dashboard" : item.icon)
        : undefined;
    if (item.children && item.children.some((child) => child.name)) {
      const childrenItems = this.getNavMenuItems(item.children, level + 1);
      // The menu is not displayed when there are no submenus
      if (childrenItems && childrenItems.length > 0) {
        return (
          <Nav.Sub
            level={level}
            itemKey={item.path}
            key={item.path}
            text={item.name}
            icon={icon}
          >
            {childrenItems}
          </Nav.Sub>
        );
      }
      return null;
    } else {
      return (
        <Nav.Item
          level={level}
          itemKey={item.path}
          key={item.path}
          text={item.name}
          icon={icon}
          linkOptions={{ target: item.target }}
        />
      );
    }
  };

  /**
   * Get the menu items
   */
  getNavMenuItems = (menusData, level = 0) => {
    if (!menusData) {
      return [];
    }
    return menusData
      .filter((item) => item.name && !item.hideInMenu)
      .map((original) => {
        const item = {
          ...original,
          name: original.locale
            ? getIntlContent(original.locale, original.name)
            : original.name,
        };
        // make dom
        const ItemDom = this.getSubMenuOrItem(item, level);
        return this.checkPermissionItem(item.authority, ItemDom);
      })
      .filter((item) => item);
  };

  // Get the currently selected menu
  getSelectedMenuKeys = () => {
    const {
      menuData,
      location: { pathname },
    } = this.props;

    // Derive flatMenuKeys from the current menuData on every call instead of
    // caching it, since menuData can change after construction (e.g. plugin
    // or permission menus that load asynchronously).
    return getMenuMatchKeys(getFlatMenuKeys(menuData), urlToList(pathname));
  };

  // conversion Path
  conversionPath = (path) => {
    if (path && path.indexOf("http") === 0) {
      return path;
    } else {
      return `/${path || ""}`.replace(/\/+/g, "/");
    }
  };

  // permission to check
  checkPermissionItem = (authority, ItemDom) => {
    const { Authorized } = this.props;
    if (Authorized && Authorized.check) {
      const { check } = Authorized;
      return check(authority, ItemDom);
    }
    return ItemDom;
  };

  handleOpenChange = ({ openKeys }) => {
    this.setState({
      openKeys: [...openKeys],
    });
  };

  onResize = (event, { size }) => {
    this.setState({
      width: size.width,
    });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  changeLocale(locale) {
    this.setState({
      localeName: locale,
    });
    getCurrentLocale(this.state.localeName);
  }

  render() {
    const { menuData, collapsed } = this.props;
    const width = collapsed ? 180 : this.state.width;
    const { openKeys } = this.state;
    const itemsByPath = new Map();
    const indexItems = (items) =>
      items.forEach((item) => {
        itemsByPath.set(item.path, item);
        if (item.children) indexItems(item.children);
      });
    indexItems(menuData);
    const workbench = {
      path: "/home",
      name: getIntlContent("SHENYU.HOME.WORKBENCH", "Workbench"),
    };
    const showWorkbench = !itemsByPath.has(workbench.path);
    if (showWorkbench) itemsByPath.set(workbench.path, workbench);
    // if pathname can't match, use the nearest parent's key
    let selectedKeys =
      this.props.location.pathname === "/home"
        ? [workbench.path]
        : this.getSelectedMenuKeys();
    if (!selectedKeys.length) {
      selectedKeys = [openKeys[openKeys.length - 1]];
    }

    return (
      <Resizable
        width={width}
        height={0}
        resizeHandles={collapsed ? [] : ["e"]}
        onResize={this.onResize}
        draggableOpts={{ enableUserSelectHack: false }}
        handle={
          <span
            className="react-resizable-handle"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        }
        minConstraints={[200, 0]}
        maxConstraints={[500, 0]}
      >
        <Sider style={{ width, flex: `0 0 ${width}px`, minWidth: width }}>
          <div ref={this.menuContainer} style={{ position: "relative" }}>
            <Nav
              className={selectionStyles.navigation}
              limitIndent={false}
              getPopupContainer={() => this.menuContainer.current}
              openKeys={openKeys}
              onOpenChange={this.handleOpenChange}
              selectedKeys={selectedKeys}
              style={{ width: "100%" }}
              renderWrapper={({ itemElement, isSubNav, props }) =>
                isSubNav
                  ? itemElement
                  : this.getMenuItemPath(
                      {
                        ...itemsByPath.get(props.itemKey),
                        name: props.text,
                        path: props.itemKey,
                        target: props.linkOptions?.target,
                      },
                      itemElement,
                    )
              }
            >
              {showWorkbench && this.getSubMenuOrItem(workbench)}
              {this.getNavMenuItems(menuData)}
            </Nav>
          </div>
        </Sider>
      </Resizable>
    );
  }
}
