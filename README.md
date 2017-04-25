h5page
--------

![logo](h5page.png)

# [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url]

Mobile-side page small development framework.

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
              :bind="item.title"
              :value="item.title"
              @create="this.focus();"
              @keydown="if (event.keyCode === 13) { this.blur(); }"
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

[npm-url]: https://npmjs.org/package/h5page
[npm-image]: https://badge.fury.io/js/h5page.svg
[travis-url]: https://travis-ci.org/zswang/h5page
[travis-image]: https://travis-ci.org/zswang/h5page.svg?branch=master
[coverage-url]: https://coveralls.io/github/zswang/h5page?branch=master
[coverage-image]: https://coveralls.io/repos/zswang/h5page/badge.svg?branch=master&service=github