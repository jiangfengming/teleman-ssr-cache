import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.mjs',
  output: {
    format: 'umd',
    name: 'telemanSSRCache',
    file: 'dist/telemanSSRCache.js',
    sourcemap: true
  },
  plugins: [
    babel()
  ]
}
