import test from "tape";
import { h, mount, getDomNode } from "../src/index.js";

test("text node", (assert) => {
  const vnode = "raw text";
  const node = getDomNode(mount(vnode));
  assert.equal(node.nodeName, "#text");
  assert.equal(node.nodeValue, "raw text");
  assert.end();
});

test("simple element", (assert) => {
  const vnode = h(
    "span",
    // JSDOM bug?
    { /*"data-type": "span",*/ class: "input", style: "color: red" },
    "span content"
  );
  const node = getDomNode(mount(vnode));

  assert.equal(node.nodeName, "SPAN");
  //assert.equal(node.dataset.type, "span");
  assert.equal(node.className, "input");
  assert.equal(node.style.color, "red");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "span content");
  assert.end();
});

test("simple element without children", (assert) => {
  const vnode = h("input", { type: "text" });
  const node = getDomNode(mount(vnode));

  assert.equal(node.nodeName, "INPUT");
  assert.equal(node.type, "text");
  assert.equal(node.childNodes.length, 0);
  assert.end();
});

test("element with multiple children", (assert) => {
  const vnode = h(
    "div",
    null,
    h("span", null, "span text"),
    h("input", { type: "number" }),
    "raw text"
  );

  const node = getDomNode(mount(vnode));

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
  const vnode = h(
    "div",
    null,
    h("span", null, ["span text"]),
    [h("input", { type: "number" }), ["nested text"]],
    "raw text"
  );

  const node = getDomNode(mount(vnode));

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
  function Box(props) {
    return h("h1", { title: props.title }, props.children);
  }

  const vnode = h(Box, { title: "box title" }, "box content");
  const node = getDomNode(mount(vnode));

  assert.equal(node.nodeName, "H1");
  assert.equal(node.title, "box title");
  assert.equal(node.childNodes.length, 1);
  assert.equal(node.firstChild.nodeValue, "box content");
  assert.end();
});

test("Component", (assert) => {
  const MyComponent = {
    mount(props, state) {
      var ref = mount(h("my-component"));
      state.payload = props;
      getDomNode(ref)._state = state;
      return ref;
    },
  };

  const props = { some_prop: "some_prop" };
  const vnode = h(MyComponent, props);

  const node = getDomNode(mount(vnode));
  assert.equal(node.nodeName, "MY-COMPONENT");
  assert.deepEqual(node._state.payload, vnode.props);

  assert.end();
});

test("svg elements", (assert) => {
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
  const node = getDomNode(mount(vnode));
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
