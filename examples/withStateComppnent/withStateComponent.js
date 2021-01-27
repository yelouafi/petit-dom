import {
  mount,
  patchInPlace,
  unmount,
  getParentNode,
} from "../../src/index.js";

export function withState(render, getInitialState) {
  return {
    mount(props, instance, env) {
      instance.env = env;
      instance.props = props;
      instance.setState = (updater) => {
        let newState = updater(instance.state, instance.props);
        if (newState !== instance.state) {
          instance.state = newState;
          updateUI(instance);
        }
      };
      instance.state =
        typeof getInitialState === "function"
          ? getInitialState(props)
          : getInitialState;
      instance.vnode = render(props, instance.state, instance.setState);
      instance.childRef = mount(instance.vnode, env);
      return instance.childRef;
    },
    patch(parentNode, newProps, oldProps, ref, instance, env) {
      instance.props = newProps;
      instance.env = env;
      updateUI(instance);
      return instance.childRef;
    },
    unmount(props, ref, instance, env) {
      unmount(instance.vnode, instance.childRef, env);
    },
  };

  function updateUI(instance) {
    let oldVNode = instance.vnode;
    instance.vnode = render(instance.props, instance.state, instance.setState);
    instance.childRef = patchInPlace(
      getParentNode(instance.childRef),
      instance.vnode,
      oldVNode,
      instance.childRef,
      instance.env
    );
  }
}
