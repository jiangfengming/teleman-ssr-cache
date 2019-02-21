export default ({ mode, store, cacheKeyFn, idle = 400, emit } = {}) => {
  if (mode === 'server') {
  } else {

  }

  return (ctx, next) => {
    const cacheKey = cacheKeyFn ? cacheKeyFn(ctx.options.cacheKey) : ctx.options.cacheKey || ctx.url

  }
}
