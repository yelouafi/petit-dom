import { isArray, EMPTYAR } from "./utils";
import { maybeFlatten } from "./h";
import { scheduleUpdate } from "./scheduler";
import { diffChildren } from "./vdom";

export class Component {
  static mount(type, props) {
    const inst = new type(props);
    inst.updateUI(inst.onMount);
    return inst.domNode;
  }

  static patch(domNode, props) {
    const inst = domNode.$instance;
    inst.beforeUpdate && inst.beforeUpdate(props);
    const shouldUpdate = !inst.shouldUpdate || inst.shouldUpdate(props);
    inst.props = props;
    if (shouldUpdate) {
      inst.updateUI(inst.onUpdate);
    }
    return domNode;
  }

  static unmount(domNode) {
    const inst = domNode.$instance;
    inst.onUnmount && inst.onUnmount();
  }

  constructor(props) {
    this.props = props;
    const tag = "v-" + (this.constructor.tag || this.constructor.name);
    this.domNode = document.createElement(tag);
    this.domNode.$instance = this;
  }

  _perform() {
    try {
      var vtree = this.render();
      vtree = maybeFlatten(isArray(vtree) ? vtree : [vtree]);
      diffChildren(this.domNode, vtree, this._vtree || EMPTYAR);
      this._vtree = vtree;
    } finally {
      this._dirty = false;
    }
  }

  updateUI(cb) {
    if (!this._dirty) {
      this._dirty = true;
      scheduleUpdate(this, cb);
    }
  }
}
