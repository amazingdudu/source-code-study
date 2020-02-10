/**
 * underscore构造函数
 *
 * 如果obj已经是underscore的实例，直接返回，如果没有new _(),直接调用_(),那么this不是underscore
 * 的实例，在underscore内部执行 new _()操作，将obj复制给内部属性_wrapped
 *
 * @param {*} obj
 * @returns {*} underscore的实例
 *
 *  _(['a','b']).map(), var uObj = new _(['a,'b]); uObj.map()
 */
function _(obj) {
	if (obj instanceof _) return obj;
	if (!(this instanceof _)) return new _(obj);
	/* if(this instanceof _) {
        this._wrapped = obj;
    } else {
        return new _(obj);
    } */
}

/**
 * 原型式继承
 *
 * @param {Object} proto
 * @returns {Object}
 *
 * var f = {name:'tom}; var s = create(f); s.name === 'tom'
 */

function create(proto) {
	var F = function() {};
	F.prototype = proto;
	return new F();
}

/**
 * 将函数的剩余参数，放入一个数组中，使这个数组成为该函数的最后一个参数
 *
 * @param {Function} func
 * @param {Number} startIndex
 * @returns {Function}
 *
 */
function restArguments(func, startIndex) {
	// 如果不指定收集函数剩余参数的起始参数位置，那么从函数的最后一个参数开始收集
	startIndex = startIndex == null ? func.length - 1 : startIndex;
	return function() {
		// 剩余参数数组长度,如果startIndex比函数参数的个数大，那么rest就是一个空数组
		var length = Math.max(arguments.length - startIndex, 0),
			rest = Array(length),
            index = 0;
        // 收集arguments从startIndex开始的参数
		for (; index < length; index++) {
			rest[index] = arguments[startIndex + index];
        }
        // 优化，call比apply快
		switch (startIndex) {
			case 0:
				return func.call(this, rest);
			case 1:
				return func.call(this, arguments[0], rest);
			case 2:
				return func.call(this, arguments[0], arguments[1], rest);
        }
        // func的总参数个数应该加1 
		var args = Array(startIndex + 1);
		for (index = 0; index < startIndex; index++) {
			args[index] = arguments[index];
        }
        // 最后一个参数为rest
		args[startIndex] = rest;
		return func.apply(this, args);
	};
}
