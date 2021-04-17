import { html } from "./html.js";
import { withState } from "./withStateComponent.js";
import { Bezier } from "./Bezier.js";
import { render, Fragment } from "../../src/index.js";

const colors = ["#28A86B", "#ff5722", "#b06327", "#1e99e9"];

const coords0 = {
  x1: 100,
  y1: 100,
  x2: 280,
  y2: 100,
  cx1: 150,
  cy1: 20,
  cx2: 180,
  cy2: 150,
};

const App = withState(
  (_, coords, setCoords) => {
    const { x1, y1, x2, y2, cx1, cy1, cx2, cy2 } = coords;

    const onCoordsChange = (coordsChange) => {
      setCoords((coords) => ({ ...coords, ...coordsChange }));
    };

    return html`<${Fragment}>
    <svg height="240" width="480" class=box>
      <g transform="translate(50, 10)">
        <${Bezier}
          colors=${colors}
          coords=${coords}
          onChange=${onCoordsChange}
        />
      </g>
    </svg>
    <pre>
      path d="
        <span style="color: ${colors[0]}">M${x1} ${y1}</span>
        <span style="color: ${colors[2]}"> C${cx1} ${cy1}</span>
        <span style="color: ${colors[3]}"> ${cx2} ${cy2}</span>
        <span style="color: ${colors[1]}"> ${x2} ${y2}</span>
    </pre>
  </Fragment>`;
  },
  () => coords0
);

const rootElement = document.getElementById("root");
render(html`<${App} />`, rootElement);
