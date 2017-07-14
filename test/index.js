const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { document } = new JSDOM(`<!DOCTYPE html><body></body>`).window;
global.document = document;

require("./h.test");
require("./mount.test");
