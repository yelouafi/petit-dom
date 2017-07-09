var EMPTYO = {};
var EMPTYAR = [];
var isArray = Array.isArray;

function isPrimitive(c) {
  var type = typeof c;
  return (
    type === "string" || type === "number" || type === "boolean" || c === null
  );
}

function isChild(c) {
  return isArray(c) || (c && c._vnode) || isPrimitive(c);
}
/**
  h(type)
  h(type, props, ...children)
  h(type, ...children)
**/
export function h(type) {
  var props, _textChild;
  var startChIdx = 1;
  var firstCh;
  var len = arguments.length - 1;

  if (len > 0) {
    firstCh = arguments[startChIdx];
    if (firstCh === null || !isChild(firstCh)) {
      props = firstCh;
      len--;
      startChIdx++;
      firstCh = arguments[startChIdx];
    }
    _textChild = len === 1 && isPrimitive(firstCh);
  }

  return {
    _vnode: true,
    type,
    key: props && props.key,
    props: props || EMPTYO,
    content: _textChild
      ? firstCh
      : !len ? EMPTYAR : flattenChildren(arguments, startChIdx, []),
    _textChild,
    _data: null,
    _node: null
  };
}

function flattenChildren(children, start, arr) {
  for (var i = start; i < children.length; i++) {
    var ch = children[i];
    appendNormalized(arr, ch);
  }
  return arr;
}

function appendNormalized(arr, ch) {
  if (isArray(ch)) {
    flattenChildren(ch, 0, arr);
  } else if (ch && ch._vnode) {
    arr.push(ch);
  } else {
    arr.push({ _text: ch });
  }
}
