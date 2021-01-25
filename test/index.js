import jsdom from "jsdom";
const { JSDOM } = jsdom;

const { document } = new JSDOM(`<!DOCTYPE html><body></body>`).window;
global.document = document;

import "./mount.test.js";
import "./patch.test.js";
import "./range.test.js";
import "./select.test.js";
