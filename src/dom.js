export const REF_SINGLE = 1; // ref with a single dom node
export const REF_ARRAY = 4; // ref with an array od nodes
export const REF_PARENT = 8; // ref with a child ref

export const SVG_NS = "http://www.w3.org/2000/svg";

function propDirective(prop) {
  return {
    mount(element, value) {
      element[prop] = value;
    },
    patch(element, newValue, oldValue) {
      if (newValue !== oldValue) {
        element[prop] = newValue;
      }
    },
    unmount(element, _) {
      element[prop] = null;
    },
  };
}

export const DOM_PROPS_DIRECTIVES = {
  selected: propDirective("selected"),
  checked: propDirective("checked"),
  value: propDirective("value"),
  innerHTML: propDirective("innerHTML"),
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

export function mountDirectives(domElement, props, env) {
  for (let key in props) {
    if (key in env.directives) {
      env.directives[key].mount(domElement, props[key]);
    }
  }
}

export function patchDirectives(domElement, newProps, oldProps, env) {
  for (let key in newProps) {
    if (key in env.directives) {
      env.directives[key].patch(domElement, newProps[key], oldProps[key]);
    }
  }
  for (let key in oldProps) {
    if (key in env.directives && !(key in newProps)) {
      env.directives[key].unmount(domElement, oldProps[key]);
    }
  }
}

export function unmountDirectives(domElement, props, env) {
  for (let key in props) {
    if (key in env.directives) {
      env.directives[key].unmount(domElement, props[key]);
    }
  }
}

export function mountAttributes(domElement, props, env) {
  for (var key in props) {
    if (key === "key" || key === "children" || key in env.directives) continue;
    if (key.startsWith("on")) {
      domElement[key.toLowerCase()] = props[key];
    } else {
      setDOMAttribute(domElement, key, props[key], env.isSVG);
    }
  }
}

export function patchAttributes(domElement, newProps, oldProps, env) {
  for (var key in newProps) {
    if (key === "key" || key === "children" || key in env.directives) continue;
    var oldValue = oldProps[key];
    var newValue = newProps[key];
    if (oldValue !== newValue) {
      if (key.startsWith("on")) {
        domElement[key.toLowerCase()] = newValue;
      } else {
        setDOMAttribute(domElement, key, newValue, env.isSVG);
      }
    }
  }
  for (key in oldProps) {
    if (
      key === "key" ||
      key === "children" ||
      key in env.directives ||
      key in newProps
    )
      continue;
    if (key.startsWith("on")) {
      domElement[key.toLowerCase()] = null;
    } else {
      domElement.removeAttribute(key);
    }
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
