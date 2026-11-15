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
import Switch from "../ui/Switch";
import ResourceIcon from "../ui/ResourceIcon";
import { Link } from "../../runtime/router";
import styles from "./index.less";
import { urlToList } from "../_utils/pathTools";
import { getCurrentLocale, getIntlContent } from "../../utils/IntlUtils";
// import { emit } from '../../utils/emit'

const { Sider } = Layout;

// Allow menu.js config icon as string or ReactNode
//   icon: 'setting',
//   icon: 'http://demo.com/icon.png',
//   icon: <ResourceIcon type="setting" />,
const getIcon = (icon) => {
  if (typeof icon === "string") {
    if (icon.indexOf("http") === 0) {
      return (
        <img
          src={icon}
          alt="icon"
          className={`${styles.icon} sider-menu-item-img`}
        />
      );
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
  constructor(props) {
    super(props);
    this.state = {
      openKeys: SiderMenu.getDefaultCollapsedSubMenus(
        props,
        getFlatMenuKeys(props.menuData),
      ),
      localeName: "",
      width: 250,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      nextProps.location.pathname !== prevState.prevPathname ||
      nextProps.menuData !== prevState.menuData
    ) {
      return {
        prevPathname: nextProps.location.pathname,
        menuData: nextProps.menuData,
        openKeys: SiderMenu.getDefaultCollapsedSubMenus(
          nextProps,
          getFlatMenuKeys(nextProps.menuData),
        ),
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
    const icon = getIcon(item.icon);
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
          onClick={() => this.saveCurrentRoute(item)}
        >
          {content || (
            <>
              {icon}
              <span>{name}</span>
            </>
          )}
        </a>
      );
    }
    const { location, isMobile, onCollapse } = this.props;
    return (
      <Link
        to={itemPath}
        target={target}
        replace={itemPath === location.pathname}
        onClick={() => {
          this.saveCurrentRoute(item);
          if (isMobile) onCollapse(true);
        }}
      >
        {content || (
          <>
            {icon}
            <span>{name}</span>
          </>
        )}
      </Link>
    );
  };

  /**
   * get SubMenu or Item
   */
  getSubMenuOrItem = (item) => {
    if (item.children && item.children.some((child) => child.name)) {
      const childrenItems = this.getNavMenuItems(item.children);
      // The menu is not displayed when there are no submenus
      if (childrenItems && childrenItems.length > 0) {
        return (
          <Nav.Sub
            itemKey={item.path}
            key={item.path}
            text={item.name}
            icon={getIcon(item.icon)}
          >
            {childrenItems}
          </Nav.Sub>
        );
      }
      return null;
    } else {
      return (
        <Nav.Item
          itemKey={item.path}
          key={item.path}
          text={item.name}
          icon={getIcon(item.icon)}
          linkOptions={{ target: item.target }}
        />
      );
    }
  };

  /**
   * Get the menu items
   */
  getNavMenuItems = (menusData) => {
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
        const ItemDom = this.getSubMenuOrItem(item);
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

  isMainMenu = (key) => {
    const { menuData } = this.props;
    return menuData.some(
      (item) => key && (item.key === key || item.path === key),
    );
  };

  handleOpenChange = ({ openKeys }) => {
    const lastOpenKey = openKeys[openKeys.length - 1];
    const moreThanOne =
      openKeys.filter((openKey) => this.isMainMenu(openKey)).length > 1;
    this.setState({
      openKeys: moreThanOne ? [lastOpenKey] : [...openKeys],
    });
  };

  changeMode = (value) => this.props.onCollapse?.(value);

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
    const { menuData, collapsed, TitleLogo, logo } = this.props;
    const width = collapsed ? 80 : this.state.width;
    const { openKeys } = this.state;
    const itemsByPath = new Map();
    const indexItems = (items) =>
      items.forEach((item) => {
        itemsByPath.set(item.path, item);
        if (item.children) indexItems(item.children);
      });
    indexItems(menuData);
    // Don't show popup menu when it is been collapsed
    const menuProps = collapsed
      ? {}
      : {
          openKeys,
        };
    // if pathname can't match, use the nearest parent's key
    let selectedKeys = this.getSelectedMenuKeys();
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
        <Sider
          style={{ width, flex: `0 0 ${width}px`, minWidth: width }}
          className={styles.sider}
        >
          <Link to="/">
            <div className={styles.logo} key="logo">
              <img
                className={collapsed ? styles.logoMark : styles.TitleLogo}
                src={collapsed ? logo : TitleLogo}
                alt="Apache ShenYu"
              />
            </div>
          </Link>
          <div className={styles.changeMode}>
            <Switch
              aria-label="Compact menu"
              checked={Boolean(collapsed)}
              onChange={this.changeMode}
            />
            {!collapsed && <span>Compact menu</span>}
          </div>
          <Nav
            isCollapsed={Boolean(collapsed)}
            {...menuProps}
            onOpenChange={this.handleOpenChange}
            selectedKeys={selectedKeys}
            style={{ width: "100%", border: 0 }}
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
            {this.getNavMenuItems(menuData)}
          </Nav>
        </Sider>
      </Resizable>
    );
  }
}
