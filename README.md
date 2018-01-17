# petit-dom

A minimalist virtual DOM library. 

Diff algroithm is based on pre-optimizations described at
https://neil.fraser.name/writing/diff/ and the algorithm presented
in the paper ["An O(ND) Difference Algorithm and Its Variations](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf). There is also [an excellent article](https://www.codeproject.com/Articles/42279/Investigating-Myers-diff-algorithm-Part-of) which explains how the algorithm works. The article includes a GUI application to play
with the algorithm

## Is this another React clone ?

Not quite. React is a framewark is a more complete solution for writing UIs using Components. It ships with a full 
Component API and implementation. Also, React is not specifically a virtual DOM library. It just happens that the Component
API is implemented using virtual DOM (which may or may not change in the future).

petit-dom is a more low level library. First it's specifically tied to the virtual DOM model. Second it has no builtin 
Component implementation. It comes with a minimal Component inerop API [see below](#custom-components) that specifies how
you may plug in your own Component implementation in a certain subtree.

This means that you can (and that the library is meant to) create your own Component implementation on top of the low level API.
If you need a ready to use full Component implementation, you should instead a library like React, or one of its 
lightwight alternatives like Preact.

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
function to the render function to customize the re-rendering behavior (By default
props are tested for shallow equality and content is tested for reference equality,
the lib assumes the same set of keys is provided inside props).


### Custom components

In addition to render functions, you can also provide custom components that has full control on how to mount/update
the DOM under a certain tree.

More concretely a custom Component can be either an object of the shape

```js
{  
  mount(props, content) => DOMNode
  patch(DOMNode, newProps, oldProps, newContent, oldContent) => DOMNode
  unmount(DOMNode)
}
```

The 3 methods can beused to control the whole virtual DOM update lifecycle. `mount` will be called when the library needs to 
create a new Node under the actual DOM tree. The method must return a DOM node to be inserted at the component location. `patch` 
is invoked when the parent node needs to update the previously create Node. And finally `unmount` is called when the Node is 
removed from the DOM.

A custom component can also be a class which implements the above three methods. In this case, each time a new Node has to be
mounted, a new instance of the provided class is created and the `mount` method is invoked. For convenience, both the class
constructor and `mount` are provided `props` and `content`. Similarly, when the parent needs to update the previously
created node the node, the `patch` method is invoked on the previously created instance. And similarly `unmount` method of
the instance when the parent needs to remove the DOM node.

Below an example of a simple but working implementation of a generic Component class

```js
import {mount, patch, unmount} from "petit-dom"

class Component {
  constructor(props = {}, content) {
    const self = this
    this._tag = 'x-' + this.constructor.name.toLowerCase()
    this.props = props
    this.content = content
  }
  mount() {
    this._vnode = h(this._tag, null, this.render())
    const node = mount(this._vnode)
    node.$$instance = this // make instance accessible in devtools
    return node
  }
  patch(node, props, oldProps, content, oldContent) {
    this.props = props
    this.content = content
    this.updateUI()
    return node
  }
  unmount(node) {
    node.$$instance = null
    return unmount(this._vnode)
  }
  updateUI() {
    const oldVnode = this._vnode
    this._vnode = h(this._tag, null, this.render())
    patch(this._vnode, oldVnode)
  }
}
```

And an example application of how to use the Component super class

```js
import { h } from 'petti-dom'

class Counter extends Component {
  
  constructor(props) {
    super(props)
    this.count = 0
  }
  
  increment() {
    this.count++
    this.updateUI()
  }
  
  /* Hooks on callback methods */
  mount() {
    console.log('mounting Counter')
    return super.mount()
  }
  
  patch(...args) {
    console.log('patching Counter')
    return super.patch(...args)
  }
  
  render() {
    return (
      h('div', { className: 'box' },
        h('h2', null, 'Child Component'),
        h('span', 
          { style: 'color: red' }, 
          `${this.props.label}...`
        ),
        `${this.count}...`,            
        h('button', { onclick: () => this.increment() }, 'Increment')
      )
    )
  }
}

class App extends Component {

  constructor() {
    super()
    this.label = 'Current count'
  }

  render() {
    return h('div', null,
      h('h1', null, 'Parent component'),
      h('input', { 
        style: 'color: red',
        value: this.label,
        oninput: (e) => {
          this.label = e.target.value
          this.updateUI()
        }
      }),
      h('hr'),
      h(Counter, { label: this.label })
    )
  }
}

document.body.appendChild(mount(h(App)));
```
