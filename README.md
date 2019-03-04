# teleman-cache
Teleman Server-Side Rendering middleware

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
  variable: '__SSR_CACHE__',

  mode: CURRENT_ENV, // server | client

  cacheKeyGenerator(ctx) {
    return ctx.url.pathname + ctx.url.search
  },

  tagGenerator(ctx) {
    return ctx.cacheTag
  },
  
  onServerCached() {
    window.PAGE_READY = true  
  },

  onClientConsumed() {
    mountAPPIntoDOM()
  }
})
```

## License
[MIT](LICENSE)
