import { EMPTY_OBJECT, maybeFlattenArray } from "./utils.js";
import { createRenderComponent } from "./createRenderComponent.js";

const isValidComponentType = c =>
  c != null && c.mount != null && c.patch != null && c.unmount != null;

export function h(type, props = EMPTY_OBJECT, ...children) {
  const key = props != null ? props.key : null;
  if (typeof type === "string") {
    return {
      _IS_VELEMENT_: true,
      type,
      key,
      attributes: props,
      children: maybeFlattenArray(children)
    };
  } else if (isValidComponentType(type)) {
    return {
      _IS_VCOMPONENT_: true,
      component: type,
      key,
      props: Object.assign({}, props, { children })
    };
  } else if (typeof type === "function") {
    return {
      _IS_VCOMPONENT_: true,
      component: createFunctionComponent(type),
      key,
      props: Object.assign({}, props, { children }),
      _state: null
    };
  }
  throw new Error("h: Invalid type!");
}

function createFunctionComponent(renderFunction) {
  var component = renderFunction.$$petitDomFunctionComponent$$;
  if (component == null) {
    component = renderFunction.$$petitDomFunctionComponent$$ = createRenderComponent(
      {
        render: renderFunction,
        shouldUpdate: renderFunction.shouldUpdate
      }
    );
  }
  return component;
}
