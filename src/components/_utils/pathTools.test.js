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

import { urlToList } from './pathTools';

describe('test urlToList', () => {
  it('A path', () => {
    expect(urlToList('/userinfo')).toEqual(['/userinfo']);
  });
  it('Secondary path', () => {
    expect(urlToList('/userinfo/2144')).toEqual(['/userinfo', '/userinfo/2144']);
  });
  it('Three paths', () => {
    expect(urlToList('/userinfo/2144/addr')).toEqual([
      '/userinfo',
      '/userinfo/2144',
      '/userinfo/2144/addr',
    ]);
  });
});
