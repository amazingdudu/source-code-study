/* Zepto v1.2.0 - zepto event ajax form ie - zeptojs.com/license */
(function(global, factory) {
	if (typeof define === 'function' && define.amd)
		define(function() {
			return factory(global);
		});
	else factory(global);
})(this, function(window) {
    // 核心，dom增删改查
	var Zepto = (function() {
		var undefined,
            key,
            // * $局部变量
			$,
			classList,
			emptyArray = [],
			concat = emptyArray.concat,
			filter = emptyArray.filter,
			slice = emptyArray.slice,
			document = window.document,
			elementDisplay = {},
			classCache = {},
			cssNumber = {
				'column-count': 1,
				columns: 1,
				'font-weight': 1,
				'line-height': 1,
				opacity: 1,
				'z-index': 1,
				zoom: 1
			},
			fragmentRE = /^\s*<(\w+|!)[^>]*>/, //匹配html标签或者注释  e.g. <div> 、<!-->
			singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, //匹配标签 e.g. <div></div> 、 <div>、 <img />
			// ? :是为了匹配什么？
			tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
			rootNodeRE = /^(?:body|html)$/i,
			capitalRE = /([A-Z])/g,
			// special attributes that should be get/set via method calls
			methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
			adjacencyOperators = ['after', 'prepend', 'before', 'append'],
			table = document.createElement('table'),
			tableRow = document.createElement('tr'),
			containers = {
				tr: document.createElement('tbody'),
				tbody: table,
				thead: table,
				tfoot: table,
				td: tableRow,
				th: tableRow,
				'*': document.createElement('div')
			},
            readyRE = /complete|loaded|interactive/,
            // 简单的选择器字符串  e.g. 'container', 'index-footer'
			simpleSelectorRE = /^[\w-]*$/,
			class2type = {},
            toString = class2type.toString,
            // * zepto
			zepto = {},
			camelize,
			uniq,
			tempParent = document.createElement('div'),
			propMap = {
				tabindex: 'tabIndex',
				readonly: 'readOnly',
				for: 'htmlFor',
				class: 'className',
				maxlength: 'maxLength',
				cellspacing: 'cellSpacing',
				cellpadding: 'cellPadding',
				rowspan: 'rowSpan',
				colspan: 'colSpan',
				usemap: 'useMap',
				frameborder: 'frameBorder',
				contenteditable: 'contentEditable'
			},
			isArray =
				Array.isArray ||
				function(object) {
					return object instanceof Array;
				};
		/**
		 * 如果元素被指定的选择器字符串选择，Element.matches()  方法返回true; 否则返回false。
		 * @param {HTMLElement} element
		 * @param {string} selector
		 * @returns {Boolean}
		 */
		zepto.matches = function(element, selector) {
			if (!selector || !element || element.nodeType !== 1) return false;
			var matchesSelector =
				element.matches ||
				element.webkitMatchesSelector ||
				element.mozMatchesSelector ||
				element.oMatchesSelector ||
				element.matchesSelector;
			if (matchesSelector) return matchesSelector.call(element, selector);
			// fall back to performing a selector:
			var match,
				parent = element.parentNode,
				temp = !parent;
			// 如果ele不存在父元素，将其放入一个临时元素中
			if (temp) (parent = tempParent).appendChild(element);
			// 通过ele的父元素找到ele集合,并且判断ele是否在集合中
			match = ~zepto.qsa(parent, selector).indexOf(element);
			temp && tempParent.removeChild(element);
			return match;
		};
		// 使用Object.prototype.toString.call(obj)判断数据类型
		function type(obj) {
            // 如果是null或者undefined，返回'null','undefined'
            // es5 不需要判断 toString.call(undefined) => [object Undefined]
			return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object';
		}

		function isFunction(value) {
			return type(value) == 'function';
		}
		function isWindow(obj) {
			return obj != null && obj == obj.window;
		}
		// document nodeType === 9
		function isDocument(obj) {
			return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
		}
		function isObject(obj) {
			return type(obj) == 'object';
		}
		// 纯粹的对象
		function isPlainObject(obj) {
			return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
		}
		// 类数组对象
		function likeArray(obj) {
			var length = !!obj && 'length' in obj && obj.length,
				type = $.type(obj);

			return (
				'function' != type &&
				!isWindow(obj) &&
				('array' == type || length === 0 || (typeof length == 'number' && length > 0 && length - 1 in obj))
			);
		}

		/**
		 * 过滤掉undefined、null元素
		 * @param {Array} array
		 * @return {Array}
		 */
		function compact(array) {
			return filter.call(array, function(item) {
				return item != null;
			});
		}
		// 扁平二维数组
		function flatten(array) {
			return array.length > 0 ? $.fn.concat.apply([], array) : array;
		}
		// 驼峰化  font-size => fontSize
		camelize = function(str) {
			return str.replace(/-+(.)?/g, function(match, chr) {
				return chr ? chr.toUpperCase() : '';
			});
		};
		// 连字符化
		function dasherize(str) {
			return str
				.replace(/::/g, '/')
				.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
				.replace(/([a-z\d])([A-Z])/g, '$1_$2')
				.replace(/_/g, '-')
				.toLowerCase();
		}
		/**
		 * 过滤掉重复元素，返回新数组
		 * @param {Array} array
		 * @return {Array}
		 */
		uniq = function(array) {
			return filter.call(array, function(item, idx) {
				return array.indexOf(item) == idx;
			});
		};
		/**
		 * 返回class的一个正则
		 * @param {*} name
		 * @returns {RegExp}
		 */
		function classRE(name) {
			return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
		}
		/**
		 * 判断一个css属性的value值是否加上px
		 * @param {String} name 属性
		 * @param {Number} value 值
		 * @returns {String} 如果需要加px,返回添加了px的值
		 */
		function maybeAddPx(name, value) {
			return typeof value == 'number' && !cssNumber[dasherize(name)] ? value + 'px' : value;
		}
		/**
		 * 获取元素默认的display属性值,并缓存,比如table默认display:table
		 * @param {String} nodeName
		 * @returns {String}
		 */
		function defaultDisplay(nodeName) {
			var element, display;
			if (!elementDisplay[nodeName]) {
				// 通过nodeName创建一个元素，插入到body中，获取完display的计算属性后移除
				element = document.createElement(nodeName);
				document.body.appendChild(element);
				display = getComputedStyle(element, '').getPropertyValue('display');
				element.parentNode.removeChild(element);
				// 如果这个元素的默认display：none （head,title默认display:none）
				display == 'none' && (display = 'block');
				elementDisplay[nodeName] = display;
			}
			return elementDisplay[nodeName];
		}
		/**
		 * 获取dom元素的所有元素子节点
		 * @param {HTMLElement} element
		 * @returns {Array}
		 */
		function children(element) {
			// 如果element有children集合，通过数组slice,将其转换为真数组
			// 否则通过childNodes集合过滤出元素子节点
			return 'children' in element
				? slice.call(element.children)
				: $.map(element.childNodes, function(node) {
						if (node.nodeType == 1) return node;
				  });
		}
        // zepto对象的构造函数
		function Z(dom, selector) {
			var i,
				len = dom ? dom.length : 0;
			for (i = 0; i < len; i++) this[i] = dom[i];
			this.length = len;
			this.selector = selector || '';
		}

		// `$.zepto.fragment` takes a html string and an optional tag name
		// to generate DOM nodes from the given html string.
		// The generated DOM nodes are returned as an array.
		// This function can be overridden in plugins for example to make
		// it compatible with browsers that don't support the DOM fully.
		// $ .zepto.fragment`接受一个html字符串和一个可选的标签名，
		// 以从给定的html字符串生成DOM节点。生成的DOM节点以数组形式返回。
		// 此函数可以在插件中重写，例如使其兼容 不完全支持DOM的浏览器。
		zepto.fragment = function(html, name, properties) {
			var dom, nodes, container;

			// A special case optimization for a single tag
			// 单个标签的特殊情况优化
			// html为 <div></div>、<div> 、<img>情况
			if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1));

			if (!dom) {
				//?是否需要判断html.replace存在
				// <div class="title"/> => <div class="title"></div>
				if (html.replace) html = html.replace(tagExpanderRE, '<$1></$2>');

				if (name === undefined) name = fragmentRE.test(html) && RegExp.$1;

				if (!(name in containers)) name = '*';
				// 使用包裹元素生成html节点，然后清空包裹元素
				container = containers[name];
				container.innerHTML = '' + html;
				// 返回生成的html节点数组
				dom = $.each(slice.call(container.childNodes), function() {
					container.removeChild(this);
				});
			}
			// 如果存在初始属性对象，遍历
			if (isPlainObject(properties)) {
				nodes = $(dom);
				$.each(properties, function(key, value) {
					// nodes 是zepto集合对象，遍历子元素添加属性，子元素即dom
					if (methodAttributes.indexOf(key) > -1) nodes[key](value);
					else nodes.attr(key, value);
				});
			}
			return dom;
		};

		// `$.zepto.Z` swaps out the prototype of the given `dom` array
		// of nodes with `$.fn` and thus supplying all the Zepto functions
		// to the array. This method can be overridden in plugins.
		// $ .zepto.Z`将给定的`dom`节点数组的原型替换为$ .fn`，从而将所有Zepto函数提供给该数组。
		// 可以在插件中重写此方法。
		zepto.Z = function(dom, selector) {
			return new Z(dom, selector);
		};

		// `$.zepto.isZ` should return `true` if the given object is a Zepto
		// collection. This method can be overridden in plugins.
		// 如果给定的对象是Zepto集合，则$ .zepto.isZ应该返回true。 可以在插件中重写此方法。
		zepto.isZ = function(object) {
			return object instanceof zepto.Z;
		};

		// `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
		// takes a CSS selector and an optional context (and handles various
		// special cases).
		// This method can be overridden in plugins.
		// $ .zepto.init是Zepto的与jQuery中 $ .fn.init相对应的对象，
		// 它带有CSS选择器和可选的上下文（并处理各种特殊情况）。此方法可以在插件中覆盖。
		zepto.init = function(selector, context) {
			var dom;
			// If nothing given, return an empty Zepto collection
			if (!selector) return zepto.Z();
			// Optimize for string selectors
			else if (typeof selector == 'string') {
				selector = selector.trim();
				// If it's a html fragment, create nodes from it
				//如果是html片段，则创建dom节点
				// Note: In both Chrome 21 and Firefox 15, DOM error 12
				// is thrown if the fragment doesn't begin with <
				if (selector[0] == '<' && fragmentRE.test(selector)) {
					// content 可以是一个属性对象 $('div',{id:'root',display:'none'})
					dom = zepto.fragment(selector, RegExp.$1, context);
                    selector = null;
				}
				// If there's a context, create a collection on that context first, and select
				// nodes from there
				// 如果有上下文，首先在该上下文上创建一个集合，然后从其中选择节点
				else if (context !== undefined) return $(context).find(selector);
				// If it's a CSS selector, use it to select nodes.
				//如果是CSS选择器，则使用它来选择节点。
				else dom = zepto.qsa(document, selector);
			}
			// If a function is given, call it when the DOM is ready
			// 如果是函数，则在DOM准备就绪时调用它
			else if (isFunction(selector)) return $(document).ready(selector);
			// If a Zepto collection is given, just return it
			// 如果是Zepto集合，则将其返回
			else if (zepto.isZ(selector)) return selector;
			else {
				// normalize array if an array of nodes is given
				// 如果给出节点数组，则对数组进行规范化
				if (isArray(selector)) dom = compact(selector);
				// Wrap DOM nodes.
				else if (isObject(selector)) (dom = [selector]), (selector = null);
				// If it's a html fragment, create nodes from it
				// 如果是html片段，就用它创建节点
				// ? 基本包装类型 new String('hello') new Numner(1)
				else if (fragmentRE.test(selector))
					(dom = zepto.fragment(selector.trim(), RegExp.$1, context)), (selector = null);
				// If there's a context, create a collection on that context first, and select
				// nodes from there
				// 如果有上下文，首先在该上下文上创建一个集合，然后从其中选择节点
				else if (context !== undefined) return $(context).find(selector);
				// And last but no least, if it's a CSS selector, use it to select nodes.
				else dom = zepto.qsa(document, selector);
			}
			// create a new Zepto collection from the nodes found
			// 从找到的节点创建一个新的Zepto集合
			return zepto.Z(dom, selector);
		};

		// `$` will be the base `Zepto` object. When calling this
		// function just call `$.zepto.init, which makes the implementation
		// details of selecting nodes and creating Zepto collections
		// patchable in plugins.

		/**
		 *
		 * @param {*} selector
		 * @param {*} context
		 * @returns {*}
		 */
		$ = function(selector, context) {
			return zepto.init(selector, context);
		};
		/**
		 *
		 * @param {Object|Array} target 目标对象
		 * @param {Object|Array} source 源对象
		 * @param {Boolean} deep 深混入
		 * @returns {Object} target
		 */
		function extend(target, source, deep) {
			for (key in source)
				if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
					// 如果源对象的key对应的属性值是原生对象，而目标对象key对应的属性值不是原生对象，
					//那么将key 初始化为空{}
					if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
						target[key] = {};
					}
					if (isArray(source[key]) && !isArray(target[key])) {
						target[key] = [];
					}
					extend(target[key], source[key], deep);
				} else if (source[key] !== undefined) {
					target[key] = source[key];
				}
		}

		// Copy all but undefined properties from one or more
		// objects to the `target` object.
		// 将所有未定义的属性从一个或多个对象复制到“ target”对象。
		$.extend = function(target) {
			var deep,
				args = slice.call(arguments, 1);
			// 如果target参数是布尔值，取第二个参数作为目标对象
			if (typeof target == 'boolean') {
				deep = target;
				target = args.shift();
			}
			args.forEach(function(arg) {
				extend(target, arg, deep);
			});
			return target;
		};

		// `$.zepto.qsa` is Zepto's CSS selector implementation which
		// uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
		// This method can be overridden in plugins.
		zepto.qsa = function(element, selector) {
			var found,
				maybeID = selector[0] == '#',
				maybeClass = !maybeID && selector[0] == '.',
				nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
				// 是否是一个简单的单一选择器,标签名，类名
				isSimple = simpleSelectorRE.test(nameOnly);

			// 如果选择器是id选择器
			if (element.getElementById && isSimple && maybeID) {
				found = element.getElementById(nameOnly);
				return found ? [found] : [];
			}
			// 如何元素不是dom节点
			else if (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) {
				return [];
			} else {
				var res;
				// 如果是一个简单的标签或者类名
				if (isSimple && !maybeID && element.getElementsByClassName) {
					res = maybeClass ? element.getElementsByClassName(nameOnly) : element.getElementsByTagName(selector);
				} else {
					// 其他所有情况，均使用原生querySelectorAll方法
					res = element.querySelectorAll(selector);
				}
				return slice.call(res);
			}
		};
		/**
		 * 已过滤的元素集合
		 * @param {*} nodes
		 * @param {*} selector
		 */
		function filtered(nodes, selector) {
			return selector == null ? $(nodes) : $(nodes).filter(selector);
		}
		/**
		 * ode 是否是parent的后代节点.如果存在原生contains方法，直接调用，否则循环找到node的父代节点是否为parent
		 * 原生contains方法,如何node是parent本身，也返回true，所以排除此种情况
		 * @param {*} parent
		 * @param {*} node
		 * @returns {Boolean}
		 */
		$.contains = document.documentElement.contains
			? function(parent, node) {
					//是否是parent的后代节点.
					return parent !== node && parent.contains(node);
			  }
			: function(parent, node) {
					while (node && (node = node.parentNode)) if (node === parent) return true;
					return false;
			  };
		/**
		 * 改版函数this指向,
		 * @param {*} context
		 * @param {*} arg
		 * @param {*} idx
		 * @param {*} payload
		 */
		function funcArg(context, arg, idx, payload) {
			return isFunction(arg) ? arg.call(context, idx, payload) : arg;
		}
		/**
		 * 设置元素的属性值，如果属性值不存在，则移除该属性
		 * @param {*} node
		 * @param {*} name
		 * @param {*} value
		 */
		function setAttribute(node, name, value) {
			value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
		}

		// access className property while respecting SVGAnimatedString
		/**
		 * 在慎重对待SVG Animated String的情况下访问className属性
		 * @param {*} node
		 * @param {*} value
		 * @returns {*}
		 * 如果value不存在则返回，node的className值，否则设置node的className
		 */
		function className(node, value) {
			var klass = node.className || '',
				svg = klass && klass.baseVal !== undefined;

			if (value === undefined) return svg ? klass.baseVal : klass;
			svg ? (klass.baseVal = value) : (node.className = value);
		}

		// "true"  => true
		// "false" => false
		// "null"  => null
		// "42"    => 42
		// "42.5"  => 42.5
		// "08"    => "08"
		// JSON    => parse if valid
		// String  => self
		/**
		 * 字符串反序列化
		 * @param {*} value
		 */
		function deserializeValue(value) {
			try {
				return value
					? value == 'true' ||
							(value == 'false'
								? false
								: value == 'null'
								? null
								: +value + '' == value
								? +value
								: /^[\[\{]/.test(value)
								? $.parseJSON(value)
								: value)
					: value;
			} catch (e) {
				return value;
			}
		}

		$.type = type;
		$.isFunction = isFunction;
		$.isWindow = isWindow;
		$.isArray = isArray;
		$.isPlainObject = isPlainObject;

		$.isEmptyObject = function(obj) {
			var name;
			for (name in obj) return false;
			return true;
		};

		$.isNumeric = function(val) {
			var num = Number(val),
				type = typeof val;
			return (
				(val != null && type != 'boolean' && (type != 'string' || val.length) && !isNaN(num) && isFinite(num)) || false
			);
		};

		$.inArray = function(elem, array, i) {
			return emptyArray.indexOf.call(array, elem, i);
		};

		$.camelCase = camelize;
		// 去除字符串两边的空白
		$.trim = function(str) {
			return str == null ? '' : String.prototype.trim.call(str);
		};

		// plugin compatibility
		$.uuid = 0;
		$.support = {};
		$.expr = {};
		$.noop = function() {};

		$.map = function(elements, callback) {
			var value,
				values = [],
				i,
				key;
			if (likeArray(elements))
				for (i = 0; i < elements.length; i++) {
					value = callback(elements[i], i);
					if (value != null) values.push(value);
				}
			else
				for (key in elements) {
					value = callback(elements[key], key);
					if (value != null) values.push(value);
				}
			//?为何需要扁平
			return flatten(values);
		};
		/**
		 * 遍历集合，当遍历器返回false时，中断遍历
		 * @param {Array|Object} elements
		 * @param {Function} callback
		 * @returns {Array|Object}
		 */
		$.each = function(elements, callback) {
			var i, key;
			if (likeArray(elements)) {
				for (i = 0; i < elements.length; i++) if (callback.call(elements[i], i, elements[i]) === false) return elements;
			} else {
				for (key in elements) if (callback.call(elements[key], key, elements[key]) === false) return elements;
			}

			return elements;
		};
		// 过滤集合
		$.grep = function(elements, callback) {
			return filter.call(elements, callback);
		};

		if (window.JSON) $.parseJSON = JSON.parse;

		// Populate the class2type map
		$.each('Boolean Number String Function Array Date RegExp Object Error'.split(' '), function(i, name) {
			class2type['[object ' + name + ']'] = name.toLowerCase();
		});

		// Define methods that will be available on all
		// Zepto collections
		// 定义在所有Zepto集合中可用的方法
		$.fn = {
			constructor: zepto.Z,
			length: 0,

			// Because a collection acts like an array
			// copy over these useful array functions.
			forEach: emptyArray.forEach,
			reduce: emptyArray.reduce,
			push: emptyArray.push,
			sort: emptyArray.sort,
			splice: emptyArray.splice,
			indexOf: emptyArray.indexOf,
			concat: function() {
				var i,
					value,
					args = [];
				for (i = 0; i < arguments.length; i++) {
					value = arguments[i];
					args[i] = zepto.isZ(value) ? value.toArray() : value;
				}
				return concat.apply(zepto.isZ(this) ? this.toArray() : this, args);
			},

			// `map` and `slice` in the jQuery API work differently
			// from their array counterparts
			// jQuery API中的`map'和`slice'与数组对应的工作方式不同
			// 递归返回新是数组，在经过$包装

			/**
			 *  遍历当前集合，返回新的集合
			 * @param {*} fn  fn里this指向的是当前遍历的元素
			 * @returns {ZeptoCollection}
			 */
			map: function(fn) {
				return $(
					$.map(this, function(el, i) {
						return fn.call(el, i, el);
					})
				);
			},
			// 截取集合，并重新包装成zepto对象
			slice: function() {
				return $(slice.apply(this, arguments));
			},

			ready: function(callback) {
				// need to check if document.body exists for IE as that browser reports
				// document ready when it hasn't yet created the body element
				if (readyRE.test(document.readyState) && document.body) callback($);
				else
					document.addEventListener(
						'DOMContentLoaded',
						function() {
							callback($);
						},
						false
					);
				return this;
			},
			/**
			 *
			 * @param {*} idx
			 * @returns {*}
			 * 返回一个新的原生集合或者集合中一个元素
			 */
			get: function(idx) {
				return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
			},
			// 将zepto集合转换为数组集合
			toArray: function() {
				return this.get();
			},
			// 返回集合中元素的个数
			size: function() {
				return this.length;
			},
			// 将该节点从其父节点中移除
			remove: function() {
				return this.each(function() {
					if (this.parentNode != null) this.parentNode.removeChild(this);
				});
			},
			// 使用every 遍历集合,可以终止循环
			each: function(callback) {
				emptyArray.every.call(this, function(el, idx) {
					return callback.call(el, idx, el) !== false;
				});
				return this;
			},
			/**
			 * 刷选出符合selector的元素集合
			 * @param {*} selector
			 * @returns {ZeptoCollection}
			 */
			filter: function(selector) {
				if (isFunction(selector)) return this.not(this.not(selector));
				return $(
					filter.call(this, function(element) {
						return zepto.matches(element, selector);
					})
				);
			},
			// 添加元素到当前匹配的元素集合中,如果给定context参数，
			// 将只在context元素中进行查找，否则在整个document中查找。
			add: function(selector, context) {
				return $(uniq(this.concat($(selector, context))));
			},
			/**
			 * 判断集合的第一个元素是否和选择器相符
			 * @param {*} selector
			 * @returns {Boolean}
			 */
			is: function(selector) {
				return this.length > 0 && zepto.matches(this[0], selector);
			},
			not: function(selector) {
				var nodes = [];
				// 过滤掉selector回调返回false的元素  为什么需要判断selector.call ？
				if (isFunction(selector) && selector.call !== undefined) {
					this.each(function(idx) {
						if (!selector.call(this, idx)) nodes.push(this);
					});
				} else {
					// 找到要排出的集合
					var excludes;
					if (typeof selector == 'string') {
						//this.filter(selector) 用来找到符合selector的集合
						excludes = this.filter(selector);
					}
					//?selector为什么会有item
					else if (likeArray(selector) && isFunction(selector.item)) {
						excludes = slice.call(selector);
					} else {
						excludes = $(selector);
					}
					this.forEach(function(el) {
						// excludes.indexOf(el) < 0 将符合selector的排除掉
						if (excludes.indexOf(el) < 0) nodes.push(el);
					});
				}
				return $(nodes);
			},
			// 判断当前对象集合的子元素是否有符合选择器的元素，或者是否包含指定的DOM节点，如果有，则返回新的对象集合，该对象过滤掉不含有选择器匹配元素或者不含有指定DOM节点的对象。
			has: function(selector) {
				return this.filter(function() {
					return isObject(selector)
						? $.contains(this, selector)
						: $(this)
								.find(selector)
								.size();
				});
			},
			// 从当前对象集合中获取给定索引值（注：以0为基数）的元素。
			eq: function(idx) {
				return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
			},
			// 获取集合中的第一个元素
			first: function() {
				var el = this[0];
				//? el除了object还会是什么 是否考虑 $([1,3]),$([0,1,2])
				return el && !isObject(el) ? el : $(el);
			},
			// 获取集合中的最后一个元素
			last: function() {
				var el = this[this.length - 1];
				return el && !isObject(el) ? el : $(el);
			},
			// 在当对象前集合内查找符合CSS选择器的每个元素的后代元素。
			// 如果给定Zepto对象集合或者元素，过滤它们，只有当它们在当前Zepto集合对象中时，才回被返回。
			find: function(selector) {
				var result,
					$this = this;
				if (!selector) result = $();
				// 如何selector是一个dom元素，判断该元素是否在集合中，是，则返回
				else if (typeof selector == 'object')
					result = $(selector).filter(function() {
						var node = this;
						return emptyArray.some.call($this, function(parent) {
							return $.contains(parent, node);
						});
					});
				else if (this.length == 1) result = $(zepto.qsa(this[0], selector));
				else
					result = this.map(function() {
						// 此处的this指向的是集合中的每一项元素，原生dom对象
						return zepto.qsa(this, selector);
					});
				return result;
			},
			// 从元素本身开始，逐级向上级元素匹配，并返回最先匹配selector的元素
			closest: function(selector, context) {
				var nodes = [],
					collection = typeof selector == 'object' && $(selector);
				this.each(function(_, node) {
					while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
						node = node !== context && !isDocument(node) && node.parentNode;
					if (node && nodes.indexOf(node) < 0) nodes.push(node);
				});
				return $(nodes);
			},
			// 获取对象集合每个元素所有的祖先元素。如果css选择器参数给出，过滤出符合条件的元素。
			parents: function(selector) {
				var ancestors = [],
					nodes = this;
				while (nodes.length > 0)
					nodes = $.map(nodes, function(node) {
						if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
							ancestors.push(node);
							return node;
						}
					});
				return filtered(ancestors, selector);
			},
			// 获取对象集合中每个元素的直接父元素。如果css选择器参数给出。过滤出符合条件的元素。
			parent: function(selector) {
				return filtered(uniq(this.pluck('parentNode')), selector);
			},
			// 获得每个匹配元素集合元素的直接子元素，如果给定selector，那么返回的结果中只包含符合css选择器的元素。
			children: function(selector) {
				return filtered(
					this.map(function() {
						return children(this);
					}),
					selector
				);
			},
			// 获得每个匹配元素集合元素的子元素，包括文字和注释节点。
			contents: function() {
				return this.map(function() {
					return this.contentDocument || slice.call(this.childNodes);
				});
			},
			// 获取对象集合中所有元素的兄弟节点。如果给定CSS选择器参数，过滤出符合选择器的元素。
			siblings: function(selector) {
				// 找到集合中每个元素的父元素，在找到父元素的所有子元素（除了该元素本身）
				return filtered(
					this.map(function(i, el) {
						return filter.call(children(el.parentNode), function(child) {
							return child !== el;
						});
					}),
					selector
				);
			},
			// 清空对象集合中每个元素的DOM内容。
			empty: function() {
				return this.each(function() {
					this.innerHTML = '';
				});
			},
			// `pluck` is borrowed from Prototype.js
			// 获取对象集合中每一个元素的属性值。返回值为 null或undefined值得过滤掉。
			pluck: function(property) {
				return $.map(this, function(el) {
					return el[property];
				});
			},
			//恢复对象集合中每个元素默认的“display”值。
			show: function() {
				return this.each(function() {
					// 如果行内属性dispaly:none,直接重置display
					this.style.display == 'none' && (this.style.display = '');
					// 如果在css中dispaly:none,那么显示时使用元素默认的display
					if (getComputedStyle(this, '').getPropertyValue('display') == 'none') {
						this.style.display = defaultDisplay(this.nodeName);
					}
				});
			},
			// 用给定的内容替换元素本身。
			replaceWith: function(newContent) {
				return this.before(newContent).remove();
			},
			wrap: function(structure) {
				var func = isFunction(structure);
				if (this[0] && !func)
					var dom = $(structure).get(0),
						clone = dom.parentNode || this.length > 1;

				return this.each(function(index) {
					$(this).wrapAll(func ? structure.call(this, index) : clone ? dom.cloneNode(true) : dom);
				});
			},
			wrapAll: function(structure) {
				if (this[0]) {
					$(this[0]).before((structure = $(structure)));
					var children;
					// drill down to the inmost element
					while ((children = structure.children()).length) structure = children.first();
					$(structure).append(this);
				}
				return this;
			},
			wrapInner: function(structure) {
				var func = isFunction(structure);
				return this.each(function(index) {
					var self = $(this),
						contents = self.contents(),
						dom = func ? structure.call(this, index) : structure;
					contents.length ? contents.wrapAll(dom) : self.append(dom);
				});
			},
			unwrap: function() {
				this.parent().each(function() {
					$(this).replaceWith($(this).children());
				});
				return this;
			},
			clone: function() {
				return this.map(function() {
					return this.cloneNode(true);
				});
			},
			hide: function() {
				return this.css('display', 'none');
			},
			toggle: function(setting) {
				return this.each(function() {
					var el = $(this);
					(setting === undefined ? el.css('display') == 'none' : setting) ? el.show() : el.hide();
				});
			},
			prev: function(selector) {
				return $(this.pluck('previousElementSibling')).filter(selector || '*');
			},
			next: function(selector) {
				return $(this.pluck('nextElementSibling')).filter(selector || '*');
			},
			// 获取或设置对象集合中元素的HTML内容。
			html: function(html) {
				// 0 in arguments 用于判断参数是否为空
				return 0 in arguments
					? this.each(function(idx) {
							var originHtml = this.innerHTML;
							//如果html是函数，那么调用函数返回dom元素或者html，回调函数参数是集合是索引和原来的html
							$(this)
								.empty()
								.append(funcArg(this, html, idx, originHtml));
					  })
					: 0 in this
					? this[0].innerHTML
					: null;
			},
			// 获取或者设置所有对象集合中元素的文本内容。
			text: function(text) {
				return 0 in arguments
					? this.each(function(idx) {
							var newText = funcArg(this, text, idx, this.textContent);
							this.textContent = newText == null ? '' : '' + newText;
					  })
					: 0 in this
					? this.pluck('textContent').join('')
					: null;
			},
			
			/**
			 * 读取或设置dom元素的属性值。读取第一个元素
			 * @param {*} name
			 * @param {*} value 可以为空、字符串或者函数
			 */
			attr: function(name, value) {
				var result;
				return typeof name == 'string' && !(1 in arguments)
					? 0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null
						? result
						: undefined
					: this.each(function(idx) {
							if (this.nodeType !== 1) return;
							if (isObject(name)) for (key in name) setAttribute(this, key, name[key]);
							else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
					  });
			},
			// 移除当前对象集合中所有元素的指定属性。 移除多个属性使用空号分格
			removeAttr: function(name) {
				return this.each(function() {
					this.nodeType === 1 &&
						name.split(' ').forEach(function(attribute) {
							setAttribute(this, attribute);
						}, this);
				});
			},
			/**
			 * 读取或设置dom元素的属性值。读取第一个元素
			 * @param {*} name
			 * @param {*} value 可以为空、字符串或者函数
			 */
			prop: function(name, value) {
				name = propMap[name] || name;
				return 1 in arguments
					? this.each(function(idx) {
							this[name] = funcArg(this, value, idx, this[name]);
					  })
					: this[0] && this[0][name];
            },
            /**
             * 删除dom元素属性
             * @param {*} name 
             */
			removeProp: function(name) {
				name = propMap[name] || name;
				return this.each(function() {
					delete this[name];
				});
            },
            // 读取或写入dom的 data-* 属性。
			data: function(name, value) {
				var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();

				var data = 1 in arguments ? this.attr(attrName, value) : this.attr(attrName);

				return data !== null ? deserializeValue(data) : undefined;
			},
			val: function(value) {
				if (0 in arguments) {
					if (value == null) value = '';
					return this.each(function(idx) {
						this.value = funcArg(this, value, idx, this.value);
					});
				} else {
					return (
						this[0] &&
						(this[0].multiple
							? $(this[0])
									.find('option')
									.filter(function() {
										return this.selected;
									})
									.pluck('value')
							: this[0].value)
					);
				}
            },
            // 获得当前元素相对于document的位置。返回一个对象含有： top, left, width和height
            // 当给定一个含有left和top属性对象时，使用这些值来对集合中每一个元素进行相对于document的定位。
			offset: function(coordinates) {
				if (coordinates)
					return this.each(function(index) {
						var $this = $(this),
							coords = funcArg(this, coordinates, index, $this.offset()),
							parentOffset = $this.offsetParent().offset(),
							props = {
								top: coords.top - parentOffset.top,
								left: coords.left - parentOffset.left
							};

						if ($this.css('position') == 'static') props['position'] = 'relative';
						$this.css(props);
					});
				if (!this.length) return null;
				if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
					return { top: 0, left: 0 };
				var obj = this[0].getBoundingClientRect();
				return {
					left: obj.left + window.pageXOffset,
					top: obj.top + window.pageYOffset,
					width: Math.round(obj.width),
					height: Math.round(obj.height)
				};
			},
			css: function(property, value) {
				if (arguments.length < 2) {
					var element = this[0];
					if (typeof property == 'string') {
						if (!element) return;
						return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property);
					} else if (isArray(property)) {
						if (!element) return;
						var props = {};
						var computedStyle = getComputedStyle(element, '');
						$.each(property, function(_, prop) {
							props[prop] = element.style[camelize(prop)] || computedStyle.getPropertyValue(prop);
						});
						return props;
					}
                }
                // https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration/removeProperty
                // var oldValue = style.removeProperty(property);
                // property 是一个 DOMString ，代表要移除的属性名。
                // 注意由多个单词组成的属性要用连字符连接各个单词，不接收驼峰命名法的形式。
                //oldValue 是一个 DOMString ，等于被移除的属性在移除前的属性值。 

				var css = '';
				if (type(property) == 'string') {
					if (!value && value !== 0)
						this.each(function() {
							this.style.removeProperty(dasherize(property));
						});
					else css = dasherize(property) + ':' + maybeAddPx(property, value);
				} else {
					for (key in property)
						if (!property[key] && property[key] !== 0)
							this.each(function() {
								this.style.removeProperty(dasherize(key));
							});
						else css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
				}

				return this.each(function() {
					this.style.cssText += ';' + css;
				});
            },
            // 获取一个元素的索引值（注：从0开始计数）。
            // 当elemen参数没有给出时，返回当前元素在兄弟节点中的位置。
            // 当element参数给出时，返回它在当前对象集合中的位置。如果没有找到该元素，则返回-1。
			index: function(element) {
				return element
					? this.indexOf($(element)[0])
					: this.parent()
							.children()
							.indexOf(this[0]);
			},
			hasClass: function(name) {
				if (!name) return false;
				return emptyArray.some.call(
					this,
					function(el) {
						return this.test(className(el));
					},
					classRE(name)
				);
			},
			addClass: function(name) {
				if (!name) return this;
				return this.each(function(idx) {
					if (!('className' in this)) return;
					classList = [];
					var cls = className(this),
						newName = funcArg(this, name, idx, cls);
					newName.split(/\s+/g).forEach(function(klass) {
						if (!$(this).hasClass(klass)) classList.push(klass);
					}, this);
					classList.length && className(this, cls + (cls ? ' ' : '') + classList.join(' '));
				});
			},
			removeClass: function(name) {
				return this.each(function(idx) {
					if (!('className' in this)) return;
					if (name === undefined) return className(this, '');
					classList = className(this);
					funcArg(this, name, idx, classList)
						.split(/\s+/g)
						.forEach(function(klass) {
							classList = classList.replace(classRE(klass), ' ');
						});
					className(this, classList.trim());
				});
			},
			toggleClass: function(name, when) {
				if (!name) return this;
				return this.each(function(idx) {
					var $this = $(this),
						names = funcArg(this, name, idx, className(this));
					names.split(/\s+/g).forEach(function(klass) {
						(when === undefined ? !$this.hasClass(klass) : when) ? $this.addClass(klass) : $this.removeClass(klass);
					});
				});
			},
			scrollTop: function(value) {
				if (!this.length) return;
				var hasScrollTop = 'scrollTop' in this[0];
				if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset;
				return this.each(
					hasScrollTop
						? function() {
								this.scrollTop = value;
						  }
						: function() {
								this.scrollTo(this.scrollX, value);
						  }
				);
			},
			scrollLeft: function(value) {
				if (!this.length) return;
				var hasScrollLeft = 'scrollLeft' in this[0];
				if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset;
				return this.each(
					hasScrollLeft
						? function() {
								this.scrollLeft = value;
						  }
						: function() {
								this.scrollTo(value, this.scrollY);
						  }
				);
			},
			position: function() {
				if (!this.length) return;

				var elem = this[0],
					// Get *real* offsetParent
					offsetParent = this.offsetParent(),
					// Get correct offsets
					offset = this.offset(),
					parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

				// Subtract element margins
				// note: when an element has margin: auto the offsetLeft and marginLeft
				// are the same in Safari causing offset.left to incorrectly be 0
				offset.top -= parseFloat($(elem).css('margin-top')) || 0;
				offset.left -= parseFloat($(elem).css('margin-left')) || 0;

				// Add offsetParent borders
				parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0;
				parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0;

				// Subtract the two offsets
				return {
					top: offset.top - parentOffset.top,
					left: offset.left - parentOffset.left
				};
			},
			offsetParent: function() {
				return this.map(function() {
                    var parent = this.offsetParent || document.body;
                    // ？如果不存在offsetParent属性，那么依次向上找
					while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css('position') == 'static')
						parent = parent.offsetParent;
					return parent;
				});
			}
		};

		// for now
		$.fn.detach = $.fn.remove;

		// Generate the `width` and `height` functions
		['width', 'height'].forEach(function(dimension) {
			var dimensionProperty = dimension.replace(/./, function(m) {
				return m[0].toUpperCase();
			});

			$.fn[dimension] = function(value) {
				var offset,
					el = this[0];
				if (value === undefined)
					return isWindow(el)
						? el['inner' + dimensionProperty]
						: isDocument(el)
						? el.documentElement['scroll' + dimensionProperty]
						: (offset = this.offset()) && offset[dimension];
				else
					return this.each(function(idx) {
						el = $(this);
						el.css(dimension, funcArg(this, value, idx, el[dimension]()));
					});
			};
		});

		function traverseNode(node, fun) {
			fun(node);
			for (var i = 0, len = node.childNodes.length; i < len; i++) traverseNode(node.childNodes[i], fun);
		}

		// Generate the `after`, `prepend`, `before`, `append`,
		// `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
		adjacencyOperators.forEach(function(operator, operatorIndex) {
			var inside = operatorIndex % 2; //=> prepend, append

			$.fn[operator] = function() {
				// arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
				var argType,
					nodes = $.map(arguments, function(arg) {
						var arr = [];
						argType = type(arg);
						if (argType == 'array') {
							arg.forEach(function(el) {
								if (el.nodeType !== undefined) return arr.push(el);
								else if ($.zepto.isZ(el)) return (arr = arr.concat(el.get()));
								arr = arr.concat(zepto.fragment(el));
							});
							return arr;
						}
						return argType == 'object' || arg == null ? arg : zepto.fragment(arg);
					}),
					parent,
					copyByClone = this.length > 1;
				if (nodes.length < 1) return this;

				return this.each(function(_, target) {
					parent = inside ? target : target.parentNode;

					// convert all methods to a "before" operation
					target =
						operatorIndex == 0
							? target.nextSibling
							: operatorIndex == 1
							? target.firstChild
							: operatorIndex == 2
							? target
							: null;

					var parentInDocument = $.contains(document.documentElement, parent);

					nodes.forEach(function(node) {
						if (copyByClone) node = node.cloneNode(true);
						else if (!parent) return $(node).remove();

						parent.insertBefore(node, target);
						if (parentInDocument)
							traverseNode(node, function(el) {
								if (
									el.nodeName != null &&
									el.nodeName.toUpperCase() === 'SCRIPT' &&
									(!el.type || el.type === 'text/javascript') &&
									!el.src
								) {
									var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
									target['eval'].call(target, el.innerHTML);
								}
							});
					});
				});
			};

			// after    => insertAfter
			// prepend  => prependTo
			// before   => insertBefore
			// append   => appendTo
			$.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
				$(html)[operator](this);
				return this;
			};
		});

		zepto.Z.prototype = Z.prototype = $.fn;

		// Export internal API functions in the `$.zepto` namespace
		zepto.uniq = uniq;
		zepto.deserializeValue = deserializeValue;
		$.zepto = zepto;

		return $;
	})();

	window.Zepto = Zepto;
    window.$ === undefined && (window.$ = Zepto);
    // 事件处理
	(function($) {
		var _zid = 1,
			undefined,
			slice = Array.prototype.slice,
			isFunction = $.isFunction,
			isString = function(obj) {
				return typeof obj == 'string';
			},
			handlers = {},
			specialEvents = {},
			focusinSupported = 'onfocusin' in window,
			focus = { focus: 'focusin', blur: 'focusout' },
			hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

		specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';
        
		function zid(element) {
			return element._zid || (element._zid = _zid++);
		}
		function findHandlers(element, event, fn, selector) {
			event = parse(event);
			if (event.ns) var matcher = matcherFor(event.ns);
			return (handlers[zid(element)] || []).filter(function(handler) {
				return (
					handler &&
					(!event.e || handler.e == event.e) &&
					(!event.ns || matcher.test(handler.ns)) &&
					(!fn || zid(handler.fn) === zid(fn)) &&
					(!selector || handler.sel == selector)
				);
			});
		}
		function parse(event) {
			var parts = ('' + event).split('.');
			return {
				e: parts[0],
				ns: parts
					.slice(1)
					.sort()
					.join(' ')
			};
		}
		function matcherFor(ns) {
			return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
		}

		function eventCapture(handler, captureSetting) {
			return (handler.del && !focusinSupported && handler.e in focus) || !!captureSetting;
		}

		function realEvent(type) {
			return hover[type] || (focusinSupported && focus[type]) || type;
		}

		function add(element, events, fn, data, selector, delegator, capture) {
			var id = zid(element),
				set = handlers[id] || (handlers[id] = []);
			events.split(/\s/).forEach(function(event) {
				if (event == 'ready') return $(document).ready(fn);
				var handler = parse(event);
				handler.fn = fn;
				handler.sel = selector;
				// emulate mouseenter, mouseleave
				if (handler.e in hover)
					fn = function(e) {
						var related = e.relatedTarget;
						if (!related || (related !== this && !$.contains(this, related))) return handler.fn.apply(this, arguments);
					};
				handler.del = delegator;
				var callback = delegator || fn;
				handler.proxy = function(e) {
					e = compatible(e);
					if (e.isImmediatePropagationStopped()) return;
					e.data = data;
					var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
					if (result === false) e.preventDefault(), e.stopPropagation();
					return result;
				};
				handler.i = set.length;
				set.push(handler);
				if ('addEventListener' in element)
					element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
			});
		}
		function remove(element, events, fn, selector, capture) {
			var id = zid(element);
			(events || '').split(/\s/).forEach(function(event) {
				findHandlers(element, event, fn, selector).forEach(function(handler) {
					delete handlers[id][handler.i];
					if ('removeEventListener' in element)
						element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
				});
			});
		}

		$.event = { add: add, remove: remove };
        // 改变函数this指向，类似于bind
		$.proxy = function(fn, context) {
            var args = 2 in arguments && slice.call(arguments, 2);
            // 参数 function context
			if (isFunction(fn)) {
				var proxyFn = function() {
					return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
				};
				proxyFn._zid = zid(fn);
                return proxyFn;
                //参数 content content中的方法
			} else if (isString(context)) {
				if (args) {
					args.unshift(fn[context], fn);
					return $.proxy.apply(null, args);
				} else {
					return $.proxy(fn[context], fn);
				}
			} else {
				throw new TypeError('expected function');
			}
		};

		$.fn.bind = function(event, data, callback) {
			return this.on(event, data, callback);
		};
		$.fn.unbind = function(event, callback) {
			return this.off(event, callback);
		};
		$.fn.one = function(event, selector, data, callback) {
			return this.on(event, selector, data, callback, 1);
		};

		var returnTrue = function() {
				return true;
			},
			returnFalse = function() {
				return false;
			},
			ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
			eventMethods = {
				preventDefault: 'isDefaultPrevented',
				stopImmediatePropagation: 'isImmediatePropagationStopped',
				stopPropagation: 'isPropagationStopped'
			};

		function compatible(event, source) {
			if (source || !event.isDefaultPrevented) {
				source || (source = event);

				$.each(eventMethods, function(name, predicate) {
					var sourceMethod = source[name];
					event[name] = function() {
						this[predicate] = returnTrue;
						return sourceMethod && sourceMethod.apply(source, arguments);
					};
					event[predicate] = returnFalse;
				});

				event.timeStamp || (event.timeStamp = Date.now());

				if (
					source.defaultPrevented !== undefined
						? source.defaultPrevented
						: 'returnValue' in source
						? source.returnValue === false
						: source.getPreventDefault && source.getPreventDefault()
				)
					event.isDefaultPrevented = returnTrue;
			}
			return event;
		}

		function createProxy(event) {
			var key,
				proxy = { originalEvent: event };
			for (key in event) if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key];

			return compatible(proxy, event);
		}

		$.fn.delegate = function(selector, event, callback) {
			return this.on(event, selector, callback);
		};
		$.fn.undelegate = function(selector, event, callback) {
			return this.off(event, selector, callback);
		};

		$.fn.live = function(event, callback) {
			$(document.body).delegate(this.selector, event, callback);
			return this;
		};
		$.fn.die = function(event, callback) {
			$(document.body).undelegate(this.selector, event, callback);
			return this;
		};

		$.fn.on = function(event, selector, data, callback, one) {
			var autoRemove,
				delegator,
                $this = this;
            // debugger
                // 同时注册多个事件
                // on({ type: handler, type2: handler2, ... })
			if (event && !isString(event)) {
				$.each(event, function(type, fn) {
					$this.on(type, selector, data, fn, one);
				});
				return $this;
			}

			if (!isString(selector) && !isFunction(callback) && callback !== false)
				(callback = data), (data = selector), (selector = undefined);
			if (callback === undefined || data === false) (callback = data), (data = undefined);

			if (callback === false) callback = returnFalse;

			return $this.each(function(_, element) {
				if (one)
					autoRemove = function(e) {
						remove(element, e.type, callback);
						return callback.apply(this, arguments);
					};

				if (selector)
					delegator = function(e) {
						var evt,
							match = $(e.target)
								.closest(selector, element)
								.get(0);
						if (match && match !== element) {
							evt = $.extend(createProxy(e), { currentTarget: match, liveFired: element });
							return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
						}
					};

				add(element, event, callback, data, selector, delegator || autoRemove);
			});
		};
		$.fn.off = function(event, selector, callback) {
			var $this = this;
			if (event && !isString(event)) {
				$.each(event, function(type, fn) {
					$this.off(type, selector, fn);
				});
				return $this;
			}

			if (!isString(selector) && !isFunction(callback) && callback !== false)
				(callback = selector), (selector = undefined);

			if (callback === false) callback = returnFalse;

			return $this.each(function() {
				remove(this, event, callback, selector);
			});
		};

		$.fn.trigger = function(event, args) {
			event = isString(event) || $.isPlainObject(event) ? $.Event(event) : compatible(event);
			event._args = args;
			return this.each(function() {
				// handle focus(), blur() by calling them directly
				if (event.type in focus && typeof this[event.type] == 'function') this[event.type]();
				// items in the collection might not be DOM elements
				else if ('dispatchEvent' in this) this.dispatchEvent(event);
				else $(this).triggerHandler(event, args);
			});
		};

		// triggers event handlers on current element just as if an event occurred,
		// doesn't trigger an actual event, doesn't bubble
		$.fn.triggerHandler = function(event, args) {
			var e, result;
			this.each(function(i, element) {
				e = createProxy(isString(event) ? $.Event(event) : event);
				e._args = args;
				e.target = element;
				$.each(findHandlers(element, event.type || event), function(i, handler) {
					result = handler.proxy(e);
					if (e.isImmediatePropagationStopped()) return false;
				});
			});
			return result;
		};

		// shortcut methods for `.bind(event, fn)` for each event type
		(
			'focusin focusout focus blur load resize scroll unload click dblclick ' +
			'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
			'change select keydown keypress keyup error'
		)
			.split(' ')
			.forEach(function(event) {
				$.fn[event] = function(callback) {
					return 0 in arguments ? this.bind(event, callback) : this.trigger(event);
				};
			});

		$.Event = function(type, props) {
			if (!isString(type)) (props = type), (type = props.type);
			var event = document.createEvent(specialEvents[type] || 'Events'),
				bubbles = true;
			if (props) for (var name in props) name == 'bubbles' ? (bubbles = !!props[name]) : (event[name] = props[name]);
			event.initEvent(type, bubbles, true);
			return compatible(event);
		};
    })(Zepto);
    // Ajax 请求
	(function($) {
		var jsonpID = +new Date(),
			document = window.document,
			key,
			name,
			rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
			scriptTypeRE = /^(?:text|application)\/javascript/i,
			xmlTypeRE = /^(?:text|application)\/xml/i,
			jsonType = 'application/json',
			htmlType = 'text/html',
			blankRE = /^\s*$/,
			originAnchor = document.createElement('a');

		originAnchor.href = window.location.href;

		// trigger a custom event and return false if it was cancelled
		function triggerAndReturn(context, eventName, data) {
			var event = $.Event(eventName);
			$(context).trigger(event, data);
			return !event.isDefaultPrevented();
		}

		// trigger an Ajax "global" event
		function triggerGlobal(settings, context, eventName, data) {
			if (settings.global) return triggerAndReturn(context || document, eventName, data);
		}

		// Number of active Ajax requests
		$.active = 0;

		function ajaxStart(settings) {
			if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart');
		}
		function ajaxStop(settings) {
			if (settings.global && !--$.active) triggerGlobal(settings, null, 'ajaxStop');
		}

		// triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
		function ajaxBeforeSend(xhr, settings) {
			var context = settings.context;
			if (
				settings.beforeSend.call(context, xhr, settings) === false ||
				triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false
			)
				return false;

			triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
		}
		function ajaxSuccess(data, xhr, settings, deferred) {
			var context = settings.context,
				status = 'success';
			settings.success.call(context, data, status, xhr);
			if (deferred) deferred.resolveWith(context, [data, status, xhr]);
			triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
			ajaxComplete(status, xhr, settings);
		}
		// type: "timeout", "error", "abort", "parsererror"
		function ajaxError(error, type, xhr, settings, deferred) {
			var context = settings.context;
			settings.error.call(context, xhr, type, error);
			if (deferred) deferred.rejectWith(context, [xhr, type, error]);
			triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type]);
			ajaxComplete(type, xhr, settings);
		}
		// status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
		function ajaxComplete(status, xhr, settings) {
			var context = settings.context;
			settings.complete.call(context, xhr, status);
			triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
			ajaxStop(settings);
		}

		function ajaxDataFilter(data, type, settings) {
			if (settings.dataFilter == empty) return data;
			var context = settings.context;
			return settings.dataFilter.call(context, data, type);
		}

		// Empty function, used as default callback
		function empty() {}

		$.ajaxJSONP = function(options, deferred) {
			if (!('type' in options)) return $.ajax(options);

			var _callbackName = options.jsonpCallback,
				callbackName = ($.isFunction(_callbackName) ? _callbackName() : _callbackName) || 'Zepto' + jsonpID++,
				script = document.createElement('script'),
				originalCallback = window[callbackName],
				responseData,
				abort = function(errorType) {
					$(script).triggerHandler('error', errorType || 'abort');
				},
				xhr = { abort: abort },
				abortTimeout;

			if (deferred) deferred.promise(xhr);

			$(script).on('load error', function(e, errorType) {
				clearTimeout(abortTimeout);
				$(script)
					.off()
					.remove();

				if (e.type == 'error' || !responseData) {
					ajaxError(null, errorType || 'error', xhr, options, deferred);
				} else {
					ajaxSuccess(responseData[0], xhr, options, deferred);
				}

				window[callbackName] = originalCallback;
				if (responseData && $.isFunction(originalCallback)) originalCallback(responseData[0]);

				originalCallback = responseData = undefined;
			});

			if (ajaxBeforeSend(xhr, options) === false) {
				abort('abort');
				return xhr;
			}

			window[callbackName] = function() {
				responseData = arguments;
			};

			script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
			document.head.appendChild(script);

			if (options.timeout > 0)
				abortTimeout = setTimeout(function() {
					abort('timeout');
				}, options.timeout);

			return xhr;
		};

		$.ajaxSettings = {
			// Default type of request
			type: 'GET',
			// Callback that is executed before request
			beforeSend: empty,
			// Callback that is executed if the request succeeds
			success: empty,
			// Callback that is executed the the server drops error
			error: empty,
			// Callback that is executed on request complete (both: error and success)
			complete: empty,
			// The context for the callbacks
			context: null,
			// Whether to trigger "global" Ajax events
			global: true,
			// Transport
			xhr: function() {
				return new window.XMLHttpRequest();
			},
			// MIME types mapping
			// IIS returns Javascript as "application/x-javascript"
			accepts: {
				script: 'text/javascript, application/javascript, application/x-javascript',
				json: jsonType,
				xml: 'application/xml, text/xml',
				html: htmlType,
				text: 'text/plain'
			},
			// Whether the request is to another domain
			crossDomain: false,
			// Default timeout
			timeout: 0,
			// Whether data should be serialized to string
			processData: true,
			// Whether the browser should be allowed to cache GET responses
			cache: true,
			//Used to handle the raw response data of XMLHttpRequest.
			//This is a pre-filtering function to sanitize the response.
			//The sanitized response should be returned
			dataFilter: empty
		};

		function mimeToDataType(mime) {
			if (mime) mime = mime.split(';', 2)[0];
			return (
				(mime &&
					(mime == htmlType
						? 'html'
						: mime == jsonType
						? 'json'
						: scriptTypeRE.test(mime)
						? 'script'
						: xmlTypeRE.test(mime) && 'xml')) ||
				'text'
			);
		}

		function appendQuery(url, query) {
			if (query == '') return url;
			return (url + '&' + query).replace(/[&?]{1,2}/, '?');
		}

		// serialize payload and append it to the URL for GET requests
		function serializeData(options) {
			if (options.processData && options.data && $.type(options.data) != 'string')
				options.data = $.param(options.data, options.traditional);
			if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
				(options.url = appendQuery(options.url, options.data)), (options.data = undefined);
		}

		$.ajax = function(options) {
			var settings = $.extend({}, options || {}),
				deferred = $.Deferred && $.Deferred(),
				urlAnchor,
				hashIndex;
			for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key];

			ajaxStart(settings);

			if (!settings.crossDomain) {
				urlAnchor = document.createElement('a');
				urlAnchor.href = settings.url;
				// cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
				urlAnchor.href = urlAnchor.href;
				settings.crossDomain =
					originAnchor.protocol + '//' + originAnchor.host !== urlAnchor.protocol + '//' + urlAnchor.host;
			}

			if (!settings.url) settings.url = window.location.toString();
			if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex);
			serializeData(settings);

			var dataType = settings.dataType,
				hasPlaceholder = /\?.+=\?/.test(settings.url);
			if (hasPlaceholder) dataType = 'jsonp';

			if (
				settings.cache === false ||
				((!options || options.cache !== true) && ('script' == dataType || 'jsonp' == dataType))
			)
				settings.url = appendQuery(settings.url, '_=' + Date.now());

			if ('jsonp' == dataType) {
				if (!hasPlaceholder)
					settings.url = appendQuery(
						settings.url,
						settings.jsonp ? settings.jsonp + '=?' : settings.jsonp === false ? '' : 'callback=?'
					);
				return $.ajaxJSONP(settings, deferred);
			}

			var mime = settings.accepts[dataType],
				headers = {},
				setHeader = function(name, value) {
					headers[name.toLowerCase()] = [name, value];
				},
				protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
				xhr = settings.xhr(),
				nativeSetHeader = xhr.setRequestHeader,
				abortTimeout;

			if (deferred) deferred.promise(xhr);

			if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest');
			setHeader('Accept', mime || '*/*');
			if ((mime = settings.mimeType || mime)) {
				if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0];
				xhr.overrideMimeType && xhr.overrideMimeType(mime);
			}
			if (
				settings.contentType ||
				(settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET')
			)
				setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');

			if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name]);
			xhr.setRequestHeader = setHeader;

			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					xhr.onreadystatechange = empty;
					clearTimeout(abortTimeout);
					var result,
						error = false;
					if (
						(xhr.status >= 200 && xhr.status < 300) ||
						xhr.status == 304 ||
						(xhr.status == 0 && protocol == 'file:')
					) {
						dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));

						if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob') result = xhr.response;
						else {
							result = xhr.responseText;

							try {
								// http://perfectionkills.com/global-eval-what-are-the-options/
								// sanitize response accordingly if data filter callback provided
								result = ajaxDataFilter(result, dataType, settings);
								if (dataType == 'script') (1, eval)(result);
								else if (dataType == 'xml') result = xhr.responseXML;
								else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result);
							} catch (e) {
								error = e;
							}

							if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred);
						}

						ajaxSuccess(result, xhr, settings, deferred);
					} else {
						ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred);
					}
				}
			};

			if (ajaxBeforeSend(xhr, settings) === false) {
				xhr.abort();
				ajaxError(null, 'abort', xhr, settings, deferred);
				return xhr;
			}

			var async = 'async' in settings ? settings.async : true;
			xhr.open(settings.type, settings.url, async, settings.username, settings.password);

			if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

			for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

			if (settings.timeout > 0)
				abortTimeout = setTimeout(function() {
					xhr.onreadystatechange = empty;
					xhr.abort();
					ajaxError(null, 'timeout', xhr, settings, deferred);
				}, settings.timeout);

			// avoid sending empty string (#319)
			xhr.send(settings.data ? settings.data : null);
			return xhr;
		};

		// handle optional data/success arguments
		function parseArguments(url, data, success, dataType) {
			if ($.isFunction(data)) (dataType = success), (success = data), (data = undefined);
			if (!$.isFunction(success)) (dataType = success), (success = undefined);
			return {
				url: url,
				data: data,
				success: success,
				dataType: dataType
			};
		}

		$.get = function(/* url, data, success, dataType */) {
			return $.ajax(parseArguments.apply(null, arguments));
		};

		$.post = function(/* url, data, success, dataType */) {
			var options = parseArguments.apply(null, arguments);
			options.type = 'POST';
			return $.ajax(options);
		};

		$.getJSON = function(/* url, data, success */) {
			var options = parseArguments.apply(null, arguments);
			options.dataType = 'json';
			return $.ajax(options);
		};

		$.fn.load = function(url, data, success) {
			if (!this.length) return this;
			var self = this,
				parts = url.split(/\s/),
				selector,
				options = parseArguments(url, data, success),
				callback = options.success;
			if (parts.length > 1) (options.url = parts[0]), (selector = parts[1]);
			options.success = function(response) {
				self.html(
					selector
						? $('<div>')
								.html(response.replace(rscript, ''))
								.find(selector)
						: response
				);
				callback && callback.apply(self, arguments);
			};
			$.ajax(options);
			return this;
		};

		var escape = encodeURIComponent;

		function serialize(params, obj, traditional, scope) {
			var type,
				array = $.isArray(obj),
				hash = $.isPlainObject(obj);
			$.each(obj, function(key, value) {
				type = $.type(value);
				if (scope)
					key = traditional ? scope : scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']';
				// handle data in serializeArray() format
				if (!scope && array) params.add(value.name, value.value);
				// recurse into nested objects
				else if (type == 'array' || (!traditional && type == 'object')) serialize(params, value, traditional, key);
				else params.add(key, value);
			});
		}

		$.param = function(obj, traditional) {
			var params = [];
			params.add = function(key, value) {
				if ($.isFunction(value)) value = value();
				if (value == null) value = '';
				this.push(escape(key) + '=' + escape(value));
			};
			serialize(params, obj, traditional);
			return params.join('&').replace(/%20/g, '+');
		};
    })(Zepto);
    // 表单方法
	(function($) {
		$.fn.serializeArray = function() {
			var name,
				type,
				result = [],
				add = function(value) {
                    // 当value为数组，即select multiple 
					if (value.forEach) return value.forEach(add);
					result.push({ name: name, value: value });
				};
			if (this[0])
				$.each(this[0].elements, function(_, field) {
					(type = field.type), (name = field.name);
					if (
						name &&
						field.nodeName.toLowerCase() != 'fieldset' &&
						!field.disabled &&
						type != 'submit' &&
						type != 'reset' &&
						type != 'button' &&
						type != 'file' &&
						((type != 'radio' && type != 'checkbox') || field.checked)
					)
						add($(field).val());
				});
			return result;
		};

		$.fn.serialize = function() {
			var result = [];
			this.serializeArray().forEach(function(elm) {
				result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value));
			});
			return result.join('&');
		};

		$.fn.submit = function(callback) {
			if (0 in arguments) this.bind('submit', callback);
			else if (this.length) {
				var event = $.Event('submit');
				this.eq(0).trigger(event);
				if (!event.isDefaultPrevented()) this.get(0).submit();
			}
			return this;
		};
    })(Zepto);
    // getComputedStyle兼容
	(function() {
        // 在没有有效元素作为参数的情况下调用getComputedStyle时，不应该崩溃
		// getComputedStyle shouldn't freak out when called
		// without a valid element as argument
		try {
			getComputedStyle(undefined);
		} catch (e) {
			var nativeGetComputedStyle = getComputedStyle;
			window.getComputedStyle = function(element, pseudoElement) {
				try {
					return nativeGetComputedStyle(element, pseudoElement);
				} catch (e) {
					return null;
				}
			};
		}
	})();
	return Zepto;
});
