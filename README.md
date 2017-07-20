# petit-dom

A minimalist virtual DOM library. 

Diff algroithm is based on pre-optimizations at
https://neil.fraser.name/writing/diff/ and the algorithm presented
in the paper ["An O(ND) Difference Algorithm and Its Variations](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf)


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
import { h, mount, patch } from 'petit-dom'

// create a virtual node
let vnode = <h1>Hello world!</h1>

// `mount(vnode)` return a DOM node 
document.body.appendChild(mount(vnode))

// patch(newVNode, oldVNode) patches a previously created & mounted vnode
let vnode2 = <h1>Hello again</h1>
patch(vnode2, vnode)
```

petit-dom has also a first class support for render functions (aka functional components).

```js
/* @jsx h */
import { h, mount } from 'petit-dom'

function Box(props, content) {
  return (
    <div>
      <h1 onclick={props.onclick}>{props.title}</h1>
      <p>{content}</p>
    </div>
  )
}

const vnode = (
  <div>
    <Box title="Fancy box">
      Put your content here
    </Box>
  </div>
)

document.body.appendChild(mount(vnode))
```

render functions behave like React pure components. Patching with the same
arguments will not cause any re-rendering. You can also attach a `shouldUpdate`
function to the render function to customoze the re-rendering behavior (By default
props are tested for shallow equality and content is tested for reference equality,
the lib assumes the same set of keys is provided inside props).


### Custom components

TBD
