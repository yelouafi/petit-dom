import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";

export default {
  entry: "src/index.js",
  dest: "dist/petit-dom.min.js",
  format: "umd",
  moduleName: "petitDom",
  sourceMap: "dist/petit-dom.min.map",
  plugins: [
    babel({
      presets: [["es2015", { modules: false }]],
      exclude: "node_modules/**"
    }),
    uglify()
  ]
};
