import { isArray, isComponent } from "./utils";

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
  } else if (c._vnode) {
    if (typeof c.type === "string") {
      // TODO : non HTML namespaces + {is} for custom elements
      node = document.createElement(c.type);
      setProps(node, c.props, undefined, c._ctx);

      if (!isArray(c.content)) {
        node.appendChild(mount(c.content));
      } else {
        appendChildren(node, c.content);
      }
    } else if (isComponent(c.type)) {
      node = c.type.mount(
        c.type,
        Object.assign({}, c.props, { content: c.content })
      );
    } else if (typeof c.type === "function") {
      var vnode = c.type(c.props, c.content);
      node = mount(vnode);
      c._data = vnode;
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
    for (var i = 0; i < ch.content.length; i++) {
      unmount(ch.content[i]);
    }
  } else {
    if (isComponent(ch.type)) ch.type.unmount(ch._node);
  }
}

function setProps(el, props, oldProps, ctx) {
  for (var key in props) {
    var oldv = oldProps && oldProps[key];
    var newv = props[key];
    if (oldv !== newv) {
      el[key] =
        typeof newv === "function" && ctx !== undefined ? newv.bind(ctx) : newv;
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
  } else if (oldch.type === newch.type) {
    const type = oldch.type;
    if (isComponent(type)) {
      type.patch(
        childNode,
        Object.assign({}, newch.props, { content: newch.content })
      );
    } else if (typeof type === "function") {
      var shouldUpdateFn = type.shouldUpdate || defShouldUpdate;
      if (
        shouldUpdateFn(oldch.props, newch.props, oldch.content, newch.content)
      ) {
        var vnode = type(newch.props, newch.content);
        childNode = patch(vnode, oldch._data, parent);
        newch._data = vnode;
      } else {
        newch._data = oldch._data;
      }
    } else if (typeof type === "string") {
      setProps(childNode, newch.props, oldch.props, newch._ctx);

      if (!isArray(oldch.content) && !isArray(newch.content)) {
        if (oldch.content !== newch.content) {
          patch(newch.content, oldch.content, childNode);
        }
      } else if (isArray(oldch.content) && isArray(newch.content)) {
        diffChildren(childNode, newch.content, oldch.content);
      } else {
        removeChildren(childNode, oldch.content, 0, oldch.content.length - 1);
        appendChildren(childNode, newch);
      }
    } else {
      throw new Error("Unkown node type! " + type);
    }
  } else {
    childNode = mount(newch);
    if (parent) {
      parent.replaceChild(childNode, oldch._node);
    }
  }

  newch._node = childNode;
  return childNode;
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
  var oldShorter = oldRem < newRem;
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
  }

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
    if (parent) patch(c1, c2);
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
    if (parent) patch(c1, c2);
    end1--;
    end2--;
    k++;
  }
  return k;
}

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

  var del = [],
    ins = [],
    oldKeyMap = {};
  var ch, oldCh;

  for (d = v.length - 1; d >= 0; d--) {
    while (
      c > 0 &&
      r > 0 &&
      canPatch(
        (oldCh = oldChildren[oldStart + c - 1]),
        (ch = children[newStart + r - 1])
      )
    ) {
      // diagonal edge = equality
      patch(ch, oldCh, parent);
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
      ins.push([newStart + r, oldStart + c]);
    } else {
      // horizontal edge = deletion
      c--;
      del.push(oldStart + c);
      oldCh = oldChildren[oldStart + c];
      if (oldCh.key) {
        oldKeyMap[oldCh.key] = oldStart + c;
      }
    }
  }

  var node, chIdx, oldChIdx, oldMatchIdx;
  var oldMoved = [];
  for (var i = ins.length - 1; i >= 0; i--) {
    [chIdx, oldChIdx] = ins[i];
    ch = children[chIdx];
    oldMatchIdx = oldKeyMap[ch.key];
    if (oldMatchIdx != null) {
      oldCh = oldChildren[oldMatchIdx];
      node = patch(ch, oldCh);
      if (oldCh._node === node) {
        oldMoved.push(oldMatchIdx);
      }
    } else {
      node = mount(ch);
    }
    oldCh = oldChildren[oldChIdx];
    parent.insertBefore(node, oldCh ? oldCh._node : null);
  }

  for (i = 0; i < oldMoved.length; i++) {
    oldChildren[oldMoved[i]] = undefined;
  }

  for (i = 0; i < del.length; i++) {
    oldCh = oldChildren[del[i]];
    if (oldCh != null) {
      parent.removeChild(oldCh._node);
      unmount(oldCh);
    }
  }
}

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
    oldCh,
    node,
    idxInOld,
    key;
  for (var i = oldStart; i <= oldEnd; i++) {
    oldCh = oldChildren[i];
    key = oldCh.key;
    if (key != null) {
      keymap[key] = i;
    }
  }
  var oldStartCh, newStartCh;
  while (oldStart <= oldEnd && newStart <= newEnd) {
    oldStartCh = oldChildren[oldStart];
    newStartCh = children[newStart];
    idxInOld = keymap[newStartCh.key];
    if (idxInOld == null) {
      parent.insertBefore(mount(newStartCh), oldStartCh._node);
      newStartCh = children[++newStart];
    } else {
      oldCh = oldChildren[idxInOld];
      node = patch(newStartCh, oldCh);
      oldCh[idxInOld] = undefined;
      parent.insertBefore(node, oldStartCh._node);
      newStartCh = children[++newStart];
    }
  }
  if (oldStart > oldEnd) {
    var before =
      children[newEnd + 1] == null ? null : children[newEnd + 1]._node;
    appendChildren(parent, children, newStart, newEnd, before);
  } else if (newStart > newEnd) {
    removeChildren(parent, oldChildren, oldStart, oldEnd);
  }
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
