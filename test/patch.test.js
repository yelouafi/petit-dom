import test from "tape";
import { Fragment } from "../src/h.js";
import { h, render } from "../src/index.js";

//  Fisher-Yates Shuffle
// code from https://stackoverflow.com/a/6274398/1430627
function shuffle(array) {
  let counter = array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

test("text node", (assert) => {
  const root = document.createElement("div");

  render("old text", root);
  const node1 = root.firstChild;

  render("new text", root);
  const node2 = root.firstChild;

  assert.equal(node1, node2);
  assert.equal(node2.nodeValue, "new text");

  assert.end();
});

test("patch node with different types", (assert) => {
  const root = document.createElement("div");

  const vnode1 = "old text";
  render(vnode1, root);
  const node1 = root.firstChild;

  // see issue #31: Null doesn't remove previous node
  render(null, root);
  const node2 = root.firstChild;

  assert.notEqual(node1, node2);
  assert.equal(node2.nodeType, 8 /* comment node type*/);

  render(h("span"), root);
  const node3 = root.firstChild;

  assert.notEqual(node2, node3);
  assert.equal(node3.tagName, "SPAN");

  render(h("div"), root);
  const node4 = root.firstChild;

  assert.notEqual(node3, node4);
  assert.equal(node4.tagName, "DIV");

  assert.end();
});

test("patch props", (assert) => {
  const root = document.createElement("div");

  render(
    h("input", {
      type: "text",
      value: "old value",
      style: "color: red",
    }),
    root
  );
  const node = root.firstChild;

  render(
    h("input", {
      type: "text",
      value: "new value",
      style: "color: green; border: 1px solid black",
    }),
    root
  );
  const node2 = root.firstChild;

  assert.equal(node2, node);
  assert.equal(node.type, "text");
  assert.equal(node.value, "new value");
  assert.equal(node.style.color, "green");
  assert.equal(node.style.border, "1px solid black");

  assert.end();
});

test("patch attributes (svg)", (assert) => {
  const root = document.createElement("div");

  render(
    h(
      "div",
      null,
      h("span", null, "..."),
      h("svg", null, h("circle", { cx: 50, cy: 60, r: 30 })),
      h("span", null, "...")
    ),
    root
  );
  const node = root.firstChild;

  let svgCircle = node.childNodes[1].firstChild;
  assert.equal(svgCircle.getAttribute("cx"), "50");
  assert.equal(svgCircle.getAttribute("cy"), "60");
  assert.equal(svgCircle.getAttribute("r"), "30");

  const onclick = () => {};
  render(
    h(
      "div",
      null,
      h("span", null, "..."),
      h(
        "svg",
        null,
        h("circle", { cx: 50, cy: 40, stroke: "green", fill: "yellow" })
      ),
      h("span", { onclick }, "...")
    ),
    root
  );

  assert.equal(svgCircle.getAttribute("cx"), "50");
  assert.equal(svgCircle.getAttribute("cy"), "40");
  assert.equal(svgCircle.getAttribute("stroke"), "green");
  assert.equal(svgCircle.getAttribute("fill"), "yellow");
  assert.equal(svgCircle.hasAttribute("r"), false);

  const span = node.childNodes[2];
  assert.equal(
    span.onclick,
    onclick,
    "should patch props instead of attributes once svg context is off"
  );

  assert.end();
});

test("patch non keyed children", (assert) => {
  const root = document.createElement("div");
  const view = (s) => h("div", null, s.split(""));

  let node;
  render(h("div", null, "1"), root);
  node = root.firstChild;

  function testPatch(seq, message) {
    assert.test(message, (assert) => {
      render(view(seq), root);
      assert.plan(seq.length * 2 + 1);

      assert.equal(
        node.childNodes.length,
        seq.length,
        "should have same number of children"
      );
      for (var i = 0; i < seq.length; i++) {
        const text = seq[i];
        const childNode = node.childNodes[i];

        assert.equal(
          childNode.nodeName,
          "#text",
          "child should be a text node"
        );
        assert.equal(childNode.nodeValue, text, "should patch text content");
      }
    });
  }

  testPatch("36", "append to an empty sequence");
  testPatch("3678", "append");
  testPatch("123678", "prepend");
  testPatch("12345678", "insert in the middle");
  testPatch("A0123456789B", "append + prepend");
  testPatch("12345678", "remove from edges");
  testPatch("123678", "remove from middle");
  testPatch("2x3y67z8", "multiple modificationq");
  testPatch(shuffle("2x3y67z8".split("")).join(""), "shuffle");
  testPatch("ABCDEF", "replace all");

  render(view(""), root);
  assert.equal(node.childNodes.length, 1, "should contain one empty node");
  assert.equal(node.firstChild.nodeType, 8, "empty child should be a comment");

  assert.end();
});

test("patch keyed children", (assert) => {
  const root = document.createElement("div");
  const view = (str) =>
    h(
      "div",
      null,
      str.split("").map((c) => h("span", { key: c }, c))
    );

  render(h("div"), root);

  let node = root.firstChild,
    prevChildNodes = Array.from(node.childNodes),
    prevSeq = "";

  function testPatch(seq, message) {
    assert.test(message, (assert) => {
      render(view(seq), root);
      let childNodes = Array.from(node.childNodes);

      assert.plan(seq.length * 2 + 1);
      assert.equal(childNodes.length, seq.length);

      for (var i = 0; i < seq.length; i++) {
        const text = seq[i];

        const index = prevSeq.indexOf(text);
        if (index >= 0) {
          assert.equal(
            prevChildNodes[index],
            childNodes[i],
            "should preserve DOM node for " + text
          );
        } else {
          assert.ok(true, "new node " + text);
        }
        assert.equal(
          childNodes[i].firstChild.nodeValue,
          text,
          "should patch text content"
        );
      }
      prevSeq = seq;
      prevChildNodes = childNodes;
      //assert.end();
    });
  }

  testPatch("36", "append to an empty sequence");
  testPatch("3678", "append");
  testPatch("7836", "reorder");
  testPatch("3678", "reorde(2)");
  testPatch("123678", "prepend");
  testPatch("12345678", "insert in the middle");
  testPatch("A0123456789B", "append + prepend");
  testPatch("12345678", "remove from edges");
  testPatch("123678", "remove from middle");
  testPatch("2x6y37z8", "multiple modifications");
  testPatch(shuffle("2x6y37z8".split("")).join(""), "shuffle");
  testPatch("ABCDEF", "replace all");

  render(view(""), root);
  assert.equal(node.childNodes.length, 1, "should contain one empty node");
  assert.equal(node.firstChild.nodeType, 8, "empty child should be a comment");

  assert.end();
});

test("patch fragemnts", (assert) => {
  const root = document.createElement("div");

  const seq = (str, num) => {
    return h(
      Fragment,
      { key: num },
      str.split("").map((s) => h("span", { key: s, class: `seq-${num}` }, s))
    );
  };

  const view = (str) => {
    return h("div", null, "first text", seq(str), seq(str), "last text");
  };

  const getChildNodes = (seq) => {
    const childNodes = Array.from(root.firstChild.childNodes);
    return [
      childNodes.slice(1, seq.length + 1),
      childNodes.slice(seq.length + 1, 2 * seq.length + 1),
    ];
  };

  render(h("div"), root);

  let prevChildNodes = getChildNodes("");
  let prevSeq = "";

  function matchSeq(seq, prevSeq, childNodes, prevChildNodes, message) {
    assert.test(message, (assert) => {
      assert.plan(seq.length * 2 + 1);

      assert.equal(childNodes.length, seq.length);

      for (var i = 0; i < seq.length; i++) {
        const text = seq[i];

        const index = prevSeq.indexOf(text);
        if (index >= 0) {
          assert.equal(
            prevChildNodes[index],
            childNodes[i],
            "should preserve DOM node for " + text
          );
        } else {
          assert.ok(true, "new node");
        }
        assert.equal(
          childNodes[i].firstChild.nodeValue,
          text,
          "should patch text content for " + text
        );
      }
    });
  }

  function testPatch(seq, message) {
    render(view(seq), root);
    let childNodes = getChildNodes(seq);
    matchSeq(
      seq,
      prevSeq,
      childNodes[0],
      prevChildNodes[0],
      `${message} - seq-1`
    );
    matchSeq(
      seq,
      prevSeq,
      childNodes[1],
      prevChildNodes[1],
      `${message} - seq-2`
    );
    prevChildNodes = childNodes;
    prevSeq = seq;
  }

  testPatch("36", "append to an empty sequence");
  testPatch("3678", "append");
  testPatch("7836", "reorder");
  testPatch("3678", "reorde(2)");
  testPatch("123678", "prepend");
  testPatch("12345678", "insert in the middle");
  testPatch("A0123456789B", "append + prepend");
  testPatch("12345678", "remove from edges");
  testPatch("123678", "remove from middle");
  testPatch("2x6y37z8", "multiple modifications");
  testPatch(shuffle("2x6y37z8".split("")).join(""), "shuffle");
  testPatch("ABCDEF", "replace all");

  assert.end();
});

test("patch render functions", (assert) => {
  // let renderCalls = 0;
  const root = document.createElement("div");

  function Box(props) {
    //renderCalls++;
    return h("h1", { title: props.title }, props.content);
  }

  render(h(Box, { title: "box title" }, "box content"), root);
  const node = root.firstChild; // renderCalls = 1

  render(h(Box, { title: "another box title" }, "another box content"), root);
  // renderCalls = 2
  assert.equal(node.title, "another box title");
  assert.equal(node.firstChild.nodeValue, "another box content");
  /*
  const vnode3 = h(Box, { title: "another box title" }, "another box content");
  patch(vnode3, vnode2); // // renderCalls = 2
  assert.equal(
    renderCalls,
    2,
    "patch should not invoke render function if props & content have not changed"
  );

  assert.equal(node.title, "another box title");
  assert.equal(node.firstChild.nodeValue, "another box content");
    */
  assert.end();
});
/*
test("Patch Component", assert => {
  let patchCalls = 0;

  const MyComponent = {
    mount: (props, content) => {
      var node = document.createElement("my-component");
      node._payload = [props, content];
      return node;
    },
    patch: (node, props, oldProps, content, oldContent) => {
      patchCalls++;
      node._payload = [props, content];
      assert.deepEqual(oldProps, vnode.props);
      assert.deepEqual(oldContent, vnode.content);
      return node;
    },
    unmount: () => {}
  };

  const vnode = h(
    MyComponent,
    { some_prop: "some prop" },
    { some_cont: "some content" }
  );

  const node = mount(vnode);
  assert.equal(vnode._node, node);
  assert.deepEqual(node._payload, [vnode.props, vnode.content]);

  const vnode2 = h(
    MyComponent,
    { some_prop: "another prop" },
    { some_cont: "another content" }
  );
  patch(vnode2, vnode);
  assert.equal(vnode2._node, node);
  assert.equal(patchCalls, 1, "patch should invoke Component.patch");
  assert.deepEqual(node._payload, [vnode2.props, vnode2.content]);

  assert.end();
});
*/

test("issues #24: applyDiff fails to insert when oldChildren is modified", (assert) => {
  const root = document.createElement("div");

  render(
    h("div", {}, [
      h("p", null, "p"),
      h("div", { key: "x" }, "div"),
      h("pre", null, "pre"),
      h("code", null, "code"),
    ]),
    root
  );
  //const node = root.firstChild

  render(
    h("div", {}, [
      h("pre", null, "pre"),
      h("code", null, "code"),
      h("div", { key: "x" }, "div"),
      h("p", null, "p"),
    ]),
    root
  );

  assert.pass("Doesn't blow up");
  assert.end();
});

test("issues #25: applyDiff fails with empty strings", (assert) => {
  const root = document.createElement("div");
  render(
    h("div", {}, [
      h("p", null, "p"),
      "",
      h("pre", null, "pre"),
      h("code", null, "code"),
    ]),
    root
  );
  //const node = root.firstChild

  render(
    h("div", {}, [
      h("pre", null, "pre"),
      h("code", null, "code"),
      "",
      h("p", null, "p"),
    ]),
    root
  );

  assert.pass("Doesn't blow up");
  assert.end();
});

test("issues #26: applyDiff fails with blank strings", (assert) => {
  const root = document.createElement("root");
  render(
    h("div", {}, [
      h("p", null, "p"),
      " ",
      h("pre", null, "pre"),
      h("code", null, "code"),
    ]),
    root
  );

  render(
    h("div", {}, [
      h("pre", null, "pre"),
      h("code", null, "code"),
      " ",
      h("p", null, "p"),
    ]),
    root
  );

  assert.pass("Doesn't blow up");
  assert.end();
});

test("issues #27: New DOM-tree is not synced with vdom-tree", (assert) => {
  const root = document.createElement("div");
  render(
    h("div", {}, [
      h("p", {}, [
        "Text",
        h("code", {}, ["Text"]),
        "Text",
        h("code", {}, ["Text"]),
        "Text",
      ]),
      h("div", {}, []),
    ]),
    root
  );

  const vnode = h("div", {}, [
    h("p", {}, [h("a", {}, ["Text"])]),
    "Text",
    h("p", {}, [h("a", {}, ["Text"])]),
    "Text",
    h("p", {}, ["Text", h("a", {}, ["Text"]), "Text"]),
    h("div", {}, []),
  ]);
  render(vnode, root);
  const node = root.firstChild;

  function checkSimlilarity(vdomNode, domnode) {
    if (domnode.nodeType === 3) {
      assert.equal(domnode.textContent, vdomNode, "Text should be the same");
      return;
    }
    if (vdomNode.content == null || vdomNode.content.length === 0) {
      assert.equal(domnode.textContent, "", "Dom content should be empty");
      return;
    }

    assert.equal(
      domnode.childNodes.length,
      vdomNode.content.length,
      "Children length should match"
    );
    assert.equal(
      domnode.tagName.toLowerCase(),
      vdomNode.type.toLowerCase(),
      "Tag names should match"
    );
    for (let i = 0; i < vdomNode.content.length; i++) {
      checkSimlilarity(vdomNode.content[i], domnode.childNodes[i]);
    }
  }

  checkSimlilarity(vnode, node);
  assert.end();
});
