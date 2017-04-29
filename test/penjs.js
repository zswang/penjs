
global.penjs = require('../src/penjs.js');
global.ejs = require('ejs');
global.compiler_ejs = require('jnodes/src/js/Compiler/ejs.js').compiler_ejs;
      

describe("src/penjs.js", function () {
  var assert = require('should');
  var util = require('util');
  var examplejs_printLines;
  function examplejs_print() {
    examplejs_printLines.push(util.format.apply(util, arguments));
  }
  var jsdom = require('jsdom');
  

  it("jsdom@penjs:base", function (done) {
    jsdom.env("    <header></header>\n    <div>\n      <script type=\"text/jhtmls\">\n      <ul>\n        items.forEach(function (item) {\n          <li :bind=\"item\" :class=\"{selected: item.selected}\" @click=\"item.selected = !item.selected\">#{item.title}</li>\n        });\n      </ul>\n      </script>\n    </div>\n    <section>\n      <script type=\"text/ejs\"></script>\n    </section>\n    <footer>\n      <script></script>\n    </footer>", {
        features: {
          FetchExternalResources : ["script", "link"],
          ProcessExternalResources: ["script"]
        }
      },
      function (err, window) {
        global.window = window;
        ["document","navigator"].forEach(
          function (key) {
            global[key] = window[key];
          }
        );
        assert.equal(err, null);
        done();
      }
    );
  });
          
  it("penjs:base", function () {
    examplejs_printLines = [];
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
    examplejs_print(li.innerHTML.trim());
    assert.equal(examplejs_printLines.join("\n"), "a"); examplejs_printLines = [];

    examplejs_print(JSON.stringify(li.className));
    assert.equal(examplejs_printLines.join("\n"), "\"\""); examplejs_printLines = [];

    li.click();
    li = div.querySelector('li');
    examplejs_print(JSON.stringify(li.className));
    assert.equal(examplejs_printLines.join("\n"), "\"selected\""); examplejs_printLines = [];

    penjs(div);
    penjs('none');
    penjs('header');
    penjs('footer script');
    penjs('section');
  });
          
  it("jsdom@penjs:options is undefined", function (done) {
    jsdom.env("    <div>\n      <script type=\"text/jhtmls\">\n      var info = { title: 'example' };\n      <div @click=\"info.title = 'success';\">\n        <h1 :bind=\"info\">#{info.title}</h1>\n      </div>\n      </script>\n    </div>", {
        features: {
          FetchExternalResources : ["script", "link"],
          ProcessExternalResources: ["script"]
        }
      },
      function (err, window) {
        global.window = window;
        ["document","navigator"].forEach(
          function (key) {
            global[key] = window[key];
          }
        );
        assert.equal(err, null);
        done();
      }
    );
  });
          
  it("penjs:options is undefined", function () {
    examplejs_printLines = [];
    var pm = penjs('div');
    var div = document.querySelector('div');
    document.querySelector('h1').click();
    examplejs_print(document.querySelector('h1').innerHTML.trim());
    assert.equal(examplejs_printLines.join("\n"), "success"); examplejs_printLines = [];
  });
          
  it("jsdom@penjs:methods", function (done) {
    jsdom.env("    <div>\n      <script type=\"text/jhtmls\">\n      var info = { title: 'example' };\n      <div @click=\"change(info, title);\">\n        <h1 :bind=\"info\">#{info.title}</h1>\n      </div>\n      </script>\n    </div>", {
        features: {
          FetchExternalResources : ["script", "link"],
          ProcessExternalResources: ["script"]
        }
      },
      function (err, window) {
        global.window = window;
        ["document","navigator"].forEach(
          function (key) {
            global[key] = window[key];
          }
        );
        assert.equal(err, null);
        done();
      }
    );
  });
          
  it("penjs:methods", function () {
    examplejs_printLines = [];
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
    examplejs_print(document.querySelector('h1').innerHTML.trim());
    assert.equal(examplejs_printLines.join("\n"), "success"); examplejs_printLines = [];
  });
          
  it("jsdom@penjs:input", function (done) {
    jsdom.env("    <div>\n      <script type=\"text/jhtmls\">\n      var info = { title: '' };\n      <input type=\"text\" value=\"input\"\n        @input=\"info.title = this.value;\"\n        @keyup.esc=\"this.value = '';\"\n        @keyup.none=\"info.none = 0;\"\n      >\n      <span :bind=\"info\">#{info.title}</span>\n      </script>\n    </div>", {
        features: {
          FetchExternalResources : ["script", "link"],
          ProcessExternalResources: ["script"]
        }
      },
      function (err, window) {
        global.window = window;
        ["document","navigator"].forEach(
          function (key) {
            global[key] = window[key];
          }
        );
        assert.equal(err, null);
        done();
      }
    );
  });
          
  it("penjs:input", function () {
    examplejs_printLines = [];
    var pm = penjs('div');
    var div = document.querySelector('div');

    var e = document.createEvent('HTMLEvents');
    e.initEvent('focusin', true, false);
    document.querySelector('input').dispatchEvent(e);
    document.querySelector('input').value = 'success';

    var e = document.createEvent('HTMLEvents');
    e.initEvent('input', true, false);
    document.querySelector('input').dispatchEvent(e);
    examplejs_print(document.querySelector('span').innerHTML.trim());
    assert.equal(examplejs_printLines.join("\n"), "success"); examplejs_printLines = [];

    var e = document.createEvent('HTMLEvents');
    e.initEvent('keyup', true, false);
    e.keyCode = 27;
    document.querySelector('input').dispatchEvent(e);
    examplejs_print(JSON.stringify(document.querySelector('input').value));
    assert.equal(examplejs_printLines.join("\n"), "\"\""); examplejs_printLines = [];

    var e = document.createEvent('HTMLEvents');
    e.initEvent('focusout', true, false);
    document.querySelector('input').dispatchEvent(e);
  });
          
  it("jsdom@penjs:init & ejs & tap", function (done) {
    jsdom.env("    <div>\n      <script type=\"text/ejs\">\n      <% var info = { title: 'example' }; %>\n      <div @tap=\"change(info, title);\">\n        <h1 :bind=\"info\"><%= info.title %></h1>\n      </div>\n      </script>\n    </div>", {
        features: {
          FetchExternalResources : ["script", "link"],
          ProcessExternalResources: ["script"]
        }
      },
      function (err, window) {
        global.window = window;
        ["document","navigator"].forEach(
          function (key) {
            global[key] = window[key];
          }
        );
        assert.equal(err, null);
        done();
      }
    );
  });
          
  it("penjs:init & ejs & tap", function () {
    examplejs_printLines = [];
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


    examplejs_print(document.querySelector('h1').innerHTML.trim());
    assert.equal(examplejs_printLines.join("\n"), "success"); examplejs_printLines = [];
  });
          
});
         