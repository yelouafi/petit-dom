# petit-dom

A minimalist virtual DOM library. 

Diff algorithm is based on pre-optimizations described at
https://neil.fraser.name/writing/diff/ and the algorithm presented
in the paper ["An O(ND) Difference Algorithm and Its Variations](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf). There is also [an excellent article](https://www.codeproject.com/Articles/42279/Investigating-Myers-diff-algorithm-Part-of) which explains how the algorithm works. The article includes a GUI application to play
with the algorithm


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

Custom component should be used for cases when you need better control over real DOM. For example, to interface video
object, insert component, written with different framework, or simply optimise part of the application, that changes frequently.

Custom component defined as an object with 3 methods:
- `mount(props, children)` is called right after component first mounted; Expected to return HTML Node to be inserted to DOM;
- `patch(HTMLNode, newProps, oldProps, newChildren, oldChildren)` called each time props or children change;
- `unmount(HTMLNode)` called when component is about to be unmounted.

As of now, custom components are stateless. The only "common ground" between method calls is HTML Node element itself.

Here are few examples.

Clock component:

```js
/* @jsx h */
import {h, mount} from 'petit-dom';

const updateTime = node => {
	const time = new Date,
		hours = ('' + time.getHours()).padStart(2, '0'),
		minutes = ('' + time.getMinutes()).padStart(2, '0'),
		sep = time.getSeconds() % 2 === 0 ? ':' : ' ';

	node.innerHTML = [hours, sep, minutes].join('');
};

const Clock = {
	mount(props, children) {
		// Create DOM element manually
		const node = document.createElement('pre');
		// Set-up contents
		updateTime(node);
		// Make sure time will update regularly
		node.interval = setInterval(() => updateTime(node), 1000);
		// Output element to be inserted to real DOM
		return node;
	},
	patch(node, newProps, oldProps, newChildren, oldChildren) {
		// Do nothing, as we have no dependencies on props or children
	},
	unmount(node) {
		// Prevent memory leaks
		clearInterval(node.interval);
	}
};

const vnode = (
	<Clock />
);

document.body.appendChild(mount(vnode));
```

Use string templates for component:

```js
/* @jsx h */
import {h, mount, patch} from 'petit-dom';
import template from 'lodash/template';

const myTemplate = template(`
<h1><%- title %></h1>
<div id="child-container"></div>
`);

const TemplateComponent = {
	mount(props, children) {
		// Create a wrapper
		const node = document.createElement('div');
		// Populate it with template
		node.innerHTML = myTemplate(props);
		// Insert children
		if (children) {
			const childHolder = node.querySelector('#child-container');
			if (childHolder) {
				childHolder.appendChild(mount(children));
			}
		}

		return node;
	},
	patch(node, newProps, oldProps, newChildren, oldChildren) {
		if (newProps !== oldProps) {
			// Update with template
			node.innerHTML = myTemplate(newProps);
		}

		if (newChildren !== oldChildren) {
			// update children v-dom
			if (newProps !== oldProps) {
				if (newChildren) {
					// Have to re-mount anyway
					const childHolder = node.querySelector('#child-container');
					if (childHolder) {
						childHolder.appendChild(mount(newChildren));
					}
				}
			} else {
				// Only update children
				const childHolder = node.querySelector('#child-container');
				if (childHolder) {
					patch(newChildren, oldChildren, childHolder);
				}
			}
		}
	},
	unmount(node) {
		// Nothing to do
	}
};

const vnode = (
	<TemplateComponent title="My title">
		<div>
			<p>And some child v-dom</p>
			<p>Just to make it interesting</p>
		</div>
	</TemplateComponent>
);

document.body.appendChild(mount(vnode));
```
