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

### Render components

TBD

### Custom components

TBD
