import { h, createNode, patch } from "../../../src/index";

var vel = <div />;
document.body.appendChild(createNode(vel));

var value = "ABCD";

function update() {
  var vel2 = (
    <div>
      <input value={value} oninput={e => (value = e.target.value)} />
      <button onclick={update}>'Patch!</button>
      <hr />
      {value.split("").map(it =>
        <span
          key={it}
          style="border: 1px dotted; margin-right: 2px; padding: 2px"
        >
          {it}
        </span>
      )}
    </div>
  );
  patch(vel2, vel);
  vel = vel2;
}

update("ABCD");
