const each = (arrLike, fn) => {
  for (var i = 0; i < arrLike.length; i++) {
    fn(arrLike[i], i, arrLike);
  }
};

const indexOf = [].indexOf;
const slice = [].slice;

export default function getObserver(selector) {
  var target;
  var config = { attributes: true, childList: true, characterData: true };
  var prevNodes = [];

  var observer = new MutationObserver(function(mutations) {
    var allNodes = target.childNodes;
    var addedNodes = [];
    //console.log(selector, prevNodes);
    mutations.forEach(function(mutation) {
      observer.disconnect();
      if (mutation.type === "childList") {
        each(mutation.addedNodes, node => addedNodes.push(node));
      }
    });
    observer.disconnect();
    each(prevNodes, node => {
      node.classList.toggle("inserted", false);
      node.classList.toggle("moved", false);
      node.classList.toggle("old", true);
      node.classList.toggle("lcs", true);
    });
    each(addedNodes, node => {
      if (indexOf.call(prevNodes, node) < 0) {
        node.classList.toggle("inserted", true);
      } else {
        node.classList.toggle("moved", true);
        node.classList.toggle("lcs", false);
      }
    });
    prevNodes = slice.call(allNodes);
    observer.observe(target, config);
  });

  return function observeDiffs() {
    target = document.querySelector(selector);
    observer.observe(target, config);
  };
}
