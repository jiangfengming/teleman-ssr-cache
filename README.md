# teleman-ssr-cache
Teleman SSR (Server-Side Rendering) caching middleware.

## Background
When a prerendered SPA (Single-Page Application) is loaded on the client side, the app will replace the
prerendered content with initial state, and make AJAX calls to fetch the content.
Until the responses arrive, the page will stay at the initial state, this causes the flash problem.

This middleware is used to preserve the state of the prerendered page.
It will cache the AJAX response on server-side rendering, then reuse the cache on the client side.

## Usage
```js
import Teleman from 'teleman'
import cache from 'teleman-ssr-cache'

const api = new Teleman({
  urlPrefix: 'https://api.example.com'
})

api.use(cache())
```

## Options

```js
cache({
  // The global variable to store the cached response when prerendering on the server side. e.g.
  // <script> var __SSR_CACHE__ = ... </script>
  // It will be inserted before the first <script> of <body>
  // In client mode, requests shouldn't be sent before page parsed the <script> tag.
  // The default name is '__SSR_CACHE__'
  variable: '__SSR_CACHE__',

  // Current environment
  // 'server' means the page is prerendering on the server side,
  // 'client' means the page is rendering on the client side (user's browser).
  // If `mode` isn't set. It is guessed from `variable` option.
  // If window[variable] is `undefined`, the mode is `server`.
  // Otherwise, the mode is `client`
  mode: 'server',

  // Customize the cache key
  // The default is `ctx.url.href`.
  // On the server side, the cached response will be stored with this key.
  // On the client side, the request will find the cached response by this key.
  cacheKeyGenerator(ctx) {
    return ctx.url.pathname + ctx.url.search
  },

  // Customize the cache tag
  // If a cached response is found by cache key, but the cache tag doesn't met,
  // the cached response will not be used, and will be removed from the cache store.
  // The main purpose of cache tag is to eliminate the 450ms delay of `onClientPreloaded` callback in some circumstances.
  // For example, An API will return different response when the user has logged in or not logged in,
  // you can call teleman.get('/article', { id: 123 }, { cacheTag: userId })
  // On the server side rendering, the cache tag is `undefined`
  // On the client side, the cache tag is userId (logged in) or `undefined` (not logged in), so the cache will be used only
  // when not logged in. But anyhow, the cached response will be removed from the cache store.
  // So `onClientPreloaded` can be called immediately when the cache store becomes empty.
  // If you don't use cache tag, but append the userId onto the cache key. On the client side, when the request is sent
  // with login state, the cached response will not be hit, so the cache store will never be empty,
  // and `onClientPreloaded` has to be called after 450ms idle.
  tagGenerator(ctx) {
    return ctx.cacheTag
  },
  
  // On the server side, when there's no more requests in 450ms,
  // the middleware will seal the cached responses and insert into <body>,
  // then `onServerRendered` will be called.
  // You can use this callback to explicitly tell the server-side rendering engine the prerendering has complete.
  onServerRendered() {
    window.PAGE_READY = true  
  },

  // On the client side, when all cached responses have been consumed (cache store is empty),
  // or there's no more requests in 450ms, the `onClientPreloaded` callback will be called.
  // On the server side, the function will be called immediately.
  // If you use async components, you can mount the app into DOM in this callback to prevent the flash problem.
  onClientPreloaded() {
    mountAPPIntoDOM()
  }
})
```

## License
[MIT](LICENSE)
