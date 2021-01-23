export const EMPTY_OBJECT = {};

const VTYPE_ELEMENT = 1;
const VTYPE_FUNCTION = 2;
const VTYPE_COMPONENT = 4;

export const isEmpty = (c) =>
  c === null || (Array.isArray(c) && c.length === 0);
export const isNonEmptyArray = (c) => Array.isArray(c) && c.length > 0;
export const isLeaf = (c) => typeof c === "string" || typeof c === "number";
export const isElement = (c) => c?.vtype === VTYPE_ELEMENT;
export const isRenderFunction = (c) => c?.vtype === VTYPE_FUNCTION;
export const isComponent = (c) => c?.vtype === VTYPE_COMPONENT;

const isValidComponentType = (c) => typeof c?.mount === "function";

export function h(type, props, ...children) {
  props = props ?? EMPTY_OBJECT;
  const content =
    children.length < 1
      ? undefined
      : children.length < 2
      ? children[0]
      : children;

  if (typeof type === "string") {
    return {
      vtype: VTYPE_ELEMENT,
      type,
      props,
      content,
    };
  } else if (isValidComponentType(type)) {
    return {
      vtype: VTYPE_COMPONENT,
      type,
      props: Object.assign({}, props, { content }),
    };
  } else if (typeof type === "function") {
    return {
      vtype: VTYPE_FUNCTION,
      type,
      props: Object.assign({}, props, { content }),
    };
  }
  throw new Error("h: Invalid type!");
}

export function Fragment(props) {
  return props.content;
}
