import test from "tape";
import { h, mount, patch } from "../src";

test("range input", assert => {
  const vnode = h("input", {
    value: "0.5",
    type: "range",
    min: "0",
    max: "1",
    step: "0.05"
  });

  const node = mount(vnode);

  assert.equal(node.value, "0.5", "range value should be 0.5");

  const vnode2 = h("input", {
    value: "1.5",
    type: "range",
    min: "0",
    max: "2",
    step: "0.05"
  });
  patch(vnode2, vnode);
  assert.equal(node.value, "1.5", "range value should be 1.5");
  assert.end();
});
