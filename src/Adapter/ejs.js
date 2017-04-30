(function () {
  if (typeof penjs === 'undefined') {
    console.error("penjs is undefined");
    return;
  }

  /*<jdists encoding="fndep" import="../../node_modules/jnodes/lib/Adapter/ejs.js" depend="adapter_ejs">*/
  var adapter_ejs = require('../../node_modules/jnodes/lib/Adapter/ejs.js').adapter_ejs;
  /*</jdists>*/

  penjs.registerAdapter('ejs', function (binder) {
    binder.registerAdapter('ejs', function (templateCode, bindObjectName) {
      var code = penjs.Parser.build(penjs.Parser.parse(templateCode), bindObjectName, adapter_ejs);
      return ejs.compile(code);
    });
  });

})();