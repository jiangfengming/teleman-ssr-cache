# teleman-cache
Teleman Server-Side Rendering middleware

## Usage
```js
import Teleman from 'teleman'
import cache from 'teleman-cache'

const api = new Teleman({
  urlPrefix: 'https://api.example.com'
})

api.use(cache({
  mode: CURRENT_ENV, // server | client
  variable: '__API_CACHE__',

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
}))
```
