penjs
--------

![logo](penjs.png)

# [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url]

Mobile-web small development framework.

## Example

```html
<div id="app">
  <script type="text/jhtmls">
    var info = {
      createCount: 0,
      destroyCount: 0,
    }
    <h1>jhtmls -- #{title} -- #{time}</h1>
    <h3 :bind="info">create #{info.createCount} destroy: #{info.destroyCount}</h3>
    var asc = 1;
    <button @tap="now()">now</button>
    <button @tap="ajax()">ajax</button>
    <button @tap="sort(items, asc = -asc)">sort</button>
    <button @tap="push(items)">push</button>
    <ul :bind="items">
      items.forEach(function (item) {
      <li :bind="item" @create="info.createCount++" @destroy="info.destroyCount++">
        if (item.editing === 'jhtmls') {
          <input type="text"
            :value="item.title"
            @create="this.focus();"
            @keydown.enter="this.blur();"
            @focusout="item.title = this.value; item.editing = false;">
        } else {
          <span @dblclick="item.editing = 'jhtmls'">#{item.title}</span>
          <button @tap="remove(items, item)">remove</button>
        }
      </li>
      });
    </ul>
  </script>
</div>
```

## License

MIT © [zswang](http://weibo.com/zswang)

[npm-url]: https://npmjs.org/package/penjs
[npm-image]: https://badge.fury.io/js/penjs.svg
[travis-url]: https://travis-ci.org/zswang/penjs
[travis-image]: https://travis-ci.org/zswang/penjs.svg?branch=master
[coverage-url]: https://coveralls.io/github/zswang/penjs?branch=master
[coverage-image]: https://coveralls.io/repos/zswang/penjs/badge.svg?branch=master&service=github