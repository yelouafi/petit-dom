export { h } from "./h.js";
export { mount, patch, unmount } from "./vdom.js";
import { mount, patch, unmount } from "./vdom.js";

export function render(vnode, parentDomNode) {
  var state = parentDomNode.$$petitDomState$$;
  var domNode;
  if (state == null) {
    domNode = mount(vnode);
    parentDomNode.appendChild(domNode);
  } else {
    domNode = patch(vnode, state.vnode, state.domNode);
    if (domNode !== state.domNode) {
      parentDomNode.replaceChild(domNode, state.domNode);
      unmount(state.vnode);
    }
  }
  parentDomNode.$$petitDomState$$ = { vnode, domNode };
}
