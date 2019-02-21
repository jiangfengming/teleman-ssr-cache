import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.mjs',
  output: {
    format: 'umd',
    name: 'telemanCache',
    file: 'dist/telemanCache.js',
    sourcemap: true
  },
  plugins: [
    babel()
  ]
}
