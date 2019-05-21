export default ({
  variable = '__SSR_CACHE__',
  mode = window[variable] ? 'client' : 'server',
  cacheKeyGenerator,
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

      script.text = `var ${variable} = "${encodeURI(JSON.stringify(cache))}"`

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
    const hit = cache.find(item => item.key === key)

    if (mode === 'server') {
      if (hit) {
        return hit.body
      }

      clearTimeout(serverIdleTimer)

      return next().then(body => {
        cache.push({ key, body })
        return body
      }).finally(() => {
        resetServerIdleTimer()
      })
    } else {
      resetClientIdleTimer()

      if (!hit) {
        return next().finally(() => resetClientIdleTimer())
      }

      if (cacheValidator ? cacheValidator(ctx) : true) {
        cleanCache()
        return hit.body
      } else {
        let promise = next()

        if (useCacheOnError) {
          promise = promise.catch(e => {
            if (useCacheOnError === true ||
              useCacheOnError && useCacheOnError.constructor === Function && useCacheOnError(e, hit.body, ctx)) {
              return hit.body
            } else {
              throw e
            }
          })
        }

        return promise.finally(() => {
          cleanCache()
          resetClientIdleTimer()
        })
      }
    }

    function cleanCache() {
      if (!cache) {
        return
      }

      const i = cache.indexOf(hit)

      if (i === -1) {
        return
      }

      cache.splice(i, 1)

      if (!cache.length) {
        cache = null

        if (onClientPreloaded) {
          clearTimeout(clientIdleTimer)
          onClientPreloaded()
          onClientPreloaded = null
        }
      }
    }
  }
}
