import test from "tape";
import { h, mount, patch } from "../src";

test("range input", assert => {
  const vnode = h("input", {
    type: "range",
    value: "0.5",
    min: "0",
    max: "1",
    step: "0.05"
  });

  const node = mount(vnode);
  /**
    likely a JSDOM bug: 
      this should fail if value is set before min, max but instead it passes
  **/
  assert.equal(node.value, "0.5", "range value should be 0.5");

  const vnode2 = h("input", {
    type: "range",
    value: "1.5",
    min: "0",
    max: "2",
    step: "0.05"
  });
  patch(vnode2, vnode);
  assert.equal(node.value, "1.5", "range value should be 1.5");
  assert.end();
});
