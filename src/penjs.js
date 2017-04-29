(function (exportName) {

  /*<jdists encoding="fndep" import="../node_modules/jnodes/jnodes.js" depend="Parser,Binder">*/
  var jnodes = require('../node_modules/jnodes/jnodes.js');
  var Binder = jnodes.Binder;
  var Parser = jnodes.Parser;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/jnodes/src/js/Compiler/jhtmls.js" depend="compiler_jhtmls">*/
  var compiler_jhtmls = require('../node_modules/jnodes/src/js/Compiler/jhtmls.js').compiler_jhtmls;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/jhtmls/jhtmls.js" depend="jhtmls_render">*/
  var jhtmls_render = require('../node_modules/jhtmls/jhtmls.js').render;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/h5tap/h5tap.js" depend="h5tap">*/
  var h5tap = require('../node_modules/h5tap/h5tap.js');
  /*</jdists>*/

  var penjs_guid = 0;

  /**
   * 创建 penjs 对象
   *
   * @param {Element|String} element 绑定的元素
   * @param {Object} options 配置项
   * @param {Object} options.data 数据
   * @param {Object} options.methods 方法
   * @example penjs:base
    ```html
    <header></header>
    <div>
      <script type="text/jhtmls">
      <ul>
        items.forEach(function (item) {
          <li :bind="item" :class="{selected: item.selected}" @click="item.selected = !item.selected">#{item.title}</li>
        });
      </ul>
      </script>
    </div>
    <section>
      <script type="text/ejs"></script>
    </section>
    <footer>
      <script></script>
    </footer>
    ```
    ```js
    penjs('div', {
      data: {
        items: [{
          title: 'a',
          selected: false,
        }, {
          title: 'b',
          selected: false,
        }]
      }
    });
    var div = document.querySelector('div');
    var li = div.querySelector('li');
    console.log(li.innerHTML.trim());
    // > a

    console.log(JSON.stringify(li.className));
    // > ""

    li.click();
    li = div.querySelector('li');
    console.log(JSON.stringify(li.className));
    // > "selected"

    penjs(div);
    penjs('none');
    penjs('header');
    penjs('footer script');
    penjs('section');
    ```
   * @example penjs:options is undefined
    ```html
    <div>
      <script type="text/jhtmls">
      var info = { title: 'example' };
      <div @click="info.title = 'success';">
        <h1 :bind="info">#{info.title}</h1>
      </div>
      </script>
    </div>
    ```
    ```js
    var pm = penjs('div');
    var div = document.querySelector('div');
    document.querySelector('h1').click();
    console.log(document.querySelector('h1').innerHTML.trim());
    // > success
    ```
   * @example penjs:methods
    ```html
    <div>
      <script type="text/jhtmls">
      var info = { title: 'example' };
      <div @click="change(info, title);">
        <h1 :bind="info">#{info.title}</h1>
      </div>
      </script>
    </div>
    ```
    ```js
    var pm = penjs('div', {
      methods: {
        change: function(info, title) {
          info.title = title;
        },
        title: 'success'
      }
    });
    var div = document.querySelector('div');
    document.querySelector('h1').click();
    console.log(document.querySelector('h1').innerHTML.trim());
    // > success
    ```
   * @example penjs:input
    ```html
    <div>
      <script type="text/jhtmls">
      var info = { title: '' };
      <input type="text" value="input"
        @input="info.title = this.value;"
        @keyup.esc="this.value = '';"
        @keyup.none="info.none = 0;"
      >
      <span :bind="info">#{info.title}</span>
      </script>
    </div>
    ```
    ```js
    var pm = penjs('div');
    var div = document.querySelector('div');

    var e = document.createEvent('HTMLEvents');
    e.initEvent('focusin', true, false);
    document.querySelector('input').dispatchEvent(e);
    document.querySelector('input').value = 'success';

    var e = document.createEvent('HTMLEvents');
    e.initEvent('input', true, false);
    document.querySelector('input').dispatchEvent(e);
    console.log(document.querySelector('span').innerHTML.trim());
    // > success

    var e = document.createEvent('HTMLEvents');
    e.initEvent('keyup', true, false);
    e.keyCode = 27;
    document.querySelector('input').dispatchEvent(e);
    console.log(JSON.stringify(document.querySelector('input').value));
    // > ""

    var e = document.createEvent('HTMLEvents');
    e.initEvent('focusout', true, false);
    document.querySelector('input').dispatchEvent(e);
    ```
   * @example penjs:init & ejs & tap
    ```html
    <div>
      <script type="text/ejs">
      <% var info = { title: 'example' }; %>
      <div @tap="change(info, title);">
        <h1 :bind="info"><%= info.title %></h1>
      </div>
      </script>
    </div>
    ```
    ```js
    var pm = penjs('div', {
      methods: {
        change: function(info, title) {
          info.title = title;
        },
        title: 'success'
      },
      init: function (binder) {
        binder.registerCompiler('ejs', function (templateCode, bindObjectName) {
          var code = penjs.Parser.build(penjs.Parser.parse(templateCode), bindObjectName, compiler_ejs);
          return ejs.compile(code);
        });
      }
    });
    var div = document.querySelector('div');

    var target = document.querySelector('h1');
    // ------ touchstart ------
    var e = document.createEvent('UIEvent');
    var point = [100, 100];
    e.touches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchstart', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ touchend ------
    var e = document.createEvent('UIEvent');
    var point = [100, 100];
    e.changedTouches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchend', true, true, window, 1);
    target.dispatchEvent(e);


    console.log(document.querySelector('h1').innerHTML.trim());
    // > success
    ```
   */
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

    var match = String(scriptElement.getAttribute('type')).match(/text\/([\w]+)/);
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

    function inputHandler(e) {
      binder.triggerScopeEvent(e);
    }

    ['click', 'dblclick', 'keydown', 'keyup', 'focusin', 'focusout', 'change'].forEach(function (eventName) {
      parentElement.addEventListener(eventName, function (e) {
        if (e.target.getAttribute(binder._eventAttributePrefix + 'input')) {
          if (eventName === 'focusin') {
            e.target.addEventListener('input', inputHandler);
          } else if (eventName === 'focusout') {
            e.target.removeEventListener('input', inputHandler);
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
      parentElement.innerHTML = templateRender(options.data);
      binder.$$scope.element = parentElement;
    }
    return options.data;
  };

  exports.Parser = Parser;

  /*<jdists encoding="fndep" import="../node_modules/h5ajax/h5ajax.js" depend="h5ajax_post,h5ajax_get,h5ajax_send">*/
  var h5ajax = require('../node_modules/h5ajax/h5ajax.js');
  var h5ajax_post = h5ajax.post;
  var h5ajax_get = h5ajax.get;
  var h5ajax_send = h5ajax.send;
  /*</jdists>*/
  exports.Ajax = {
    send: h5ajax_send,
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