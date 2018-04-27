import { isArray, isComponent } from "./utils";

const SVG_NS = "http://www.w3.org/2000/svg";
const DELAYED_PROPS = {
  selected: true,
  value: true,
  checked: true,
  innerHTML: true
};
/**
  TODO: activate full namespaced attributes (not supported in JSX)
  const XML_NS = "http://www.w3.org/XML/1998/namespace"
**/
const XLINK_NS = "http://www.w3.org/1999/xlink";
const NS_ATTRS = {
  show: XLINK_NS,
  actuate: XLINK_NS,
  href: XLINK_NS
};

function defShouldUpdate(p1, p2, c1, c2) {
  if (c1 !== c2) return true;
  for (var key in p1) {
    if (p1[key] !== p2[key]) return true;
  }
  return false;
}

export function mount(c) {
  var node;
  if (c._text != null) {
    node = document.createTextNode(c._text);
  } else if (c._vnode === true) {
    const { type, props, content, isSVG } = c;
    if (typeof type === "string") {
      // TODO : {is} for custom elements
      var delayedProps;
      if (!isSVG) {
        node = document.createElement(type);
      } else {
        node = document.createElementNS(SVG_NS, type);
      }
      delayedProps = setAttributes(node, props, undefined);
      if (!isArray(content)) {
        node.appendChild(mount(content));
      } else {
        appendChildren(node, content);
      }
      if (delayedProps != null) {
        setProps(node, props, undefined, delayedProps);
      }
    } else if (isComponent(type)) {
      node = type.mount(props, content);
    } else if (typeof type === "function") {
      if (isComponent(type.prototype)) {
        var instance = new type(props, content);
        node = instance.mount(props, content);
        c._data = instance;
      } else {
        var vnode = type(props, content);
        node = mount(vnode);
        c._data = vnode;
      }
    }
  }
  if (node == null) {
    throw new Error("Unkown node type!");
  }
  c._node = node;
  return node;
}

function appendChildren(
  parent,
  children,
  start = 0,
  end = children.length - 1,
  beforeNode
) {
  while (start <= end) {
    var ch = children[start++];
    parent.insertBefore(mount(ch), beforeNode);
  }
}

function removeChildren(
  parent,
  children,
  start = 0,
  end = children.length - 1
) {
  let cleared;
  if (parent.childNodes.length === end - start + 1) {
    parent.textContent = "";
    cleared = true;
  }
  while (start <= end) {
    var ch = children[start++];
    if (!cleared) parent.removeChild(ch._node);
    unmount(ch);
  }
}

export function unmount(ch) {
  if (isArray(ch)) {
    for (var i = 0; i < ch.length; i++) {
      unmount(ch[i]);
    }
  } else if (ch._vnode === true) {
    if (isComponent(ch.type)) {
      ch.type.unmount(ch._node);
    } else if (
      typeof ch.type === "function" &&
      isComponent(ch.type.prototype)
    ) {
      ch._data.unmount(ch._node);
    } else if (ch.content != null) {
      unmount(ch.content);
    }
  }
}

function setProps(el, props, oldProps, keys) {
  var key;
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    var oldv = oldProps && oldProps[key];
    var newv = props[key];
    if (oldv !== newv) {
      el[key] = newv;
    }
  }
}

function setAttributes(el, attrs, oldAttrs) {
  let props = [];
  for (var key in attrs) {
    if (key.startsWith("on") || key in DELAYED_PROPS) {
      props.push(key);
      continue;
    }
    var oldv = oldAttrs != null ? oldAttrs[key] : undefined;
    var newv = attrs[key];
    if (oldv !== newv) {
      setDOMAttr(el, key, newv);
    }
  }
  for (key in oldAttrs) {
    if (!(key in attrs)) {
      el.removeAttribute(key);
    }
  }
  if (props.length > 0) {
    return props;
  }
}

function setDOMAttr(el, attr, value) {
  if (value === true) {
    el.setAttribute(attr, "");
  } else if (value === false) {
    el.removeAttribute(attr);
  } else {
    var ns = NS_ATTRS[attr];
    if (ns !== undefined) {
      el.setAttributeNS(ns, attr, value);
    } else {
      el.setAttribute(attr, value);
    }
  }
}

export function patch(newch, oldch, parent) {
  var childNode = oldch._node;

  if (oldch === newch) {
    return childNode;
  }

  var t1, t2;
  if ((t1 = oldch._text) != null && (t2 = newch._text) != null) {
    if (t1 !== t2) {
      childNode.nodeValue = t2;
    }
  } else if (oldch.type === newch.type && oldch.isSVG === newch.isSVG) {
    const { type } = oldch;
    if (isComponent(type)) {
      type.patch(
        childNode,
        newch.props,
        oldch.props,
        newch.content,
        oldch.content
      );
    } else if (typeof type === "function") {
      if (isComponent(type.prototype)) {
        var instance = oldch._data;
        instance.patch(
          childNode,
          newch.props,
          oldch.props,
          newch.content,
          oldch.content
        );
        newch._data = instance;
      } else {
        var shouldUpdateFn = type.shouldUpdate || defShouldUpdate;
        if (
          shouldUpdateFn(newch.props, oldch.props, newch.content, oldch.content)
        ) {
          var vnode = type(newch.props, newch.content);
          childNode = patch(vnode, oldch._data, parent);
          newch._data = vnode;
        } else {
          newch._data = oldch._data;
        }
      }
    } else if (typeof type === "string") {
      var delayedProps = setAttributes(childNode, newch.props, oldch.props);
      patchContent(childNode, newch.content, oldch.content);
      if (delayedProps != null) {
        setProps(childNode, newch.props, oldch.props, delayedProps);
      }
    } else {
      throw new Error("Unkown node type! " + type);
    }
  } else {
    childNode = mount(newch);
    if (parent) {
      parent.replaceChild(childNode, oldch._node);
    }
    unmount(oldch);
  }

  newch._node = childNode;
  return childNode;
}

function patchContent(parent, content, oldContent) {
  if (!isArray(content) && !isArray(oldContent)) {
    if (content !== oldContent) {
      patch(content, oldContent, parent);
    }
  } else if (isArray(content) && isArray(oldContent)) {
    diffChildren(parent, content, oldContent);
  } else {
    removeChildren(parent, oldContent, 0, oldContent.length - 1);
    appendChildren(parent, content);
  }
}

function canPatch(v1, v2) {
  return v1.key === v2.key;
}

export function diffChildren(
  parent,
  children,
  oldChildren,
  newStart = 0,
  newEnd = children.length - 1,
  oldStart = 0,
  oldEnd = oldChildren.length - 1
) {
  if (children === oldChildren) return;
  var oldCh;

  /**
    Before applying the diff algorithm we try some preprocessing optimizations
    to reduce the cost
    See https://neil.fraser.name/writing/diff/ for the full details.

    In the following : indel = INsertion/DELetion
  **/

  // common prefix/suffix

  var k = diffCommonPrefix(
    children,
    oldChildren,
    newStart,
    newEnd,
    oldStart,
    oldEnd,
    canPatch,
    parent
  );
  newStart += k;
  oldStart += k;

  k = diffCommonSufffix(
    children,
    oldChildren,
    newStart,
    newEnd,
    oldStart,
    oldEnd,
    canPatch,
    parent
  );
  newEnd -= k;
  oldEnd -= k;

  if (newStart > newEnd && oldStart > oldEnd) {
    return;
  }

  // simple indel: one of the 2 sequences is empty after common prefix/suffix removal

  // old sequence is empty -> insertion
  if (newStart <= newEnd && oldStart > oldEnd) {
    oldCh = oldChildren[oldStart];
    appendChildren(parent, children, newStart, newEnd, oldCh && oldCh._node);
    return;
  }

  // new sequence is empty -> deletion
  if (oldStart <= oldEnd && newStart > newEnd) {
    removeChildren(parent, oldChildren, oldStart, oldEnd);
    return;
  }

  // 2 simple indels: the shortest sequence is a subsequence of the longest
  var oldRem = oldEnd - oldStart + 1;
  var newRem = newEnd - newStart + 1;
  k = -1;
  if (oldRem < newRem) {
    k = indexOf(
      children,
      oldChildren,
      newStart,
      newEnd,
      oldStart,
      oldEnd,
      canPatch
    );
    if (k >= 0) {
      oldCh = oldChildren[oldStart];
      appendChildren(parent, children, newStart, k - 1, oldCh._node);
      var upperLimit = k + oldRem;
      newStart = k;
      while (newStart < upperLimit) {
        patch(children[newStart++], oldChildren[oldStart++]);
      }
      oldCh = oldChildren[oldEnd];
      appendChildren(
        parent,
        children,
        newStart,
        newEnd,
        oldCh && oldCh._node.nextSibling
      );
      return;
    }
  } else if (oldRem > newRem) {
    k = indexOf(
      oldChildren,
      children,
      oldStart,
      oldEnd,
      newStart,
      newEnd,
      canPatch
    );
    if (k >= 0) {
      removeChildren(parent, oldChildren, oldStart, k - 1);
      upperLimit = k + newRem;
      oldStart = k;
      while (oldStart < upperLimit) {
        patch(children[newStart++], oldChildren[oldStart++]);
      }
      removeChildren(parent, oldChildren, oldStart, oldEnd);
      return;
    }
  }

  // fast case: difference between the 2 sequences is only one item
  if (oldStart === oldEnd) {
    var node = oldChildren[oldStart]._node;
    appendChildren(parent, children, newStart, newEnd, node);
    parent.removeChild(node);
    unmount(node);
    return;
  }
  if (newStart === newEnd) {
    parent.insertBefore(mount(children[newStart]), oldChildren[oldStart]._node);
    removeChildren(parent, oldChildren, oldStart, oldEnd);
    return;
  }

  /*
    last preopt
    if we can find a subsequence that's at least half the longest sequence the it's guaranteed to
    be the longest common subsequence. This allows us to find the lcs using a simple O(N) algorithm
  */
  var hm;
  /*var oldShorter = oldRem < newRem;
  if (oldShorter) {
    hm = diffHalfMatch(
      children,
      oldChildren,
      newStart,
      newEnd,
      oldStart,
      oldEnd,
      canPatch
    );
  } else {
    hm = diffHalfMatch(
      oldChildren,
      children,
      oldStart,
      oldEnd,
      newStart,
      newEnd,
      canPatch
    );
  }
  if (hm) {
    var newStartHm = oldShorter ? hm.start1 : hm.start2;
    var newEndHm = newStartHm + hm.length - 1;
    var oldStartHm = oldShorter ? hm.start2 : hm.start1;
    var oldEndHm = oldStartHm + hm.length - 1;
    for (var i = newStartHm, j = oldStartHm; i <= newEndHm; i++, j++) {
      patch(children[i], oldChildren[j], parent);
    }
    diffChildren(
      parent,
      children,
      oldChildren,
      newStart,
      newStartHm - 1,
      oldStart,
      oldStartHm - 1
    );
    diffChildren(
      parent,
      children,
      oldChildren,
      newEndHm + 1,
      newEnd,
      oldEndHm + 1,
      oldEnd
    );
    return;
  }*/

  /*
    Run the diff algorithm
    First try the O(ND) algorithm. If O(ND) cost is high (Too match diffs between the 2 seqs)
    then fallback to Map lookup based algorithm
  */
  if (!hm) {
    var failed = diffOND(
      parent,
      children,
      oldChildren,
      newStart,
      newEnd,
      oldStart,
      oldEnd
    );
    if (failed)
      diffWithMap(
        parent,
        children,
        oldChildren,
        newStart,
        newEnd,
        oldStart,
        oldEnd
      );
  }
}

function diffCommonPrefix(s1, s2, start1, end1, start2, end2, eq, parent) {
  var k = 0,
    c1,
    c2;
  while (
    start1 <= end1 &&
    start2 <= end2 &&
    eq((c1 = s1[start1]), (c2 = s2[start2]))
  ) {
    if (parent) patch(c1, c2, parent);
    start1++;
    start2++;
    k++;
  }
  return k;
}

function diffCommonSufffix(s1, s2, start1, end1, start2, end2, eq, parent) {
  var k = 0,
    c1,
    c2;
  while (
    start1 <= end1 &&
    start2 <= end2 &&
    eq((c1 = s1[end1]), (c2 = s2[end2]))
  ) {
    if (parent) patch(c1, c2, parent);
    end1--;
    end2--;
    k++;
  }
  return k;
}
/*
function diffHalfMatch(s1, s2, start1, end1, start2, end2, eq) {
  var len1 = end1 - start1 + 1;
  var len2 = end2 - start2 + 1;

  if (len1 < 2 || len2 < 1) {
    return null;
  }

  var hm1 = halfMatchInt(start1 + Math.ceil(len1 / 4));
  var hm2 = halfMatchInt(start1 + Math.ceil(len1 / 2));
  return !hm1 && !hm2
    ? null
    : !hm1 ? hm2 : !hm2 ? hm1 : hm1.length > hm2.length ? hm1 : hm2;

  function halfMatchInt(seedStart) {
    var seedEnd = seedStart + Math.floor(len1 / 4);
    var j = start2 - 1;
    var bestCS = { length: 0 };
    while (
      j < end2 &&
      (j = indexOf(s2, s1, j + 1, end2, seedStart, seedEnd, eq)) !== -1
    ) {
      var prefixLen = diffCommonPrefix(s1, s2, seedStart, end1, j, end2, eq);
      var suffixLen = diffCommonSufffix(
        s1,
        s2,
        start1,
        seedStart - 1,
        start2,
        j - 1,
        eq
      );
      if (bestCS.length < prefixLen + suffixLen) {
        bestCS.start1 = seedStart - suffixLen;
        bestCS.start2 = j - suffixLen;
        bestCS.length = prefixLen + suffixLen;
      }
    }
    return bestCS.length >= len1 / 2 ? bestCS : null;
  }
}
*/
const PATCH = 2;
const INSERTION = 4;
const DELETION = 8;

/**
  Find the shortest edit script between the old and new sequences
  This is equivalent to finding the shortest path in the edit graph of the 2 sequences
  see "An O(ND) Difference Algorithm and Its Variations" at
  http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf
**/
function diffOND(
  parent,
  children,
  oldChildren,
  newStart = 0,
  newEnd = children.length - 1,
  oldStart = 0,
  oldEnd = oldChildren.length - 1
) {
  var rows = newEnd - newStart + 1;
  var cols = oldEnd - oldStart + 1;
  var dmax = rows + cols;

  var v = [];
  var d, k, r, c, pv, cv, pd;
  outer: for (d = 0; d <= dmax; d++) {
    if (d > 50) return true;
    pd = d - 1;
    pv = d ? v[d - 1] : [0, 0];
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
        canPatch(oldChildren[oldStart + c], children[newStart + r])
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
  var oldCh;
  var diffIdx = diff.length - 1;
  for (d = v.length - 1; d >= 0; d--) {
    while (
      c > 0 &&
      r > 0 &&
      canPatch(oldChildren[oldStart + c - 1], children[newStart + r - 1])
    ) {
      // diagonal edge = equality
      diff[diffIdx--] = PATCH;
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
      diff[diffIdx--] = INSERTION;
    } else {
      // horizontal edge = deletion
      c--;
      diff[diffIdx--] = DELETION;
      oldCh = oldChildren[oldStart + c];
      if (oldCh.key != null) {
        deleteMap[oldCh.key] = oldStart + c;
      }
    }
  }

  applyDiff(parent, diff, children, oldChildren, newStart, oldStart, deleteMap);
}

function applyDiff(
  parent,
  diff,
  children,
  oldChildren,
  newStart,
  oldStart,
  deleteMap
) {
  var ch,
    oldCh,
    node,
    oldMatchIdx,
    moveMap = {};
  for (var i = 0, chIdx = newStart, oldChIdx = oldStart; i < diff.length; i++) {
    const op = diff[i];
    if (op === PATCH) {
      patch(children[chIdx++], oldChildren[oldChIdx++], parent);
    } else if (op === INSERTION) {
      ch = children[chIdx++];
      oldMatchIdx = null;
      if (ch.key != null) {
        oldMatchIdx = deleteMap[ch.key];
      }
      if (oldMatchIdx != null) {
        node = patch(ch, oldChildren[oldMatchIdx]);
        moveMap[ch.key] = oldMatchIdx;
      } else {
        node = mount(ch);
      }
      parent.insertBefore(
        node,
        oldChIdx < oldChildren.length ? oldChildren[oldChIdx]._node : null
      );
    } else if (op === DELETION) {
      oldChIdx++;
    }
  }

  for (i = 0, oldChIdx = oldStart; i < diff.length; i++) {
    const op = diff[i];
    if (op === PATCH) {
      oldChIdx++;
    } else if (op === DELETION) {
      oldCh = oldChildren[oldChIdx++];
      if (oldCh.key == null || moveMap[oldCh.key] == null) {
        parent.removeChild(oldCh._node);
        unmount(oldCh);
      }
    }
  }
}

/**
  A simplified implementation of Hunt-Szymanski algorithm
  see "A Fast Algorithm for Computing Longest Common Subsequences"
  http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.608.1614&rep=rep1&type=pdf
  This implementation supposes keys are unique so we only use 
  simple object maps to build the match list
**/
function diffWithMap(
  parent,
  children,
  oldChildren,
  newStart,
  newEnd,
  oldStart,
  oldEnd
) {
  var keymap = {},
    unkeyed = [],
    idxUnkeyed = 0,
    ch,
    oldCh,
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
    oldCh = oldChildren[i];
    key = oldCh.key;
    if (key != null) {
      keymap[key] = i;
    } else {
      unkeyed.push(i);
    }
  }

  for (i = newStart; i <= newEnd; i++) {
    ch = children[i];
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
  applyDiff(parent, diff, children, oldChildren, newStart, oldStart, keymap);
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

function indexOf(a, suba, aStart, aEnd, subaStart, subaEnd, eq) {
  var j = subaStart,
    k = -1;
  var subaLen = subaEnd - subaStart + 1;
  while (aStart <= aEnd && aEnd - aStart + 1 >= subaLen) {
    if (eq(a[aStart], suba[j])) {
      if (k < 0) k = aStart;
      j++;
      if (j > subaEnd) return k;
    } else {
      k = -1;
      j = subaStart;
    }
    aStart++;
  }
  return -1;
}
