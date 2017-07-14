//import { LOG } from "./utils";

var ref = {
  queue: [],
  cbs: []
};
var updateScheduled = false;

export function scheduleUpdate(comp, cb) {
  ref.queue.push(comp);
  if (cb) ref.cbs.push([cb, comp]);
  if (!updateScheduled) {
    updateScheduled = true;
    //LOG("scheduling frame");
    requestAnimationFrame(() => {
      flush();
      updateScheduled = false;
    });
  }
}

function flush() {
  //LOG("begin flush");
  var end = false;
  while (!end) {
    while (ref.queue.length) {
      var _queue = ref.queue;
      ref.queue = [];
      for (var i = 0; i < _queue.length; i++) {
        const comp = _queue[i];
        comp._perform();
      }
    }
    var _cbs = ref.cbs;
    ref.cbs = [];
    for (i = 0; i < _cbs.length; i++) {
      const [cb, comp] = _cbs[i];
      cb.call(comp);
    }
    // check for post-cb updates
    if (!ref.queue.length) {
      end = true;
    } else {
      //LOG("flush: another pass");
    }
  }
  //LOG("end flush");
}
