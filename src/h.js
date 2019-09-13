import { EMPTY_OBJECT, maybeFlattenArray } from "./utils.js";

const isValidComponentType = c =>
  c != null && c.mount != null && c.patch != null && c.unmount != null;

export function h(type, props = EMPTY_OBJECT, ...children) {
  const key = props != null ? props.key : null;
  if (typeof type === "string") {
    return {
      _IS_VELEMENT_: true,
      type,
      key,
      props,
      children: maybeFlattenArray(children)
    };
  } else if (typeof type === "function") {
    return {
      _IS_VFUNCTION_: true,
      type,
      key,
      props,
      children
    };
  } else if (isValidComponentType(type)) {
    return {
      _IS_VCOMPONENT_: true,
      type,
      key,
      props,
      children
    };
  }
  throw new Error("h: Invalid type!");
}
