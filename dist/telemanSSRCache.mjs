var index = (function (_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$variable = _ref.variable,
      variable = _ref$variable === void 0 ? '__SSR_CACHE__' : _ref$variable,
      _ref$mode = _ref.mode,
      mode = _ref$mode === void 0 ? window[variable] ? 'client' : 'server' : _ref$mode,
      cacheKeyGenerator = _ref.cacheKeyGenerator,
      tagGenerator = _ref.tagGenerator,
      onServerRendered = _ref.onServerRendered,
      onClientPreloaded = _ref.onClientPreloaded;

  var cache, script, serverIdleTimer, clientIdleTimer;

  if (mode === 'server') {
    if (onClientPreloaded) onClientPreloaded();
    cache = [];
    script = document.createElement('script');
    document.body.insertBefore(script, document.body.getElementsByTagName('script')[0] || null);
    resetServerIdleTimer();
  } else {
    cache = window[variable];

    if (onClientPreloaded) {
      if (!cache || !cache.length) {
        onClientPreloaded();
        onClientPreloaded = null;
      } else {
        resetClientIdleTimer();
      }
    }
  }

  function resetServerIdleTimer() {
    clearTimeout(serverIdleTimer);
    serverIdleTimer = setTimeout(function () {
      script.text = "var " + variable + " = " + JSON.stringify(cache);

      if (onServerRendered) {
        onServerRendered();
        onServerRendered = null;
      }
    }, 450);
  }

  function resetClientIdleTimer() {
    clearTimeout(clientIdleTimer);

    if (onClientPreloaded) {
      clientIdleTimer = setTimeout(function () {
        if (onClientPreloaded) {
          onClientPreloaded();
          onClientPreloaded = null;
        }
      }, 450);
    }
  }

  return function (ctx, next) {
    if (!ctx.options.method || ctx.options.method.toUpperCase() !== 'GET' || !cache) {
      return next();
    }

    var key = cacheKeyGenerator ? cacheKeyGenerator(ctx) : ctx.url;
    var tag = tagGenerator ? tagGenerator(ctx) : '';
    var hitIndex = cache.findIndex(function (item) {
      return item.key === key;
    });
    var hit = hitIndex === -1 ? null : cache[hitIndex];

    if (mode === 'server') {
      if (hit && hit.tag === tag) return hit.body;
      clearTimeout(serverIdleTimer);
      return next().then(function (body) {
        cache.push({
          key: key,
          tag: tag,
          body: body
        });
        return body;
      }).finally(function () {
        resetServerIdleTimer();
      });
    } else {
      resetClientIdleTimer();

      if (!hit) {
        return next().finally(function () {
          return resetClientIdleTimer();
        });
      }

      cache.splice(hitIndex, 1);

      if (!cache.length) {
        cache = null;

        if (onClientPreloaded) {
          clearTimeout(clientIdleTimer);
          onClientPreloaded();
          onClientPreloaded = null;
        }
      }

      if (hit.tag === tag) {
        return hit.body;
      } else {
        return next().finally(function () {
          return resetClientIdleTimer();
        });
      }
    }
  };
});

export default index;
//# sourceMappingURL=telemanSSRCache.mjs.map
