import { mount, patch, unmount } from "../../../src/index.js";

const promise = Promise.resolve();
function doLater(fn) {
  promise.then(fn);
}

export class Component {
  constructor(props) {
    this.props = props;
  }

  shouldComponentUpdate() {
    return true;
  }

  setState() {
    throw new Error("Calling setState on an unmounted component");
  }

  static mount(props, stateRef, env) {
    var instance = new this(props);
    stateRef.instance = instance;
    stateRef.env = env;

    instance.setState = function setState(updater) {
      const newState = updater(instance.state, instance.props);
      if (newState !== instance.state) {
        if (!instance.shouldComponentUpdate(instance.props, newState)) {
          instance.state = newState;
          return;
        }
        instance.state = newState;
        const domNode = instance.forceUpdate();
        if (domNode !== stateRef.node) {
          const parentNode = stateRef.node.parentNode;
          if (parentNode != null) {
            parentNode.replaceChild(domNode, stateRef.node);
          }
          stateRef.node = domNode;
        }
      }
    };

    instance.forceUpdate = function forceUpdate() {
      var newVNode = instance.render();
      var oldVNode = stateRef.vnode;
      stateRef.vnode = newVNode;
      return patch(newVNode, oldVNode, stateRef.node, stateRef.env);
    };

    stateRef.vnode = instance.render(instance);
    stateRef.node = mount(stateRef.vnode, env);
    if (instance.componentDidMount != null) {
      doLater(() => instance.componentDidMount());
    }
    return stateRef.node;
  }

  static patch(newProps, oldProps, stateRef, domNode, env) {
    const instance = stateRef.instance;
    if (!instance.shouldComponentUpdate(newProps, instance.state)) {
      return domNode;
    }
    instance.props = newProps;
    stateRef.env = env;
    stateRef.node = instance.forceUpdate();
    if (instance.componentDidUpdate != null) {
      doLater(() => instance.componentDidUpdate(oldProps, instance.state));
    }
    return stateRef.node;
  }

  static unmount(stateRef, domNode, env) {
    delete stateRef.instance.setState;
    delete stateRef.instance.forceUpdate;
    if (stateRef.instance.componentWillUnmount != null) {
      stateRef.instance.componentWillUnmount();
    }
    unmount(stateRef.vnode, domNode, env);
  }
}
