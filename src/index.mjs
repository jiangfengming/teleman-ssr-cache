export default ({ mode, variable, cacheKeyFn, tagFn, onServerCached, onClientConsumed } = {}) => {
  let cache, script

  if (mode === 'server') {
    if (onClientConsumed) onClientConsumed()
    cache = []
    script = document.createElement('script')
    document.body.insertBefore(script, document.body.getElementsByTagName('script')[0] || null)
    resetServerIdleTimer()
  } else {
    cache = window[variable]

    if (onClientConsumed) {
      if (!cache || !cache.length) {
        onClientConsumed()
        onClientConsumed = null
      } else {
        resetClientIdleTimer()
      }
    }
  }

  let serverIdleTimer
  function resetServerIdleTimer() {
    clearTimeout(serverIdleTimer)

    serverIdleTimer = setTimeout(() => {
      script.text = `var ${variable} = ${JSON.stringify(cache)}`

      if (onServerCached) {
        onServerCached()
        onServerCached = null
      }
    }, 450)
  }

  let clientIdleTimer
  function resetClientIdleTimer() {
    clearTimeout(clientIdleTimer)

    if (onClientConsumed) {
      clientIdleTimer = setTimeout(() => {
        if (onClientConsumed) {
          onClientConsumed()
          onClientConsumed = null
        }
      }, 450)
    }
  }

  return (ctx, next) => {
    if (!cache) return next()

    const key = cacheKeyFn ? cacheKeyFn(ctx) : ctx.url
    const tag = tagFn ? tagFn(ctx) : ''
    const hitIndex = cache.findIndex(item => item.key === key)
    const hit = hitIndex === -1 ? null : cache[hitIndex]

    if (mode === 'server') {
      if (hit && hit.tag === tag) return hit.body

      clearTimeout(serverIdleTimer)

      return next().then(body => {
        cache.push({ key, tag, body })
        return body
      }).finally(() => {
        resetServerIdleTimer()
      })
    } else {
      resetClientIdleTimer()

      if (!hit) {
        return next().finally(() => resetClientIdleTimer())
      }

      cache.splice(hitIndex, 1)
      if (!cache.length) {
        cache = null
        if (onClientConsumed) {
          clearTimeout(clientIdleTimer)
          onClientConsumed()
          onClientConsumed = null
        }
      }

      if (hit.tag === tag) {
        return hit.body
      } else {
        return next().finally(() => resetClientIdleTimer())
      }
    }
  }
}
