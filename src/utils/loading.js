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

import createDvaLoading from "dva-loading";

// Action types used by dva-loading's reducer (not exported by the package).
const SHOW = "@@DVA_LOADING/SHOW";
const HIDE = "@@DVA_LOADING/HIDE";

// dva-loading 2.x dispatches HIDE only after the effect returns, so an effect
// that throws (e.g. a rejected request) or is cancelled leaves its loading
// flags set forever. Keep its reducer and only/except filtering, but always
// dispatch HIDE from a finally block.
export default function createLoading(opts = {}) {
  const loading = createDvaLoading(opts);

  function onEffect(effect, sagaEffects, model, actionType) {
    if (loading.onEffect(effect, sagaEffects, model, actionType) === effect) {
      return effect;
    }
    const { put } = sagaEffects;
    const payload = { namespace: model.namespace, actionType };
    return function* loadingEffect(...args) {
      yield put({ type: SHOW, payload });
      try {
        yield effect(...args);
      } finally {
        yield put({ type: HIDE, payload });
      }
    };
  }

  return { ...loading, onEffect };
}
