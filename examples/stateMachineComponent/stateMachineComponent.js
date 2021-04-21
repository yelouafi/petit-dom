import {
  mount,
  patchInPlace,
  unmount,
  getParentNode,
} from "../../src/index.js";

export function createSMComponent({ view, update, output }) {
  return {
    mount(me) {
      me.emit = (event) => {
        let newState = update(me.props, me.state, event);
        if (newState !== me.state) {
          me.state = newState;
          me.render(view(me.props, me.state, me.emit));
          Promise.resolve().then(() => {
            output(me.props, me.state, me.emit);
          });
        }
      };
      me.emit({ type: "$INIT" });
    },
    patch(me) {
      me.emit({ type: "$NEW_PROPS", props: me.props, oldProps: me.oldProps });
    },
  };
}
