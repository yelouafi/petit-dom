import test from "tape";
import { h, mount, patch } from "../src";

test("unmount", assert => {
  let mountNode, unmountNode;

  const Wrapper = {
    mount(_, child) {
      mountNode = mount(child);
      return mountNode;
    },
    patch(node, _, __, newChild, oldChild) {
      return patch(newChild, oldChild);
    },
    unmount(node) {
      unmountNode = node;
    }
  };

  const vnode1 = h(
    "div",
    null,
    h("span", null, "some text"),
    h(Wrapper, null, h("p", null, "some text"))
  );

  mount(vnode1);

  const vnode2 = h(
    "div",
    null,
    h("span", null, "some text"),
    h("span", null, "another text")
  );

  patch(vnode2, vnode1);

  assert.equal(
    unmountNode,
    mountNode,
    "should call Wrapper.unmount with the mounted node as argument"
  );

  assert.end();
});
