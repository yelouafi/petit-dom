export { h, jsx, Fragment } from "./h.js";
export { getParentNode } from "./dom.js";
import { insertDom } from "./dom.js";
import { mount, patchInPlace, DEFAULT_ENV } from "./vdom.js";

export function render(vnode, parentDomNode, options = {}) {
  let rootRef = parentDomNode.$$PETIT_DOM_REF;
  let env = Object.assign({}, DEFAULT_ENV);
  Object.assign(env.directives, options.directives);
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
}
