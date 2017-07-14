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
  const vnode = { _text: "old text" };
  const node = mount(vnode);

  const vnode2 = { _text: "new text" };
  const node2 = patch(vnode2, vnode);

  assert.equal(node, node2);
  assert.equal(vnode2._node, node);
  assert.equal(node.nodeValue, "new text");

  assert.end();
});

test("patch node with different types", assert => {
  const vnode = { _text: "old text" };
  const node = mount(vnode);

  const vnode2 = h("span");
  const node2 = patch(vnode2, vnode);

  assert.notEqual(node, node2);
  assert.equal(vnode2._node, node2);
  assert.equal(node2.tagName, "SPAN");

  const vnode3 = h("div");
  const node3 = patch(vnode3, vnode2);

  assert.notEqual(node2, node3);
  assert.equal(vnode3._node, node3);
  assert.equal(node3.tagName, "DIV");

  assert.end();
});

test("patch props", assert => {
  const vnode = h("input", {
    type: "number",
    value: "old value",
    style: "color: red"
  });
  const node = mount(vnode);

  const vnode2 = h("input", {
    type: "number",
    value: "new value",
    style: "color: green; border: 1px solid black"
  });
  const node2 = patch(vnode2, vnode);

  assert.equal(node2, node);
  assert.equal(vnode2._node, node);
  assert.equal(node.type, "number");
  assert.equal(node.value, "new value");
  assert.equal(node.style.color, "green");
  assert.equal(node.style.border, "1px solid black");

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
      patch(vnode2, vnode);
      vnode = vnode2;
      assert.plan(vnode.content.length * 2 + 1);

      assert.equal(
        node.childNodes.length,
        vnode.content.length,
        "should have same number of children"
      );
      for (var i = 0; i < vnode.content.length; i++) {
        const ch = vnode.content[i];
        const childNode = node.childNodes[i];

        assert.equal(
          childNode.nodeName,
          "#text",
          "chuild should be a text node"
        );
        assert.equal(
          childNode.nodeValue,
          ch._text,
          "should patch text content"
        );
      }
    });
    //assert.end()
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

  const markWithTransientState = (vnode, version) => {
    // mark all nodes with transient state before patching
    // We want to make sure patch preserve keyed children' transient state
    for (var i = 0; i < vnode.content.length; i++) {
      const ch = vnode.content[i];
      ch._version = `${ch.key}${version}`;
      ch._node._version = ch.version;
    }
  };

  let vnode2,
    vnode,
    node,
    version = 0;

  vnode = render("");
  node = mount(vnode);

  function testPatch(s, message) {
    assert.test(message, assert => {
      vnode2 = render(s);
      markWithTransientState(vnode, ++version);
      patch(vnode2, vnode);
      vnode = vnode2;

      assert.plan(vnode.content.length * 4 + 1);
      assert.equal(node.childNodes.length, vnode.content.length);

      for (var i = 0; i < vnode.content.length; i++) {
        const ch = vnode.content[i];
        const childNode = node.childNodes[i];

        assert.equal(childNode.tagName, "SPAN", "tag name should be span");
        assert.equal(
          childNode.childNodes.length,
          1,
          "should have one child node"
        );
        assert.equal(
          childNode.firstChild.nodeValue,
          ch.content[0]._text,
          "should match text content"
        );
        assert.equal(
          childNode._version,
          ch.version,
          "should preserve transcient version"
        );
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
