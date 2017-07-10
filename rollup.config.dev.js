import babel from "rollup-plugin-babel";

export default {
  entry: "src/index.js",
  dest: "dist/petit-dom.dev.js",
  format: "umd",
  moduleName: "petitDom",
  sourceMap: "inline",
  plugins: [
    babel({
      presets: [["es2015", { modules: false }]],
      exclude: "node_modules/**"
    })
  ]
};
