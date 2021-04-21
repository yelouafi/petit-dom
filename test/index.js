import jsdom from "jsdom";
const { JSDOM } = jsdom;

const { document, Node } = new JSDOM(`<!DOCTYPE html><body></body>`).window;
global.document = document;
global.Node = Node;

import "./mount.test.js";
import "./patch.test.js";
import "./range.test.js";
import "./select.test.js";
