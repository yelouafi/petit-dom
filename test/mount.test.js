import test from "tape";
import { h, mount } from "../src";

test("text node", assert => {
  const vnode = { _text: "raw text" };
  const node = mount(vnode);
  assert.equal(node.nodeName, "#text");
  assert.equal(node.nodeValue, "raw text");
  assert.end();
});

test("simple element", assert => {
  const vnode = h(
    "span",
    { type: "number", className: "input", style: "color: red" },
    "span content"
  );
  const node = mount(vnode);
  assert.equal(vnode._node, node);
  assert.equal(vnode.content[0]._node, node.firstChild);

  assert.equal(node.nodeName, "SPAN");
  assert.equal(node.type, "number");
  assert.equal(node.className, "input");
  assert.equal(node.style.color, "red");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "span content");
  assert.end();
});

test("element with multiple children", assert => {
  var vspan, vinput;

  const vnode = h(
    "div",
    null,
    (vspan = h("span", null, "span text")),
    (vinput = h("input", { type: "number" })),
    "raw text"
  );

  const node = mount(vnode);
  assert.equal(vnode._node, node);

  assert.equal(node.nodeName, "DIV");
  assert.equal(node.childNodes.length, 3);
  for (var i = 0; i < vnode.content.length; i++) {
    var ch = vnode.content[i];
    assert.equal(ch._node, node.childNodes[i]);
  }

  assert.equal(vspan._node.nodeName, "SPAN");
  assert.equal(vspan._node.childNodes.length, 1);
  assert.equal(vspan._node.firstChild.nodeValue, "span text");

  assert.equal(vinput._node.nodeName, "INPUT");
  assert.equal(vinput._node.childNodes.length, 0);
  assert.equal(vinput._node.type, "number");

  const vtext = vnode.content[2];
  assert.equal(vtext._node.nodeName, "#text");
  assert.equal(vtext._node.nodeValue, "raw text");

  assert.end();
});

test("render functions", assert => {
  function Box(props, content) {
    return h("h1", { title: props.title }, content);
  }

  const vnode = h(Box, { title: "box title" }, "box content");
  const node = mount(vnode);
  assert.equal(vnode._node, node);

  assert.equal(node.nodeName, "H1");
  assert.equal(node.title, "box title");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "box content");
  assert.end();
});

test("Component", assert => {
  const MyComponent = {
    mount: (props, content) => {
      var node = document.createElement("my-component");
      node._payload = [props, content];
      return node;
    },
    patch: () => {},
    unmount: () => {}
  };

  const vnode = h(
    MyComponent,
    { some_prop: "some_prop" },
    { some_cont: "some_cont" }
  );

  const node = mount(vnode);
  assert.equal(vnode._node, node);
  assert.equal(node.nodeName, "MY-COMPONENT");
  assert.deepEqual(node._payload, [vnode.props, vnode.content]);

  assert.end();
});
