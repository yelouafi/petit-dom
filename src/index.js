export { h } from "./h.js";
export { mount, patch, unmount } from "./vdom.js";
import { mount, patchInPlace } from "./vdom.js";

export function render(vnode, parentDomNode) {
  var state = parentDomNode.$$petitDomState$$;
  var domNode;
  if (state == null) {
    domNode = mount(vnode);
    parentDomNode.appendChild(domNode);
  } else {
    domNode = patchInPlace(vnode, state.vnode, state.domNode, parentDomNode);
  }
  parentDomNode.$$petitDomState$$ = { vnode, domNode };
}
