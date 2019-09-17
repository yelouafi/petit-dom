# petit-dom

A minimalist virtual DOM library.

## Install

```sh
$ npm install --save petit-dom
```

or

```sh
$ yarn add petit-dom
```

## Usage

If you're using Babel you can use JSX syntax by putting a `/* @jsx h */` at the top of the source file.

```js
/* @jsx h */
import { h, render } from "petit-dom";

//  assuming your HTML contains a node with "root" id
const parentNode = document.getElementById("root");

// mount
render(<h1>Hello world!</h1>, parentNode);

// patch
render(<h1>Hello again</h1>, parentNode);
```

You can also use raw `h` function calls if you want, see examples folder for usage.

petit-dom has supports also render functions (aka functional components).

```js
/* @jsx h */
import { h, render } from "petit-dom";

function Box(props) {
  return (
    <div>
      <h1 onclick={props.onclick}>{props.title}</h1>
      <p>{props.children}</p>
    </div>
  );
}

render(<Box title="Fancy box">Put your content here</Box>, parentNode);
```

render functions behave like React pure components. Patching with the same
arguments will not cause any re-rendering. You can also attach a `shouldUpdate`
function to the render function to customize the re-rendering behavior (By default
props are tested for shallow equality and content is tested for reference equality,
the lib assumes the same set of keys is provided inside props).

## Custom components

Besides HTML/SVG tag names and render fucntions, the 'h' function also accepts any object
with the following signature

```js
{
    mount(props, stateRef, env) => DomNode
    patch(newProps, oldProps, stateRef, domNode, env) => DomNode
    unmount(stateRef, domNode, env)
}
```

Each of the 3 functions (they are not methods, i.e. no `this`) will be called
by the library at the moment suggested by its name:

- `mount` is called when the library need to create a new Node to be inserted at some
  palce into the DOM.

- `patch` is called when the library needs to update the previously created DOM with
  new props.

- `unmount` is called after the DOM node has been removed from DOM tree.

`props`, `newProps` and `oldProps` all refer to the properties provided to the `h` function
(included via JSX). The children are stored in the `children` property of the props object.

`stateRef` is an object provided to persist any needed data between different invocations. As
mentioned, the 3 functions above are not to be treated as instance methods (no `this`) but as
ordinary functions. Any instance specific data must be stored in the `stateRef` object.

`domNode` is obviously the DOM node to be mounted or patched.

`env` is used internally by the mount/patch process; \*\*This argument must be forwareded to all
nested `mount`, `patch` and `unmount` calls).

Custom components are pretty raw, but they are also more flexible and allow
implementing higher-level solution on top. For example, render functions are implemented
on top of them.

```js
function createRenderComponent({ render, shouldUpdate = shallowCompare }) {
  return {
    mount(props, stateRef, env) {
      var vnode = render(props);
      stateRef.vnode = vnode;
      return mount(vnode, env);
    },
    patch(newProps, oldProps, stateRef, domNode, env) {
      if (!shouldUpdate(newProps, oldProps)) {
        return domNode;
      }
      var newVNode = render(newProps);
      var oldVNode = stateRef.vnode;
      stateRef.vnode = newVNode;
      return patch(newVNode, oldVNode, domNode, env);
    },
    unmount(stateRef, domNode, env) {
      unmount(stateRef.vnode, domNode, env);
    }
  };
}
```

## API

- `h(type, props, ...children)`

Creates virtual nodes.

- `type`: a string (HTML or SVG tag name), or a custom component (see above)

- `props`: in the case of HTML/SVG tags, this corresponds to the attributes/properties
  to be set in the real DOM node. In the case of components, `{ ...props, children }` is
  passed to the appropriate component function (`mount` or `patch`).

- `render(vnode, parentDom)`

renders a virtual node into the DOM. The function will initially create a DOM node
as specified the virtual node `vnode`. Subsequent calls will update the previous
DOM node (or replace it if it's a different tag).

There are also lower level methods that are typically used when implementing
custom components:

- `mount(vnode, env)`

Creates a real DOM node as specified by `vnode`. The `env` argument is optional (e.g. when
called from top level), but typically you'll just have to forward something passed from
upstream (e.g. when called inside a custom component).

- `patch(newVNode, oldVNode, domNode, env)`

Updates (or eventuall replaces) `domNode` based on the difference between `newVNode` and `oldVNode`.

- `unmount(vnode, domNode, env)`

This is called after `domNode` has been retired from the DOM tree. This will be typically
used by custom components to implement cleanup logic.
