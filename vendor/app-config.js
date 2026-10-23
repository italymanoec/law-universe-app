/* Change the product name here, then run: python3 tools/finalize-musk.py */
window.LAWU_CONFIG = Object.freeze({name: 'LEXO'});
(function () {
  function apply() {
    const name = window.LAWU_CONFIG.name;
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!['SCRIPT','STYLE'].includes(node.parentElement?.tagName)) node.textContent = node.textContent.replaceAll('{{APP_NAME}}', name);
    }
    document.querySelectorAll('[aria-label],meta[content]').forEach(el => {
      for (const attr of ['aria-label','content']) if (el.hasAttribute(attr)) el.setAttribute(attr, el.getAttribute(attr).replaceAll('{{APP_NAME}}', name));
    });
  }
  document.addEventListener('DOMContentLoaded', apply);
})();
