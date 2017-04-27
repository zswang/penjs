(function (exportName) {

  /*<jdists encoding="fndep" import="../node_modules/jnodes/jnodes.js" depend="Parser,Binder">*/
  var jnodes = require('../node_modules/jnodes/jnodes.js');
  var Binder = jnodes.Binder;
  var Parser = jnodes.Parser;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/jnodes/src/js/Compiler/jhtmls.js" depend="compiler_jhtmls">*/
  var compiler_jhtmls = require('../node_modules/jnodes/src/js/Compiler/jhtmls.js');
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/jhtmls/jhtmls.js" depend="jhtmls_render">*/
  var jhtmls_render = require('../node_modules/jhtmls/jhtmls.js').render;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/h5tap/h5tap.js" depend="h5tap">*/
  var h5tap = require('../node_modules/h5tap/h5tap.js');
  /*</jdists>*/

  var penjs_guid = 0;

  var exports = function (element, options) {
    options = options || {};
    options.data = options.data || {};
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) {
      return;
    }
    var parentElement;
    var scriptElement;

    if (/script/i.test(element.tagName)) {
      scriptElement = element;
      parentElement = element.parentNode;
    } else {
      scriptElement = element.querySelector('script');
      parentElement = element;
    }
    if (!scriptElement || !parentElement) {
      return;
    }

    var match = scriptElement.getAttribute('type').match(/text\/([\w]+)/);
    if (!match) {
      return;
    }

    function findEventTarget(parent, target, selector) {
      var elements = [].slice.call(parent.querySelectorAll(selector));
      while (target && elements.indexOf(target) < 0) {
        target = target.parentNode;
      }
      return target;
    }

    /**
     * 绑定方法的执行对象
     *
     * @param {Object} methods
     * @param {Object} data
     */
    function methodsBind(methods, data) {
      if (!methods) {
        return;
      }
      var result = {};
      Object.keys(methods).forEach(function (key) {
        var value = methods[key];
        if (typeof value === 'function') {
          result[key] = function () {
            value.apply(data, arguments);
          };
        } else {
          result[key] = value;
        }
      });
      return result;
    }
    var binderName = 'binder' + (penjs_guid++).toString(36);
    var binder = penjs[binderName] = new Binder({
      bindObjectName: 'penjs.' + binderName,
      imports: methodsBind(options.methods, options.data),
    });

    if (typeof options.init === 'function') {
      options.init.call(options.data, binder);
    }

    ['click', 'dblclick', 'keydown', 'keyup', 'focusin', 'focusout', 'change'].forEach(function (eventName) {
      parentElement.addEventListener(eventName, function (e) {
        if (e.target.getAttribute(binder._eventAttributePrefix + 'input')) {
          if (eventName === 'focusin') {
            e.target.addEventListener('input', function (e) {
              binder.triggerScopeEvent(e);
            });
          } else if (eventName === 'focusout') {
            e.target.removeEventListener('input', function (e) {
              binder.triggerScopeEvent(e);
            });
          }
        }

        var target = findEventTarget(parentElement, e.target, '[' + binder._eventAttributePrefix + eventName + ']');
        if (!target) {
          return;
        }
        binder.triggerScopeEvent(e, target);
      });
    });

    h5tap(parentElement, '[' + binder._eventAttributePrefix + 'tap]', function (element, e) {
      binder.triggerScopeEvent({ type: 'tap', target: element });
    });

    function keyChecker(event, trigger) {
      return ({
        esc: [27],
        tab: [9],
        enter: [13],
        space: [32],
        up: [38],
        left: [37],
        right: [39],
        down: [40],
        delete: [8, 46],
      }[trigger] || []).indexOf(event.keyCode) >= 0;
    }

    binder.registerChecker('keyup', keyChecker);
    binder.registerChecker('keydown', keyChecker);

    binder.registerCompiler('jhtmls', function (templateCode, bindObjectName) {
      var code = Parser.build(Parser.parse(templateCode), bindObjectName, compiler_jhtmls);
      return jhtmls_render(code);
    });
    var templateType = match[1];
    var templateRender = binder.templateCompiler(templateType, scriptElement.innerHTML);

    if (templateRender) {
      parentElement.innerHTML = templateRender(options.data || {});
    }
    binder.$$scope.element = parentElement;
    return options.data;
  };

  exports.Parser = Parser;

  /*<jdists encoding="fndep" import="../node_modules/h5ajax/h5ajax.js" depend="h5ajax_post,h5ajax_get">*/
  var h5ajax = require('../node_modules/h5ajax/h5ajax.js');
  var h5ajax_post = h5ajax.post;
  var h5ajax_get = h5ajax.get;
  /*</jdists>*/
  exports.Ajax = {
    post: h5ajax_post,
    get: h5ajax_get,
  };

  /* istanbul ignore next */
  if (typeof define === 'function') {
    if (define.amd || define.cmd) {
      define(function () {
        return exports;
      });
    }
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  } else {
    window[exportName] = exports;
  }
})('penjs');