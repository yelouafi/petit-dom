export const EMPTYO = {};
export const EMPTYAR = [];
export const isArray = Array.isArray;
export const isVNode = c => c && (c._vnode != null || c._text != null);
export const isComponent = c => c && c.mount && c.patch && c.unmount;

export const LOG = (...args) => {
  /*eslint-disable no-console*/
  console.log(...args);
};
