export { h } from "./h.js";
export { mount, patch, patchInPlace, unmount } from "./vdom.js";
export { getDomNode, getParentNode, getNextSibling } from "./dom.js";
import { insertDom } from "./dom.js";
import { mount, patchInPlace, DEFAULT_ENV } from "./vdom.js";

let effects = [];

export function scheduleEffect(eff) {
  effects.push(eff);
}

function runEffects() {
  while (effects.length > 0) {
    let currentEffects = effects;
    effects = [];
    currentEffects.forEach((eff) => eff());
  }
}

export function render(vnode, parentDomNode, env = DEFAULT_ENV) {
  let rootRef = parentDomNode.$$PETIT_DOM_REF;
  if (rootRef == null) {
    const ref = mount(vnode, env);
    parentDomNode.$$PETIT_DOM_REF = { ref, vnode };
    parentDomNode.textContent = "";
    insertDom(parentDomNode, ref, null);
  } else {
    rootRef.ref = patchInPlace(
      parentDomNode,
      vnode,
      rootRef.vnode,
      rootRef.ref,
      env
    );
    rootRef.vnode = vnode;
  }
  runEffects();
}
