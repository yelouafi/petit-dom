import test from "tape";
import { h, render } from "../src/index.js";

test("select.option.selected (single selection)", (assert) => {
  const root = document.createElement("div");
  render(
    h(
      "select",
      null,
      h("option", { value: "eat" }, "Eat"),
      h("option", { value: "pray", selected: true }, "Pray"),
      h("option", { value: "love" }, "Love")
    ),
    root
  );

  const node = root.firstChild;
  assert.equal(node.selectedIndex, 1, "selected index should be 1");

  render(
    h(
      "select",
      null,
      h("option", { value: "eat", selected: true }, "Eat"),
      h("option", { value: "pray" }, "Pray"),
      h("option", { value: "love" }, "Love")
    ),
    root
  );

  assert.equal(node.selectedIndex, 0, "selected index should be 0");
  assert.end();
});

test("select.value (single selection)", (assert) => {
  const root = document.createElement("div");
  render(
    h(
      "select",
      { value: "pray" },
      h("option", { value: "eat" }, "Eat"),
      h("option", { value: "pray" }, "Pray"),
      h("option", { value: "love" }, "Love")
    ),
    root
  );

  const node = root.firstChild;
  assert.equal(node.selectedIndex, 1, "selected index should be 1");
  assert.equal(node.options[1].selected, true, "option 1 should be selected");

  render(
    h(
      "select",
      { value: "eat" },
      h("option", { value: "eat" }, "Eat"),
      h("option", { value: "pray" }, "Pray"),
      h("option", { value: "love" }, "Love")
    ),
    root
  );

  assert.equal(node.selectedIndex, 0, "selected index should be 0");
  assert.end();
});

test("select with multiple = true", (assert) => {
  const root = document.createElement("div");
  render(
    h(
      "select",
      { multiple: true },
      h("option", { value: "eat", selected: true }, "Eat"),
      h("option", { value: "pray", selected: false }, "Pray"),
      h("option", { value: "love", selected: true }, "Love")
    ),
    root
  );

  const node = root.firstChild;
  assert.equal(
    node.selectedOptions.length,
    2,
    "number of selected options should be 2"
  );
  assert.equal(
    node.selectedOptions[0],
    node.options[0],
    "should select options[0]"
  );
  assert.equal(
    node.selectedOptions[1],
    node.options[2],
    "should select options[2]"
  );
  assert.equal(node.options[0].selected, true, "option 0 should be selected");
  assert.equal(
    node.options[1].selected,
    false,
    "option 1 should not be selected"
  );
  assert.equal(node.options[2].selected, true, "option 2 should be selected");

  render(
    h(
      "select",
      { selectedIndex: -1, multiple: true },
      h("option", { value: "eat", selected: true }, "Eat"),
      h("option", { value: "pray", selected: true }, "Pray"),
      h("option", { value: "love", selected: false }, "Love")
    ),
    root
  );

  assert.equal(
    node.selectedOptions.length,
    2,
    "number of selected options should be 2"
  );
  assert.equal(
    node.selectedOptions[0],
    node.options[0],
    "should select options[0]"
  );
  assert.equal(
    node.selectedOptions[1],
    node.options[1],
    "should select options[1]"
  );

  assert.equal(node.options[0].selected, true, "option 0 should be selected");
  assert.equal(node.options[1].selected, true, "option 1 should be selected");
  assert.equal(
    node.options[2].selected,
    false,
    "option 2 should not be selected"
  );
  assert.end();
});
