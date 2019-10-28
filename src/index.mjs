export default ({
  variable = '__SSR_CACHE__',
  mode = !window[variable] && /Headless/i.test(navigator.userAgent) ? 'server' : 'client',
  cacheKeyGenerator,
  onServerRendered,
  onClientPreloaded
} = {}) => {
  let cache, script, serverIdleTimer, clientIdleTimer

  if (mode === 'server') {
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
    }, 400)
  }

  function resetClientIdleTimer() {
    clearTimeout(clientIdleTimer)

    if (onClientPreloaded) {
      clientIdleTimer = setTimeout(() => {
        if (onClientPreloaded) {
          onClientPreloaded()
          onClientPreloaded = null
        }
      }, 400)
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
        cache.push({
          key,
          body: JSON.parse(JSON.stringify(body)) // unreference
        })
        return body
      }).finally(resetServerIdleTimer)
    } else {
      resetClientIdleTimer()

      if (!hit) {
        return next().finally(resetServerIdleTimer)
      }

      cleanCache()
      return hit.body
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
