import babel from "rollup-plugin-babel";

export default {
  entry: "src/main.js",
  dest: "dist/build.js",
  format: "iife",
  sourceMap: "inline",
  plugins: [
    babel({
      presets: [["es2015", { modules: false }]],
      plugins: ["external-helpers", ["transform-react-jsx", { pragma: "h" }]],
      exclude: "node_modules/**"
    })
  ]
};
