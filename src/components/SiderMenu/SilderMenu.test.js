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

import { urlToList } from '../_utils/pathTools';
import { getFlatMenuKeys, getMenuMatchKeys } from './SiderMenu';

const menu = [
  {
    path: '/dashboard',
    children: [
      {
        path: '/dashboard/name',
      },
    ],
  },
  {
    path: '/userinfo',
    children: [
      {
        path: '/userinfo/:id',
        children: [
          {
            path: '/userinfo/:id/info',
          },
        ],
      },
    ],
  },
];

const flatMenuKeys = getFlatMenuKeys(menu);

describe('test convert nested menu to flat menu', () => {
  it('simple menu', () => {
    expect(flatMenuKeys).toEqual([
      '/dashboard',
      '/dashboard/name',
      '/userinfo',
      '/userinfo/:id',
      '/userinfo/:id/info',
    ]);
  });
});

describe('test menu match', () => {
  it('simple path', () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList('/dashboard'))).toEqual(['/dashboard']);
  });

  it('error path', () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList('/dashboardname'))).toEqual([]);
  });

  it('Secondary path', () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList('/dashboard/name'))).toEqual([
      '/dashboard',
      '/dashboard/name',
    ]);
  });

  it('Parameter path', () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList('/userinfo/2144'))).toEqual([
      '/userinfo',
      '/userinfo/:id',
    ]);
  });

  it('three parameter path', () => {
    expect(getMenuMatchKeys(flatMenuKeys, urlToList('/userinfo/2144/info'))).toEqual([
      '/userinfo',
      '/userinfo/:id',
      '/userinfo/:id/info',
    ]);
  });
});
