import test from "tape";
import { h, render } from "../src/index.js";

test("range input", (assert) => {
  const root = document.createElement("div");
  render(
    h("input", {
      value: "0.5",
      type: "range",
      min: "0",
      max: "1",
      step: "0.05",
    }),
    root
  );

  const node = root.firstChild;

  assert.equal(node.value, "0.5", "range value should be 0.5");

  render(
    h("input", {
      value: "1.5",
      type: "range",
      min: "0",
      max: "2",
      step: "0.05",
    }),
    root
  );

  assert.equal(node.value, "1.5", "range value should be 1.5");
  assert.end();
});
