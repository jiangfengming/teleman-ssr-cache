export default ({
  variable = '__SSR_CACHE__',
  mode = window[variable] ? 'client' : 'server',
  cacheKeyGenerator,
  tagGenerator,
  cacheValidator,
  useCacheOnError,
  onServerRendered,
  onClientPreloaded
} = {}) => {
  let cache, script, serverIdleTimer, clientIdleTimer

  if (mode === 'server') {
    if (onClientPreloaded) {
      onClientPreloaded()
    }

    cache = []
    resetServerIdleTimer()
  } else {
    if (window[variable]) {
      cache = window[variable] = JSON.parse(decodeURI(window[variable]))
    }

    if (onClientPreloaded) {
      if (!cache || !cache.length) {
        onClientPreloaded()
        onClientPreloaded = null
      } else {
        resetClientIdleTimer()
      }
    }
  }

  function resetServerIdleTimer() {
    clearTimeout(serverIdleTimer)

    serverIdleTimer = setTimeout(() => {
      if (!script) {
        script = document.createElement('script')
        document.body.insertBefore(script, document.body.getElementsByTagName('script')[0] || null)
      }

      script.text = `var ${variable} = '${encodeURI(JSON.stringify(cache))}'`

      if (onServerRendered) {
        onServerRendered()
        onServerRendered = null
      }
    }, 450)
  }

  function resetClientIdleTimer() {
    clearTimeout(clientIdleTimer)

    if (onClientPreloaded) {
      clientIdleTimer = setTimeout(() => {
        if (onClientPreloaded) {
          onClientPreloaded()
          onClientPreloaded = null
        }
      }, 450)
    }
  }

  return (ctx, next) => {
    if (!cache || ctx.options.method && ctx.options.method.toUpperCase() !== 'GET') {
      return next()
    }

    const key = cacheKeyGenerator ? cacheKeyGenerator(ctx) : ctx.url
    const tag = tagGenerator ? tagGenerator(ctx) : undefined
    const hitIndex = cache.findIndex(item => item.key === key)
    const hit = hitIndex === -1 ? null : cache[hitIndex]

    if (mode === 'server') {
      if (hit && hit.tag === tag) {
        return hit.body
      }

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

        if (onClientPreloaded) {
          clearTimeout(clientIdleTimer)
          onClientPreloaded()
          onClientPreloaded = null
        }
      }

      const isHit = hit.tag === tag

      if (isHit && (cacheValidator ? cacheValidator(ctx) : true)) {
        return hit.body
      } else {
        let promise = next()

        if (isHit && useCacheOnError) {
          promise = promise.catch(e => {
            if (useCacheOnError === true ||
              useCacheOnError && useCacheOnError.constructor === Function && useCacheOnError(e, hit.body, ctx)) {
              return hit.body
            } else {
              throw e
            }
          })
        }

        return promise.finally(() => resetClientIdleTimer())
      }
    }
  }
}
