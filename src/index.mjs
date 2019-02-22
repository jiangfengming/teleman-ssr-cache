export default ({ mode, store, genCacheKey, genTag, idle = 400, onServerCached, onClientConsumed } = {}) => {
  if (mode === 'server') {
  } else {
  }

  return (ctx, next) => {
    const cacheKey = genCacheKey ? genCacheKey(ctx) : ctx.options.cacheKey || ctx.url
  }
}
