import {
  mount,
  patchInPlace,
  unmount,
  getParentNode,
} from "../../src/index.js";

export function createSMComponent({ render, update, output }) {
  return {
    mount(props, instance, env) {
      instance.env = env;
      instance.props = props;
      instance.emit = (event) => {
        let newState = update(instance.props, instance.state, event);
        if (newState !== instance.state) {
          instance.state = newState;
          updateUI(instance);
          Promise.resolve().then(() => {
            output(
              instance.props,
              instance.state,
              instance.event,
              instance.emit
            );
          });
        }
      };
      instance.state = update(props, undefined, { type: "$INIT" });
      instance.vnode = render(props, instance.state, instance.emit);
      instance.childRef = mount(instance.vnode, env);
      return instance.childRef;
    },
    patch(parentNode, newProps, oldProps, ref, instance, env) {
      instance.props = newProps;
      instance.env = env;
      updateUI(instance);
      Promise.resolve().then(() => {
        output(instance.props, instance.state, instance.event, instance.emit);
      });
      return instance.childRef;
    },
    unmount(props, ref, instance, env) {
      unmount(instance.vnode, instance.childRef, env);
    },
  };

  function updateUI(instance) {
    let oldVNode = instance.vnode;
    instance.vnode = render(instance.props, instance.state, instance.emit);
    instance.childRef = patchInPlace(
      getParentNode(instance.childRef),
      instance.vnode,
      oldVNode,
      instance.childRef,
      instance.env
    );
  }
}
