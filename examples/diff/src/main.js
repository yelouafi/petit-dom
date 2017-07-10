import { h, createNode, patch } from "../../../src/index";

window.VDOM_DEBUG = true;

// manually set a custom class on the children
// A virtual dom which supports keying should preserve the class of the marked nodes
function markNodes() {
  const nodes = document.querySelectorAll("span");
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].className = "marked";
  }
}

var vel = <div />;
document.body.appendChild(createNode(vel));

var value = "ABCD";

function update() {
  var vel2 = (
    <div>
      <input value={value} oninput={e => (value = e.target.value)} />
      <button onclick={update}>Patch!</button>
      <hr />
      {value.split("").map(it =>
        <span
          key={it}
          style="border: 1px dotted; margin-right: 2px; padding: 2px"
        >
          {it}
        </span>
      )}
      <hr />
      <button onclick={markNodes}>Mark nodes</button>
      <p style="width: 400px">
        Click this button if you want to style all nodes with bold style before
        applying the patch.<br />
        This applies the styling manually (in the DOM nodes) so you can check if
        the virtual dom library preserves keyed children.
      </p>
    </div>
  );
  patch(vel2, vel);
  vel = vel2;
}

update("ABCD");
