const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { document } = new JSDOM(`<!DOCTYPE html><body></body>`).window;
global.document = document;

import "./mount.test";
import "./patch.test";
