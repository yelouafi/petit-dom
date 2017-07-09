(function() {
  "use strict";

  var _typeof =
    typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
      ? function(obj) {
          return typeof obj;
        }
      : function(obj) {
          return obj &&
          typeof Symbol === "function" &&
          obj.constructor === Symbol &&
          obj !== Symbol.prototype
            ? "symbol"
            : typeof obj;
        };

  var slicedToArray = (function() {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (
          var _i = arr[Symbol.iterator](), _s;
          !(_n = (_s = _i.next()).done);
          _n = true
        ) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function(arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError(
          "Invalid attempt to destructure non-iterable instance"
        );
      }
    };
  })();

  var EMPTYO = {};
  var EMPTYAR = [];
  var isArray = Array.isArray;

  function isPrimitive(c) {
    var type = typeof c === "undefined" ? "undefined" : _typeof(c);
    return (
      type === "string" || type === "number" || type === "boolean" || c === null
    );
  }

  function isChild(c) {
    return isArray(c) || (c && c._vnode) || isPrimitive(c);
  }
  /**
  h(type)
  h(type, props, ...children)
  h(type, ...children)
**/
  function h(type) {
    var props, _textChild;
    var startChIdx = 1;
    var firstCh;
    var len = arguments.length - 1;

    if (len > 0) {
      firstCh = arguments[startChIdx];
      if (firstCh === null || !isChild(firstCh)) {
        props = firstCh;
        len--;
        startChIdx++;
        firstCh = arguments[startChIdx];
      }
      _textChild = len === 1 && isPrimitive(firstCh);
    }

    return {
      _vnode: true,
      type: type,
      key: props && props.key,
      props: props || EMPTYO,
      content: _textChild
        ? firstCh
        : !len ? EMPTYAR : flattenChildren(arguments, startChIdx, []),
      _textChild: _textChild,
      _data: null,
      _node: null
    };
  }

  function flattenChildren(children, start, arr) {
    for (var i = start; i < children.length; i++) {
      var ch = children[i];
      appendNormalized(arr, ch);
    }
    return arr;
  }

  function appendNormalized(arr, ch) {
    if (isArray(ch)) {
      flattenChildren(ch, 0, arr);
    } else if (ch && ch._vnode) {
      arr.push(ch);
    } else {
      arr.push({ _text: ch });
    }
  }

  function isComponent(type) {
    return type && type.mount && type.update && type.unmount;
  }

  function createNode(c) {
    var node;
    if (c._text != null) {
      node = document.createTextNode(c._text);
    } else if (c._vnode) {
      if (typeof c.type === "string") {
        // TODO : non HTML namespaces + {is} for custom elements
        node = document.createElement(c.type);
        setProps(node, c.props, undefined, c._ctx);

        if (c._textChild) {
          node.appendChild(document.createTextNode(c.content));
        } else {
          appendChildren(node, c.content);
        }
      } else if (isComponent(c.type)) {
        node = c.type.mount(c);
      }
    }
    if (node == null) {
      throw new Error("Unkown node type!");
    }
    c._node = node;
    return node;
  }

  function appendChildren(parent, children) {
    var start =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var end =
      arguments.length > 3 && arguments[3] !== undefined
        ? arguments[3]
        : children.length - 1;
    var beforeNode = arguments[4];

    while (start <= end) {
      var ch = children[start++];
      parent.insertBefore(createNode(ch), beforeNode);
    }
  }

  function removeChildren(parent, children) {
    var start =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var end =
      arguments.length > 3 && arguments[3] !== undefined
        ? arguments[3]
        : children.length - 1;

    /*
  if(end - start + 1 === children.length) {
    parent.textContent = ''
    while(parent.firstChild) parent.removeChild(parent.firstChild)
    return
  }
  */
    while (start <= end) {
      var ch = children[start++];
      if (isComponent(ch.type)) {
        ch.type.unmount(ch._node);
      }
      parent.removeChild(ch._node);
    }
  }

  function setProps(el, props, oldProps, ctx) {
    for (var key in props) {
      var oldv = oldProps && oldProps[key];
      var newv = props[key];
      if (oldv !== newv) {
        el[key] =
          typeof newv === "function" && ctx !== undefined
            ? newv.bind(ctx)
            : newv;
      }
    }
  }

  function patch(newch, oldch, parent) {
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
      var type = oldch.type;
      if (isComponent(type)) {
        childNode = type.update(childNode, newch.props, newch.content);
      } else {
        setProps(childNode, newch.props, oldch.props, newch._ctx);

        if (oldch._textChild && newch._textChild) {
          if (oldch.content !== newch.content) {
            childNode.firstChild.nodeValue = newch.content;
          }
        } else {
          diffChildren(childNode, newch.content, oldch.content);
        }
      }
    } else {
      childNode = createNode(newch);
      if (parent) {
        parent.replaceChild(childNode, oldch._node);
      }
    }

    newch._node = childNode;
    if (typeof VDOM_DEBUG !== "undefined") childNode.className = "match";
    return childNode;
  }

  function canPatch(v1, v2) {
    return v1.key === v2.key;
  }

  function diffChildren(parent, children, oldChildren) {
    var newStart =
      arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var newEnd =
      arguments.length > 4 && arguments[4] !== undefined
        ? arguments[4]
        : children.length - 1;
    var oldStart =
      arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    var oldEnd =
      arguments.length > 6 && arguments[6] !== undefined
        ? arguments[6]
        : oldChildren.length - 1;

    var ch, oldCh;

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
      canPatch
    );
    while (k--) {
      ch = children[newStart++];
      oldCh = oldChildren[oldStart++];
      patch(ch, oldCh, parent);
    }

    k = diffCommonSufffix(
      children,
      oldChildren,
      newStart,
      newEnd,
      oldStart,
      oldEnd,
      canPatch
    );
    while (k--) {
      ch = children[newEnd--];
      oldCh = oldChildren[oldEnd--];
      patch(ch, oldCh, parent);
    }

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
      return;
    }
    if (newStart === newEnd) {
      parent.insertBefore(
        createNode(children[newStart]),
        oldChildren[oldStart]._node
      );
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

  function diffCommonPrefix(s1, s2, start1, end1, start2, end2, eq) {
    var k = 0;
    while (start1 <= end1 && start2 <= end2 && eq(s1[start1], s2[start2])) {
      start1++;
      start2++;
      k++;
    }
    return k;
  }

  function diffCommonSufffix(s1, s2, start1, end1, start2, end2, eq) {
    var k = 0;
    while (start1 <= end1 && start2 <= end2 && eq(s1[end1], s2[end2])) {
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
  function diffOND(parent, children, oldChildren) {
    var newStart =
      arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var newEnd =
      arguments.length > 4 && arguments[4] !== undefined
        ? arguments[4]
        : children.length - 1;
    var oldStart =
      arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    var oldEnd =
      arguments.length > 6 && arguments[6] !== undefined
        ? arguments[6]
        : oldChildren.length - 1;

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
      var _ins$i = slicedToArray(ins[i], 2);

      chIdx = _ins$i[0];
      oldChIdx = _ins$i[1];

      ch = children[chIdx];
      oldMatchIdx = oldKeyMap[ch.key];
      if (oldMatchIdx != null) {
        oldCh = oldChildren[oldMatchIdx];
        node = patch(ch, oldCh);
        if (oldCh._node === node) {
          oldMoved.push(oldMatchIdx);
        }
      } else {
        node = createNode(ch);
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
        parent.insertBefore(createNode(newStartCh), oldStartCh._node);
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

  var vel = h("div", null);
  document.body.appendChild(createNode(vel));

  var value = "ABCD";

  function update() {
    var vel2 = h(
      "div",
      null,
      h("input", {
        value: value,
        oninput: function oninput(e) {
          return (value = e.target.value);
        }
      }),
      h("button", { onclick: update }, "'Patch!"),
      h("hr", null),
      value.split("").map(function(it) {
        return h(
          "span",
          {
            key: it,
            style: "border: 1px dotted; margin-right: 2px; padding: 2px"
          },
          it
        );
      })
    );
    patch(vel2, vel);
    vel = vel2;
  }

  update("ABCD");
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9oLmpzIiwiLi4vLi4vLi4vc3JjL3Zkb20uanMiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcclxudmFyIEVNUFRZTyA9IHt9XHJcbnZhciBFTVBUWUFSID0gW11cclxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5XHJcblxyXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShjKSB7XHJcbiAgdmFyIHR5cGUgPSB0eXBlb2YgY1xyXG4gIHJldHVybiB0eXBlID09PSAnc3RyaW5nJyB8fCB0eXBlID09PSAnbnVtYmVyJyB8fCB0eXBlID09PSAnYm9vbGVhbicgfHwgYyA9PT0gbnVsbFxyXG59XHJcblxyXG5mdW5jdGlvbiBpc0NoaWxkKGMpIHtcclxuICByZXR1cm4gaXNBcnJheShjKSB8fCAoYyAmJiBjLl92bm9kZSkgfHwgaXNQcmltaXRpdmUoYylcclxufVxyXG4vKipcclxuICBoKHR5cGUpXHJcbiAgaCh0eXBlLCBwcm9wcywgLi4uY2hpbGRyZW4pXHJcbiAgaCh0eXBlLCAuLi5jaGlsZHJlbilcclxuKiovXHJcbmV4cG9ydCBmdW5jdGlvbiBoKHR5cGUpIHtcclxuICB2YXIgcHJvcHMsIF90ZXh0Q2hpbGRcclxuICB2YXIgc3RhcnRDaElkeCA9IDFcclxuICB2YXIgZmlyc3RDaFxyXG4gIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoIC0gMVxyXG5cclxuICBpZihsZW4gPiAwKSB7XHJcbiAgICBmaXJzdENoID0gYXJndW1lbnRzW3N0YXJ0Q2hJZHhdXHJcbiAgICBpZihmaXJzdENoID09PSBudWxsIHx8ICFpc0NoaWxkKGZpcnN0Q2gpKSB7XHJcbiAgICAgIHByb3BzID0gZmlyc3RDaFxyXG4gICAgICBsZW4tLVxyXG4gICAgICBzdGFydENoSWR4KytcclxuICAgICAgZmlyc3RDaCA9IGFyZ3VtZW50c1tzdGFydENoSWR4XVxyXG4gICAgfVxyXG4gICAgX3RleHRDaGlsZCA9IGxlbiA9PT0gMSAmJiBpc1ByaW1pdGl2ZShmaXJzdENoKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIF92bm9kZTogdHJ1ZSxcclxuICAgIHR5cGUsXHJcbiAgICBrZXk6IHByb3BzICYmIHByb3BzLmtleSxcclxuICAgIHByb3BzOiBwcm9wcyB8fCBFTVBUWU8sXHJcbiAgICBjb250ZW50OiBfdGV4dENoaWxkID8gZmlyc3RDaCA6ICghbGVuID8gRU1QVFlBUiA6IGZsYXR0ZW5DaGlsZHJlbihhcmd1bWVudHMsIHN0YXJ0Q2hJZHgsIFtdKSksXHJcbiAgICBfdGV4dENoaWxkLFxyXG4gICAgX2RhdGE6IG51bGwsXHJcbiAgICBfbm9kZTogbnVsbFxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZmxhdHRlbkNoaWxkcmVuKGNoaWxkcmVuLCBzdGFydCwgYXJyKSB7XHJcbiAgZm9yKHZhciBpID0gc3RhcnQ7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGNoID0gY2hpbGRyZW5baV1cclxuICAgIGFwcGVuZE5vcm1hbGl6ZWQoYXJyLCBjaClcclxuICB9XHJcbiAgcmV0dXJuIGFyclxyXG59XHJcblxyXG5mdW5jdGlvbiBhcHBlbmROb3JtYWxpemVkKGFyciwgY2gpIHtcclxuICBpZihpc0FycmF5KGNoKSkge1xyXG4gICAgZmxhdHRlbkNoaWxkcmVuKGNoLCAwLCBhcnIpXHJcbiAgfVxyXG4gIGVsc2UgaWYoY2ggJiYgY2guX3Zub2RlKSB7XHJcbiAgICBhcnIucHVzaChjaClcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBhcnIucHVzaCh7X3RleHQ6IGNofSlcclxuICB9XHJcbn1cclxuIiwiXHJcbmZ1bmN0aW9uIGlzQ29tcG9uZW50KHR5cGUpIHtcclxuICByZXR1cm4gdHlwZSAmJiB0eXBlLm1vdW50ICYmIHR5cGUudXBkYXRlICYmIHR5cGUudW5tb3VudFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZShjKSB7XHJcbiAgdmFyIG5vZGVcclxuICBpZihjLl90ZXh0ICE9IG51bGwpIHtcclxuICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjLl90ZXh0KVxyXG4gIH1cclxuICBlbHNlIGlmKGMuX3Zub2RlKSB7XHJcbiAgICBpZih0eXBlb2YgYy50eXBlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAvLyBUT0RPIDogbm9uIEhUTUwgbmFtZXNwYWNlcyArIHtpc30gZm9yIGN1c3RvbSBlbGVtZW50c1xyXG4gICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChjLnR5cGUpXHJcbiAgICAgIHNldFByb3BzKG5vZGUsIGMucHJvcHMsIHVuZGVmaW5lZCwgYy5fY3R4KVxyXG5cclxuICAgICAgaWYoYy5fdGV4dENoaWxkKSB7XHJcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjLmNvbnRlbnQpKVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFwcGVuZENoaWxkcmVuKG5vZGUsIGMuY29udGVudClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZihpc0NvbXBvbmVudChjLnR5cGUpKSB7XHJcbiAgICAgIG5vZGUgPSBjLnR5cGUubW91bnQoYylcclxuICAgIH1cclxuICB9XHJcbiAgaWYobm9kZSA9PSBudWxsKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua293biBub2RlIHR5cGUhJylcclxuICB9XHJcbiAgYy5fbm9kZSA9IG5vZGVcclxuICByZXR1cm4gbm9kZVxyXG59XHJcblxyXG5mdW5jdGlvbiBhcHBlbmRDaGlsZHJlbihwYXJlbnQsIGNoaWxkcmVuLCBzdGFydCA9IDAsIGVuZCA9IGNoaWxkcmVuLmxlbmd0aCAtIDEsIGJlZm9yZU5vZGUpIHtcclxuICB3aGlsZShzdGFydCA8PSBlbmQpIHtcclxuICAgIHZhciBjaCA9IGNoaWxkcmVuW3N0YXJ0KytdXHJcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU5vZGUoY2gpLCBiZWZvcmVOb2RlKVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZUNoaWxkcmVuKHBhcmVudCwgY2hpbGRyZW4sIHN0YXJ0ID0gMCwgZW5kID0gY2hpbGRyZW4ubGVuZ3RoIC0gMSkge1xyXG4gIC8qXHJcbiAgaWYoZW5kIC0gc3RhcnQgKyAxID09PSBjaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgIHBhcmVudC50ZXh0Q29udGVudCA9ICcnXHJcbiAgICB3aGlsZShwYXJlbnQuZmlyc3RDaGlsZCkgcGFyZW50LnJlbW92ZUNoaWxkKHBhcmVudC5maXJzdENoaWxkKVxyXG4gICAgcmV0dXJuXHJcbiAgfVxyXG4gICovXHJcbiAgd2hpbGUoc3RhcnQgPD0gZW5kKSB7XHJcbiAgICB2YXIgY2ggPSBjaGlsZHJlbltzdGFydCsrXVxyXG4gICAgaWYoaXNDb21wb25lbnQoY2gudHlwZSkpIHtcclxuICAgICAgY2gudHlwZS51bm1vdW50KGNoLl9ub2RlKVxyXG4gICAgfVxyXG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoLl9ub2RlKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0UHJvcHMoZWwsIHByb3BzLCBvbGRQcm9wcywgY3R4KSB7XHJcbiAgZm9yKHZhciBrZXkgaW4gcHJvcHMpIHtcclxuICAgIHZhciBvbGR2ID0gb2xkUHJvcHMgJiYgb2xkUHJvcHNba2V5XVxyXG4gICAgdmFyIG5ld3YgPSBwcm9wc1trZXldXHJcbiAgICBpZihvbGR2ICE9PSBuZXd2KSB7XHJcbiAgICAgIGVsW2tleV0gPSAoXHJcbiAgICAgICAgdHlwZW9mIG5ld3YgPT09ICdmdW5jdGlvbicgJiYgY3R4ICE9PSB1bmRlZmluZWRcclxuICAgICAgICAgID8gbmV3di5iaW5kKGN0eClcclxuICAgICAgICAgIDogbmV3dlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2gobmV3Y2gsIG9sZGNoLCBwYXJlbnQpIHtcclxuICB2YXIgY2hpbGROb2RlID0gb2xkY2guX25vZGVcclxuXHJcbiAgaWYob2xkY2ggPT09IG5ld2NoKSB7XHJcbiAgICByZXR1cm4gY2hpbGROb2RlXHJcbiAgfVxyXG5cclxuICB2YXIgdDEsIHQyXHJcbiAgaWYoKHQxID0gb2xkY2guX3RleHQpICE9IG51bGwgJiYgKHQyID0gbmV3Y2guX3RleHQpICE9IG51bGwpIHtcclxuICAgIGlmKHQxICE9PSB0Mikge1xyXG4gICAgICBjaGlsZE5vZGUubm9kZVZhbHVlID0gdDJcclxuICAgIH1cclxuICB9XHJcbiAgZWxzZSBpZihvbGRjaC50eXBlID09PSBuZXdjaC50eXBlKSB7XHJcbiAgICBjb25zdCB0eXBlID0gb2xkY2gudHlwZVxyXG4gICAgaWYoaXNDb21wb25lbnQodHlwZSkpIHtcclxuICAgICAgY2hpbGROb2RlID0gdHlwZS51cGRhdGUoY2hpbGROb2RlLCBuZXdjaC5wcm9wcywgbmV3Y2guY29udGVudClcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBzZXRQcm9wcyhjaGlsZE5vZGUsIG5ld2NoLnByb3BzLCBvbGRjaC5wcm9wcywgbmV3Y2guX2N0eClcclxuXHJcbiAgICAgIGlmKG9sZGNoLl90ZXh0Q2hpbGQgJiYgbmV3Y2guX3RleHRDaGlsZCkge1xyXG4gICAgICAgIGlmKG9sZGNoLmNvbnRlbnQgIT09IG5ld2NoLmNvbnRlbnQpIHtcclxuICAgICAgICAgIGNoaWxkTm9kZS5maXJzdENoaWxkLm5vZGVWYWx1ZSA9IG5ld2NoLmNvbnRlbnRcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZGlmZkNoaWxkcmVuKGNoaWxkTm9kZSwgbmV3Y2guY29udGVudCwgb2xkY2guY29udGVudClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNoaWxkTm9kZSA9IGNyZWF0ZU5vZGUobmV3Y2gpXHJcbiAgICBpZihwYXJlbnQpIHtcclxuICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZChjaGlsZE5vZGUsIG9sZGNoLl9ub2RlKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbmV3Y2guX25vZGUgPSBjaGlsZE5vZGVcclxuICBpZih0eXBlb2YgVkRPTV9ERUJVRyAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICBjaGlsZE5vZGUuY2xhc3NOYW1lID0gJ21hdGNoJ1xyXG4gIHJldHVybiBjaGlsZE5vZGVcclxufVxyXG5cclxuZnVuY3Rpb24gY2FuUGF0Y2godjEsIHYyKSB7XHJcbiAgcmV0dXJuIHYxLmtleSA9PT0gdjIua2V5XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGlmZkNoaWxkcmVuKFxyXG4gIHBhcmVudCxcclxuICBjaGlsZHJlbixcclxuICBvbGRDaGlsZHJlbixcclxuICBuZXdTdGFydCA9IDAsXHJcbiAgbmV3RW5kID0gY2hpbGRyZW4ubGVuZ3RoIC0gMSxcclxuICBvbGRTdGFydCA9IDAsXHJcbiAgb2xkRW5kID0gb2xkQ2hpbGRyZW4ubGVuZ3RoIC0gMVxyXG4gICkge1xyXG4gIHZhciBjaCwgb2xkQ2hcclxuXHJcbiAgLyoqXHJcbiAgICBCZWZvcmUgYXBwbHlpbmcgdGhlIGRpZmYgYWxnb3JpdGhtIHdlIHRyeSBzb21lIHByZXByb2Nlc3Npbmcgb3B0aW1pemF0aW9uc1xyXG4gICAgdG8gcmVkdWNlIHRoZSBjb3N0XHJcbiAgICBTZWUgaHR0cHM6Ly9uZWlsLmZyYXNlci5uYW1lL3dyaXRpbmcvZGlmZi8gZm9yIHRoZSBmdWxsIGRldGFpbHMuXHJcblxyXG4gICAgSW4gdGhlIGZvbGxvd2luZyA6IGluZGVsID0gSU5zZXJ0aW9uL0RFTGV0aW9uXHJcbiAgKiovXHJcblxyXG4gIC8vIGNvbW1vbiBwcmVmaXgvc3VmZml4XHJcblxyXG4gIHZhciBrID0gZGlmZkNvbW1vblByZWZpeChjaGlsZHJlbiwgb2xkQ2hpbGRyZW4sIG5ld1N0YXJ0LCBuZXdFbmQsIG9sZFN0YXJ0LCBvbGRFbmQsIGNhblBhdGNoKVxyXG4gIHdoaWxlKGstLSkge1xyXG4gICAgY2ggPSBjaGlsZHJlbltuZXdTdGFydCsrXVxyXG4gICAgb2xkQ2ggPSBvbGRDaGlsZHJlbltvbGRTdGFydCsrXVxyXG4gICAgcGF0Y2goY2gsIG9sZENoLCBwYXJlbnQpXHJcbiAgfVxyXG5cclxuICBrID0gZGlmZkNvbW1vblN1ZmZmaXgoY2hpbGRyZW4sIG9sZENoaWxkcmVuLCBuZXdTdGFydCwgbmV3RW5kLCBvbGRTdGFydCwgb2xkRW5kLCBjYW5QYXRjaClcclxuICB3aGlsZShrLS0pIHtcclxuICAgIGNoID0gY2hpbGRyZW5bbmV3RW5kLS1dXHJcbiAgICBvbGRDaCA9IG9sZENoaWxkcmVuW29sZEVuZC0tXVxyXG4gICAgcGF0Y2goY2gsIG9sZENoLCBwYXJlbnQpXHJcbiAgfVxyXG5cclxuICBpZihuZXdTdGFydCA+IG5ld0VuZCAmJiBvbGRTdGFydCA+IG9sZEVuZCkge1xyXG4gICAgcmV0dXJuXHJcbiAgfVxyXG5cclxuICAvLyBzaW1wbGUgaW5kZWw6IG9uZSBvZiB0aGUgMiBzZXF1ZW5jZXMgaXMgZW1wdHkgYWZ0ZXIgY29tbW9uIHByZWZpeC9zdWZmaXggcmVtb3ZhbFxyXG5cclxuICAvLyBvbGQgc2VxdWVuY2UgaXMgZW1wdHkgLT4gaW5zZXJ0aW9uXHJcbiAgaWYobmV3U3RhcnQgPD0gbmV3RW5kICYmIG9sZFN0YXJ0ID4gb2xkRW5kKSB7XHJcbiAgICBvbGRDaCA9IG9sZENoaWxkcmVuW29sZFN0YXJ0XVxyXG4gICAgYXBwZW5kQ2hpbGRyZW4ocGFyZW50LCBjaGlsZHJlbiwgbmV3U3RhcnQsIG5ld0VuZCwgb2xkQ2ggJiYgb2xkQ2guX25vZGUpXHJcbiAgICByZXR1cm5cclxuICB9XHJcblxyXG4gIC8vIG5ldyBzZXF1ZW5jZSBpcyBlbXB0eSAtPiBkZWxldGlvblxyXG4gIGlmKG9sZFN0YXJ0IDw9IG9sZEVuZCAmJiBuZXdTdGFydCA+IG5ld0VuZCkge1xyXG4gICAgcmVtb3ZlQ2hpbGRyZW4ocGFyZW50LCBvbGRDaGlsZHJlbiwgb2xkU3RhcnQsIG9sZEVuZClcclxuICAgIHJldHVyblxyXG4gIH1cclxuXHJcbiAgLy8gMiBzaW1wbGUgaW5kZWxzOiB0aGUgc2hvcnRlc3Qgc2VxdWVuY2UgaXMgYSBzdWJzZXF1ZW5jZSBvZiB0aGUgbG9uZ2VzdFxyXG4gIHZhciBvbGRSZW0gPSBvbGRFbmQgLSBvbGRTdGFydCArIDFcclxuICB2YXIgbmV3UmVtID0gbmV3RW5kIC0gbmV3U3RhcnQgKyAxXHJcbiAgayA9IC0xXHJcbiAgaWYob2xkUmVtIDwgbmV3UmVtKSB7XHJcbiAgICBrID0gaW5kZXhPZihjaGlsZHJlbiwgb2xkQ2hpbGRyZW4sIG5ld1N0YXJ0LCBuZXdFbmQsIG9sZFN0YXJ0LCBvbGRFbmQsIGNhblBhdGNoKVxyXG4gICAgaWYoayA+PSAwKSB7XHJcbiAgICAgIG9sZENoID0gb2xkQ2hpbGRyZW5bb2xkU3RhcnRdXHJcbiAgICAgIGFwcGVuZENoaWxkcmVuKHBhcmVudCwgY2hpbGRyZW4sIG5ld1N0YXJ0LCBrIC0gMSwgb2xkQ2guX25vZGUpXHJcbiAgICAgIHZhciB1cHBlckxpbWl0ID0gayArIG9sZFJlbVxyXG4gICAgICBuZXdTdGFydCA9IGtcclxuICAgICAgd2hpbGUobmV3U3RhcnQgPCB1cHBlckxpbWl0KSB7XHJcbiAgICAgICAgcGF0Y2goY2hpbGRyZW5bbmV3U3RhcnQrK10sIG9sZENoaWxkcmVuW29sZFN0YXJ0KytdKVxyXG4gICAgICB9XHJcbiAgICAgIG9sZENoID0gb2xkQ2hpbGRyZW5bb2xkRW5kXVxyXG4gICAgICBhcHBlbmRDaGlsZHJlbihwYXJlbnQsIGNoaWxkcmVuLCBuZXdTdGFydCwgbmV3RW5kLCBvbGRDaCAmJiBvbGRDaC5fbm9kZS5uZXh0U2libGluZylcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2UgaWYob2xkUmVtID4gbmV3UmVtKSB7XHJcbiAgICBrID0gaW5kZXhPZihvbGRDaGlsZHJlbiwgY2hpbGRyZW4sIG9sZFN0YXJ0LCBvbGRFbmQsIG5ld1N0YXJ0LCBuZXdFbmQsIGNhblBhdGNoKVxyXG4gICAgaWYoayA+PSAwKSB7XHJcbiAgICAgIHJlbW92ZUNoaWxkcmVuKHBhcmVudCwgb2xkQ2hpbGRyZW4sIG9sZFN0YXJ0LCBrIC0gMSlcclxuICAgICAgdXBwZXJMaW1pdCA9IGsgKyBuZXdSZW1cclxuICAgICAgb2xkU3RhcnQgPSBrXHJcbiAgICAgIHdoaWxlKG9sZFN0YXJ0IDwgdXBwZXJMaW1pdCkge1xyXG4gICAgICAgIHBhdGNoKGNoaWxkcmVuW25ld1N0YXJ0KytdLCBvbGRDaGlsZHJlbltvbGRTdGFydCsrXSlcclxuICAgICAgfVxyXG4gICAgICByZW1vdmVDaGlsZHJlbihwYXJlbnQsIG9sZENoaWxkcmVuLCBvbGRTdGFydCwgb2xkRW5kKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIGZhc3QgY2FzZTogZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSAyIHNlcXVlbmNlcyBpcyBvbmx5IG9uZSBpdGVtXHJcbiAgaWYob2xkU3RhcnQgPT09IG9sZEVuZCkge1xyXG4gICAgdmFyIG5vZGUgPSBvbGRDaGlsZHJlbltvbGRTdGFydF0uX25vZGVcclxuICAgIGFwcGVuZENoaWxkcmVuKHBhcmVudCwgY2hpbGRyZW4sIG5ld1N0YXJ0LCBuZXdFbmQsIG5vZGUpXHJcbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSlcclxuICAgIHJldHVyblxyXG4gIH1cclxuICBpZihuZXdTdGFydCA9PT0gbmV3RW5kKSB7XHJcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU5vZGUoY2hpbGRyZW5bbmV3U3RhcnRdKSwgb2xkQ2hpbGRyZW5bb2xkU3RhcnRdLl9ub2RlKVxyXG4gICAgcmVtb3ZlQ2hpbGRyZW4ocGFyZW50LCBvbGRDaGlsZHJlbiwgb2xkU3RhcnQsIG9sZEVuZClcclxuICAgIHJldHVyblxyXG4gIH1cclxuXHJcbiAgLypcclxuICAgIGxhc3QgcHJlb3B0XHJcbiAgICBpZiB3ZSBjYW4gZmluZCBhIHN1YnNlcXVlbmNlIHRoYXQncyBhdCBsZWFzdCBoYWxmIHRoZSBsb25nZXN0IHNlcXVlbmNlIHRoZSBpdCdzIGd1YXJhbnRlZWQgdG9cclxuICAgIGJlIHRoZSBsb25nZXN0IGNvbW1vbiBzdWJzZXF1ZW5jZS4gVGhpcyBhbGxvd3MgdXMgdG8gZmluZCB0aGUgbGNzIHVzaW5nIGEgc2ltcGxlIE8oTikgYWxnb3JpdGhtXHJcbiAgKi9cclxuICB2YXIgaG1cclxuICB2YXIgb2xkU2hvcnRlciA9IG9sZFJlbSA8IG5ld1JlbVxyXG4gIGlmKG9sZFNob3J0ZXIpIHtcclxuICAgIGhtID0gZGlmZkhhbGZNYXRjaChjaGlsZHJlbiwgb2xkQ2hpbGRyZW4sIG5ld1N0YXJ0LCBuZXdFbmQsIG9sZFN0YXJ0LCBvbGRFbmQsIGNhblBhdGNoKVxyXG4gIH0gZWxzZSB7XHJcbiAgICBobSA9IGRpZmZIYWxmTWF0Y2gob2xkQ2hpbGRyZW4sIGNoaWxkcmVuLCBvbGRTdGFydCwgb2xkRW5kLCBuZXdTdGFydCwgbmV3RW5kLCBjYW5QYXRjaClcclxuICB9XHJcbiAgaWYoaG0pIHtcclxuICAgIHZhciBuZXdTdGFydEhtID0gb2xkU2hvcnRlciA/IGhtLnN0YXJ0MSA6IGhtLnN0YXJ0MlxyXG4gICAgdmFyIG5ld0VuZEhtID0gbmV3U3RhcnRIbSArIGhtLmxlbmd0aCAtIDFcclxuICAgIHZhciBvbGRTdGFydEhtID0gb2xkU2hvcnRlciA/IGhtLnN0YXJ0MiA6IGhtLnN0YXJ0MVxyXG4gICAgdmFyIG9sZEVuZEhtID0gb2xkU3RhcnRIbSArIGhtLmxlbmd0aCAtIDFcclxuICAgIGZvcih2YXIgaSA9IG5ld1N0YXJ0SG0sIGogPSBvbGRTdGFydEhtOyBpIDw9IG5ld0VuZEhtOyBpKyssIGorKykge1xyXG4gICAgICBwYXRjaChjaGlsZHJlbltpXSwgb2xkQ2hpbGRyZW5bal0sIHBhcmVudClcclxuICAgIH1cclxuICAgIGRpZmZDaGlsZHJlbihwYXJlbnQsIGNoaWxkcmVuLCBvbGRDaGlsZHJlbiwgbmV3U3RhcnQsIG5ld1N0YXJ0SG0gLSAxLCBvbGRTdGFydCwgb2xkU3RhcnRIbSAtIDEpXHJcbiAgICBkaWZmQ2hpbGRyZW4ocGFyZW50LCBjaGlsZHJlbiwgb2xkQ2hpbGRyZW4sIG5ld0VuZEhtICsgMSwgbmV3RW5kLCBvbGRFbmRIbSAgKyAxLCBvbGRFbmQpXHJcbiAgICByZXR1cm5cclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICBSdW4gdGhlIGRpZmYgYWxnb3JpdGhtXHJcbiAgICBGaXJzdCB0cnkgdGhlIE8oTkQpIGFsZ29yaXRobS4gSWYgTyhORCkgY29zdCBpcyBoaWdoIChUb28gbWF0Y2ggZGlmZnMgYmV0d2VlbiB0aGUgMiBzZXFzKVxyXG4gICAgdGhlbiBmYWxsYmFjayB0byBNYXAgbG9va3VwIGJhc2VkIGFsZ29yaXRobVxyXG4gICovXHJcbiAgaWYoIWhtKSB7XHJcbiAgICB2YXIgZmFpbGVkID0gZGlmZk9ORChwYXJlbnQsIGNoaWxkcmVuLCBvbGRDaGlsZHJlbiwgbmV3U3RhcnQsIG5ld0VuZCwgb2xkU3RhcnQsIG9sZEVuZClcclxuICAgIGlmKGZhaWxlZClcclxuICAgICAgZGlmZldpdGhNYXAocGFyZW50LCBjaGlsZHJlbiwgb2xkQ2hpbGRyZW4sIG5ld1N0YXJ0LCBuZXdFbmQsIG9sZFN0YXJ0LCBvbGRFbmQpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaWZmQ29tbW9uUHJlZml4KHMxLCBzMiwgc3RhcnQxLCBlbmQxLCBzdGFydDIsIGVuZDIsIGVxKSB7XHJcbiAgdmFyIGsgPSAwXHJcbiAgd2hpbGUoc3RhcnQxIDw9IGVuZDEgJiYgc3RhcnQyIDw9IGVuZDIgJiYgZXEoczFbc3RhcnQxXSwgczJbc3RhcnQyXSkpIHtcclxuICAgIHN0YXJ0MSsrOyBzdGFydDIrKzsgaysrXHJcbiAgfVxyXG4gIHJldHVybiBrXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpZmZDb21tb25TdWZmZml4KHMxLCBzMiwgc3RhcnQxLCBlbmQxLCBzdGFydDIsIGVuZDIsIGVxKSB7XHJcbiAgdmFyIGsgPSAwXHJcbiAgd2hpbGUoc3RhcnQxIDw9IGVuZDEgJiYgc3RhcnQyIDw9IGVuZDIgJiYgZXEoczFbZW5kMV0sIHMyW2VuZDJdKSkge1xyXG4gICAgZW5kMS0tOyBlbmQyLS07IGsrK1xyXG4gIH1cclxuICByZXR1cm4ga1xyXG59XHJcblxyXG5mdW5jdGlvbiBkaWZmSGFsZk1hdGNoKHMxLCBzMiwgc3RhcnQxLCBlbmQxLCBzdGFydDIsIGVuZDIsIGVxKSB7XHJcbiAgdmFyIGxlbjEgPSBlbmQxIC0gc3RhcnQxICsgMVxyXG4gIHZhciBsZW4yID0gZW5kMiAtIHN0YXJ0MiArIDFcclxuXHJcbiAgaWYgKGxlbjEgPCAyIHx8IGxlbjIgPCAxKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHZhciBobTEgPSBoYWxmTWF0Y2hJbnQoc3RhcnQxICsgTWF0aC5jZWlsKGxlbjEvNCkpXHJcbiAgdmFyIGhtMiA9IGhhbGZNYXRjaEludChzdGFydDEgKyBNYXRoLmNlaWwobGVuMS8yKSlcclxuICByZXR1cm4gKFxyXG4gICAgICAhaG0xICYmICFobTIgPyBudWxsXHJcbiAgICA6ICFobTEgPyBobTJcclxuICAgIDogIWhtMiA/IGhtMVxyXG4gICAgOiBobTEubGVuZ3RoID4gaG0yLmxlbmd0aCA/IGhtMSA6IGhtMlxyXG4gIClcclxuXHJcbiAgZnVuY3Rpb24gaGFsZk1hdGNoSW50KHNlZWRTdGFydCkge1xyXG4gICAgdmFyIHNlZWRFbmQgPSBzZWVkU3RhcnQgKyBNYXRoLmZsb29yKGxlbjEvNClcclxuICAgIHZhciBqID0gc3RhcnQyIC0gMVxyXG4gICAgdmFyIGJlc3RDUyA9IHtsZW5ndGg6IDB9XHJcbiAgICB3aGlsZShqIDwgZW5kMiAmJiAoaiA9IGluZGV4T2YoczIsIHMxLCBqICsgMSwgZW5kMiwgc2VlZFN0YXJ0LCBzZWVkRW5kLCBlcSkpICE9PSAtMSkge1xyXG4gICAgICB2YXIgcHJlZml4TGVuID0gZGlmZkNvbW1vblByZWZpeChzMSwgczIsIHNlZWRTdGFydCwgZW5kMSwgaiwgZW5kMiwgZXEpXHJcbiAgICAgIHZhciBzdWZmaXhMZW4gPSBkaWZmQ29tbW9uU3VmZmZpeChzMSwgczIsIHN0YXJ0MSwgc2VlZFN0YXJ0IC0gMSwgc3RhcnQyLCBqIC0gMSwgZXEpXHJcbiAgICAgIGlmKGJlc3RDUy5sZW5ndGggPCBwcmVmaXhMZW4gKyBzdWZmaXhMZW4pIHtcclxuICAgICAgICBiZXN0Q1Muc3RhcnQxID0gc2VlZFN0YXJ0IC0gc3VmZml4TGVuXHJcbiAgICAgICAgYmVzdENTLnN0YXJ0MiA9IGogLSBzdWZmaXhMZW5cclxuICAgICAgICBiZXN0Q1MubGVuZ3RoID0gcHJlZml4TGVuICsgc3VmZml4TGVuXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBiZXN0Q1MubGVuZ3RoID49IGxlbjEvMiA/IGJlc3RDUyA6IG51bGxcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gIEZpbmQgdGhlIHNob3J0ZXN0IGVkaXQgc2NyaXB0IGJldHdlZW4gdGhlIG9sZCBhbmQgbmV3IHNlcXVlbmNlc1xyXG4gIFRoaXMgaXMgZXF1aXZhbGVudCB0byBmaW5kaW5nIHRoZSBzaG9ydGVzdCBwYXRoIGluIHRoZSBlZGl0IGdyYXBoIG9mIHRoZSAyIHNlcXVlbmNlc1xyXG4gIHNlZSBcIkFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBJdHMgVmFyaWF0aW9uc1wiIGF0XHJcbiAgaHR0cDovL2NpdGVzZWVyeC5pc3QucHN1LmVkdS92aWV3ZG9jL2Rvd25sb2FkP2RvaT0xMC4xLjEuNC42OTI3JnJlcD1yZXAxJnR5cGU9cGRmXHJcbioqL1xyXG5mdW5jdGlvbiBkaWZmT05EKHBhcmVudCwgY2hpbGRyZW4sIG9sZENoaWxkcmVuLCBuZXdTdGFydD0wLCBuZXdFbmQ9Y2hpbGRyZW4ubGVuZ3RoLTEsIG9sZFN0YXJ0PTAsIG9sZEVuZD1vbGRDaGlsZHJlbi5sZW5ndGgtMSkge1xyXG4gIHZhciByb3dzID0gbmV3RW5kIC0gbmV3U3RhcnQgKyAxXHJcbiAgdmFyIGNvbHMgPSBvbGRFbmQgLSBvbGRTdGFydCArIDFcclxuICB2YXIgZG1heCA9IHJvd3MgKyBjb2xzXHJcblxyXG4gIHZhciB2ID0gW11cclxuICB2YXIgZCwgaywgciwgYywgcHYsY3YsIHBkXHJcbiAgb3V0ZXI6IGZvcihkID0gMDsgZCA8PSBkbWF4OyBkKyspIHtcclxuICAgIGlmKGQgPiA1MCkgcmV0dXJuIHRydWVcclxuICAgIHBkID0gZCAtIDFcclxuICAgIHB2ID0gZCA/IHZbZC0xXSA6IFswLDBdXHJcbiAgICBjdiA9IHZbZF0gPSBbXVxyXG4gICAgZm9yKGsgPSAtZDsgayA8PSBkOyBrICs9IDIpIHtcclxuICAgICAgaWYoayA9PT0gLWQgfHwgKGsgIT09IGQgJiYgcHZbcGQray0xXSA8IHB2W3BkK2srMV0pKSB7XHJcbiAgICAgICAgYyA9IHB2W3BkK2srMV1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjID0gcHZbcGQray0xXSsxXHJcbiAgICAgIH1cclxuICAgICAgciA9IGMgLSBrXHJcbiAgICAgIHdoaWxlKGMgPCBjb2xzICYmIHIgPCByb3dzICYmIGNhblBhdGNoKG9sZENoaWxkcmVuW29sZFN0YXJ0K2NdLCBjaGlsZHJlbltuZXdTdGFydCtyXSkpIHtcclxuICAgICAgICBjKytcclxuICAgICAgICByKytcclxuICAgICAgfVxyXG4gICAgICBpZihjID09PSBjb2xzICYmIHIgPT09IHJvd3MpIHtcclxuICAgICAgICBicmVhayBvdXRlclxyXG4gICAgICB9XHJcbiAgICAgIGN2W2Qra10gPSBjXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgZGVsID0gW10sIGlucyA9IFtdLCBvbGRLZXlNYXAgPSB7fVxyXG4gIHZhciBjaCwgb2xkQ2hcclxuXHJcbiAgZm9yKGQgPSB2Lmxlbmd0aCAtIDE7IGQgPj0gMDsgZC0tKSB7XHJcbiAgICB3aGlsZShjID4gMCAmJiByID4gMCAmJiBjYW5QYXRjaChvbGRDaCA9IG9sZENoaWxkcmVuW29sZFN0YXJ0K2MtMV0sIGNoID0gY2hpbGRyZW5bbmV3U3RhcnQrci0xXSkpIHtcclxuICAgICAgLy8gZGlhZ29uYWwgZWRnZSA9IGVxdWFsaXR5XHJcbiAgICAgIHBhdGNoKGNoLCBvbGRDaCwgcGFyZW50KVxyXG4gICAgICBjLS1cclxuICAgICAgci0tXHJcblxyXG4gICAgfVxyXG4gICAgaWYoIWQpIGJyZWFrXHJcbiAgICBwZCA9IGQgLSAxXHJcbiAgICBwdiA9IGQgPyB2W2QtMV0gOiBbMCwwXVxyXG4gICAgayA9IGMgLSByXHJcbiAgICBpZihrID09PSAtZCB8fCAoayAhPT0gZCAmJiBwdltwZCtrLTFdIDwgcHZbcGQraysxXSkpIHtcclxuICAgICAgLy8gdmVydGljYWwgZWRnZSA9IGluc2VydGlvblxyXG4gICAgICByLS1cclxuICAgICAgaW5zLnB1c2goW25ld1N0YXJ0K3IsIG9sZFN0YXJ0K2NdKVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGhvcml6b250YWwgZWRnZSA9IGRlbGV0aW9uXHJcbiAgICAgIGMtLVxyXG4gICAgICBkZWwucHVzaChvbGRTdGFydCtjKVxyXG4gICAgICBvbGRDaCA9IG9sZENoaWxkcmVuW29sZFN0YXJ0K2NdXHJcbiAgICAgIGlmKG9sZENoLmtleSkge1xyXG4gICAgICAgIG9sZEtleU1hcFtvbGRDaC5rZXldID0gb2xkU3RhcnQrY1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgbm9kZSwgY2hJZHgsIG9sZENoSWR4LCBvbGRNYXRjaElkeFxyXG4gIHZhciBvbGRNb3ZlZCA9IFtdXHJcbiAgZm9yKHZhciBpID0gaW5zLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xyXG4gICAgW2NoSWR4LCBvbGRDaElkeF0gPSBpbnNbaV1cclxuICAgIGNoID0gY2hpbGRyZW5bY2hJZHhdXHJcbiAgICBvbGRNYXRjaElkeCA9IG9sZEtleU1hcFtjaC5rZXldXHJcbiAgICBpZihvbGRNYXRjaElkeCAhPSBudWxsKSB7XHJcbiAgICAgIG9sZENoID0gb2xkQ2hpbGRyZW5bb2xkTWF0Y2hJZHhdXHJcbiAgICAgIG5vZGUgPSBwYXRjaChjaCwgb2xkQ2gpXHJcbiAgICAgIGlmKG9sZENoLl9ub2RlID09PSBub2RlKSB7XHJcbiAgICAgICAgb2xkTW92ZWQucHVzaChvbGRNYXRjaElkeClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIG5vZGUgPSBjcmVhdGVOb2RlKGNoKVxyXG4gICAgfVxyXG4gICAgb2xkQ2ggPSBvbGRDaGlsZHJlbltvbGRDaElkeF1cclxuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgb2xkQ2ggPyBvbGRDaC5fbm9kZSA6IG51bGwpXHJcbiAgfVxyXG5cclxuICBmb3IoaSA9IDA7IGkgPCBvbGRNb3ZlZC5sZW5ndGg7IGkrKykge1xyXG4gICAgb2xkQ2hpbGRyZW5bb2xkTW92ZWRbaV1dID0gdW5kZWZpbmVkXHJcbiAgfVxyXG5cclxuICBmb3IoaSA9IDA7IGkgPCBkZWwubGVuZ3RoOyBpKyspIHtcclxuICAgIG9sZENoID0gb2xkQ2hpbGRyZW5bZGVsW2ldXVxyXG4gICAgaWYob2xkQ2ggIT0gbnVsbCkge1xyXG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQob2xkQ2guX25vZGUpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaWZmV2l0aE1hcChwYXJlbnQsIGNoaWxkcmVuLCBvbGRDaGlsZHJlbiwgbmV3U3RhcnQsIG5ld0VuZCwgb2xkU3RhcnQsIG9sZEVuZCkge1xyXG4gIHZhciBrZXltYXAgPSB7fSwgb2xkQ2gsIG5vZGUsIGlkeEluT2xkLCBrZXlcclxuICBmb3IodmFyIGkgPSBvbGRTdGFydDsgaSA8PSBvbGRFbmQ7IGkrKykge1xyXG4gICAgb2xkQ2ggPSBvbGRDaGlsZHJlbltpXVxyXG4gICAga2V5ID0gb2xkQ2gua2V5XHJcbiAgICBpZihrZXkgIT0gbnVsbCkge1xyXG4gICAgICBrZXltYXBba2V5XSA9IGlcclxuICAgIH1cclxuICB9XHJcbiAgdmFyIG9sZFN0YXJ0Q2gsIG5ld1N0YXJ0Q2hcclxuICB3aGlsZSAob2xkU3RhcnQgPD0gb2xkRW5kICYmIG5ld1N0YXJ0IDw9IG5ld0VuZCkge1xyXG4gICAgb2xkU3RhcnRDaCA9IG9sZENoaWxkcmVuW29sZFN0YXJ0XVxyXG4gICAgbmV3U3RhcnRDaCA9IGNoaWxkcmVuW25ld1N0YXJ0XVxyXG4gICAgaWR4SW5PbGQgPSBrZXltYXBbbmV3U3RhcnRDaC5rZXldO1xyXG4gICAgaWYoaWR4SW5PbGQgPT0gbnVsbCkge1xyXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU5vZGUobmV3U3RhcnRDaCksIG9sZFN0YXJ0Q2guX25vZGUpO1xyXG4gICAgICBuZXdTdGFydENoID0gY2hpbGRyZW5bKytuZXdTdGFydF07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvbGRDaCA9IG9sZENoaWxkcmVuW2lkeEluT2xkXTtcclxuICAgICAgbm9kZSA9IHBhdGNoKG5ld1N0YXJ0Q2gsIG9sZENoKTtcclxuICAgICAgb2xkQ2hbaWR4SW5PbGRdID0gdW5kZWZpbmVkO1xyXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIG9sZFN0YXJ0Q2guX25vZGUpO1xyXG4gICAgICBuZXdTdGFydENoID0gY2hpbGRyZW5bKytuZXdTdGFydF07XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChvbGRTdGFydCA+IG9sZEVuZCkge1xyXG4gICAgdmFyIGJlZm9yZSA9IGNoaWxkcmVuW25ld0VuZCsxXSA9PSBudWxsID8gbnVsbCA6IGNoaWxkcmVuW25ld0VuZCsxXS5fbm9kZTtcclxuICAgIGFwcGVuZENoaWxkcmVuKHBhcmVudCwgY2hpbGRyZW4sIG5ld1N0YXJ0LCBuZXdFbmQsIGJlZm9yZSk7XHJcbiAgfSBlbHNlIGlmIChuZXdTdGFydCA+IG5ld0VuZCkge1xyXG4gICAgcmVtb3ZlQ2hpbGRyZW4ocGFyZW50LCBvbGRDaGlsZHJlbiwgb2xkU3RhcnQsIG9sZEVuZCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpbmRleE9mKGEsIHN1YmEsIGFTdGFydCwgYUVuZCwgc3ViYVN0YXJ0LCBzdWJhRW5kLCBlcSkge1xyXG4gIHZhciBqID0gc3ViYVN0YXJ0LCBrID0gLTFcclxuICB2YXIgc3ViYUxlbiA9IHN1YmFFbmQgLSBzdWJhU3RhcnQgKyAxXHJcbiAgd2hpbGUoYVN0YXJ0IDw9IGFFbmQgJiYgKGFFbmQgLSBhU3RhcnQgKyAxKSA+PSBzdWJhTGVuKSB7XHJcbiAgICBpZihlcShhW2FTdGFydF0sIHN1YmFbal0pKSB7XHJcbiAgICAgIGlmKGsgPCAwKSBrID0gYVN0YXJ0XHJcbiAgICAgIGorK1xyXG4gICAgICBpZihqID4gc3ViYUVuZClcclxuICAgICAgICByZXR1cm4ga1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgayA9IC0xXHJcbiAgICAgIGogPSBzdWJhU3RhcnRcclxuICAgIH1cclxuICAgIGFTdGFydCsrXHJcbiAgfVxyXG4gIHJldHVybiAtMVxyXG59XHJcbiIsIlxyXG5pbXBvcnQgeyBoLCBjcmVhdGVOb2RlLCBwYXRjaCB9IGZyb20gJy4uLy4uLy4uL3NyYy9pbmRleCdcclxuXHJcbnZhciB2ZWwgPSA8ZGl2PjwvZGl2PlxyXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNyZWF0ZU5vZGUodmVsKSlcclxuXHJcbnZhciB2YWx1ZSA9ICdBQkNEJ1xyXG5cclxuZnVuY3Rpb24gdXBkYXRlKCkge1xyXG4gIHZhciB2ZWwyID0gKFxyXG4gICAgPGRpdj5cclxuICAgICAgPGlucHV0IHZhbHVlPXt2YWx1ZX0gb25pbnB1dD17ZSA9PiB2YWx1ZSA9IGUudGFyZ2V0LnZhbHVlfSAvPlxyXG4gICAgICA8YnV0dG9uIG9uY2xpY2s9e3VwZGF0ZX0+J1BhdGNoITwvYnV0dG9uPlxyXG4gICAgICA8aHIvPlxyXG4gICAgICB7dmFsdWUuc3BsaXQoJycpLm1hcChpdCA9PlxyXG4gICAgICAgIDxzcGFuXHJcbiAgICAgICAgICBrZXk9e2l0fVxyXG4gICAgICAgICAgc3R5bGU9J2JvcmRlcjogMXB4IGRvdHRlZDsgbWFyZ2luLXJpZ2h0OiAycHg7IHBhZGRpbmc6IDJweCdcclxuICAgICAgICA+XHJcbiAgICAgICAgICB7aXR9XHJcbiAgICAgICAgPC9zcGFuPlxyXG4gICAgICApfVxyXG4gICAgPC9kaXY+XHJcbiAgKVxyXG4gIHBhdGNoKHZlbDIsIHZlbClcclxuICB2ZWwgPSB2ZWwyXHJcbn1cclxuXHJcbnVwZGF0ZSgnQUJDRCcpXHJcbiJdLCJuYW1lcyI6WyJFTVBUWU8iLCJFTVBUWUFSIiwiaXNBcnJheSIsIkFycmF5IiwiaXNQcmltaXRpdmUiLCJjIiwidHlwZSIsImlzQ2hpbGQiLCJfdm5vZGUiLCJoIiwicHJvcHMiLCJfdGV4dENoaWxkIiwic3RhcnRDaElkeCIsImZpcnN0Q2giLCJsZW4iLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJrZXkiLCJmbGF0dGVuQ2hpbGRyZW4iLCJjaGlsZHJlbiIsInN0YXJ0IiwiYXJyIiwiaSIsImNoIiwiYXBwZW5kTm9ybWFsaXplZCIsInB1c2giLCJfdGV4dCIsImlzQ29tcG9uZW50IiwibW91bnQiLCJ1cGRhdGUiLCJ1bm1vdW50IiwiY3JlYXRlTm9kZSIsIm5vZGUiLCJkb2N1bWVudCIsImNyZWF0ZVRleHROb2RlIiwiY3JlYXRlRWxlbWVudCIsInVuZGVmaW5lZCIsIl9jdHgiLCJhcHBlbmRDaGlsZCIsImNvbnRlbnQiLCJFcnJvciIsIl9ub2RlIiwiYXBwZW5kQ2hpbGRyZW4iLCJwYXJlbnQiLCJlbmQiLCJiZWZvcmVOb2RlIiwiaW5zZXJ0QmVmb3JlIiwicmVtb3ZlQ2hpbGRyZW4iLCJyZW1vdmVDaGlsZCIsInNldFByb3BzIiwiZWwiLCJvbGRQcm9wcyIsImN0eCIsIm9sZHYiLCJuZXd2IiwiYmluZCIsInBhdGNoIiwibmV3Y2giLCJvbGRjaCIsImNoaWxkTm9kZSIsInQxIiwidDIiLCJub2RlVmFsdWUiLCJmaXJzdENoaWxkIiwicmVwbGFjZUNoaWxkIiwiVkRPTV9ERUJVRyIsImNsYXNzTmFtZSIsImNhblBhdGNoIiwidjEiLCJ2MiIsImRpZmZDaGlsZHJlbiIsIm9sZENoaWxkcmVuIiwibmV3U3RhcnQiLCJuZXdFbmQiLCJvbGRTdGFydCIsIm9sZEVuZCIsIm9sZENoIiwiayIsImRpZmZDb21tb25QcmVmaXgiLCJkaWZmQ29tbW9uU3VmZmZpeCIsIm9sZFJlbSIsIm5ld1JlbSIsImluZGV4T2YiLCJ1cHBlckxpbWl0IiwibmV4dFNpYmxpbmciLCJobSIsIm9sZFNob3J0ZXIiLCJkaWZmSGFsZk1hdGNoIiwibmV3U3RhcnRIbSIsInN0YXJ0MSIsInN0YXJ0MiIsIm5ld0VuZEhtIiwib2xkU3RhcnRIbSIsIm9sZEVuZEhtIiwiaiIsImZhaWxlZCIsImRpZmZPTkQiLCJkaWZmV2l0aE1hcCIsInMxIiwiczIiLCJlbmQxIiwiZW5kMiIsImVxIiwibGVuMSIsImxlbjIiLCJobTEiLCJoYWxmTWF0Y2hJbnQiLCJNYXRoIiwiY2VpbCIsImhtMiIsInNlZWRTdGFydCIsInNlZWRFbmQiLCJmbG9vciIsImJlc3RDUyIsInByZWZpeExlbiIsInN1ZmZpeExlbiIsInJvd3MiLCJjb2xzIiwiZG1heCIsInYiLCJkIiwiciIsInB2IiwiY3YiLCJwZCIsIm91dGVyIiwiZGVsIiwiaW5zIiwib2xkS2V5TWFwIiwiY2hJZHgiLCJvbGRDaElkeCIsIm9sZE1hdGNoSWR4Iiwib2xkTW92ZWQiLCJrZXltYXAiLCJpZHhJbk9sZCIsIm9sZFN0YXJ0Q2giLCJuZXdTdGFydENoIiwiYmVmb3JlIiwiYSIsInN1YmEiLCJhU3RhcnQiLCJhRW5kIiwic3ViYVN0YXJ0Iiwic3ViYUVuZCIsInN1YmFMZW4iLCJ2ZWwiLCJib2R5IiwidmFsdWUiLCJ2ZWwyIiwiZSIsInRhcmdldCIsInNwbGl0IiwibWFwIiwiaXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLElBQUlBLFNBQVMsRUFBYjtBQUNBLElBQUlDLFVBQVUsRUFBZDtBQUNBLElBQUlDLFVBQVVDLE1BQU1ELE9BQXBCOztBQUVBLFNBQVNFLFdBQVQsQ0FBcUJDLENBQXJC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
