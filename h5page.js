(function (exportName) {
  /*<function name="parser_void_elements">*/
var parser_void_elements = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen',
    'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
]; /*</function>*/
/*<function name="parser_tokenizer" depend="parser_void_elements">*/
function parser_tokenizer(code) {
    var resultNodes = [];
    /**
     * 当前扫描起始位置
     */
    var scanpos = 0;
    function pushToken(type, pos, endpos) {
        if (endpos <= pos) {
            return;
        }
        var node = {
            type: type,
            pos: pos,
            endpos: endpos,
        };
        if (type === 'text' || type === 'comment') {
            node.value = code.slice(pos, endpos);
        }
        scanpos = endpos;
        resultNodes.push(node);
        return node;
    }
    while (scanpos < code.length) {
        var match = code.slice(scanpos).match(/([^\S\n]*)(?:<(!--)|<\/(:?[\w_]+[\w_-]*[\w_]|[\w_]+)\s*>|<(:?[\w_]+[\w_-]*[\w_]|[\w_]+)\s*)/);
        if (!match) {
            break;
        }
        pushToken('text', scanpos, scanpos + match.index); // 记录 text
        var offset = match[0].length;
        var indent = match[1];
        if (match[2]) {
            match = code.slice(scanpos + offset).match(/-->/);
            if (!match) {
                var node_1 = pushToken('comment', scanpos, code.length);
                node_1.indent = indent;
                break;
            }
            offset += match.index + match[0].length;
            var node_2 = pushToken('comment', scanpos, scanpos + offset);
            node_2.indent = indent;
            continue;
        }
        var tag = match[3];
        if (tag) {
            var node_3 = pushToken('right', scanpos, scanpos + offset);
            node_3.tag = tag;
            node_3.indent = indent;
            continue;
        }
        // "<tag"
        tag = match[4];
        var attrs = [];
        // find attrs
        while (true) {
            // find attrName
            match = code.slice(scanpos + offset).match(/^\s*([:@]?[\w_]+[\w_\-.]*[\w_]|[\w_]+)\s*/);
            if (!match) {
                break;
            }
            offset += match[0].length;
            var attrName = match[1];
            var attrValue = '';
            var quoted = '';
            // find attrValue
            match = code.slice(scanpos + offset).match(/^\s*=\s*((')([^']*)'|(")([^"]*)"|([^'"\s\/>]+))\s*/);
            if (match) {
                offset += match[0].length;
                attrValue = match[1];
                quoted = match[2] || match[4] || '';
            }
            switch (quoted) {
                case '"':
                case "'":
                    attrValue = attrValue.slice(1, -1);
                    break;
            }
            attrs.push({
                name: attrName,
                value: attrValue,
                quoted: quoted,
            });
        }
        match = code.slice(scanpos + offset).match(/^\s*(\/?)>/);
        if (!match) {
            break;
        }
        offset += match[0].length;
        var single = match[1] || parser_void_elements.indexOf(tag) >= 0;
        var node = pushToken(single ? 'single' : 'left', scanpos, scanpos + offset);
        node.tag = tag;
        node.attrs = attrs;
        node.indent = indent;
        node.selfClosing = parser_void_elements.indexOf(tag) >= 0;
    }
    pushToken('text', scanpos, code.length); // 记录 text
    return resultNodes;
} /*</function>*/
/*<function name="parser_parse" depend="parser_tokenizer">*/
/**
 * 解析 HTML 代码
 *
 * @param code
 * @return 返回根节点
 * @example parser_parse:base
  ```js
  var node = jnodes.Parser.parse(`<!--test--><div class="box"></div>`);
  console.log(JSON.stringify(node));
  // > {"type":"root","pos":0,"endpos":34,"children":[{"type":"comment","pos":0,"endpos":11,"value":"<!--test-->","indent":""},{"type":"block","pos":11,"endpos":34,"tag":"div","attrs":[{"name":"class","value":"box","quoted":"\""}],"indent":"","selfClosing":false,"children":[]}]}
  ```
 * @example parser_parse:text
  ```js
  var node = jnodes.Parser.parse(`hello`);
  console.log(JSON.stringify(node));
  // > {"type":"root","pos":0,"endpos":5,"children":[{"type":"text","pos":0,"endpos":5,"value":"hello"}]}
  ```
 * @example parser_parse:comment not closed.
  ```js
  var node = jnodes.Parser.parse(`<!--hello`);
  console.log(JSON.stringify(node));
  // > {"type":"root","pos":0,"endpos":9,"children":[{"type":"comment","pos":0,"endpos":9,"value":"<!--hello","indent":""}]}
  ```
 * @example parser_parse:attribute is emtpy
  ```js
  var node = jnodes.Parser.parse(`<div><input type=text readonly></div>`);
  console.log(JSON.stringify(node));
  // > {"type":"root","pos":0,"endpos":37,"children":[{"type":"block","pos":0,"endpos":37,"tag":"div","attrs":[],"indent":"","selfClosing":false,"children":[{"type":"single","pos":5,"endpos":31,"tag":"input","attrs":[{"name":"type","value":"text","quoted":""},{"name":"readonly","value":"","quoted":""}],"indent":"","selfClosing":true}]}]}
  ```
 * @example parser_parse:tag not closed
  ```js
  var node = jnodes.Parser.parse(`<input type=text readonly`);
  console.log(JSON.stringify(node));
  // > {"type":"root","pos":0,"endpos":25,"children":[{"type":"text","pos":0,"endpos":25,"value":"<input type=text readonly"}]}
  ```
 * @example parser_parse:tag asymmetric
  ```js
  var node = jnodes.Parser.parse(`<div><span></div></span>`);
  console.log(JSON.stringify(node));
  // * throw
  ```
 * @example parser_parse:tag asymmetric
  ```js
  var node = jnodes.Parser.parse(`<section><div></div>\n</span>`);
  console.log(JSON.stringify(node));
  // * throw
  ```
 * @example parser_parse:tag nesting
  ```js
  var node = jnodes.Parser.parse(`<div><div><div></div><div></div></div></div>`);
  console.log(JSON.stringify(node));
  // > {"type":"root","pos":0,"endpos":44,"children":[{"type":"block","pos":0,"endpos":44,"tag":"div","attrs":[],"indent":"","selfClosing":false,"children":[{"type":"block","pos":5,"endpos":38,"tag":"div","attrs":[],"indent":"","selfClosing":false,"children":[{"type":"block","pos":10,"endpos":21,"tag":"div","attrs":[],"indent":"","selfClosing":false,"children":[]},{"type":"block","pos":21,"endpos":32,"tag":"div","attrs":[],"indent":"","selfClosing":false,"children":[]}]}]}]}
  ```
 */
function parser_parse(code) {
    var root = {
        type: 'root',
        pos: 0,
        endpos: code.length,
        children: []
    };
    var current = root;
    var tokens = parser_tokenizer(code);
    /*<debug>
    console.log(JSON.stringify(tokens, null, '  '))
    //</debug>*/
    var lefts = []; // 左边标签集合，用于寻找配对的右边标签
    tokens.forEach(function (token) {
        switch (token.type) {
            case 'comment':
            case 'single':
            case 'text':
                current.children.push(token);
                current.endpos = token.endpos;
                break;
            case 'left':
                token.children = [];
                lefts.push(token);
                current.children.push(token);
                current = token;
                break;
            case 'right':
                var buffer = void 0;
                var line = void 0;
                var col = void 0;
                var error = void 0;
                if (lefts.length <= 0) {
                    buffer = code.slice(0, token.endpos).split('\n');
                    line = buffer.length;
                    col = buffer[buffer.length - 1].length + 1;
                    /*<debug>*/
                    lightcode(buffer, 5);
                    /*</debug>*/
                    error = 'No start tag. (line:' + token.line + ' col:' + token.col + ')';
                    console.error(error);
                    throw error;
                }
                for (var i = lefts.length - 1; i >= 0; i--) {
                    var curr = lefts[i];
                    var prev = lefts[i - 1];
                    if (curr.tag === token.tag) {
                        curr.type = 'block';
                        curr.endpos = token.endpos;
                        if (prev) {
                            current = prev;
                        }
                        else {
                            current = root;
                        }
                        current.endpos = curr.endpos;
                        lefts = lefts.slice(0, i);
                        break;
                    }
                    else {
                        if (!prev) {
                            buffer = code.slice(0, token.endpos).split('\n');
                            line = buffer.length;
                            col = buffer[buffer.length - 1].length + 1;
                            /*<debug>*/
                            lightcode(buffer, 5);
                            /*</debug>*/
                            error = 'No start tag. (line:' + token.line + ' col:' + token.col + ')';
                            console.error(error);
                            throw error;
                        }
                        curr.type = 'text';
                        delete curr.children; // 移除子节点
                        delete curr.tag;
                        delete curr.attrs;
                    }
                }
                break;
        }
    });
    /*<debug>
    console.log(JSON.stringify(root, null, '  '))
    //</debug>*/
    return root;
}
/*<debug>*/
function lightcode(buffer, count) {
    var len = buffer.length.toString().length;
    var lines = buffer.slice(-count);
    for (var i = lines.length - 1; i >= 0; i--) {
        var l = (buffer.length + i - lines.length + 1).toString();
        l = (new Array(len - l.length + 1)).join(' ') + l; // 前面补空格
        lines[i] = l + (i === lines.length - 1 ? ' > ' : '   ') + '| ' + lines[i];
    }
    console.log(lines.join('\n'));
} /*</debug>*/ /*</function>*/
/*<function name="parser_build">*/
/**
 * @preview
  ```html
  <!-- beforebegin -->
  <p>
  <!-- afterbegin -->
  foo
  <!-- beforeend -->
  </p>
  <!-- afterend -->
  ```
 * @param node
 * @param hook
 * @return 返回构建后的 HTML 字符串
 * @example parser_build:base
  ```js
  var node = jnodes.Parser.parse(`<input type=text readonly>`)
  console.log(jnodes.Parser.build(node));
  // > <input type=text readonly>
  console.log(JSON.stringify(jnodes.Parser.build()));
  // > ""
  ```
 * @example parser_build:hook
  ```js
  var node = jnodes.Parser.parse(`<div>text</div>`)
  console.log(jnodes.Parser.build(node, null, function (node, options) {
    if (node.tag) {
      node.beforebegin = `[beforebegin]`;
      node.beforeend = `[beforeend]`;
      node.afterbegin = `[afterbegin]`;
      node.afterend = `[afterend]`;
    }
  }));
  // > [beforebegin]<div>[beforeend]text[afterbegin]</div>[afterend]
  ```
 * @example parser_build:hook overwriteNode
  ```js
  var node = jnodes.Parser.parse(`<div><tnt/></div>`)
  console.log(jnodes.Parser.build(node, null, function (node, options) {
    if (node.tag === 'tnt') {
      node.overwriteNode = `<img src="tnt.png">`;
    }
  }));
  // > <div><img src="tnt.png"></div>
  ```
 * @example parser_build:hook overwriteAttrs
  ```js
  var node = jnodes.Parser.parse(`<div><bigimg alt="none"/></div>`)
  console.log(jnodes.Parser.build(node, null, function (node, options) {
    if (node.tag === 'bigimg') {
      node.overwriteAttrs = `src="tnt.png" alt="tnt"`;
    }
  }));
  // > <div><bigimg src="tnt.png" alt="tnt"/></div>
  var node = jnodes.Parser.parse(`<div><bigimg alt="none"/></div>`)
  console.log(jnodes.Parser.build(node, null, function (node, options) {
    if (node.tag === 'bigimg') {
      node.overwriteAttrs = ``;
    }
  }));
  // > <div><bigimg/></div>
  ```
 * @example parser_build:indent
  ```js
  var node = jnodes.Parser.parse(`<div>\n  <span>hello</span>\n</div>`)
  console.log(JSON.stringify(jnodes.Parser.build(node)));
  // > "<div>\n  <span>hello</span>\n</div>"
  ```
 */
function parser_build(node, options, hook) {
    if (!node) {
        return '';
    }
    var indent = node.indent || '';
    if (hook) {
        hook(node, options);
    }
    if (node.overwriteNode) {
        return node.overwriteNode;
    }
    var result = '';
    if (node.beforebegin) {
        result += node.beforebegin;
    }
    if (node.type === 'text' || node.type === 'comment') {
        result += node.value;
    }
    else if (node.tag) {
        if (!result || result[result.length - 1] === '\n') {
            result += indent;
        }
        result += '<' + node.tag;
        if (typeof node.overwriteAttrs === 'string') {
            if (node.overwriteAttrs) {
                result += ' ' + node.overwriteAttrs;
            }
        }
        else {
            node.attrs.forEach(function (attr) {
                result += ' ' + attr.name;
                if (attr.value) {
                    result += '=' + attr.quoted + attr.value + attr.quoted;
                }
            });
        }
        if (node.type === 'single') {
            if (!node.selfClosing) {
                result += '/';
            }
            result += '>';
        }
        else {
            result += '>';
        }
    }
    if (!node.selfClosing && node.type !== 'single') {
        if (node.beforeend) {
            result += node.beforeend;
        }
        if (node.children) {
            node.children.forEach(function (item) {
                item.parent = node;
                result += parser_build(item, options, hook);
            });
        }
        if (node.afterbegin) {
            result += node.afterbegin;
        }
        if (node.tag) {
            if (result[result.length - 1] === '\n') {
                result += indent;
            }
            result += '</' + node.tag + '>';
        }
    }
    if (node.afterend) {
        result += node.afterend;
    }
    return result;
} /*</function>*/
/*<function name="observer">*/
/**
 * 监听数据改版
 *
 * @param model 数据
 * @param trigger 触发函数
 * @example observer():trigger is undefined
  ```js
  var data = { a: 1 };
  jnodes.observer(data);
  ```
 * @example observer():trigger
  ```js
  var data = { a: 1 };
  jnodes.observer(data, function () {
    console.log(data.a);
  });
  data.a = 2;
  // > 2
  ```
 * @example observer():filter
  ```js
  var data = { a: 1, b: 1 };
  var count = 0;
  jnodes.observer(data, function () {
    count++;
  }, function (key) {
    return key === 'a';
  });
  data.a = 2;
  console.log(count);
  // > 1
  data.a = 2;
  console.log(count);
  // > 1
  data.b = 2;
  console.log(count);
  // > 1
  ```
 * @example observer():configurable is false
  ```js
  var data = { a: 1 };
  Object.defineProperty(data, 'a', {
    enumerable: true,
    configurable: false,
  });
  var i = 0;
  jnodes.observer(data, function () {
    i = 1;
  });
  data.a = 2;
  console.log(i);
  // > 0
  ```
 * @example observer():getter/setter
  ```js
  var data = { a: 1 };
  var _x = 0;
  Object.defineProperty(data, 'x', {
    enumerable: true,
    configurable: true,
    get: function () {
      return _x;
    },
    set: function (value) {
      _x = value;
    }
  });
  jnodes.observer(data, function () {});
  data.x = 123;
  console.log(data.x);
  // > 123
  ```
 * @example observer():array
  ```js
  var data = [1, 2, 3];
  var count = 0;
  jnodes.observer(data, function () {
    count++;
  });
  data.push(4);
  console.log(count);
  // > 1
  data.sort();
  console.log(count);
  // > 2
  ```
 */
function observer(model, trigger, filter) {
    if (!trigger) {
        return;
    }
    function define(key, value) {
        // 过滤处理
        if (filter && !filter(key)) {
            return;
        }
        var property = Object.getOwnPropertyDescriptor(model, key);
        if (property && property.configurable === false) {
            return;
        }
        // cater for pre-defined getter/setters
        var getter = property && property.get;
        var setter = property && property.set;
        Object.defineProperty(model, key, {
            enumerable: true,
            configurable: true,
            get: function () {
                return getter ? getter.call(model) : value;
            },
            set: function (newVal) {
                var val = getter ? getter.call(model) : value;
                if (newVal === val) {
                    return;
                }
                if (setter) {
                    setter.call(model, newVal);
                }
                else {
                    value = newVal;
                }
                trigger(model);
            }
        });
    }
    if (Array.isArray(model)) {
        [
            'push',
            'pop',
            'shift',
            'unshift',
            'splice',
            'sort',
            'reverse',
        ]
            .forEach(function (method) {
            // cache original method
            var original = model[method];
            Object.defineProperty(model, method, {
                value: function () {
                    var result = original.apply(this, arguments);
                    trigger(model);
                    return result;
                },
                enumerable: false,
                writable: true,
                configurable: true,
            });
        });
    }
    else {
        Object.keys(model).forEach(function (key) {
            define(key, model[key]);
        });
    }
} /*</function>*/
/*<function name="Parser" depend="parser_parse,parser_build">*/
var Parser = {
    parse: parser_parse,
    build: parser_build,
}; /*</function>*/
/*<function name="Binder" depend="observer">*/
var guid = 0;
/**
 * @example bind():base
  ```js
  jnodes.binder = new jnodes.Binder();
  var data = {x: 1, y: 2};
  var rootScope = {};
  var count = 0;
  jnodes.binder.bind(data, rootScope, function (output) {
    output.push('<div></div>');
    count++;
  });
  console.log(rootScope.children.length);
  // > 1
  var element = {};
  global.document = { querySelector: function(selector) {
    console.log(selector);
    // > [data-jnodes-scope="0"]
    return element;
  } };
  console.log(count);
  // > 0
  data.x = 2;
  console.log(count);
  // > 1
  console.log(JSON.stringify(element));
  // > {"outerHTML":"<div></div>"}
  console.log(JSON.stringify(jnodes.binder.scope('none')));
  // > undefined
  console.log(JSON.stringify(jnodes.binder.templateCompiler('none')));
  // > undefined
  console.log(JSON.stringify(jnodes.binder.templateRender('none')));
  // > undefined
  console.log(JSON.stringify(jnodes.binder._attrsRender(rootScope)));
  // > ""
  var scope = {
    children: [{
      model: {
        $$binds: []
      }
    }]
  };
  jnodes.binder.cleanChildren(scope);
  var scope = {
    children: [{
      model: {}
    }]
  };
  jnodes.binder.cleanChildren(scope);
  ```
 * @example bind():bind jhtmls
  ```html
  <div>
    <script type="text/jhtmls">
    <h1 :class="{book: Math.random() > 0.5}">Books</h1>
    <ul :bind="books" @create="books.loaded = 'done'">
    books.forEach(function (book) {
      <li :bind="book">
        <:template name="book"/>
      </li>
    });
    </ul>
    </script>
  </div>
  <script type="text/jhtmls" id="book">
  <a href="#{id}">#{title}</a>
  </script>
  ```
  ```js
  jnodes.binder = new jnodes.Binder();
  var books = [{id: 1, title: 'book1'}, {id: 2, title: 'book2'}, {id: 3, title: 'book3'}];
  jnodes.binder.registerCompiler('jhtmls', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, compiler_jhtmls);
    return jhtmls.render(code);
  });
  var bookRender = jnodes.binder.templateCompiler('jhtmls', document.querySelector('#book').innerHTML);
  jnodes.binder.registerTemplate('book', function (scope) {
    return bookRender(scope.model);
  });
  var div = document.querySelector('div');
  div.innerHTML = jnodes.binder.templateCompiler('jhtmls', div.querySelector('script').innerHTML)({
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
 * @example bind():bind jhtmls 2
  ```html
  <div>
    <script type="text/jhtmls">
    <ul :bind="books" :data-length="books.length" @create="books.loaded = 'done'" class="books">
    books.forEach(function (book) {
      <li :bind="book" @click="book.star = !book.star" class="" :class="{star: book.star}">
        <a :href="'/' + book.id" :bind="book.title" @destroy="console.info('destroy')">#{book.title}</a>
        <span :bind="book.id" :data-star="book.star">#{book.id}</span>
      </li>
    });
    </ul>
    </script>
  </div>
  ```
  ```js
  jnodes.binder = new jnodes.Binder({});
  var books = [{id: 1, title: 'book1', star: false}, {id: 2, title: 'book2', star: false}, {id: 3, title: 'book3', star: false}];
  jnodes.binder.registerCompiler('jhtmls', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, compiler_jhtmls);
    return jhtmls.render(code);
  });
  var div = document.querySelector('div');
  div.innerHTML = jnodes.binder.templateCompiler('jhtmls', div.querySelector('script').innerHTML)({
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
 * @example bind():update
  ```js
  var data = {x: 1, y: 2};
  var binder = new jnodes.Binder();
  var scope = binder.bind(data, null, null);
  var element = {};
  global.document = { querySelector: function(selector) {
    return element;
  } };
  binder.update(scope);
  console.log(JSON.stringify(element));
  // > {}
  var scope = binder.bind(data, null, null, function (output) {
    output.push('<div></div>');
  });
  var element = {};
  global.document = { querySelector: function(selector) {
    return element;
  } };
  binder.update(scope);
  console.log(JSON.stringify(element));
  // > {"innerHTML":"<div></div>"}
  ```
 * @example bind():attr is null
  ```html
  <div>
    <script type="text/jhtmls">
    <input type="checkbox" :checked="checked">
    </script>
  </div>
  ```
  ```js
  var binder = new jnodes.Binder();
  var data = { checked: false };
  var div = document.querySelector('div');
  jnodes.binder.registerCompiler('jhtmls', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, compiler_jhtmls);
    return jhtmls.render(code);
  });
  div.innerHTML = jnodes.binder.templateCompiler('jhtmls', div.querySelector('script').innerHTML)(data);
  var rootScope = jnodes.binder.$$scope;
  rootScope.element = div;
  console.log(div.innerHTML.trim());
  // > <input type="checkbox">
  data.checked = true;
  console.log(div.innerHTML.trim());
  // > <input checked="" type="checkbox">
  ```
   */
var Binder = (function () {
    function Binder(options) {
        var _this = this;
        options = options || {};
        this._binds = {};
        this._templates = {};
        this._bindObjectName = options.bindObjectName || 'jnodes.binder';
        this._bindAttributeName = options.bindAttributeName || 'bind';
        this._scopeAttributeName = options.scopeAttributeName || "data-jnodes-scope";
        this._eventAttributePrefix = options.eventAttributePrefix || "data-jnodes-event-";
        this._imports = options.imports;
        this._templates = {};
        this._compiler = {};
        this._checkers = {};
        this._findElement = options.findElement || (function (scope) {
            return document.querySelector("[" + _this._scopeAttributeName + "=\"" + scope.id + "\"]");
        });
        this._updateElement = options.updateElement || (function (element, scope) {
            if (!element || (!scope.outerRender && !scope.innerRender)) {
                return;
            }
            _this.lifecycleEvent(scope, 'destroy');
            _this.cleanChildren(scope);
            var output = [];
            if (!scope.innerRender) {
                scope.outerRender(output, true);
                element.outerHTML = output.join('');
            }
            else if (!scope.outerRender) {
                scope.innerRender(output);
                element.innerHTML = output.join('');
            }
            else {
                scope.outerRender(output, false);
                var shell = output.join('');
                output = [];
                if (scope.shell === shell) {
                    scope.innerRender(output);
                    element.innerHTML = output.join('');
                }
                else {
                    scope.shell = shell;
                    scope.outerRender(output, true);
                    element.outerHTML = output.join('');
                }
            }
            _this.lifecycleEvent(scope, 'create');
            _this.lifecycleEvent(scope, 'update');
        });
        this._attrsRender = options.attrsRender || (function (scope, attrs) {
            if (!attrs) {
                return '';
            }
            var dictValues = {};
            var dictQuoteds = {};
            attrs.filter(function (attr) {
                if (':' !== attr.name[0] && '@' !== attr.name[0]) {
                    return true;
                }
                var name = attr.name.slice(1);
                if (name === _this._bindAttributeName) {
                    name = _this._scopeAttributeName;
                }
                else if ('@' === attr.name[0]) {
                    var arr = name.split('.');
                    name = arr[0];
                    if (name === 'create') {
                        scope.lifecycleCreate = true;
                    }
                    else if (name === 'destroy') {
                        scope.lifecycleDestroy = true;
                    }
                    else if (name === 'update') {
                        scope.lifecycleUpdate = true;
                    }
                    name = _this._eventAttributePrefix + name;
                }
                var values = dictValues[name] = dictValues[name] || [];
                dictQuoteds[name] = attr.quoted;
                if (name === _this._scopeAttributeName) {
                    values.push(scope.id);
                    return;
                }
                if (attr.value === '' || attr.value === null || attr.value === undefined ||
                    attr.value === false) {
                    return;
                }
                switch (typeof attr.value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        values.push(attr.value);
                        break;
                    case 'object':
                        Object.keys(attr.value).forEach(function (key) {
                            if (attr.value[key]) {
                                values.push(key);
                            }
                        });
                        break;
                    case 'function':
                        var methodId = "@" + (guid++).toString(36);
                        scope.methods = scope.methods || {};
                        scope.methods[methodId] = attr.value;
                        values.push(methodId);
                        break;
                }
            }).forEach(function (attr) {
                var values = dictValues[attr.name] = dictValues[attr.name] || [];
                if (attr.value === '' || values.indexOf(attr.value) >= 0) {
                    return;
                }
                values.push(attr.value);
            });
            return Object.keys(dictValues).map(function (name) {
                var values = dictValues[name];
                if (values.length <= 0) {
                    return null;
                }
                var quoted = dictQuoteds[name] || '';
                if (values.length === 1 && values[0] === true) {
                    return "" + name;
                }
                return name + "=" + quoted + values.join(' ') + quoted;
            }).join(' ');
        });
    }
    Binder.prototype.registerTemplate = function (templateName, render) {
        this._templates[templateName] = render;
    };
    Binder.prototype.templateRender = function (templateName, scope) {
        var render = this._templates[templateName];
        if (!render) {
            return;
        }
        return render(scope);
    };
    Binder.prototype.registerChecker = function (eventType, checker) {
        this._checkers[eventType] = checker;
    };
    Binder.prototype.eventChecker = function (event, trigger) {
        var checker = this._checkers[event.type];
        if (!checker) {
            return;
        }
        return checker(event, trigger);
    };
    Binder.prototype.templateCompiler = function (templateType, templateCode) {
        var compiler = this._compiler[templateType];
        if (!compiler) {
            return;
        }
        return compiler(templateCode, this._bindObjectName);
    };
    Binder.prototype.registerCompiler = function (templateType, compiler) {
        this._compiler[templateType] = compiler;
    };
    Binder.prototype.cleanChildren = function (scope) {
        var _this = this;
        if (scope.children) {
            scope.children.forEach(function (item) {
                var binds = item.model && item.model.$$binds;
                if (binds) {
                    // remove scope
                    var index = binds.indexOf(item);
                    if (index >= 0) {
                        binds.splice(index, 1);
                    }
                }
                delete _this._binds[item.id];
                _this.cleanChildren(item);
                scope.children = [];
                delete scope.methods;
                delete scope.attrs;
            });
        }
    };
    /**
     * 触发元素生命周期改变的事件
     *
     * @param scope 作用域
     * @param parent 容器
     * @param type 类型
     */
    Binder.prototype.lifecycleEvent = function (scope, type) {
        var _this = this;
        function hasLifecycle(scope) {
            if (type === 'update') {
                if (scope.lifecycleUpdate) {
                    return true;
                }
                return;
            }
            if ((type === 'create' && scope.lifecycleCreate) || (type === 'destroy' && scope.lifecycleDestroy)) {
                return true;
            }
            if (scope.children) {
                return scope.children.some(hasLifecycle);
            }
        }
        if (hasLifecycle(scope)) {
            var parent_1 = this.element(scope);
            if (type === 'update') {
                this.triggerScopeEvent({ type: type, target: parent_1 });
            }
            else {
                var elements = [].slice.apply(parent_1.querySelectorAll("[" + this._eventAttributePrefix + type + "]"));
                elements.forEach(function (item) {
                    _this.triggerScopeEvent({ type: type, target: item });
                    item.removeAttribute("" + _this._eventAttributePrefix + type);
                });
            }
        }
    };
    /**
     * 数据绑定
     *
     * @param model 绑定数据
     * @param parent 父级作用域
     * @param outerRender 外渲染函数
     */
    Binder.prototype.bind = function (model, parent, outerBindRender, innerBindRender) {
        var _this = this;
        var scope = {
            model: model,
            parent: parent,
            binder: this,
        };
        Object.defineProperty(scope, 'element', {
            enumerable: true,
            configurable: true,
            get: function () {
                return scope._element;
            },
            set: function (value) {
                scope._element = value;
                if (value) {
                    value.setAttribute(_this._scopeAttributeName, scope.id);
                    _this.lifecycleEvent(scope, 'create');
                }
            }
        });
        if (outerBindRender) {
            scope.outerRender = function (output, holdInner) {
                return outerBindRender(output, scope, holdInner);
            };
        }
        if (innerBindRender) {
            scope.innerRender = function (output) {
                return innerBindRender(output, scope);
            };
        }
        scope.id = (guid++).toString(36);
        this._binds[scope.id] = scope;
        if (parent) {
            parent.children = parent.children || [];
            parent.children.push(scope);
        }
        // 只绑定对象类型
        if (model && typeof model === 'object') {
            // 对象已经绑定过
            if (!model.$$binds) {
                model.$$binds = [scope];
                observer(model, function () {
                    model.$$binds.forEach(function (scope) {
                        scope.binder.update(scope);
                    });
                }, function (key) {
                    return key && key.slice(2) !== '$$';
                });
            }
            else {
                model.$$binds.push(scope);
            }
        }
        return scope;
    };
    /**
     * 通过作用域查找元素
     * @param scope
     */
    Binder.prototype.element = function (scope) {
        return scope._element || this._findElement(scope);
    };
    /**
     * 更新数据对应的元素
     *
     * @param scope 作用域
     */
    Binder.prototype.update = function (scope) {
        this._updateElement(this.element(scope), scope);
    };
    Binder.prototype.scope = function (id) {
        var scope;
        if (typeof id === 'string') {
            scope = this._binds[id];
            if (scope) {
                return scope;
            }
        }
        else {
            var element = id;
            while (element && element.getAttribute) {
                var result = this.scope(element.getAttribute(this._scopeAttributeName));
                if (result) {
                    return result;
                }
                element = element.parentNode;
            }
        }
    };
    /**
     * 触发作用域事件
     *
     * @param event 事件对象
     * @param target 元素
     * @example triggerScopeEvent:coverage 1
      ```js
      var binder = new jnodes.Binder();
      var element = {
        getAttribute: function () {
          return null;
        }
      };
      binder.triggerScopeEvent({ target: element });
      ```
     * @example triggerScopeEvent:coverage 2
      ```js
      var binder = new jnodes.Binder();
      var scope = binder.bind({ x: 1 }, null, function (output) {
        output.push('<div></div>');
      });
      var element = {
        getAttribute: function (attrName) {
          switch (attrName) {
            case 'data-jnodes-event-click':
              return '@1';
            case 'data-jnodes-scope':
              return scope.id;
          }
        }
      };
      binder.triggerScopeEvent({ type: 'click', target: element });
      binder.triggerScopeEvent({ type: 'click', target: null });
      var element2 = {
        getAttribute: function (attrName) {
          switch (attrName) {
            case 'data-jnodes-event-click':
              return '@1';
          }
        }
      };
      binder.triggerScopeEvent({ type: 'click', target: element2 });
      ```
     */
    Binder.prototype.triggerScopeEvent = function (event, target) {
        target = target || event.target;
        if (!target) {
            return;
        }
        var cmd = target.getAttribute(this._eventAttributePrefix + event.type);
        if (cmd && cmd[0] === '@') {
            var scope_1 = this.scope(target);
            if (!scope_1) {
                return;
            }
            // forEach @1 @2 ...
            cmd.replace(/@\w+/g, function (all) {
                var method = (scope_1.methods || {})[all];
                if (method) {
                    method.call(target, event);
                }
                return '';
            });
        }
    };
    return Binder;
}()); /*</function>*/
  /*<function name="compiler_jhtmls">*/
/**
 * 编译 jhtmls
 *
 * @param node 节点
 * @param bindObjectName 全局对象名
 * @example compiler_jhtmls:base1
  ```js
  var node = {
    tag: ':template'
  };
  compiler_jhtmls(node);
  console.log(JSON.stringify(node));
  // > {"tag":":template"}
  ```
 * @example compiler_jhtmls:base2
  ```js
  var node = {
    tag: ':template',
    attrs: [{
      name: 'class',
      value: 'book'
    }]
  };
  compiler_jhtmls(node);
  console.log(JSON.stringify(node));
  // > {"tag":":template","attrs":[{"name":"class","value":"book"}]}
  ```
 * @example compiler_jhtmls:base keyup.enter
  ```html
  <div>
    <script type="text/jhtmls">
    <input type="text" @keyup.enter="pos.x = parseInt(this.value)" value="-1">
    <div><button :bind="pos" @click="pos.x++" @update.none="console.info('none')">plus #{pos.x}</button></div>
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
  jnodes.binder.registerCompiler('jhtmls', function (templateCode, bindObjectName) {
    var node = jnodes.Parser.parse(templateCode);
    var code = jnodes.Parser.build(node, bindObjectName, compiler_jhtmls);
    return jhtmls.render(code);
  });
  div.innerHTML = jnodes.binder.templateCompiler('jhtmls', div.querySelector('script').innerHTML)(data);
  var rootScope = jnodes.binder.$$scope;
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
 */
function compiler_jhtmls(node, bindObjectName) {
    var indent = node.indent || '';
    var inserFlag = "/***/ ";
    if (node.type === 'root') {
        node.beforebegin = "" + indent + inserFlag + "var _rootScope_ = " + bindObjectName + ".bind(this, { root: true }, null, function (_output_, _scope_) {";
        node.afterend = "\n" + indent + inserFlag + "}); _rootScope_.innerRender(_output_); " + bindObjectName + ".$$scope = _rootScope_;";
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
                node.overwriteNode = "\n" + indent + inserFlag + "_output_.push(" + bindObjectName + ".templateRender(" + JSON.stringify(attr.value) + ", _scope_, " + bindObjectName + ".bind));";
                return true;
            }
        });
        return;
    }
    var varintAttrs = "\n" + indent + inserFlag + "var _attrs_ = [\n";
    var hasOverwriteAttr;
    var bindDataValue;
    node.attrs.forEach(function (attr) {
        var value;
        if (attr.name[0] === ':') {
            if (attr.name === ':bind') {
                bindDataValue = attr.value;
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
    node.beforebegin = '';
    if (bindDataValue) {
        node.beforebegin += "\n" + indent + inserFlag + bindObjectName + ".bind(" + bindDataValue + ", _scope_, function (_output_, _scope_, holdInner) {\n";
        node.beforeend = "\n" + indent + inserFlag + "_scope_.innerRender = function(_output_) {\n";
        node.afterbegin = "\n" + indent + inserFlag + "}; if (holdInner) { _scope_.innerRender(_output_); }\n";
        node.afterend = "\n" + indent + inserFlag + "}).outerRender(_output_, true);\n";
    }
    varintAttrs += "" + indent + inserFlag + "];\n";
    node.beforebegin += varintAttrs;
    node.overwriteAttrs = "!#{" + bindObjectName + "._attrsRender(_scope_, _attrs_)}";
} /*</function>*/
  /*<function name="jhtmls_isOutput">*/
  /**
   * 是否行是否输出
   *
   * @param {string} line 行的内容
   * @return {Boolean} 返回该行是否为内容输出
   '''<example>'''
   * @example isOutput():expression 1
    ```js
    console.log(jhtmls.isOutput('print: #{$name}'));
    // > true
    ```
   * @example isOutput():expression 2
    ```js
    console.log(jhtmls.isOutput('print: !#{$title}'));
    // > true
    ```
   * @example isOutput():Begin "&"
    ```js
    console.log(jhtmls.isOutput('& 8848'));
    // > true
    ```
   * @example isOutput():Begin "="
    ```js
    console.log(jhtmls.isOutput('= 8848'));
    // > true
    ```
   * @example isOutput():Begin ":"
    ```js
    console.log(jhtmls.isOutput(': 8848'));
    // > true
    ```
   * @example isOutput():Begin "|"
    ```js
    console.log(jhtmls.isOutput('| 8848'));
    // > true
    ```
   * @example isOutput():Begin "汉字"
    ```js
    console.log(jhtmls.isOutput('汉字'));
    // > true
    ```
   * @example isOutput():Begin "<"
    ```js
    console.log(jhtmls.isOutput('<li>item1</li>'));
    // > true
    ```
   * @example isOutput():Begin "##"
    ```js
    console.log(jhtmls.isOutput('## title'));
    // > true
    ```
   * @example isOutput():Keyword "else"
    ```js
    console.log(jhtmls.isOutput('else'));
    // > false
    ```
   * @example isOutput():Keyword "void"
    ```js
    console.log(jhtmls.isOutput('void'));
    // > false
    ```
   * @example isOutput():Keyword "try"
    ```js
    console.log(jhtmls.isOutput('try'));
    // > false
    ```
   * @example isOutput():Keyword "finally"
    ```js
    console.log(jhtmls.isOutput('finally'));
    // > false
    ```
   * @example isOutput():Keyword "do"
    ```js
    console.log(jhtmls.isOutput('do'));
    // > false
    ```
   * @example isOutput():Not keyword "hello"
    ```js
    console.log(jhtmls.isOutput('hello'));
    // > true
    ```
   * @example isOutput():No semicolon "foo()"
    ```js
    console.log(jhtmls.isOutput('foo()'));
    // > false
    ```
   * @example isOutput():Not symbol "return !todo.completed"
    ```js
    console.log(jhtmls.isOutput('return !todo.completed'));
    // > false
    ```
   * @example isOutput():Strings Template "`${name}`"
    ```js
    console.log(jhtmls.isOutput('`${name}`'));
    // > false
    ```
   * @example isOutput():Strings Template "\`\`\`js"
    ```js
    console.log(jhtmls.isOutput('\`\`\`js'));
    // > true
    ```
   * @example isOutput():Url "http://jhtmls.com/"
    ```js
    console.log(jhtmls.isOutput('http://jhtmls.com/'));
    // > true
    ```
   '''</example>'''
   */
  function jhtmls_isOutput(line) {
    // 碰见替换表达式
    // 示例：title: #{title}
    if (/^.*#\{[^}]*\}.*$/.test(line)) {
      return true;
    }
    // 特殊字符开头
    // 示例：&、=、:、|
    if (/^[ \t]*[&=:|].*$/.test(line)) {
      return true;
    }
    // 非 JavaScript 字符开头
    // 示例：#、<div>、汉字
    if (/^[ \w\t_$]*([^&\^?|\n\w\/'"{}\[\]+\-():;,!` \t=\.$_]|:\/\/).*$/.test(line)) {
      return true;
    }
    // ```
    if (/^\s*[`\-+'"]{3,}/.test(line)) {
      return true;
    }
    // 不是 else 等单行语句
    // 示例：hello world
    if (/^(?!\s*(else|do|try|finally|void|typeof\s[\w$_]*)\s*$)[^'"`!:;{}()\[\],\n|=&\/^?]+$/.test(line)) {
      return true;
    }
    return false;
  }
  /*</function>*/
  /*<function name="jhtmls_build" depend="jhtmls_isOutput">*/
  /**
   * 构造模板的处理函数
   *
   * @param {string} template 模板字符
   * @return {function} 返回编译后的函数
   '''<example>'''
   * @example build():base
    ```js
    console.log(typeof jhtmls.build('print: #{name}'));
    // > function
    ```
   * @example build():Empty string
    ```js
    console.log(typeof jhtmls.build(''));
    // > function
    ```
   '''</example>'''
   */
  function jhtmls_build(template) {
    if (!template) {
      return function () {
        return '';
      };
    }
    var lines = String(template).split(/\n\r?/).map(function (line, index, array) {
      if (/^\s*$/.test(line)) {
        return line;
      }
      else if (jhtmls_isOutput(line)) {
        var expressions = [];
        var offset = 0;
        line.replace(/(!?#)\{((?:"(?:[^\\"]|(?:\\.))*"|'(?:[^\\']|(?:\\.))*'|(?:[^{}]*\{[^}]*\})?|[^}]*)*)\}/g,
          function (all, flag, value, index) {
            var text = line.slice(offset, index);
            if (text) {
              expressions.push(JSON.stringify(text));
            }
            offset = index + all.length;
            if (!value) {
              return;
            }
            // 单纯变量，加一个未定义保护
            if (/^[a-z$][\w$]+$/i.test(value) &&
              !(/^(true|false|NaN|null|this)$/.test(value))) {
              value = 'typeof ' + value + "==='undefined'?'':" + value;
            }
            switch (flag) {
            case '#':
              expressions.push('_encode_(' + value + ')');
              break;
            case '!#':
              expressions.push('(' + value + ')');
              break;
            }
          });
        var text = line.slice(offset, line.length);
        if (text) {
          expressions.push(JSON.stringify(text));
        }
        if (index < array.length - 1) {
          expressions.push('"\\n"');
        }
        return '_output_.push(' + expressions + ');';
      }
      else {
        return line;
      }
    });
    lines.unshift('with(this){');
    lines.push('}');
    return new Function(
      '_output_', '_encode_', 'helper', 'jhtmls', 'require',
      lines.join('\n')
    );
  }
  /*</function>*/
  /*<function name="encodeHTML">*/
  var htmlEncodeDict = {
    '"': '#34',
    "'": '#39',
    '<': 'lt',
    '>': 'gt',
    '&': 'amp',
    ' ': 'nbsp'
  };
  /**
   * HTML编码
   *
   * @param {string} text 文本
   '''<example>'''
   * @example encodeHTML():base
    ```js
    console.log(jstrs.encodeHTML('\'1\' < "2"'));
    // > &#39;1&#39;&nbsp;&lt;&nbsp;&#34;2&#34;
    ```
   '''</example>'''
   */
  function encodeHTML(text) {
    return String(text).replace(/["<>& ']/g, function (all) {
      return '&' + htmlEncodeDict[all] + ';';
    });
  }
  /*</function>*/
  /*<function name="jhtmls_render" depend="jhtmls_build,encodeHTML">*/
  /**
   * 格式化输出
   *
   * @param {string|Function} template 模板本身 或 模板放在函数行注释中
   * @param {Object} data 格式化的数据，默认为空字符串
   * @param {Object} helper 附加数据(默认为渲染函数)
   * @return {Function|string} 如果只有一个参数则返回渲染函数，否则返回格式化后的字符串
   '''<example>'''
   * @example render():Build Function
    ```js
    console.log(typeof jhtmls.render('print: #{name}'));
    // > function
    ```
   * @example render():Format String
    ```js
    console.log(jhtmls.render('print: #{name}', { name: 'zswang' }));
    // > print: zswang
    ```
   * @example render():this & require is null
    ```js
    console.log(jhtmls.render('print: #{this}', 2016));
    // > print: 2016
    ```
   * @example render():encodeHTML
    ```js
    console.log(jhtmls.render('print: #{this}', '\' "'));
    // > print: &#39; &#34;
    console.log(jhtmls.render('print: !#{this}', '\' "'));
    // > print: ' "
    ```
   '''</example>'''
   */
  function jhtmls_render(template, data, helper) {
    if (typeof template === 'function') { // 函数多行注释处理
      template = String(template).replace(
        /[^]*\/\*!?\s*|\s*\*\/[^]*/g, // 替换掉函数前后部分
        ''
      );
    }
    var fn = jhtmls_build(template);
    /**
     * 格式化
     *
     * @inner
     * @param {Object} d 数据
     * @param {Object} h 辅助对象 helper
     */
    var format = function (d, h) {
      var _require;
      /* istanbul ignore else */
      if (typeof require === 'function') {
        _require = require;
      }
      // h = h || fn;
      var output = [];
      if (typeof h === 'undefined') {
        h = function (d) {
          fn.call(d, output, encodeHTML, h, exports, _require);
        };
      }
      fn.call(d, output, encodeHTML, h, exports, _require);
      return output.join('');
    };
    if (arguments.length <= 1) { // 无渲染数据
      return format;
    }
    return format(data, helper);
  }
  /*</function>*/
  /*<function name="h5tap">*/
  /**
   * 监听移动端 tap 事件
   *
   * @param {HTMLElement|string} parent 容器
   * @param {string} selector 选择器，触发事件的元素
   * @param {Function} callback 回调函数
   * [[[
   *   @param {HTMLElement} element 触发元素
   *   @param {number} duration 按下到放开的时长
   *   function callback(element, duration) {}
   * ]]]
   * @example h5tap():pc
    ```html
    <div>
       <button cmd="save"></button>
       <button cmd="load"></button>
    </div>
    ```
    ```js
    h5tap(document.querySelector('div'), '[cmd]', function (target) {
      console.log(target.getAttribute('cmd'));
      // > load
      // * done
    });
    var target = document.querySelector('[cmd="load"]');
    // ------ mousedown ------
    var e = document.createEvent('UIEvent');
    var point = [100, 100];
    e.pageX = point[0];
    e.pageY = point[1];
    e.clientX = point[0];
    e.clientY = point[1];
    e.initUIEvent('mousedown', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ mouseup ------
    var e = document.createEvent('UIEvent');
    var point = [100, 105];
    e.pageX = point[0];
    e.pageY = point[1];
    e.clientX = point[0];
    e.clientY = point[1];
    e.initUIEvent('mouseup', true, true, window, 1);
    target.dispatchEvent(e);
    ```
   * @example h5tap():mobile
    ```html
    <div>
       <button cmd="save"><span>保存</span></button>
       <button cmd="load"></button>
    </div>
    ```
    ```js
    h5tap('div', '[cmd]', function (target) {
      console.log(target.getAttribute('cmd'));
      // > save
      // * done
    });
    var target = document.querySelector('[cmd="save"] span');
    // ------ touchstart ------
    var e = document.createEvent('UIEvent');
    var point = [100, 100];
    e.touches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchstart', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ touchend ------
    var e = document.createEvent('UIEvent');
    var point = [100, 105];
    e.changedTouches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchend', true, true, window, 1);
    target.dispatchEvent(e);
    ```
   * @example h5tap():mobile none
    ```html
    <div>
       <button cmd="save"><span>保存</span></button>
       <button cmd="load"></button>
    </div>
    ```
    ```js
    var count = 0;
    h5tap('div', '[cmd]', function (target) {
      count++;
    });
    var target = document.querySelector('[cmd="save"] span');
    // ------ touchstart ------
    var e = document.createEvent('UIEvent');
    e.initUIEvent('touchstart', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ touchend ------
    var e = document.createEvent('UIEvent');
    e.initUIEvent('touchend', true, true, window, 1);
    target.dispatchEvent(e); // +1
    var target = document.querySelector('[cmd="save"] span');
    // ------ touchstart ------
    var touchstartEvent = document.createEvent('UIEvent');
    var point = [100, 100];
    touchstartEvent.touches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    touchstartEvent.initUIEvent('touchstart', true, true, window, 1);
    target.dispatchEvent(touchstartEvent);
    // ------ touchend ------
    var touchendEvent = document.createEvent('UIEvent');
    var point = [100, 155];
    touchendEvent.changedTouches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    touchendEvent.initUIEvent('touchend', true, true, window, 1);
    target.dispatchEvent(touchendEvent); // +0
    var target = document.querySelector('div');
    // ------ touchstart ------
    target.dispatchEvent(touchstartEvent);
    // ------ touchend ------
    target.dispatchEvent(touchendEvent); // +0
    setTimeout(function () {
      console.log(count);
      // > 1
      // * done
    }, 5)
    ```
   * @example h5tap():Event parallelism
    ```html
    <div>
       <button cmd="ok"></button>
    </div>
    ```
    ```js
    var count = 0;
    h5tap('div', '[cmd]', function (target) {
      count++;
    });
    var point = [100, 100];
    var target = document.querySelector('[cmd="ok"]');
    // ------ mousedown ------
    var e = document.createEvent('UIEvent');
    e.pageX = point[0];
    e.pageY = point[1];
    e.clientX = point[0];
    e.clientY = point[1];
    e.initUIEvent('mousedown', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ touchstart ------
    var e = document.createEvent('UIEvent');
    var point = [100, 100];
    e.touches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchstart', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ mouseup ------
    var e = document.createEvent('UIEvent');
    e.pageX = point[0];
    e.pageY = point[1];
    e.clientX = point[0];
    e.clientY = point[1];
    e.initUIEvent('mouseup', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ touchend ------
    var e = document.createEvent('UIEvent');
    e.changedTouches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchend', true, true, window, 1);
    target.dispatchEvent(e);
    setTimeout(function () {
      console.log(count);
      // > 1
      // * done
    }, 5)
    ```
   * @example h5tap():Scroll event
    ```html
    <div>
       <button cmd="ok"></button>
    </div>
    ```
    ```js
    var count = 0;
    h5tap('div', '[cmd]', function (target) {
      count++;
    });
    var point = [100, 100];
    var target = document.querySelector('[cmd="ok"]');
    // ------ touchstart ------
    var e = document.createEvent('UIEvent');
    var point = [100, 100];
    e.touches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchstart', true, true, window, 1);
    target.dispatchEvent(e);
    // ------ scroll ------
    var e = document.createEvent('UIEvent');
    e.initUIEvent('scroll', true, true, window, 1);
    window.dispatchEvent(e);
    // ------ touchend ------
    var e = document.createEvent('UIEvent');
    e.changedTouches = [{pageX: point[0], pageY: point[1], clientX: point[0], clientY: point[1]}];
    e.initUIEvent('touchend', true, true, window, 1);
    target.dispatchEvent(e);
    setTimeout(function () {
      console.log(count);
      // > 0
      // * done
    }, 5)
    ```
   */
  function h5tap(parent, selector, callback) {
    if (typeof parent === 'string') {
      parent = document.querySelector(parent);
    }
    var startPoint;
    var target;
    var startTime;
    var removeMouseEvent;
    function startHandler(e) {
      var elements = [].slice.call(parent.querySelectorAll(selector));
      target = e.target;
      while (target && elements.indexOf(target) < 0) {
        target = target.parentNode;
      }
      if (!target) {
        return;
      }
      startTime = Date.now();
      if (/touchstart/i.test(e.type)) {
        if (!removeMouseEvent) {
          removeMouseEvent = true;
          parent.removeEventListener('mousedown', startHandler);
          document.removeEventListener('mouseup', endHandler);
        }
        var touch = (e.touches || {})[0] || {};
        startPoint = [touch.clientX || 0, touch.clientY || 0];
      } else {
        startPoint = [e.clientX, e.clientY];
      }
    }
    function endHandler(e) {
      if (!startPoint) {
        return;
      }
      var endPoint;
      if (/touchend/i.test(e.type)) {
        var touch = (e.touches || {})[0] || (e.changedTouches || {})[0] || {};
        endPoint = [touch.clientX || 0, touch.clientY || 0];
      } else {
        endPoint = [e.clientX, e.clientY];
      }
      if (Math.sqrt(Math.pow(startPoint[0] - endPoint[0], 2) + Math.pow(startPoint[1] - endPoint[1], 2)) < 50) {
        callback(target, Date.now() - startTime);
      }
      startPoint = null;
      target = null;
    }
    parent.addEventListener('touchstart', startHandler, false);
    document.addEventListener('touchend', endHandler, false);
    // 兼容 PC 端
    parent.addEventListener('mousedown', startHandler, false);
    document.addEventListener('mouseup', endHandler, false);
    // 发生滚动则不触发
    window.addEventListener('scroll', function() {
      startPoint = null;
      target = null;
    });
  }
  /*</function>*/
  var h5page_guid = 0;
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
    var binderName = 'binder' + (h5page_guid++).toString(36);
    var binder = h5page[binderName] = new Binder({
      bindObjectName: 'h5page.' + binderName,
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
  /*<function name="h5ajax_send">*/
  /**
   * 发送 ajax 请求
   *
   * @param {string} url 请求链接
   * @param {string} method 方法
   * @param {Function} hook xhr 钩子
   * @param {Function=} callback 回调函数
   * [[[
   *   @param {string} err 错误信息，无错误时为 null
   *   @param {Object} json 应答的 JSON 数据
   *   @param {XMLHttpRequest} xhr XMLHttpRequest 实例
   *   function callback()
   * ]]]
   * @example send():base
    ```js
    // mock : {"status":200,"data":{"user_id":30001,"name":"zswang"}}
    h5ajax.send('http://localhost/user/info', 'GET', null, function(err, json) {
      console.log(JSON.stringify(json));
      // > {"status":200,"data":{"user_id":30001,"name":"zswang"}}
      // * done
    });
    ```
   * @example send():callback is null
    ```js
    h5ajax.send('http://localhost/user/info', 'GET');
    ```
   * @example send():response is error
    ```js
    h5ajax.send('http://localhost/error', 'GET', null, function (err, json, xhr) {
      console.log(!!err);
      // > true
      console.log(xhr.status);
      // > 500
      // * done
    });
    ```
   */
  function h5ajax_send(url, method, hook, callback) {
    callback = callback || function() {};
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var data = xhr.responseText;
        try {
          data = JSON.parse(data);
          callback(null, data, xhr);
        } catch (ex) {
          callback(ex.message, data, xhr);
        }
      }
    };
    xhr.send(hook ? hook(xhr) : null);
  }
  /*</function>*/
  /*<function name="h5ajax_post" depend="h5ajax_send">*/
  /**
   * 发送 ajax POST 请求
   *
   * @param {string} url 请求链接
   * @param {string} params 请求参数
   * @param {Function=} callback 回调函数
   * [[[
   *   @param {string} err 错误信息，无错误时为 null
   *   @param {Object} json 应答的 JSON 数据
   *   @param {XMLHttpRequest} xhr XMLHttpRequest 实例
   *   function callback()
   * ]]]
   * @example post():base
    ```js
    // mock : {"status":200,"data":{"user_id":30001,"name":"zswang","code":$code}}
    h5ajax.post('http://localhost/user/info', { "code": "2016" }, function(err, json) {
      console.log(JSON.stringify(json));
      // > {"status":200,"data":{"user_id":30001,"name":"zswang","code":"2016"}}
      // * done
    });
    ```
   */
  function h5ajax_post(url, params, callback) {
    h5ajax_send(url, 'POST', function(xhr) {
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      return Object.keys(params).map(function(key) {
        return key + '=' + encodeURIComponent(params[key]);
      }).join('&');
    }, callback);
  }
  /*</function>*/
  /*<function name="h5ajax_get" depend="h5ajax_send">*/
  /**
   * 发送 ajax GET 请求
   *
   * @param {string} url 请求链接
   * @param {Function=} callback 回调函数
   * [[[
   *   @param {string} err 错误信息，无错误时为 null
   *   @param {Object} json 应答的 JSON 数据
   *   @param {XMLHttpRequest} xhr XMLHttpRequest 实例
   *   function callback()
   * ]]]
   * @example get():base
    ```js
    // mock : {"status":200,"data":{"user_id":30001,"name":"zswang"}}
    h5ajax.get('http://localhost/user/info', function(err, json) {
      console.log(JSON.stringify(json));
      // > {"status":200,"data":{"user_id":30001,"name":"zswang"}}
      // * done
    });
    ```
   */
  function h5ajax_get(url, callback) {
    h5ajax_send(url, 'GET', null, callback);
  }
  /*</function>*/
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
})('h5page');