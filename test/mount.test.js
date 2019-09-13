import test from "tape";
import { h, mount } from "../src";

test("text node", assert => {
  const vnode = "raw text";
  const node = mount(vnode);
  assert.equal(node.nodeName, "#text");
  assert.equal(node.nodeValue, "raw text");
  assert.end();
});

test("simple element", assert => {
  const vnode = h(
    "span",
    // JSDOM bug?
    { /*"data-type": "span",*/ class: "input", style: "color: red" },
    "span content"
  );
  const node = mount(vnode);

  assert.equal(node.nodeName, "SPAN");
  //assert.equal(node.dataset.type, "span");
  assert.equal(node.className, "input");
  assert.equal(node.style.color, "red");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "span content");
  assert.end();
});

test("element with multiple children", assert => {
  const vnode = h(
    "div",
    null,
    h("span", null, "span text"),
    h("input", { type: "number" }),
    "raw text"
  );

  const node = mount(vnode);

  assert.equal(node.nodeName, "DIV");
  assert.equal(node.childNodes.length, 3);

  const span = node.childNodes[0];
  assert.equal(span.nodeName, "SPAN");
  assert.equal(span.childNodes.length, 1);
  assert.equal(span.firstChild.nodeValue, "span text");

  const input = node.childNodes[1];
  assert.equal(input.nodeName, "INPUT");
  assert.equal(input.childNodes.length, 0);
  assert.equal(input.type, "number");

  const text = node.childNodes[2];
  assert.equal(text.nodeName, "#text");
  assert.equal(text.nodeValue, "raw text");

  assert.end();
});

test("render functions", assert => {
  function Box(props, content) {
    return h("h1", { title: props.title }, content);
  }

  const vnode = h(Box, { title: "box title" }, "box content");
  const node = mount(vnode);

  assert.equal(node.nodeName, "H1");
  assert.equal(node.title, "box title");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "box content");
  assert.end();
});
/*
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
*/
test("svg elements", assert => {
  const onclick = () => {};

  const vnode = h(
    "div",
    null,
    h("span", null, "..."),
    h(
      "svg",
      { width: 100, height: 200 },
      h("circle", { cx: 50, cy: 60, r: 40 }),
      h("a", { href: "/link", show: "/link2", actuate: "/link3" })
    ),
    h("span", { onclick }, "...")
  );
  const node = mount(vnode);
  assert.equal(node.childNodes.length, 3);

  const svgNode = node.childNodes[1];
  assert.equal(svgNode.nodeName, "svg");
  assert.equal(svgNode.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(svgNode.getAttribute("width"), "100");
  assert.equal(svgNode.getAttribute("height"), "200");
  assert.equal(svgNode.childNodes.length, 2);

  const svgCircle = svgNode.childNodes[0];
  assert.equal(svgCircle.nodeName, "circle");
  assert.equal(svgCircle.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(svgCircle.getAttribute("cx"), "50");
  assert.equal(svgCircle.getAttribute("cy"), "60");
  assert.equal(svgCircle.getAttribute("r"), "40");

  const svgA = svgNode.childNodes[1];
  assert.equal(svgA.nodeName, "a");
  assert.equal(svgA.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(
    svgA.getAttributeNS("http://www.w3.org/1999/xlink", "href"),
    "/link"
  );
  assert.equal(
    svgA.getAttributeNS("http://www.w3.org/1999/xlink", "show"),
    "/link2"
  );
  assert.equal(
    svgA.getAttributeNS("http://www.w3.org/1999/xlink", "actuate"),
    "/link3"
  );

  const span = node.childNodes[2];
  assert.equal(
    span.onclick,
    onclick,
    "should set props instead of attrs once svg context is off"
  );

  assert.end();
});
