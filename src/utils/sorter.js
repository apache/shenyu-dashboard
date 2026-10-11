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

const isMissing = (value) =>
  value === null || value === undefined || value === "";

// Missing values are ordered before present values, so they stay together
// at the start of an ascending sort and at the end of a descending sort.
const compareWithMissing = (a, b, compare) => {
  const aMissing = isMissing(a);
  const bMissing = isMissing(b);
  if (aMissing || bMissing) {
    if (aMissing && bMissing) {
      return 0;
    }
    return aMissing ? -1 : 1;
  }
  return compare(a, b);
};

export const compareNumber = (a, b) =>
  compareWithMissing(a, b, (x, y) => {
    const numberA = Number(x);
    const numberB = Number(y);
    const aInvalid = Number.isNaN(numberA);
    const bInvalid = Number.isNaN(numberB);
    if (aInvalid || bInvalid) {
      if (aInvalid && bInvalid) {
        return 0;
      }
      return aInvalid ? -1 : 1;
    }
    return numberA - numberB;
  });

export const compareDate = (a, b) =>
  compareWithMissing(a, b, (x, y) =>
    compareNumber(new Date(x).getTime(), new Date(y).getTime()),
  );

export const sortByNumber = (field) => (a, b) =>
  compareNumber(a[field], b[field]);

export const sortByDate = (field) => (a, b) => compareDate(a[field], b[field]);
