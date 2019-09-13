export const PATCH = "="; //2;
export const INSERTION = "+"; // 4;
export const DELETION = "-"; //8;

export function diff(
  newArray,
  oldArray,
  compareFn,
  newStart = 0,
  newEnd = newArray.length - 1,
  oldStart = 0,
  oldEnd = oldArray.length - 1
) {
  var diff = diffOND(
    newArray,
    oldArray,
    compareFn,
    newStart,
    newEnd,
    oldStart,
    oldEnd
  );
  if (diff != null) return diff;
  return diffWithMap(
    newArray,
    oldArray,
    compareFn,
    newStart,
    newEnd,
    oldStart,
    oldEnd
  );
}

/**
  Find the shortest edit script between the old and new sequences
  This is equivalent to finding the shortest path in the edit graph of the 2 sequences
  see "An O(ND) Difference Algorithm and Its Variations" at
  http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf

  Alternatively, see the following link for a more detailed workthrough
  https://www.codeproject.com/Articles/42279/Investigating-Myers-diff-algorithm-Part-of
**/
function diffOND(
  newArray,
  oldArray,
  compareFn,
  newStart = 0,
  newEnd = newArray.length - 1,
  oldStart = 0,
  oldEnd = oldArray.length - 1
) {
  var rows = newEnd - newStart + 1;
  var cols = oldEnd - oldStart + 1;
  var dmax = rows + cols;

  var v = [];
  var d, k, r, c, pv, cv, pd;
  outer: for (d = 0; d <= dmax; d++) {
    // Difference is too much, use alternate algorithm
    if (d > 50) return;
    pd = d - 1;
    pv = d > 0 ? v[d - 1] : [0, 0];
    cv = v[d] = [];
    for (k = -d; k <= d; k += 2) {
      if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
        c = pv[pd + k + 1];
      } else {
        c = pv[pd + k - 1] + 1;
      }
      r = c - k;
      while (
        c < cols &&
        r < rows &&
        compareFn(oldArray[oldStart + c], newArray[newStart + r])
      ) {
        c++;
        r++;
      }
      if (c === cols && r === rows) {
        break outer;
      }
      cv[d + k] = c;
    }
  }

  var diff = Array(d / 2 + dmax / 2);
  var deleteMap = {};
  var item;
  var diffIndex = diff.length - 1;
  for (d = v.length - 1; d >= 0; d--) {
    while (
      c > 0 &&
      r > 0 &&
      compareFn(oldArray[oldStart + c - 1], newArray[newStart + r - 1])
    ) {
      // diagonal edge = equality
      diff[diffIndex--] = PATCH;
      c--;
      r--;
    }
    if (!d) break;
    pd = d - 1;
    pv = d ? v[d - 1] : [0, 0];
    k = c - r;
    if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
      // vertical edge = insertion
      r--;
      diff[diffIndex--] = INSERTION;
    } else {
      // horizontal edge = deletion
      c--;
      diff[diffIndex--] = DELETION;
      item = oldArray[oldStart + c];
      if (item.key != null) {
        deleteMap[item.key] = oldStart + c;
      }
    }
  }

  return {
    diff,
    deleteMap
  };
}

/**
  A simplified implementation of Hunt-Szymanski algorithm
  see "A Fast Algorithm for Computing Longest Common Subsequences"
  http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.608.1614&rep=rep1&type=pdf
  This implementation supposes keys are unique so we only use 
  simple object maps to build the match list
**/
function diffWithMap(newArray, oldArray, newStart, newEnd, oldStart, oldEnd) {
  var keymap = {},
    unkeyed = [],
    idxUnkeyed = 0,
    ch,
    item,
    k,
    idxInOld,
    key;

  var newLen = newEnd - newStart + 1;
  var oldLen = oldEnd - oldStart + 1;
  var minLen = Math.min(newLen, oldLen);
  var tresh = Array(minLen + 1);
  tresh[0] = -1;

  for (var i = 1; i < tresh.length; i++) {
    tresh[i] = oldEnd + 1;
  }
  var link = Array(minLen);

  for (i = oldStart; i <= oldEnd; i++) {
    item = oldArray[i];
    key = item.key;
    if (key != null) {
      keymap[key] = i;
    } else {
      unkeyed.push(i);
    }
  }

  for (i = newStart; i <= newEnd; i++) {
    ch = newArray[i];
    idxInOld = ch.key == null ? unkeyed[idxUnkeyed++] : keymap[ch.key];
    if (idxInOld != null) {
      k = findK(tresh, idxInOld);
      if (k >= 0) {
        tresh[k] = idxInOld;
        link[k] = { newi: i, oldi: idxInOld, prev: link[k - 1] };
      }
    }
  }

  k = tresh.length - 1;
  while (tresh[k] > oldEnd) k--;

  var ptr = link[k];
  var diff = Array(oldLen + newLen - k);
  var curNewi = newEnd,
    curOldi = oldEnd;
  var d = diff.length - 1;
  while (ptr) {
    const { newi, oldi } = ptr;
    while (curNewi > newi) {
      diff[d--] = INSERTION;
      curNewi--;
    }
    while (curOldi > oldi) {
      diff[d--] = DELETION;
      curOldi--;
    }
    diff[d--] = PATCH;
    curNewi--;
    curOldi--;
    ptr = ptr.prev;
  }
  while (curNewi >= newStart) {
    diff[d--] = INSERTION;
    curNewi--;
  }
  while (curOldi >= oldStart) {
    diff[d--] = DELETION;
    curOldi--;
  }

  return {
    diff,
    deleteMap: keymap
  };
}

function findK(ktr, j) {
  var lo = 1;
  var hi = ktr.length - 1;
  while (lo <= hi) {
    var mid = Math.ceil((lo + hi) / 2);
    if (j < ktr[mid]) hi = mid - 1;
    else lo = mid + 1;
  }
  return lo;
}
