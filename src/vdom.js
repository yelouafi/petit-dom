import {
  isEmpty,
  isLeaf,
  isElement,
  isComponent,
  isNonEmptyArray,
  isRenderFunction,
  EMPTY_OBJECT,
} from "./h.js";
import {
  SVG_NS,
  REF_SINGLE,
  REF_ARRAY,
  REF_PARENT,
  insertDom,
  replaceDom,
  removeDom,
  getDomNode,
  patchProps,
  setDOMProps,
  getNextSibling,
} from "./dom.js";

export const DEFAULT_ENV = {
  isSvg: false,
};

export function mount(vnode, env = DEFAULT_ENV) {
  if (isEmpty(vnode)) {
    return {
      type: REF_SINGLE,
      node: document.createComment("NULL"),
    };
  } else if (isLeaf(vnode)) {
    return {
      type: REF_SINGLE,
      node: document.createTextNode(vnode),
    };
  } else if (isElement(vnode)) {
    let node;
    let { type, props, content } = vnode;
    if (type === "svg" && !env.isSvg) {
      env = Object.assign({}, env, { isSVG: true });
    }
    // TODO : {is} for custom elements
    let delayedProps;
    if (!env.isSVG) {
      node = document.createElement(type);
    } else {
      node = document.createElementNS(SVG_NS, type);
    }
    delayedProps = patchProps(node, props, EMPTY_OBJECT, env.isSVG);
    let contentRef = content == null ? content : mount(content, env);
    /**
     * We need to insert content before setting interactive props
     * that rely on children been present (e.g select)
     */
    if (contentRef != null) insertDom(node, contentRef);
    if (delayedProps != null) {
      setDOMProps(node, props, EMPTY_OBJECT, delayedProps);
    }
    return {
      type: REF_SINGLE,
      node,
      content: contentRef,
    };
  } else if (isNonEmptyArray(vnode)) {
    return {
      type: REF_ARRAY,
      children: vnode.map((child) => mount(child, env)),
    };
  } else if (isRenderFunction(vnode)) {
    let childVNode = vnode.type(vnode.props);
    let childRef = mount(childVNode, env);
    return {
      type: REF_PARENT,
      childRef,
      childState: childVNode,
    };
  } else if (isComponent(vnode)) {
    let childState = {};
    let childRef = vnode.type.mount(vnode.props, childState, env);
    return {
      type: REF_PARENT,
      childRef,
      childState,
    };
  }
  if (vnode === undefined) {
    throw new Error("mount: vnode is undefined!");
  }

  throw new Error("mount: Invalid Vnode!");
}

export function patch(
  parentDomNode,
  newVNode,
  oldVNode,
  ref,
  env = DEFAULT_ENV
) {
  if (oldVNode === newVNode) {
    return ref;
  } else if (isEmpty(newVNode) && isEmpty(oldVNode)) {
    return ref;
  } else if (isLeaf(newVNode) && isLeaf(oldVNode)) {
    ref.node.nodeValue = newVNode;
    return ref;
  } else if (
    isElement(newVNode) &&
    isElement(oldVNode) &&
    newVNode.type === oldVNode.type
  ) {
    if (newVNode.type === "svg" && !env.isSvg) {
      env = Object.assign({}, env, { isSVG: true });
    }
    let delayedProps = patchProps(
      ref.node,
      newVNode.props,
      oldVNode.props,
      env.isSVG
    );

    if (oldVNode.content == null) {
      if (newVNode.content != null) {
        ref.content = mount(newVNode.content, env);
        insertDom(ref.node, ref.content);
      }
    } else {
      if (newVNode.content == null) {
        ref.node.textContent = "";
        unmount(oldVNode.content, ref.content, env);
        ref.content = null;
      } else {
        ref.content = patchInPlace(
          ref.node,
          newVNode.content,
          oldVNode.content,
          ref.content,
          env
        );
      }
    }
    if (delayedProps != null) {
      setDOMProps(ref.node, newVNode.props, oldVNode.props, delayedProps);
    }
    return ref;
  } else if (isNonEmptyArray(newVNode) && isNonEmptyArray(oldVNode)) {
    patchChildren(parentDomNode, newVNode, oldVNode, ref, env);
    return ref;
  } else if (
    isRenderFunction(newVNode) &&
    isRenderFunction(oldVNode) &&
    newVNode.type === oldVNode.type
  ) {
    let renderFn = newVNode.type;
    let shouldUpdate =
      renderFn.shouldUpdate != null
        ? renderFn.shouldUpdate(oldVNode.props, newVNode.props)
        : defaultShouldUpdate(oldVNode.props, newVNode.props);
    if (shouldUpdate) {
      let childVNode = renderFn(newVNode.props);
      let childRef = patch(
        parentDomNode,
        childVNode,
        ref.childState,
        ref.childRef,
        env
      );
      // We need to return a new ref in order for parent patches to
      // properly replace changing DOM nodes
      if (childRef !== ref.childRef) {
        return {
          type: REF_PARENT,
          childRef,
          childState: childVNode,
        };
      } else {
        ref.childState = childVNode;
        return ref;
      }
    } else {
      return ref;
    }
  } else if (
    isComponent(newVNode) &&
    isComponent(oldVNode) &&
    newVNode.type === oldVNode.type
  ) {
    let childRef = newVNode.type.patch(
      parentDomNode,
      newVNode.props,
      oldVNode.props,
      ref.childRef,
      ref.childState,
      env
    );
    if (childRef !== ref.childRef) {
      return {
        type: REF_PARENT,
        childRef,
        childState: ref.childState,
      };
    } else {
      ref.childRef = childRef;
      return ref;
    }
  } else {
    return mount(newVNode, env);
  }
}

/**
 * Execute any compoenent specific unmount code
 */
export function unmount(vnode, ref, env) {
  if (isEmpty(vnode) || isLeaf(vnode)) return;
  if (isElement(vnode)) {
    if (vnode.content != null) unmount(vnode.content, ref.content, env);
  } else if (isNonEmptyArray(vnode)) {
    vnode.forEach((childVNode, index) =>
      unmount(childVNode, ref.children[index], env)
    );
  } else if (isComponent(vnode)) {
    vnode.type.unmount(vnode.props, ref.childRef, ref.childState, env);
  }
}

export function patchInPlace(parentDomNode, newVNode, oldVNode, ref, env) {
  const newRef = patch(parentDomNode, newVNode, oldVNode, ref, env);
  if (newRef !== ref) {
    replaceDom(parentDomNode, newRef, ref);
    unmount(oldVNode, ref, env);
  }
  return newRef;
}

function patchChildren(parentDomNode, newChildren, oldchildren, ref, env) {
  // We need to retreive the next sibling before the old children
  // get eventually removed from the current DOM document
  const nextNode = getNextSibling(ref);
  const children = Array(newChildren.length);
  let refChildren = ref.children;
  let newStart = 0,
    oldStart = 0,
    newEnd = newChildren.length - 1,
    oldEnd = oldchildren.length - 1;
  let oldVNode, newVNode, oldRef, newRef, refMap;

  while (newStart <= newEnd && oldStart <= oldEnd) {
    if (refChildren[oldStart] === null) {
      oldStart++;
      continue;
    }
    if (refChildren[oldEnd] === null) {
      oldEnd--;
      continue;
    }

    oldVNode = oldchildren[oldStart];
    newVNode = newChildren[newStart];
    if (oldVNode?.props?.key === newVNode?.props?.key) {
      oldRef = refChildren[oldStart];
      newRef = children[newStart] = patchInPlace(
        parentDomNode,
        newVNode,
        oldVNode,
        oldRef,
        env
      );
      newStart++;
      oldStart++;
      continue;
    }

    oldVNode = oldchildren[oldEnd];
    newVNode = newChildren[newEnd];
    if (oldVNode?.props?.key === newVNode?.props?.key) {
      oldRef = refChildren[oldEnd];
      newRef = children[newEnd] = patchInPlace(
        parentDomNode,
        newVNode,
        oldVNode,
        oldRef,
        env
      );
      newEnd--;
      oldEnd--;
      continue;
    }

    if (refMap == null) {
      refMap = {};
      for (let i = oldStart; i <= oldEnd; i++) {
        oldVNode = oldchildren[i];
        if (oldVNode?.props?.key != null) {
          refMap[oldVNode.props.key] = i;
        }
      }
    }

    newVNode = newChildren[newStart];
    const idx =
      newVNode?.props?.key != null ? refMap[newVNode.props.key] : null;
    if (idx != null) {
      oldVNode = oldchildren[idx];
      oldRef = refChildren[idx];
      refChildren[idx] = null;
      newRef = children[newStart] = patch(
        parentDomNode,
        newVNode,
        oldVNode,
        oldRef,
        env
      );
      insertDom(parentDomNode, newRef, getDomNode(refChildren[oldStart]));
      if (newRef !== oldRef) {
        removeDom(parentDomNode, oldRef);
        unmount(oldVNode, oldRef, env);
      }
    } else {
      newRef = children[newStart] = mount(newVNode, env);
      insertDom(parentDomNode, newRef, getDomNode(refChildren[oldStart]));
    }
    newStart++;
  }

  const beforeNode =
    newEnd < newChildren.length - 1
      ? getDomNode(children[newEnd + 1])
      : nextNode;
  while (newStart <= newEnd) {
    const newRef = mount(newChildren[newStart], env);
    children[newStart] = newRef;
    insertDom(parentDomNode, newRef, beforeNode);
    newStart++;
  }
  while (oldStart <= oldEnd) {
    oldRef = refChildren[oldStart];
    if (oldRef != null) {
      removeDom(parentDomNode, oldRef);
      unmount(oldchildren[oldStart], oldRef, env);
    }
    oldStart++;
  }
  ref.children = children;
}

function defaultShouldUpdate(p1, p2) {
  if (p1 === p2) return false;
  for (let key in p2) {
    if (p1[key] !== p2[key]) return true;
  }
  return false;
}
