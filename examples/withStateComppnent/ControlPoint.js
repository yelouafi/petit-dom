import { html } from "./html.js";

const onMouseDown = (x, y, onChange) => (event) => {
  const node = event.target;
  const dx = x - event.clientX;
  const dy = y - event.clientY;

  document.addEventListener("mousemove", onMouseMove);

  node.onmouseup = () => {
    document.removeEventListener("mousemove", onMouseMove);
  };

  function onMouseMove(event) {
    const x1 = event.clientX + dx;
    const y1 = event.clientY + dy;
    onChange(x1, y1);
  }
};

export function ControlPoint({ x, y, fill, onChange }) {
  return html`<g transform="translate(${x}, ${y})">
    <circle class="control-point" cx="0" cy="0" r="3" fill=${fill} />
    <circle
      class="handle"
      onMouseDown=${onMouseDown(x, y, onChange)}
      cx="0"
      cy="0"
      r="10"
      fill=${fill}
    />
  </g>`;
}
