import { mount, patch, unmount } from "./vdom.js";

function shallowCompare(p1, p2, c1, c2) {
  if (c1 !== c2) return true;

  for (var key in p1) {
    if (p1[key] !== p2[key]) return true;
  }
  return false;
}

function mountRenderComponent(renderFunction, props, env) {
  var renderedVNode = renderFunction(props);
  var node = mount(renderedVNode, env);
  return {
    node,
    renderedVNode
  };
}

function patchRenderComponent(
  renderFunction,
  newProps,
  oldProps,
  oldState,
  shouldUpdate,
  env
) {
  if (!shouldUpdate(newProps, oldProps)) {
    return oldState;
  }
  var renderedVNode = renderFunction(newProps);

  var node = patch(renderedVNode, oldState.renderedVNode, oldState.node, env);
  return {
    node,
    renderedVNode
  };
}

export function createRenderComponent({
  render,
  shouldUpdate = shallowCompare
}) {
  return {
    mount(props, env) {
      return mountRenderComponent(render, props, env);
    },
    patch(newProps, oldProps, oldState, env) {
      return patchRenderComponent(
        render,
        newProps,
        oldProps,
        oldState,
        shouldUpdate,
        env
      );
    },
    unmount(state, node, env) {
      unmount(state.renderedVNode, node, env);
    }
  };
}
