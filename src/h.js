import { EMPTYO, EMPTYAR, isArray, isVNode } from "./utils";

export function h(type, props, contArg) {
  var content, args, i;
  var len = arguments.length - 2;

  if (typeof type !== "string") {
    if (len === 1) {
      content = contArg;
    } else if (len > 1) {
      args = Array(len);
      for (i = 0; i < len; i++) {
        args[i] = arguments[i + 2];
      }
      content = contArg;
    }
  } else {
    if (len === 1) {
      if (isArray(contArg)) {
        content = maybeFlatten(contArg);
      } else if (isVNode(contArg)) {
        content = [contArg];
      } else {
        content = [{ _text: contArg == null ? "" : contArg }];
      }
    } else if (len > 1) {
      args = Array(len);
      for (i = 0; i < len; i++) {
        args[i] = arguments[i + 2];
      }
      content = maybeFlatten(args);
    } else {
      content = EMPTYAR;
    }
  }

  return {
    _vnode: true,
    type,
    key: (props && props.key) || null,
    props: props || EMPTYO,
    content
  };
}

export function maybeFlatten(arr) {
  for (var i = 0; i < arr.length; i++) {
    var ch = arr[i];
    if (isArray(ch)) {
      return flattenChildren(arr, i, arr.slice(0, i));
    } else if (!isVNode(ch)) {
      arr[i] = { _text: ch == null ? "" : ch };
    }
  }
  return arr;
}

function flattenChildren(children, start, arr) {
  for (var i = start; i < children.length; i++) {
    var ch = children[i];
    if (isArray(ch)) {
      flattenChildren(ch, 0, arr);
    } else if (isVNode(ch)) {
      arr.push(ch);
    } else {
      arr.push({ _text: ch == null ? "" : ch });
    }
  }
  return arr;
}
