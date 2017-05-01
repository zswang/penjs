(function () {
  if (typeof penjs === 'undefined') {
    console.error("penjs is undefined");
    return;
  }
  /*<function name="adapter_ejs">*/
/**
 * EJS 处理
 *
 * @param node
 * @param bindObjectName
 * @example adapter_ejs:base1
  ```html
  <div>
    <script type="text/ejs">
    <h1 :class="{book: Math.random() > 0.5}">Books</h1>
    <ul :bind="books" @create="books.loaded = 'done'">
    <% books.forEach(function (book) { %>
      <li :bind="book">
        <:template name="book"/>
      </li>
    <% }); %>
    </ul>
    </script>
  </div>
  <script type="text/ejs" id="book">
  <a :href="id"><%= title %></a>
  </script>
  ```
  ```js
  jnodes.binder = new jnodes.Binder();
  var books = [{id: 1, title: 'book1'}, {id: 2, title: 'book2'}, {id: 3, title: 'book3'}];
  jnodes.binder.registerAdapter('ejs', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, adapter_ejs);
    return ejs.compile(code);
  });
  var bookRender = jnodes.binder.templateAdapter('ejs', document.querySelector('#book').innerHTML);
  jnodes.binder.registerTemplate('book', function (scope) {
    return bookRender(scope.model);
  });
  var div = document.querySelector('div');
  div.innerHTML = jnodes.binder.templateAdapter('ejs', div.querySelector('script').innerHTML)({
    books: books
  });
  var rootScope = jnodes.binder.$$scope;
  rootScope.element = null;
  rootScope.element = div;
  console.log(rootScope.element === div);
  // > true
  console.log(div.querySelector('ul li a').innerHTML);
  // > book1
  books[0].title = 'Star Wars';
  console.log(div.querySelector('ul li a').innerHTML);
  // > Star Wars
  books[0].title = 'Jane Eyre';
  console.log(div.querySelector('ul li a').innerHTML);
  // > Jane Eyre
  console.log(jnodes.binder.scope(div) === rootScope);
  // > true
  console.log(jnodes.binder.scope(div.querySelector('ul li a')).model.id === 1);
  // > true
  books.shift();
  console.log(jnodes.binder.scope(div.querySelector('ul li a')).model.id === 2);
  // > true
  ```
 * @example adapter_ejs:base2
  ```html
  <div>
    <script type="text/ejs">
    <ul :bind="books" :data-length="books.length" @create="books.loaded = 'done'" class="books">
    <% books.forEach(function (book) { %>
      <li :bind="book" @click="book.star = !book.star" class="" :class="{star: book.star}">
        <a :href="'/' + book.id" :bind="book.title"><%= book.title %></a>
        <span :bind="book.id" :data-star="book.star"><%= book.id %></span>
      </li>
    <% }); %>
    </ul>
    </script>
  </div>
  ```
  ```js
  jnodes.binder = new jnodes.Binder({});
  var books = [{id: 1, title: 'book1', star: false}, {id: 2, title: 'book2', star: false}, {id: 3, title: 'book3', star: false}];
  jnodes.binder.registerAdapter('ejs', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, adapter_ejs);
    return ejs.compile(code);
  });
  var div = document.querySelector('div');
  div.innerHTML = jnodes.binder.templateAdapter('ejs', div.querySelector('script').innerHTML)({
    books: books
  });
  var rootScope = jnodes.binder.$$scope;
  rootScope.element = div;
  console.log(books.loaded);
  // > done
  console.log(JSON.stringify(jnodes.binder.scope(div.querySelector('ul li a')).model));
  // > "book1"
  console.log(JSON.stringify(jnodes.binder.scope(div.querySelector('ul li span')).model));
  // > 1
  books.shift();
  console.log(JSON.stringify(jnodes.binder.scope(div.querySelector('ul li a')).model));
  // > "book2"
  function findEventTarget(parent, target, selector) {
    var elements = [].slice.call(parent.querySelectorAll(selector));
    while (target && elements.indexOf(target) < 0) {
      target = target.parentNode;
    }
    return target;
  }
  ['click'].forEach(function (eventName) {
    document.addEventListener(eventName, function (e) {
      if (e.target.getAttribute('data-jnodes-event-input')) {
        if (eventName === 'focusin') {
          e.target.addEventListener('input', triggerScopeEvent)
        } else if (eventName === 'focusout') {
          e.target.removeEventListener('input', triggerScopeEvent)
        }
      }
      var target = findEventTarget(document, e.target, '[data-jnodes-event-' + eventName + ']');
      if (!target) {
        return;
      }
      jnodes.binder.triggerScopeEvent(e, target);
    })
  });
  var li = div.querySelector('ul li');
  li.click();
  var li = div.querySelector('ul li');
  console.log(li.className);
  // > star
  ```
 * @example adapter_ejs:base3
  ```js
  var node = {
    tag: ':template'
  };
  adapter_ejs(node);
  console.log(JSON.stringify(node));
  // > {"tag":":template"}
  ```
 * @example adapter_ejs:base4
  ```js
  var node = {
    tag: ':template',
    attrs: [{
      name: 'class',
      value: 'book'
    }]
  };
  adapter_ejs(node);
  console.log(JSON.stringify(node));
  // > {"tag":":template","attrs":[{"name":"class","value":"book"}]}
  ```
 * @example adapter_ejs:base5
  ```js
  var node = {
    tag: 'span',
    attrs: [{
      name: 'class',
      value: 'book',
    }]
  };
  adapter_ejs(node);
  console.log(JSON.stringify(node));
  // > {"tag":"span","attrs":[{"name":"class","value":"book"}]}
  ```
 * @example adapter_ejs:base keyup.enter
  ```html
  <div>
    <script type="text/ejs">
    <input type="text" @keyup.enter="pos.x = parseInt(this.value)" value="-1">
    <div><button :bind="pos" @click="pos.x++">plus <%= pos.x %></button></div>
    </script>
  </div>
  ```
  ```js
  var data = {
    tag: 'x',
    pos: {
      x: 1,
    }
  };
  var div = document.querySelector('div');
  var binder = jnodes.binder = new jnodes.Binder();
  binder.registerAdapter('ejs', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, adapter_ejs);
    return ejs.compile(code);
  });
  div.innerHTML = binder.templateAdapter('ejs', div.querySelector('script').innerHTML)(data);
  var rootScope = binder.$$scope;
  rootScope.element = div;
  function keyChecker(event, trigger) {
    switch (trigger) {
      case 'enter':
        return event.keyCode === 13;
      case 'esc':
        return event.keyCode === 27;
    }
  }
  binder.registerChecker('keyup', keyChecker);
  function findEventTarget(parent, target, selector) {
    var elements = [].slice.call(parent.querySelectorAll(selector));
    while (target && elements.indexOf(target) < 0) {
      target = target.parentNode;
    }
    return target;
  }
  ['keydown', 'keyup'].forEach(function (eventName) {
    div.addEventListener(eventName, function (e) {
      var target = findEventTarget(div, e.target, '[' + binder._eventAttributePrefix + eventName + ']');
      if (!target) {
        return;
      }
      binder.triggerScopeEvent(e, target);
    })
  })
  var e = document.createEvent('HTMLEvents');
  e.initEvent('keyup', true, false);
  e.keyCode = 13;
  document.querySelector('input').dispatchEvent(e);
  console.log(document.querySelector('button').innerHTML.trim());
  // > plus -1
  ```
 * @example adapter_ejs:base depend
  ```html
  <div>
    <script type="text/ejs">
    <div :bind="books">
      <h4><%= books.filter(function (book) { return book.star; }).length %></h4>
      <ul>
      <% books.forEach(function (book) { %>
        <li :depend="book">#{book.title}</li>
      <% }); %>
      </ul>
    </script>
  </div>
  ```
  ```js
  var data = {
    books: [{
      title: 'a',
      star: false,
    },{
      title: 'b',
      star: false,
    }]
  };
  var div = document.querySelector('div');
  var binder = jnodes.binder = new jnodes.Binder();
  jnodes.binder.registerAdapter('ejs', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, adapter_ejs);
    return ejs.compile(code);
  });
  div.innerHTML = jnodes.binder.templateAdapter('ejs', div.querySelector('script').innerHTML)(data);
  var rootScope = jnodes.binder.$$scope;
  rootScope.element = div;
  data.books[0].star = true;
  console.log(div.querySelector('h4').innerHTML);
  // > 1
  data.books[1].star = true;
  console.log(div.querySelector('h4').innerHTML);
  // > 2
  ```
   */
function adapter_ejs(node, bindObjectName) {
    var indent = node.indent || '';
    var inserFlag = "/***/ ";
    if (node.type === 'root') {
        node.beforebegin = "<%" + indent + inserFlag + "var _rootScope_ = " + bindObjectName + ".bind(locals, { root: true }, null, function (__output, _scope_) { var __append = __output.push.bind(__output); %>";
        node.afterend = "<%" + indent + inserFlag + "}); _rootScope_.innerRender(__output); " + bindObjectName + ".$$scope = _rootScope_;%>";
        return;
    }
    if (!node.tag) {
        return;
    }
    if (!node.attrs || !node.attrs.length) {
        return;
    }
    if (node.tag === ':template') {
        node.attrs.some(function (attr) {
            if (attr.name === 'name') {
                node.overwriteNode = "<%" + indent + inserFlag + "__append(" + bindObjectName + ".templateRender(" + JSON.stringify(attr.value) + ", _scope_, " + bindObjectName + ".bind)); %>";
                return true;
            }
        });
        return;
    }
    var varintAttrs = "<%" + indent + inserFlag + "var _attrs_ = [\n";
    var hasOverwriteAttr;
    node.attrs.forEach(function (attr) {
        var value;
        if (attr.name[0] === ':') {
            if (attr.name === ':bind') {
                node.beforebegin = "<%" + indent + inserFlag + bindObjectName + ".bind(" + attr.value + ", _scope_, function (__output, _scope_, holdInner) { var __append = __output.push.bind(__output); %>";
                node.beforeend = "<%" + indent + inserFlag + "_scope_.innerRender = function(__output) { var __append = __output.push.bind(__output); %>";
                node.afterbegin = "<%" + indent + inserFlag + "}; if (holdInner) { _scope_.innerRender(__output); }%>";
                node.afterend = "<%" + indent + inserFlag + "}).outerRender(__output, true); %>";
            }
            else if (attr.name === ':depend') {
                node.beforebegin = "<%" + indent + inserFlag + bindObjectName + ".depend(" + attr.value + ", _scope_, function (__output, _scope_) { var __append = __output.push.bind(__output); %>";
                node.afterend = "<%" + indent + inserFlag + "}).outerRender(__output); %>";
            }
            hasOverwriteAttr = true;
            value = attr.value;
        }
        else if (attr.name[0] === '@') {
            var arr = attr.name.split('.');
            var trigger = arr[1];
            if (trigger) {
                value = "function (event) { if (" + bindObjectName + ".eventChecker(event, " + JSON.stringify(trigger) + ")) { with (" + bindObjectName + "._imports || {}) { " + attr.value + " }}}";
            }
            else {
                value = "function (event) { with (" + bindObjectName + "._imports || {}) { " + attr.value + " }}";
            }
            hasOverwriteAttr = true;
        }
        else {
            value = JSON.stringify(attr.value);
        }
        varintAttrs += "" + indent + inserFlag + "{ name: " + JSON.stringify(attr.name) + ", value: " + value + ", quoted: " + JSON.stringify(attr.quoted) + "},\n";
    });
    if (!hasOverwriteAttr) {
        return;
    }
    node.beforebegin = node.beforebegin || "";
    varintAttrs += "" + indent + inserFlag + "];%>";
    node.beforebegin += varintAttrs;
    node.overwriteAttrs = "<%- " + bindObjectName + "._attrsRender(_scope_, _attrs_, { tag: " + JSON.stringify(node.tag) + ", id: " + JSON.stringify(node.id) + " }) %>";
} /*</function>*/
  penjs.registerAdapter('ejs', function (binder) {
    binder.registerAdapter('ejs', function (templateCode, bindObjectName) {
      var code = penjs.Parser.build(penjs.Parser.parse(templateCode), bindObjectName, adapter_ejs);
      return ejs.compile(code);
    });
  });
})();