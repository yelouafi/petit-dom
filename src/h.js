import { EMPTYO, EMPTYAR, isArray, isVNode } from "./utils";


export function h(type, props, contArg) {
  var content,
    args,
    i,
    isSVG = false;
  var len = arguments.length - 2;

  if (typeof type !== "string") {
    if (len === 1) {
      content = contArg;
    } else if (len > 1) {
      args = Array(len);
      for (i = 0; i < len; i++) {
        args[i] = arguments[i + 2];
      }
      content = args;
    }
  } else {
    
    var classregex = type.match(/\..*?(?=\.|$|#)/g)
    if (classregex) {
      var classtr = classregex.join(' ').replace('.','')
      props.class = props.class ? props.class +' '+ classtr : classtr
    }
    var idregex = type.match(/#.*?(?=\.|$|#)/)
    if (idregex && !props.id) {
      props.id = idregex[0].slice(1)
    }
    type = type.match(/^.*?(?=\.|\#|$)/)[0]

    isSVG = type === "svg";
    if (len === 1) {
      if (isArray(contArg)) {
        content = maybeFlatten(contArg, isSVG);
      } else if (isVNode(contArg)) {
        contArg.isSVG = isSVG;
        content = [contArg];
      } else {
        content = [{ _text: (contArg == null || contArg == false) ? "" : contArg }];
      }
    } else if (len > 1) {
      args = Array(len);
      for (i = 0; i < len; i++) {
        args[i] = arguments[i + 2];
      }
      content = maybeFlatten(args, isSVG);
    } else {
      content = EMPTYAR;
    }
  }

  return {
    _vnode: true,
    isSVG,
    type,
    key: (props && props.key) || null,
    props: props || EMPTYO,
    content
  };
}

export function maybeFlatten(arr, isSVG) {
  for (var i = 0; i < arr.length; i++) {
    var ch = arr[i];
    if (isArray(ch)) {
      return flattenChildren(arr, i, arr.slice(0, i), isSVG);
    } else if (!isVNode(ch)) {
      arr[i] = { _text: (ch == null || ch == false) ? "" : ch };
    } else if (isSVG && !ch.isSVG) {
      ch.isSVG = true;
    }
  }
  return arr;
}

function flattenChildren(children, start, arr, isSVG) {
  for (var i = start; i < children.length; i++) {
    var ch = children[i];
    if (isArray(ch)) {
      flattenChildren(ch, 0, arr, isSVG);
    } else if (isVNode(ch)) {
      if (isSVG && !ch.isSVG) {
        ch.isSVG = true;
      }
      arr.push(ch);
    } else {
      arr.push({ _text: ch == null ? "" : ch });
    }
  }
  return arr;
}
