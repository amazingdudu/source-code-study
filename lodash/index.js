var res;
var LIST = LIST;

res = _.chunk(LIST, undefined);

var index = LIST.length;
// 4 进入循环 3 进入循环 2 进入循环 1 进入循环 0
while (index--) {
	// console.log(index);
	// console.log(LIST[index]);
}

res = _.concat([1], 2, [3], [[4]]);

res = _.difference([3, 2, 1, NaN], [4, 2]);

res = _.differenceBy([-2, 1, -3], [2, 4, 3.2], Math.abs);

var objects = [
	{ x: 1, y: 2 },
	{ x: 2, y: 1 }
];

res = _.differenceWith(objects, [{ x: 1, y: 2 }], function(arrVal, othVal) {
	// console.log(arrVal, othVal);
	return othVal.y == arrVal.y;
});

res = _.drop([1, 2, 3, 4, 5]);

res = _.dropRight([1, 2, 3, 4, 5]);

res = _.dropWhile(LIST, function(item) {
	console.log(item);
	return item.id < 3;
});

var users = [
	{ user: 'barney', active: false },
	{ user: 'fred', active: false },
	{ user: 'pebbles', active: true }
];
res = _.dropWhile(users, { user: 'barney', active: false });

res = _.dropRightWhile(users, { user: 'pebbles', active: true });
// debugger
res = _.flatten([1, [2, [3, [4]], 5]]);
console.log(res);

console.log('apple, orange, cherry, peach.'.match(/(?:orange)/));

var str = '张三试试'.replace(/(.{1})(.+)/, function(_, b, c) {
	console.log(arguments);
    return b + c.replace(/./g, '*');
});

