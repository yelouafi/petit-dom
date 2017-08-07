/* @jsx h */
import { h, mount, patch } from "../../../src/index";
import diffObserver from "./utils";
import Sequence from "./sequence";

var libs = [];

var currentStep = -1;
var lastInput = "";
var currentInput = "";

const steps = [
  "36",
  "3678",
  "7836",
  "3678",
  "123678",
  "12345678",
  "a0123456789b",
  "12345678",
  "12378456",
  "12345678",
  "6ab127cd8",
  "1278",
  "890"
];

var vnode = render();
document.querySelector("#main").appendChild(mount(vnode));
const obsDiff = diffObserver(".seq");
obsDiff();

function update() {
  const oldVnode = vnode;
  vnode = render();
  patch(vnode, oldVnode);
  const value = currentInput.split("").filter(s => s).map(s => s.trim());
  libs.forEach(({ render, node }) => render(value, node));
  lastInput = currentInput;
}

function toggleAutoTest() {
  if (currentStep >= 0) {
    currentStep = -1;
    currentInput = "";
  } else {
    currentStep = 0;
    currentInput = steps[currentStep];
  }
  update();
}

function nextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    currentInput = steps[currentStep];
  }
  update();
}

function render() {
  const isAutoTest = currentStep >= 0;
  const sequence = currentInput.split("").filter(s => s).map(s => s.trim());
  const edit =
    currentInput !== lastInput
      ? `'${lastInput}' ➔ '${currentInput}'`
      : "No edit";

  return (
    <div>
      <div>
        <span className="box inserted">Inserted</span>
        <span className="box moved">Moved</span>
        <span className="box lcs">Non moved</span>
      </div>
      <hr />
      <input
        placeholder="e.g. 12345"
        disabled={isAutoTest}
        value={currentInput}
        oninput={e => (currentInput = e.target.value)}
      />
      <button disabled={isAutoTest} onclick={update}>
        Patch!
      </button>
      <button onclick={toggleAutoTest}>
        {isAutoTest ? "Abort predefined test" : "Start predefined test"}
      </button>
      <p>
        {"Current step : "}
        {edit}
      </p>
      {isAutoTest
        ? <button disabled={currentStep >= steps.length - 1} onclick={nextStep}>
            Next
          </button>
        : null}
      <hr />
      <Sequence sequence={sequence} />
    </div>
  );
}

update();
