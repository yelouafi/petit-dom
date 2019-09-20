import { mount, patch, unmount } from "./vdom.js";

export function createRenderComponent({
  render,
  shouldUpdate = shallowCompare
}) {
  return {
    mount(props, stateRef, env) {
      var vnode = render(props);
      stateRef.vnode = vnode;
      return mount(vnode, env);
    },
    patch(newProps, oldProps, stateRef, domNode, env) {
      if (!shouldUpdate(newProps, oldProps)) {
        return domNode;
      }
      var newVNode = render(newProps);
      var oldVNode = stateRef.vnode;
      stateRef.vnode = newVNode;
      return patch(newVNode, oldVNode, domNode, env);
    },
    unmount(stateRef, domNode, env) {
      stateRef.wasUnmounted = true;
      unmount(stateRef.vnode, domNode, env);
    }
  };
}

function shallowCompare(p1, p2, c1, c2) {
  if (c1 !== c2) return true;

  for (var key in p1) {
    if (p1[key] !== p2[key]) return true;
  }
  return false;
}

const PD_COMPONENT = Symbol("@petit-dom/component");

export function createFunctionComponent(renderFunction) {
  var component = renderFunction[PD_COMPONENT];
  if (component == null) {
    component = renderFunction[PD_COMPONENT] = createRenderComponent({
      render: renderFunction,
      shouldUpdate: renderFunction.shouldUpdate
    });
  }
  return component;
}
