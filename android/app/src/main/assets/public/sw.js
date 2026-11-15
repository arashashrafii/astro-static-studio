/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-8d0d8005'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "49cbd4be7c63127cfa99e158a3abdc3b"
  }, {
    "url": "index.html",
    "revision": "4bb6bb7b3e4ffce212d9b87336f163a1"
  }, {
    "url": "icon.svg",
    "revision": "fbd06e78b717c14689bf128c24d0d251"
  }, {
    "url": "icon-512.png",
    "revision": "d6dff832cbbd5cf9b3e25f5362859e79"
  }, {
    "url": "icon-192.png",
    "revision": "b351bc8f43d676c3314f20153ce8c353"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "07d857d8f76a54cdd70db9fba44326a8"
  }, {
    "url": "assets/rich-text-editor-BiIBTm2o.js",
    "revision": null
  }, {
    "url": "assets/quill.snow-DxS_hAU9.js",
    "revision": null
  }, {
    "url": "assets/quill-DVB7LGv8.css",
    "revision": null
  }, {
    "url": "assets/index-BNwCHrbJ.js",
    "revision": null
  }, {
    "url": "assets/index-4WIgW5cy.css",
    "revision": null
  }, {
    "url": "assets/dashboard-v2-mVKLnkPo.js",
    "revision": null
  }, {
    "url": "assets/collection-review-prototype-BzXetEz-.js",
    "revision": null
  }, {
    "url": "assets/collection-review-prototype-BWimBqWm.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "07d857d8f76a54cdd70db9fba44326a8"
  }, {
    "url": "icon-192.png",
    "revision": "b351bc8f43d676c3314f20153ce8c353"
  }, {
    "url": "icon-512.png",
    "revision": "d6dff832cbbd5cf9b3e25f5362859e79"
  }, {
    "url": "icon.svg",
    "revision": "fbd06e78b717c14689bf128c24d0d251"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "49cbd4be7c63127cfa99e158a3abdc3b"
  }, {
    "url": "manifest.webmanifest",
    "revision": "96a21e0deb89e6b71a77f8c3e56d7637"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//, /^\/media\//, /^\/preview(?:\/|$)/]
  }));
  workbox.registerRoute(/^\/api\/(?:content|status|theme|media\/stats)$/, new workbox.NetworkFirst({
    "cacheName": "studio-api-cache",
    "networkTimeoutSeconds": 3,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^\/media\/.*/, new workbox.CacheFirst({
    "cacheName": "studio-media-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 300,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
