import { h, mount, patch } from "../../../src/index";

var gMountId = 0;

export default class Component {
  static mount(props, content) {
    const inst = new this(props, content);
    inst._petit_mount();
    inst.host.$$inst = inst;
    return inst.host;
  }

  static patch(node, props, content) {
    const inst = node.$$inst;
    inst._petit_patch(props, content);
  }

  static unmount(node) {
    const inst = node.$$inst;
    inst._petit_unmount();
  }

  constructor(props, content) {
    this._petit_updateCbs = [];
    this._petit_isDirty = false;
    this._petit_isUnmounted = false;
    this.props = props;
    this.content = content;
    this.tagName = this.tagName || `v-${this.constructor.name}`;
  }

  _petit_updateSync() {
    if (this._petit_isUnmounted) return;
    try {
      const vnode = h(this.tagName, null, this.render());
      patch(vnode, this.vnode);
      this.vnode = vnode;
    } finally {
      this._petit_isDirty = false;
    }
  }

  _petit_mount() {
    this._petit_mountId = ++gMountId;
    this.vnode = h(this.tagName, null, this.render());
    this.host = mount(this.vnode);
    this.updateUI(this.onMount);
  }

  _petit_patch(props, content) {
    if (this._petit_isUnmounted) return;
    this.onPatch(props);
    this.props = props;
    this.content = content;
  }

  _petit_unmount() {
    if (this._petit_isUnmounted) return;
    this._petit_isUnmounted = true;
    this.props = null;
    this.content = null;
    this.vnode = null;
    this.host = null;
    this._petit_updateCbs = null;
    this.onUnmount();
  }

  _petit_invokeUpdateCbs() {
    if (this._petit_isUnmounted) return;
    const cbs = this._petit_updateCbs;
    this._petit_updateCbs = [];
    cbs.forEach(cb => cb.call(this));
  }

  onMount() {}

  onPatch(props, content) {
    this.updateUI();
  }

  onUnmount() {}

  updateUI(cb) {
    if (this._petit_isUnmounted) return;
    if (!this._petit_isDirty) {
      this._petit_isDirty = true;
      scheduleUpdate(this);
    }
    if (cb != null) this._petit_updateCbs.push(cb);
  }
}

var queue = [];
var updateScheduled = false;

function scheduleUpdate(comp) {
  queue.push(comp);
  if (!updateScheduled) {
    updateScheduled = true;
    requestAnimationFrame(() => {
      flush();
      updateScheduled = false;
    });
  }
}

function flush() {
  while (queue.length > 0) {
    var _queue = queue.sort((c1, c2) => c1._petit_mountId - c2._petit_mountId);
    queue = [];
    _queue.forEach(comp => comp._petit_updateSync());
    _queue.forEach(comp => comp._petit_invokeUpdateCbs());
  }
}
