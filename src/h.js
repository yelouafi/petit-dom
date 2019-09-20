import { maybeFlattenArray } from "./utils.js";
import { createFunctionComponent } from "./createRenderComponent.js";

const EMPTY_OBJECT = {};
const VTYPE_ELEMENT = 0x80;
const VTYPE_COMPONENT = 0x100;

export const isVNull = c => c === null;
export const isVLeaf = c => typeof c === "string" || typeof c === "number";
export const isVElement = c => c != null && c.vtype === VTYPE_ELEMENT;
export const isVComponent = c => c != null && c.vtype === VTYPE_COMPONENT;

const isValidComponentType = c =>
  c != null && c.mount != null && c.patch != null && c.unmount != null;

export function h(type, props = EMPTY_OBJECT, ...children) {
  const key = props != null ? props.key : null;
  if (typeof type === "string") {
    return {
      vtype: VTYPE_ELEMENT,
      type,
      key,
      props,
      children: maybeFlattenArray(children)
    };
  } else if (isValidComponentType(type)) {
    return {
      vtype: VTYPE_COMPONENT,
      type,
      key,
      props: Object.assign({}, props, { children }),
      _state: null
    };
  } else if (typeof type === "function") {
    return {
      vtype: VTYPE_COMPONENT,
      type: createFunctionComponent(type),
      key,
      props: Object.assign({}, props, { children }),
      _state: null
    };
  }
  throw new Error("h: Invalid type!");
}
