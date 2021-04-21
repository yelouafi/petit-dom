import test from "tape";
import { h, render } from "../src/index.js";

test("DOM node", (assert) => {
  const root = document.createElement("div");

  const vnode = document.createTextNode("dom node");

  render(vnode, root);

  assert.equal(root.firstChild, vnode);
  assert.end();
});

test("text node", (assert) => {
  const root = document.createElement("div");

  render("raw text", root);
  let node = root.firstChild;
  assert.equal(node.nodeName, "#text");
  assert.equal(node.nodeValue, "raw text");
  assert.end();
});

test("simple element", (assert) => {
  const root = document.createElement("div");
  const vnode = h(
    "span",
    // JSDOM bug?
    { /*"data-type": "span",*/ class: "input", style: "color: red" },
    "span content"
  );
  render(vnode, root);
  const node = root.firstChild;

  assert.equal(node.nodeName, "SPAN");
  //assert.equal(node.dataset.type, "span");
  assert.equal(node.className, "input");
  assert.equal(node.style.color, "red");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "span content");
  assert.end();
});

test("simple element without children", (assert) => {
  const root = document.createElement("div");

  const vnode = h("input", { type: "text" });

  render(vnode, root);
  const node = root.firstChild;

  assert.equal(node.nodeName, "INPUT");
  assert.equal(node.type, "text");
  assert.equal(node.childNodes.length, 0);
  assert.end();
});

test("element with multiple children", (assert) => {
  const root = document.createElement("div");

  const vnode = h(
    "div",
    null,
    h("span", null, "span text"),
    h("input", { type: "number" }),
    "raw text"
  );

  render(vnode, root);
  const node = root.firstChild;

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

test("element with nested array", (assert) => {
  const root = document.createElement("div");

  const vnode = h(
    "div",
    null,
    h("span", null, ["span text"]),
    [h("input", { type: "number" }), ["nested text"]],
    "raw text"
  );

  render(vnode, root);
  const node = root.firstChild;

  assert.equal(node.nodeName, "DIV");
  assert.equal(node.childNodes.length, 4);

  const span = node.childNodes[0];
  assert.equal(span.nodeName, "SPAN");
  assert.equal(span.childNodes.length, 1);
  assert.equal(span.firstChild.nodeValue, "span text");

  const input = node.childNodes[1];
  assert.equal(input.nodeName, "INPUT");
  assert.equal(input.childNodes.length, 0);
  assert.equal(input.type, "number");

  const text1 = node.childNodes[2];
  assert.equal(text1.nodeName, "#text");
  assert.equal(text1.nodeValue, "nested text");

  const text2 = node.childNodes[3];
  assert.equal(text2.nodeName, "#text");
  assert.equal(text2.nodeValue, "raw text");

  assert.end();
});

test("render functions", (assert) => {
  const root = document.createElement("div");

  function Box(props) {
    return h("h1", { title: props.title }, props.children);
  }

  const vnode = h(Box, { title: "box title" }, "box content");

  render(vnode, root);
  const node = root.firstChild;

  assert.equal(node.nodeName, "H1");
  assert.equal(node.title, "box title");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "box content");
  assert.end();
});

test("Component/sync rendering", (assert) => {
  const root = document.createElement("div");

  const MyComponent = {
    mount(me) {
      me.render(me.props.some_prop);
    },
  };

  const props = { some_prop: "some_prop" };
  const vnode = h(MyComponent, props);

  render(vnode, root);
  const node = root.firstChild;
  assert.equal(node.nodeValue, props.some_prop);

  assert.end();
});

test("Mount Component/async rendering", (assert) => {
  const root = document.createElement("div");

  let p = new Promise((resolve) => setTimeout(resolve, 0));
  const MyComponent = {
    mount: (me) => {
      p = p.then(() => {
        me.render(me.props.prop);
      }, 0);
    },
  };

  render(h(MyComponent, { prop: "prop1" }), root);

  assert.equal(root.firstChild.nodeType, 8 /* comment node */);

  p.then(() => {
    assert.equal(root.firstChild.nodeValue, "prop1");
    assert.end();
  });
});

test("svg elements", (assert) => {
  const root = document.createElement("div");

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

  render(vnode, root);
  const node = root.firstChild;

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
