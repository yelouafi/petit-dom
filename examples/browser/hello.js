import { h, render } from "../../src/index.js";

function app({ input, trans, list }) {
  return h(
    "div",
    null,
    h("input", {
      value: input,
      oninput: (e) => render(app({ list, trans, input: e.target.value }), root),
      onkeydown: (e) => {
        if (e.which === 13)
          render(
            app({ list: input, trans: `${list} -> ${input}`, input }),
            root
          );
      },
    }),
    h("span", null, trans),
    h("hr"),
    h("pre", null, JSON.stringify({ input, list }, null, 2)),
    list.split("").map((it) => h("span", { className: "item", key: it }, it))
  );
}

const root = document.getElementById("root");
render(app({ input: "", trans: "", list: "" }), root);
