# Github repos example

This example demonstrates how to create a custom component that can instantiate a state machine with output.

Each state machine needs to define 3 functions

```js
  {
    // render an UI VNode
    render(props, state, emit) => VNode
    // transition to a new state
    update(props, state, event) => state
    // Execute side effects after a state transition
    output(props, state, event, emit) => void
  }
```
