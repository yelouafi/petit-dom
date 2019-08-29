import test from "tape";
import { h, mount, patch } from "../src";

test("issues #24: applyDiff fails to insert when oldChildren is modified", assert => {
  const oldVnode = h("div", {}, [
    h("p", null, "p"),
    h("div", { key: "x" }, "div"),
    h("pre", null, "pre"),
    h("code", null, "code")
  ]);

  const newVnode = h("div", {}, [
    h("pre", null, "pre"),
    h("code", null, "code"),
    h("div", { key: "x" }, "div"),
    h("p", null, "p")
  ]);

  mount(oldVnode);
  patch(newVnode, oldVnode);
  assert.end();
});

test("issues #25: applyDiff fails with empty strings", assert => {
  const oldVnode = h("div", {}, [
    h("p", null, "p"),
    "",
    h("pre", null, "pre"),
    h("code", null, "code")
  ]);

  const newVnode = h("div", {}, [
    h("pre", null, "pre"),
    h("code", null, "code"),
    "",
    h("p", null, "p")
  ]);

  mount(oldVnode);
  patch(newVnode, oldVnode);

  assert.end();
});

test("issues #26: applyDiff fails with blank strings", assert => {
  const oldVnode = h("div", {}, [
    h("p", null, "p"),
    " ",
    h("pre", null, "pre"),
    h("code", null, "code")
  ]);

  const newVnode = h("div", {}, [
    h("pre", null, "pre"),
    h("code", null, "code"),
    " ",
    h("p", null, "p")
  ]);

  mount(oldVnode);
  patch(newVnode, oldVnode);

  assert.end();
});
