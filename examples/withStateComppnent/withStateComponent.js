export function withState(view, getInitialState) {
  return {
    mount(me) {
      me.setState = (updater) => {
        let newState = updater(me.state, me.props);
        if (newState !== me.state) {
          me.state = newState;
          me.render(view(me.props, me.state, me.setState));
        }
      };
      me.setState((_, props) => getInitialState(props));
    },
    patch(me) {
      me.render(view(me.props, me.state, me.setState));
    },
  };
}
