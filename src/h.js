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

  props =
    children.length > 1
      ? Object.assign({}, props, { children })
      : children.length === 1
      ? Object.assign({}, props, { children: children[0] })
      : props;

  return jsx(type, props, props.key);
}

export function jsx(type, props, key) {
  if (key !== key) throw new Error("Invalid NaN key");
  const vtype =
    typeof type === "string"
      ? VTYPE_ELEMENT
      : isValidComponentType(type)
      ? VTYPE_COMPONENT
      : typeof type === "function"
      ? VTYPE_FUNCTION
      : undefined;
  if (vtype === undefined) throw new Error("Invalid VNode type");
  return {
    vtype,
    type,
    key,
    props,
  };
}

export const jsxs = jsx;

export function Fragment(props) {
  return props.children;
}
