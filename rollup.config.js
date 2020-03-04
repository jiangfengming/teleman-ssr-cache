import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.js',

  output: {
    format: 'esm',
    file: 'dist/teleman-ssr-cache.js',
    sourcemap: true
  },

  plugins: [
    babel()
  ]
}
