/*!
 * Copyright (c) 2017-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

interface FetchResponse {
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  json: () => Promise<any>;
}

export type Fetch = (url: string) => Promise<FetchResponse>;

/**
 * Built-in fetch helpers can be used to initialize the adblocker from
 * pre-built presets or raw lists (fetched from multiple sources). In case of
 * failure (e.g. timeout), the whole process of initialization fails. Timeouts
 * are not so uncommon, and retrying to fetch usually succeeds.
 */
export function fetchWithRetry(fetch: Fetch, url: string): Promise<FetchResponse> {
  let retry = 3;

  // Wrap `fetch` into a lightweight retry function which makes sure that if
  // fetching fails, it can be retried up to three times. Failure can happen if
  // the remote server times-out, but retrying fetching of the same URL will
  // usually succeed.
  const fetchWrapper = (): Promise<FetchResponse> => {
    return fetch(url).catch((ex) => {
      if (retry > 0) {
        retry -= 1;
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            fetchWrapper().then(resolve).catch(reject);
          }, 500);
        });
      }

      throw ex;
    });
  };

  return fetchWrapper();
}

function fetchResource(fetch: Fetch, url: string): Promise<string> {
  return fetchWithRetry(fetch, url).then((response) => response.text());
}

const PREFIX =
  'https://raw.githubusercontent.com/cliqz-oss/adblocker/master/packages/adblocker/assets';

const ABP_PREFIX = "https://easylist-downloads.adblockplus.org";

export const abpLists = [
  `${ABP_PREFIX}/abpindo+easylist.txt`,
  `${ABP_PREFIX}/abpvn+easylist.txt`,
  `${ABP_PREFIX}/bulgarian_list+easylist.txt`,
  `${ABP_PREFIX}/dandelion_sprouts_nordic_filters+easylist.txt`,
  `${ABP_PREFIX}/easylist.txt`,
  `${ABP_PREFIX}/easylistchina+easylist.txt`,
  `${ABP_PREFIX}/easylistczechslovak+easylist.txt`,
  `${ABP_PREFIX}/easylistdutch+easylist.txt`,
  `${ABP_PREFIX}/easylistgermany+easylist.txt`,
  `${ABP_PREFIX}/israellist+easylist.txt`,
  `${ABP_PREFIX}/easylistitaly+easylist.txt`,
  `${ABP_PREFIX}/easylistlithuania+easylist.txt`,
  `${ABP_PREFIX}/easylistpolish+easylist.txt`,
  `${ABP_PREFIX}/easylistportuguese+easylist.txt`,
  `${ABP_PREFIX}/easylistspanish+easylist.txt`,
  `${ABP_PREFIX}/indianlist+easylist.txt`,
  `${ABP_PREFIX}/koreanlist+easylist.txt`,
  `${ABP_PREFIX}/latvianlist+easylist.txt`,
  `${ABP_PREFIX}/liste_ar+liste_fr+easylist.txt`,
  `${ABP_PREFIX}/liste_fr+easylist.txt`,
  `${ABP_PREFIX}/rolist+easylist.txt`,
  `${ABP_PREFIX}/ruadlist+easylist.txt`,
  `${ABP_PREFIX}/abp-filters-anti-cv.txt`,
  `${ABP_PREFIX}/i_dont_care_about_cookies.txt`,
  `${ABP_PREFIX}/fanboy-notifications.txt`,
  `${ABP_PREFIX}/easyprivacy.txt`,
  `${ABP_PREFIX}/fanboy-social.txt`,
]

export const adsLists = [
  `${PREFIX}/easylist/easylist.txt`,
  `${PREFIX}/easylist/easylistgermany.txt`,
  `${PREFIX}/peter-lowe/serverlist.txt`,
  `${PREFIX}/ublock-origin/annoyances.txt`,
  `${PREFIX}/ublock-origin/badware.txt`,
  `${PREFIX}/ublock-origin/filters.txt`,
  `${PREFIX}/ublock-origin/filters-2020.txt`,
  `${PREFIX}/ublock-origin/filters-2021.txt`,
  `${PREFIX}/ublock-origin/filters-2022.txt`,
  `${PREFIX}/ublock-origin/resource-abuse.txt`,
  `${PREFIX}/ublock-origin/unbreak.txt`,
];

export const adsAndTrackingLists = [
  ...adsLists,
  `${PREFIX}/easylist/easyprivacy.txt`,
  `${PREFIX}/ublock-origin/privacy.txt`,
];

export const fullLists = [...abpLists, ...adsAndTrackingLists, `${PREFIX}/easylist/easylist-cookie.txt`];

/**
 * Fetch latest version of enabledByDefault blocking lists.
 */
export function fetchLists(fetch: Fetch, urls: string[]): Promise<string[]> {
  return Promise.all(urls.map((url) => fetchResource(fetch, url)));
}

/**
 * Fetch latest version of uBlock Origin's resources, used to inject scripts in
 * the page or redirect request to data URLs.
 */
export function fetchResources(fetch: Fetch): Promise<string> {
  return fetchResource(fetch, `${PREFIX}/ublock-origin/resources.txt`);
}
