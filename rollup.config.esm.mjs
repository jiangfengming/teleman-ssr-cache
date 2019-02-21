import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.mjs',
  output: {
    format: 'es',
    file: 'dist/telemanCache.mjs',
    sourcemap: true
  },
  plugins: [
    babel()
  ]
}
