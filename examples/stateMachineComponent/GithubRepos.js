import { h } from "../../src/index.js";
import { createSMComponent } from "./stateMachineComponent.js";
import debounce from "https://unpkg.com/lodash-es@4.17.20/debounce.js";

/**
 *  type State =
 *      { tag: "IDLE" }
 *    | { tag: "REQUEST_PENDING", user: string }
 *    | { tag: "REQUEST_SUCCESS", user: string, repos: Array<Repo> }
 *    | { tag: "REQUEST_ERROR", user: string, error: string }
 *
 *  type Event =
 *      { tag: "USER_CHANGED", input: string }
 *    | { tag: "RESPONSE_SUCCESS", user: string, repos: Array<Repo> }
 *    | { tag: "RESPONSE_ERROR", user: string, error: string }
 */

const initState = { tag: "IDLE" };

const transitions = {
  IDLE: {
    USER_CHANGED(_, { user }) {
      return { tag: "REQUEST_PENDING", user };
    },
    RESPONSE_SUCCESS(state, _) {
      return state;
    },
    RESPONSE_ERROR(state, _) {
      return state;
    },
  },
  REQUEST_PENDING: {
    USER_CHANGED(_, { user }) {
      return { tag: "REQUEST_PENDING", user };
    },
    RESPONSE_SUCCESS(state, { user, repos }) {
      if (state.user === user) {
        return { tag: "REQUEST_SUCCESS", user, repos };
      } else {
        return state;
      }
    },
    RESPONSE_ERROR(state, { user, error }) {
      if (state.user === user) {
        return { tag: "REQUEST_ERROR", user, error };
      } else {
        return state;
      }
    },
  },
  REQUEST_SUCCESS: {
    USER_CHANGED(_, { user }) {
      return { tag: "REQUEST_PENDING", user };
    },
    RESPONSE_SUCCESS(state, _) {
      return state;
    },
    RESPONSE_ERROR(state, _) {
      return state;
    },
  },
  REQUEST_ERROR: {
    USER_CHANGED(_, { user }) {
      return { tag: "REQUEST_PENDING", user };
    },
    RESPONSE_SUCCESS(state, _) {
      return state;
    },
    RESPONSE_ERROR(state, _) {
      return state;
    },
  },
};

function update(_, state, event) {
  if (state === undefined) return initState;
  if (event.tag === "USER_CHANGED" && event.user === "") return { tag: "IDLE" };
  // console.log("new event", state, event);
  let tr = transitions[state.tag][event.tag];
  if (tr != null) {
    return tr(state, event);
  } else {
    return state;
  }
}

async function output(_, state, emit) {
  if (state.tag === "REQUEST_PENDING") {
    const response = await fetch(
      `https://api.github.com/users/${state.user}/repos`
    );
    const body = await response.json();
    if (response.ok) {
      emit({ tag: "RESPONSE_SUCCESS", user: state.user, repos: body });
    } else {
      emit({ tag: "RESPONSE_ERROR", user: state.user, error: body.message });
    }
  }
}

function view(_, state, emit) {
  return h(
    "div",
    null,
    h("h1", null, "Github Repos example"),
    h(
      "label",
      { for: "input" },
      "Username",
      h("input", {
        id: "input",
        value: state.user ?? "",
        placeholder: "Enter github username",
        onInput: debounce((event) => {
          let user = event.target.value.trim();
          if (user !== state.user) {
            emit({ tag: "USER_CHANGED", user });
          }
        }, 1000),
      }),
      h("hr"),
      state.tag === "IDLE"
        ? "No request yet"
        : state.tag === "REQUEST_PENDING"
        ? `Fetching repos for ${state.user}`
        : state.tag === "REQUEST_SUCCESS"
        ? state.repos.map((repo) => h(Repo, { repo }))
        : `Error: ${state.error}`
    )
  );
}

function Repo({ repo }) {
  return h(
    "div",
    { class: "box" },
    h("a", { href: repo.html_url }, h("h3", null, repo.name)),
    h("p", null, repo.description)
  );
}

export const GithubRepos = createSMComponent({
  view,
  update,
  output,
});
