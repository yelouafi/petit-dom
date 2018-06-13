const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { document } = new JSDOM(`<!DOCTYPE html><body></body>`).window;
global.document = document;

import "./h.test";
import "./mount.test";
import "./unmount.test";
import "./patch.test";
import "./select.test.js";
import "./range.test.js";
