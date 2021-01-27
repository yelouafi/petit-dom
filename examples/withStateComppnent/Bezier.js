import { html } from "./html.js";
import { Fragment } from "../../src/index.js";
import { ControlPoint } from "./ControlPoint.js";

export function Bezier({ coords, colors, onChange }) {
  const { x1, y1, x2, y2, cx1, cy1, cx2, cy2 } = coords;

  const onXYChange = (xname, yname) => (x, y) => {
    onChange({
      [xname]: x,
      [yname]: y,
    });
  };

  return html`
    <${Fragment}>
      <g>
        <path
          class="shape"
          d="M${x1} ${y1} C${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}"
        />
        <line class="control-line" x1=${cx1} y1=${cy1} x2=${x1} y2=${y1} />
        <line class="control-line" x1=${x2} y1=${y2} x2=${cx2} y2=${cy2} />
      </g>
      <${ControlPoint}
        x=${x1}
        y=${y1}
        fill=${colors[0]}
        onChange=${onXYChange("x1", "y1")}
      />
      <${ControlPoint}
        x=${x2}
        y=${y2}
        fill=${colors[1]}
        onChange=${onXYChange("x2", "y2")}
      />
      <${ControlPoint}
        x=${cx1}
        y=${cy1}
        fill=${colors[2]}
        onChange=${onXYChange("cx1", "cy1")}
      />
      <${ControlPoint}
        x=${cx2}
        y=${cy2}
        fill=${colors[3]}
        onChange=${onXYChange("cx2", "cy2")}
      />
    </Fragment>`;
}
