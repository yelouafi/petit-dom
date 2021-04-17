# petit-dom

A minimalist virtual DOM library.

- Supports HTML & SVG elements.
- Supports Render functions and Fragments.
- Custom components allows to build your own abstraction around DOM elements.
- Directives allows you to attach custom behavior to DOM elements.

## Installation

The library is provided as a set of ES modules. You can install using `npm` or `yarn` and then import
from `petit-dom` (see example below).

```sh
$ npm install --save petit-dom
```

or

```sh
$ yarn add petit-dom
```

> Note however no transpiled build is provided. The library will work with all recent versions of `Node` and major browsers. If you're targeting older platforms, make sure to transpile to the desired ES version.

To run the examples, you can run a local web server (like npm `http-server` module) from the root folder of the project. Since all example use ES6 modules, you can simply navigate to the example you want and load the desired HTML file.

## Usage

If you're using Babel you can use JSX syntax by configuring the jsx runtime

```json
{
  "presets": [
    [
      "@babel/preset-react",
      { "runtime": "automatic", "importSource": "petit-dom" }
    ]
  ]
}
```

```js
import { render } from "petit-dom";

//  assuming your HTML contains a node with "root" id
const parentNode = document.getElementById("root");

// mount
render(<h1>Hello world!</h1>, parentNode);

// patch
render(<h1>Hello again</h1>, parentNode);
```

Alternatively you can use the classic Babel transform via `/* @jsx h */` on the top. You can also use the raw `h` function calls if you want, see examples folder for usage.

petit-dom also supports render functions

```js
import { render } from "petit-dom";

function Box(props) {
  return (
    <div>
      <h1>{props.title}</h1>
      <p>{props.children}</p>
    </div>
  );
}

render(<Box title="Fancy box">Put your content here</Box>, parentNode);
```

render functions behave like React pure components. Patching with the same
arguments will not cause any re-rendering. You can also attach a `shouldUpdate`
function to the render function to customize the re-rendering behavior (By default
props are tested for shallow equality).

## Custom components

Besides HTML/SVG tag names, fragments and render fucntions, the `h` function also accepts any object
with the following signature

```js
{
  mount(self);
  patch(self);
  unmount(self);
}
```

Each of the 3 functions will be called by the library at the moment suggested by its name.

The `self` argument which is an aboject holding the following properties:

- `render(...)`: To create/update DOM content for the component
- `props`: the current props passed to the JSX element (or `h` function)
- `oldProps`: the previous props, it's value is `undefined` inside `mount`

You can also attach arbitrary properties to the object, they will persist between different
invocations.

See examples folder for how to define some custom components.

## Directives

You can also attach custom behaviors to DOM nodes. Directives allows you to obtain references
to DOM nodes and manage their lifecycle.

A directive is an object with the current interface

```js
{
  mount(domElement, value);
  patch(domElement, newValue, oldValue);
  unmount(element, lastValue);
}
```

There's an example of a simple log directive in the examples folder.

## API

### `h(type, props, ...children)`

Creates a virtual node.

- `type`: a string (HTML or SVG tag name), or a custom component (see above)

- `props`: in the case of HTML/SVG tags, this corresponds to the attributes/properties
  to be set in the real DOM node. In the case of components, `{ ...props, children }` is
  passed to the appropriate component function (`mount` or `patch`).

### `render(vnode, parentDom, options = {})`

renders a virtual node into the DOM. The function will initially create a DOM node
as specified the virtual node `vnode` and append it to the children of`parentDOM`.
Subsequent calls will update the previous DOM node (or replace it if it's a different tag).

Optionally, you can use `options` to pass custom directives, for example:

```js
  let log = { ... }, // defines a log directive
  render(<Something />, parent, { directives: { log } });
```
