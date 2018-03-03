/* @jsx h */
import { h } from "../../../src/index";

export default function Sequence({ sequence }) {
  return (
    <div class="seq">
      {sequence.map(it =>
        <div key={it == +it ? it : null} data-key={it} class="box">
          {it}
        </div>
      )}
    </div>
  );
}
