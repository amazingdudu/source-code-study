function apply(func, thisArg, args) {
	switch (args.length) {
		case 0:
			return func.call(thisArg);
		case 1:
			return func.call(thisArg, args[0]);
		case 2:
			return func.call(thisArg, args[0], args[1]);
		case 3:
			return func.call(thisArg, args[0], args[1], args[2]);
	}
	return func.apply(thisArg, args);
}

function compact(array) {
	var index = -1,
		length = array == null ? 0 : array.length,
		resIndex = 0,
		result = [];
	while (++index < length) {
		var value = array[index];
		if (value) {
			result[resIndex++] = value;
		}
	}
	return result;
}

function contact() {
	var length = arguments.length; 4
	if (!length) return [];
	var args = Array(length - 1),
		array = arguments[0],
		index = length;

	while (--index) {
		args[index - 1] = arguments[index];
    }
    
    // return arrayPush
}
