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
  // If window[variable] is `undefined` and User-Agent includes 'Headless', the mode is `server`.
  // Otherwise, the mode is `client`.
  mode: 'server',

  // Customize the cache key
  // The default is `ctx.url.href`.
  // On the server side, the cached response will be stored with this key.
  // On the client side, the request will find the cached response by this key.
  cacheKeyGenerator(ctx) {
    return ctx.url.pathname + ctx.url.search
  },

  // On the server side, when there's no more requests in 450ms,
  // the middleware will seal the cached responses and insert into <body>,
  // then `onCached` will be called.
  onCached() {
  },

  // On the client side, when all cached responses have been consumed (the cache store becomes empty),
  // or there's no more requests in 450ms, the `onConsumed` callback will be called.
  onConsumed() {
  }
})
```

## License
[MIT](LICENSE)
