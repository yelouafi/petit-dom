import { mount, patch, unmount } from "../../../src/index.js";

var theComponent;
export function useState(initialState) {
  if (theComponent == null) throw new Error("useState used in a non component");
  if (theComponent.isMounted) {
    return theComponent.cells[theComponent.cellIndex++];
  } else {
    const cell = theComponent.createCell(initialState);
    theComponent.cells[theComponent.cellIndex++] = cell;
    return cell;
  }
}

export function withHooks(render) {
  function update(stateRef) {
    stateRef.cellIndex = 0;
    theComponent = stateRef;
    var newVNode = render(stateRef.props);
    theComponent = null;
    var oldVNode = stateRef.vnode;
    stateRef.vnode = newVNode;
    return patch(newVNode, oldVNode, stateRef.node, stateRef.env);
  }

  return {
    mount(props, stateRef, env) {
      stateRef.props = props;
      stateRef.env = env;
      stateRef.cellIndex = 0;
      stateRef.cells = [];

      stateRef.createCell = function createCell(initialState) {
        var cell = [initialState, updateState];
        function updateState(updater) {
          const newState = updater(cell[0], stateRef.props);
          if (newState !== cell[0]) {
            cell[0] = newState;
            const domNode = update(stateRef);
            if (domNode !== stateRef.node) {
              const parentNode = stateRef.node.parentNode;
              if (parentNode != null) {
                parentNode.replaceChild(domNode, stateRef.node);
              }
              stateRef.node = domNode;
            }
          }
        }
        return cell;
      };
      theComponent = stateRef;
      stateRef.vnode = render(props);
      stateRef.node = mount(stateRef.vnode, env);
      stateRef.isMounted = true;
      return stateRef.node;
    },
    patch(newProps, oldProps, stateRef, domNode, env) {
      stateRef.props = newProps;
      stateRef.env = env;
      stateRef.node = update(stateRef);
      return stateRef.node;
    },
    unmount(stateRef, domNode, env) {
      stateRef.wasUnmounted = true;
      unmount(stateRef.vnode, domNode, env);
    }
  };
}
