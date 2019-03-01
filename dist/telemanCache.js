(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.telemanCache = factory());
}(this, function () { 'use strict';

  var index = (function (_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        _ref$variable = _ref.variable,
        variable = _ref$variable === void 0 ? '__API_CACHE__' : _ref$variable,
        _ref$mode = _ref.mode,
        mode = _ref$mode === void 0 ? window[variable] ? 'client' : 'server' : _ref$mode,
        cacheKeyGenerator = _ref.cacheKeyGenerator,
        tagGenerator = _ref.tagGenerator,
        onServerCached = _ref.onServerCached,
        onClientConsumed = _ref.onClientConsumed;

    var cache, script, serverIdleTimer, clientIdleTimer;

    if (mode === 'server') {
      if (onClientConsumed) onClientConsumed();
      cache = [];
      script = document.createElement('script');
      document.body.insertBefore(script, document.body.getElementsByTagName('script')[0] || null);
      resetServerIdleTimer();
    } else {
      cache = window[variable];

      if (onClientConsumed) {
        if (!cache || !cache.length) {
          onClientConsumed();
          onClientConsumed = null;
        } else {
          resetClientIdleTimer();
        }
      }
    }

    function resetServerIdleTimer() {
      clearTimeout(serverIdleTimer);
      serverIdleTimer = setTimeout(function () {
        script.text = "var " + variable + " = " + JSON.stringify(cache);

        if (onServerCached) {
          onServerCached();
          onServerCached = null;
        }
      }, 450);
    }

    function resetClientIdleTimer() {
      clearTimeout(clientIdleTimer);

      if (onClientConsumed) {
        clientIdleTimer = setTimeout(function () {
          if (onClientConsumed) {
            onClientConsumed();
            onClientConsumed = null;
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

          if (onClientConsumed) {
            clearTimeout(clientIdleTimer);
            onClientConsumed();
            onClientConsumed = null;
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

  return index;

}));
//# sourceMappingURL=telemanCache.js.map
