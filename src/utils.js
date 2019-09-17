export const EMPTY_OBJECT = {};

export const isVLeaf = c =>
  typeof c === "string" || typeof c === "number" || typeof c === "boolean";
export const isVElement = c => c != null && c._IS_VELEMENT_;
export const isVFunction = c => c != null && c._IS_VFUNCTION_;
export const isVComponent = c => c != null && c._IS_VCOMPONENT_;

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

export function maybeFlattenArray(array) {
  for (var i = 0; i < array.length; i++) {
    var item = array[i];
    if (Array.isArray(item)) {
      return flattenArray(array, array.slice(0, i), i);
    }
  }
  return array;
}

function flattenArray(sourceArray, targetArray, startIndex) {
  for (var i = startIndex; i < sourceArray.length; i++) {
    var item = sourceArray[i];
    if (Array.isArray(item)) {
      flattenArray(item, targetArray, 0);
    } else {
      targetArray.push(item);
    }
  }
  return targetArray;
}
