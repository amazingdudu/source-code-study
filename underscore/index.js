// 原型式继承
function create(proto) {
	var F = function() {};
	F.prototype = proto;
	var result = new F();
	F.prototype = null;
	return result;
}

var obj = {
	name: 'tom'
};

var i = create(obj);
