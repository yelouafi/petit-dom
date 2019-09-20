import { indexOf } from "./utils.js";
import { isVNull, isVLeaf, isVElement, isVComponent } from "./h.js";
import { diff, INSERTION, DELETION, PATCH } from "./diff.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const INTERACTIVE_PROPS = {
  selected: true,
  value: true,
  checked: true,
  innerHTML: true
};
/**
  TODO: activate full namespaced attributes (not supported in JSX)
  const XML_NS = "http://www.w3.org/XML/1998/namespace"
**/
const XLINK_NS = "http://www.w3.org/1999/xlink";
const NS_ATTRS = {
  show: XLINK_NS,
  actuate: XLINK_NS,
  href: XLINK_NS
};

const DEFAULT_ENV = {
  isSvg: false
};

export function mount(vnode, env = DEFAULT_ENV) {
  if (isVNull(vnode)) {
    return document.createComment("NULL");
  } else if (isVLeaf(vnode)) {
    return document.createTextNode(String(vnode));
  } else if (isVElement(vnode)) {
    var node;
    var { type, props, children } = vnode;
    if (type === "svg" && !env.isSvg) {
      env = Object.assign({}, env, { isSVG: true });
    }
    // TODO : {is} for custom elements
    var delayedProps;
    if (!env.isSVG) {
      node = document.createElement(type);
    } else {
      node = document.createElementNS(SVG_NS, type);
    }
    delayedProps = setAttributes(node, props, undefined, env.isSVG);
    mountChildren(node, children, 0, children.length - 1, null, env);
    if (delayedProps != null) {
      setProps(node, props, undefined, delayedProps);
    }
    return node;
  } else if (isVComponent(vnode)) {
    vnode._state = {};
    return vnode.type.mount(vnode.props, vnode._state, env);
  }
  if (vnode === undefined) {
    throw new Error("mount: vnode is undefined!");
  }

  throw new Error("mount: Invalid Vnode!");
}

export function patch(newVNode, oldVNode, domNode, env = DEFAULT_ENV) {
  if (oldVNode === newVNode) {
    return domNode;
  } else if (isVNull(newVNode) && isVNull(newVNode)) {
    return domNode;
  } else if (isVLeaf(newVNode) && isVLeaf(oldVNode)) {
    domNode.nodeValue = String(newVNode);
    return domNode;
  } else if (
    isVElement(newVNode) &&
    isVElement(oldVNode) &&
    newVNode.type === oldVNode.type
  ) {
    if (newVNode.type === "svg" && !env.isSvg) {
      env = Object.assign({}, env, { isSVG: true });
    }
    var delayedProps = setAttributes(
      domNode,
      newVNode.props,
      oldVNode.props,
      env.isSVG
    );

    patchChildren(domNode, newVNode.children, oldVNode.children, env);
    if (delayedProps != null) {
      setProps(domNode, newVNode.props, oldVNode.props, delayedProps);
    }
    return domNode;
  } else if (
    isVComponent(newVNode) &&
    isVComponent(oldVNode) &&
    newVNode.type === oldVNode.type
  ) {
    newVNode._state = oldVNode._state;
    return newVNode.type.patch(
      newVNode.props,
      oldVNode.props,
      newVNode._state,
      domNode,
      env
    );
  } else {
    return mount(newVNode, env);
  }
}

export function unmount(vnode, domNode, env) {
  if (isVNull(vnode) || isVLeaf(vnode)) {
    return;
  }
  if (isVElement(vnode)) {
    for (var i = 0; i < vnode.children.length; i++) {
      unmount(vnode.children[i], domNode.childNodes[i], env);
    }
  } else if (isVComponent(vnode)) {
    vnode.type.unmount(vnode._state, domNode, env);
  }
}

function mountChildren(
  parentDomNode,
  vnodes,
  start = 0,
  end = vnodes.length - 1,
  beforeNode,
  env
) {
  while (start <= end) {
    var vnode = vnodes[start++];
    parentDomNode.insertBefore(mount(vnode, env), beforeNode);
  }
}

function setProps(el, props, oldProps, keys) {
  var key;
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    var oldv = oldProps && oldProps[key];
    var newv = props[key];
    if (oldv !== newv) {
      el[key] = newv;
    }
  }
}

function setAttributes(domElement, newAttrs, oldAttrs, isSVG) {
  var props = [];
  for (var key in newAttrs) {
    /* eslint-disable no-prototype-builtins */
    if (key.startsWith("on") || INTERACTIVE_PROPS.hasOwnProperty(key)) {
      props.push(key);
      continue;
    }
    var oldValue = oldAttrs != null ? oldAttrs[key] : undefined;
    var newValue = newAttrs[key];
    if (oldValue !== newValue) {
      setDOMAttribute(domElement, key, newValue, isSVG);
    }
  }
  for (key in oldAttrs) {
    if (!(key in newAttrs)) {
      domElement.removeAttribute(key);
    }
  }
  if (props.length > 0) {
    return props;
  }
}

function setDOMAttribute(el, attr, value, isSVG) {
  if (value === true) {
    el.setAttribute(attr, "");
  } else if (value === false) {
    el.removeAttribute(attr);
  } else {
    var namespace = isSVG ? NS_ATTRS[attr] : undefined;
    if (namespace !== undefined) {
      el.setAttributeNS(namespace, attr, value);
    } else {
      el.setAttribute(attr, value);
    }
  }
}

function removeChildren(
  parentDomNode,
  childDomNodes,
  children,
  start = 0,
  end = children.length - 1
) {
  var cleared;
  if (childDomNodes.length === end - start + 1) {
    parentDomNode.textContent = "";
    cleared = true;
  }
  while (start <= end) {
    var vnode = children[start];
    var domNode = childDomNodes[start];
    if (!cleared) parentDomNode.removeChild(domNode);
    start++;
    unmount(vnode, domNode);
  }
}

function patchInPlace(
  newVNode,
  oldVNode,
  parentDomNode,
  childDomNodes,
  index,
  env
) {
  var oldDomNode = childDomNodes[index];
  var newDomNode = patch(newVNode, oldVNode, oldDomNode, env);
  if (newDomNode != oldDomNode) {
    childDomNodes[index] = newDomNode;
    parentDomNode.replaceChild(newDomNode, oldDomNode);
    unmount(oldVNode, oldDomNode, env);
  }
  return newDomNode;
}

function canPatch(newVNode, oldVNode) {
  var newKey = newVNode != null && newVNode.key != null ? newVNode.key : null;
  var oldKey = oldVNode != null && oldVNode.key != null ? oldVNode.key : null;
  return newKey === oldKey;
}

function patchChildren(parentDomNode, newChildren, oldChildren, env) {
  if (newChildren === oldChildren) return;
  var newStart = 0;
  var newEnd = newChildren.length - 1;
  var oldStart = 0;
  var oldEnd = oldChildren.length - 1;
  var newVNode, oldVNode, domNode;
  var childDomNodes = Array.from(parentDomNode.childNodes);

  /**
    Before applying the diff algorithm we try some preprocessing optimizations
    to reduce the cost
    See https://neil.fraser.name/writing/diff/ for the full details.

    In the following : indel = INsertion/DELetion
  **/

  // common prefix/suffix

  while (newStart <= newEnd && oldStart <= oldEnd) {
    newVNode = newChildren[newStart];
    oldVNode = oldChildren[oldStart];

    if (canPatch(newVNode, oldVNode)) {
      patchInPlace(
        newVNode,
        oldVNode,
        parentDomNode,
        childDomNodes,
        oldStart,
        env
      );
      newStart++;
      oldStart++;
      continue;
    }
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
    if (canPatch(newVNode)) {
      patchInPlace(
        newVNode,
        oldVNode,
        parentDomNode,
        childDomNodes,
        oldEnd,
        env
      );
      oldEnd--;
      newEnd--;
      continue;
    }
    break;
  }

  if (newStart > newEnd && oldStart > oldEnd) return;

  // simple indel: one of the 2 sequences is empty after common prefix/suffix removal

  // old sequence is empty -> insertion
  if (newStart <= newEnd && oldStart > oldEnd) {
    mountChildren(
      parentDomNode,
      newChildren,
      newStart,
      newEnd,
      childDomNodes[oldStart],
      env
    );
    return;
  }

  // new sequence is empty -> deletion
  if (oldStart <= oldEnd && newStart > newEnd) {
    removeChildren(parentDomNode, childDomNodes, oldChildren, oldStart, oldEnd);
    return;
  }

  // 2 simple indels: the shortest sequence is a subsequence of the longest
  var oldRemaining = oldEnd - oldStart + 1;
  var newRemaining = newEnd - newStart + 1;
  var k = -1;
  if (oldRemaining < newRemaining) {
    k = indexOf(
      newChildren,
      oldChildren,
      newStart,
      newEnd,
      oldStart,
      oldEnd,
      canPatch
    );
    if (k >= 0) {
      mountChildren(
        parentDomNode,
        newChildren,
        newStart,
        k - 1,
        childDomNodes[oldStart],
        env
      );
      var upperLimit = k + oldRemaining;
      newStart = k;
      while (newStart < upperLimit) {
        patchInPlace(
          newChildren[newStart],
          oldChildren[oldStart],
          parentDomNode,
          childDomNodes,
          oldStart,
          env
        );
        newStart++;
        oldStart++;
      }
      oldEnd++;
      mountChildren(
        parentDomNode,
        newChildren,
        newStart,
        newEnd,
        childDomNodes[oldEnd],
        env
      );
      return;
    }
  } else if (oldRemaining > newRemaining) {
    k = indexOf(
      oldChildren,
      newChildren,
      oldStart,
      oldEnd,
      newStart,
      newEnd,
      canPatch
    );
    if (k >= 0) {
      removeChildren(
        parentDomNode,
        childDomNodes,
        oldChildren,
        oldStart,
        k - 1
      );
      upperLimit = k + newRemaining;
      oldStart = k;
      while (oldStart < upperLimit) {
        patchInPlace(
          newChildren[newStart],
          oldChildren[oldStart],
          parentDomNode,
          childDomNodes,
          oldEnd,
          env
        );
        newStart++;
        oldStart++;
      }
      removeChildren(
        parentDomNode,
        childDomNodes,
        oldChildren,
        oldStart,
        oldEnd
      );
      return;
    }
  }

  // fast case: difference between the 2 sequences is only one item
  if (oldStart === oldEnd) {
    domNode = childDomNodes[oldStart];
    mountChildren(
      parentDomNode,
      newChildren,
      newStart,
      newEnd,
      childDomNodes[oldStart],
      env
    );
    parentDomNode.removeChild(domNode);
    unmount(oldChildren[oldStart], domNode, env);
    return;
  }
  if (newStart === newEnd) {
    parentDomNode.insertBefore(
      mount(newChildren[newStart], env),
      childDomNodes[oldStart]
    );
    removeChildren(parentDomNode, childDomNodes, oldChildren, oldStart, oldEnd);
    return;
  }

  var diffResult = diff(
    newChildren,
    oldChildren,
    canPatch,
    newStart,
    newEnd,
    oldStart,
    oldEnd
  );
  applyDiff(
    parentDomNode,
    childDomNodes,
    diffResult,
    newChildren,
    oldChildren,
    newStart,
    oldStart,
    env
  );
}

function applyDiff(
  parentDomNode,
  childDomNodes,
  { diff, deleteMap },
  newChildren,
  oldChildren,
  newStart,
  oldStart,
  env
) {
  var newVNode, oldVNode, domNode, oldMatchIndex;

  for (
    var i = 0, newIndex = newStart, oldIndex = oldStart;
    i < diff.length;
    i++
  ) {
    const op = diff[i];
    if (op === PATCH) {
      patchInPlace(
        newChildren[newIndex],
        oldChildren[oldIndex],
        parentDomNode,
        childDomNodes,
        oldIndex,
        env
      );
      newIndex++;
      oldIndex++;
    } else if (op === INSERTION) {
      newVNode = newChildren[newIndex];
      if (newVNode.key != null) {
        oldMatchIndex = deleteMap[newVNode.key];
      } else {
        oldMatchIndex = null;
      }
      if (oldMatchIndex != null) {
        domNode = patch(
          newVNode,
          oldChildren[oldMatchIndex],
          childDomNodes[oldMatchIndex],
          env
        );
        // we use undefined to mark moved vnodes, we cant use null because
        // null is a valid VNode
        oldChildren[oldMatchIndex] = undefined;
      } else {
        domNode = mount(newVNode, env);
      }
      parentDomNode.insertBefore(domNode, childDomNodes[oldIndex]);
      newIndex++;
    } else if (op === DELETION) {
      oldIndex++;
    }
  }

  for (i = 0, oldIndex = oldStart; i < diff.length; i++) {
    const op = diff[i];
    if (op === PATCH) {
      oldIndex++;
    } else if (op === DELETION) {
      oldVNode = oldChildren[oldIndex];
      domNode = childDomNodes[oldIndex];
      if (oldVNode !== undefined) {
        parentDomNode.removeChild(domNode);
        unmount(oldVNode, domNode, env);
      }
      oldIndex++;
    }
  }
}
