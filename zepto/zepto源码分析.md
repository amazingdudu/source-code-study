# zepto 源码分析

## 1.入口、整体结构

```javascript
(function(global, factory) {
	factory(global);
})(this, function(window) {
	var Zepto = (function() {})();
	window.Zepto = Zepto;
	window.$ === undefined && (window.$ = Zepto);
});
```

## 核心

```javascript
var zepto = {},
	$;

function Z(dom) {
	var len = dom.length;
	for (var i = 0; i < len; i++) {
		this[i] = dom[i];
	}
	this.length = dom.length;
}

zepto.Z = function(dom) {
	return new Z(dom);
};

zepto.init = function(dom,context) {
    var dom = [];
    dom = context.querySelectorAll(selector);
	return zepto.Z(dom);
};

$ = function() {
	return zepto.init();
};

$.fn = {
	constructor: zepto.Z,
	css: function() {
		return this;
    },
    val: function() {
		return this;
    },
    ...
};

zepto.Z.prototype = Z.prototype = $.fn;

return $;

```

### 简化

```javascript
function Z(dom, selector) {
	var i,
		len = dom ? dom.length : 0;
	for (i = 0; i < len; i++) this[i] = dom[i];
	this.length = len;
	this.selector = selector || '';
}

function $(selector, context = document) {
	var dom = context.querySelectorAll(selector);
	return new Z(dom, selector);
}

$('div');
```
## 工具函数

## zepto集合方法