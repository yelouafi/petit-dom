const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { document } = new JSDOM(`<!DOCTYPE html><body></body>`).window;
global.document = document;

import "./utils.test";
import "./mount.test";
import "./patch.test";
import "./range.test";
import "./select.test";
