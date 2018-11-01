export const EMPTYO = {};
export const EMPTYAR = [];
export const isArray = Array.isArray;
export const isVNode = c => c && (c._vnode != null || c._text != null);
export const isComponent = c => c && c.mount && c.patch && c.unmount;

export const LOG = (...args) => {
  /*eslint-disable no-console*/
  console.log(...args);
};

export function findK(ktr, j) {
  var lo = 1;
  var hi = ktr.length - 1;
  while (lo <= hi) {
    var mid = Math.ceil((lo + hi) / 2);
    if (j < ktr[mid]) hi = mid - 1;
    else lo = mid + 1;
  }
  return lo;
}

export function indexOf(a, suba, aStart, aEnd, subaStart, subaEnd, eq) {
  var j = subaStart,
    k = -1;
  var subaLen = subaEnd - subaStart + 1;
  while (aStart <= aEnd) {
    if (eq(a[aStart], suba[j])) {
      if (k < 0) k = aStart;
      j++;
      if (j > subaEnd) return k;
    } else {
      if (aStart + subaLen > aEnd) return -1;
      k = -1;
      j = subaStart;
    }
    aStart++;
  }
  return -1;
}
