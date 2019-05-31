import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.mjs',
  output: {
    format: 'esm',
    file: 'dist/index.mjs',
    sourcemap: true
  },
  plugins: [
    babel()
  ]
}
