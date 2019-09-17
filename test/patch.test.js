import test from "tape";
import { h, mount, patch } from "../src";

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

test("text node", assert => {
  const vnode = "old text";
  const node = mount(vnode);

  const vnode2 = "new text";
  const node2 = patch(vnode2, vnode, node);

  assert.equal(node, node2);
  assert.equal(node.nodeValue, "new text");

  assert.end();
});

test("patch node with different types", assert => {
  const vnode = "old text";
  const node = mount(vnode);

  const vnode2 = h("span");
  const node2 = patch(vnode2, vnode, node);

  assert.notEqual(node, node2);
  assert.equal(node2.tagName, "SPAN");

  const vnode3 = h("div");
  const node3 = patch(vnode3, vnode2, node2);

  assert.notEqual(node2, node3);
  assert.equal(node3.tagName, "DIV");

  assert.end();
});

test("patch props", assert => {
  const vnode = h("input", {
    type: "text",
    value: "old value",
    style: "color: red"
  });
  const node = mount(vnode);

  const vnode2 = h("input", {
    type: "text",
    value: "new value",
    style: "color: green; border: 1px solid black"
  });
  const node2 = patch(vnode2, vnode, node);

  assert.equal(node2, node);
  assert.equal(node.type, "text");
  assert.equal(node.value, "new value");
  assert.equal(node.style.color, "green");
  assert.equal(node.style.border, "1px solid black");

  assert.end();
});

test("patch attributes (svg)", assert => {
  const vnode = h(
    "div",
    null,
    h("span", null, "..."),
    h("svg", null, h("circle", { cx: 50, cy: 60, r: 30 })),
    h("span", null, "...")
  );
  const node = mount(vnode);
  let svgCircle = node.childNodes[1].firstChild;
  assert.equal(svgCircle.getAttribute("cx"), "50");
  assert.equal(svgCircle.getAttribute("cy"), "60");
  assert.equal(svgCircle.getAttribute("r"), "30");

  const onclick = () => {};
  const vnode2 = h(
    "div",
    null,
    h("span", null, "..."),
    h(
      "svg",
      null,
      h("circle", { cx: 50, cy: 40, stroke: "green", fill: "yellow" })
    ),
    h("span", { onclick }, "...")
  );

  patch(vnode2, vnode, node);
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

test("patch non keyed children", assert => {
  const render = s => h("div", null, s.split(""));

  let vnode, vnode2, node;
  vnode = h("div");
  node = mount(vnode);

  function testPatch(seq, message) {
    assert.test(message, assert => {
      vnode2 = render(seq);
      patch(vnode2, vnode, node);
      vnode = vnode2;
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
  testPatch("", "clear");

  assert.end();
});

test("patch keyed children", assert => {
  const render = str =>
    h("div", null, str.split("").map(c => h("span", { key: c }, c)));

  let prevVNode,
    prevChildNodes,
    vnode = render(""),
    node = mount(vnode),
    childNodes = Array.from(node.childNodes);

  function testPatch(seq, message) {
    assert.test(message, assert => {
      prevVNode = vnode;
      prevChildNodes = childNodes;
      vnode = render(seq);

      const findOldByKey = key => seq.indexOf(c => c === key);

      patch(vnode, prevVNode, node);
      childNodes = node.childNodes;

      assert.plan(seq.length * 2 + 1);
      assert.equal(node.childNodes.length, seq.length);

      for (var i = 0; i < seq.length; i++) {
        const text = seq[i];

        const index = findOldByKey(text);
        if (index >= 0) {
          assert.equal(
            prevChildNodes[index],
            childNodes[i],
            "should preserve DOM node"
          );
        } else {
          assert.ok(true, "new node");
        }
        assert.equal(
          childNodes[i].firstChild.nodeValue,
          text,
          "should patch text content"
        );
      }
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
  testPatch("", "clear");

  assert.end();
});

test("patch render functions", assert => {
  //let renderCalls = 0;

  function Box(props) {
    //renderCalls++;
    return h("h1", { title: props.title }, props.children);
  }

  const vnode = h(Box, { title: "box title" }, "box content");
  const node = mount(vnode); // renderCalls = 1

  const vnode2 = h(Box, { title: "another box title" }, "another box content");
  patch(vnode2, vnode, node); // renderCalls = 2
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

test("issues #24: applyDiff fails to insert when oldChildren is modified", assert => {
  const oldVnode = h("div", {}, [
    h("p", null, "p"),
    h("div", { key: "x" }, "div"),
    h("pre", null, "pre"),
    h("code", null, "code")
  ]);

  const newVnode = h("div", {}, [
    h("pre", null, "pre"),
    h("code", null, "code"),
    h("div", { key: "x" }, "div"),
    h("p", null, "p")
  ]);

  const node = mount(oldVnode);
  patch(newVnode, oldVnode, node);
  assert.pass("Doesn't blow up");
  assert.end();
});

test("issues #25: applyDiff fails with empty strings", assert => {
  const oldVnode = h("div", {}, [
    h("p", null, "p"),
    "",
    h("pre", null, "pre"),
    h("code", null, "code")
  ]);

  const newVnode = h("div", {}, [
    h("pre", null, "pre"),
    h("code", null, "code"),
    "",
    h("p", null, "p")
  ]);

  const node = mount(oldVnode);
  patch(newVnode, oldVnode, node);
  assert.pass("Doesn't blow up");
  assert.end();
});

test("issues #26: applyDiff fails with blank strings", assert => {
  const oldVnode = h("div", {}, [
    h("p", null, "p"),
    " ",
    h("pre", null, "pre"),
    h("code", null, "code")
  ]);

  const newVnode = h("div", {}, [
    h("pre", null, "pre"),
    h("code", null, "code"),
    " ",
    h("p", null, "p")
  ]);

  const node = mount(oldVnode);
  patch(newVnode, oldVnode, node);
  assert.pass("Doesn't blow up");
  assert.end();
});
