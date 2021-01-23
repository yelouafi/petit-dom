export const REF_SINGLE = 1; // ref with a single dom node
export const REF_ARRAY = 4; // ref with an array od nodes
export const REF_PARENT = 8; // ref with a child ref

export const SVG_NS = "http://www.w3.org/2000/svg";

const DELAYED_PROPS = {
  selected: true,
  value: true,
  checked: true,
  innerHTML: true,
};
/**
  TODO: activate full namespaced attributes (not supported in JSX)
  const XML_NS = "http://www.w3.org/XML/1998/namespace"
**/
const XLINK_NS = "http://www.w3.org/1999/xlink";
const NS_ATTRS = {
  show: XLINK_NS,
  actuate: XLINK_NS,
  href: XLINK_NS,
};

export function getDomNode(ref) {
  if (ref.type === REF_SINGLE) {
    return ref.node;
  } else if (ref.type === REF_ARRAY) {
    return getDomNode(ref.children[0]);
  } else if (ref.type === REF_PARENT) {
    return getDomNode(ref.childRef);
  }
  throw new Error("Unkown ref type " + JSON.stringify(ref));
}

export function getParentNode(ref) {
  if (ref.type === REF_SINGLE) {
    return ref.node.parentNode;
  } else if (ref.type === REF_ARRAY) {
    return getParentNode(ref.children[0]);
  } else if (ref.type === REF_PARENT) {
    return getParentNode(ref.childRef);
  }
  throw new Error("Unkown ref type " + ref);
}

export function getNextSibling(ref) {
  if (ref.type === REF_SINGLE) {
    return ref.node.nextSibling;
  } else if (ref.type === REF_ARRAY) {
    return getNextSibling(ref.children[ref.children.length - 1]);
  } else if (ref.type === REF_PARENT) {
    return getNextSibling(ref.childRef);
  }
  throw new Error("Unkown ref type " + JSON.stringify(ref));
}

export function insertDom(parent, ref, nextSibling) {
  if (ref.type === REF_SINGLE) {
    parent.insertBefore(ref.node, nextSibling);
  } else if (ref.type === REF_ARRAY) {
    ref.children.forEach((ch) => {
      insertDom(parent, ch, nextSibling);
    });
  } else if (ref.type === REF_PARENT) {
    insertDom(parent, ref.childRef, nextSibling);
  } else {
    throw new Error("Unkown ref type " + JSON.stringify(ref));
  }
}

export function removeDom(parent, ref) {
  if (ref.type === REF_SINGLE) {
    parent.removeChild(ref.node);
  } else if (ref.type === REF_ARRAY) {
    ref.children.forEach((ch) => {
      removeDom(parent, ch);
    });
  } else if (ref.type === REF_PARENT) {
    removeDom(parent, ref.childRef);
  } else {
    throw new Error("Unkown ref type " + ref);
  }
}

export function replaceDom(parent, newRef, oldRef) {
  insertDom(parent, newRef, getDomNode(oldRef));
  removeDom(parent, oldRef);
}

export function setDOMProps(el, newProps, oldProps, keys) {
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var oldv = oldProps[key];
    var newv = newProps[key];
    if (oldv !== newv) {
      el[key] = newv;
    }
  }
}

export function patchProps(domElement, newProps, oldProps, isSVG) {
  var delayedProps;
  for (var key in newProps) {
    if (key === "key") continue;
    if (key.startsWith("on")) {
      domElement[key] = newProps[key];
      continue;
    }
    if (DELAYED_PROPS[key] != null) {
      if (delayedProps == null) delayedProps = [];
      delayedProps.push(key);
      continue;
    }
    var oldValue = oldProps[key];
    var newValue = newProps[key];
    if (oldValue !== newValue) {
      setDOMAttribute(domElement, key, newValue, isSVG);
    }
  }
  for (key in oldProps) {
    if (key === "key") continue;
    if (!(key in newProps)) {
      if (key.startsWith("on") || DELAYED_PROPS[key] != null) {
        // This is an edge case; assuming setting value to null
        // would reset the DOM property to its default state (??)
        domElement[key] = null;
      } else {
        domElement.removeAttribute(key);
      }
    }
  }
  return delayedProps;
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
