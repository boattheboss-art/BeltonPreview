(function () {
  const base = new URL(document.baseURI).pathname.replace(/\/$/, '');
  window.beltonUrl = function (value) {
    return base + '/' + value.replace(/^\/+/, '');
  };
})();
