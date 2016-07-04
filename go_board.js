
function assocFoldr(list, func) {
	if (!list || list.length === 0) {
		throw("assocFoldr does not take empty list.");
	}
	var output = list[0];
	for (var i = 1; i < list.length; i++) {
		output = func(output, list[i]);
	}
	return output;
}

function zippr(lhs, rhs, func) {
	if (lhs.length != rhs.length) {throw("zipping non-equal lengths");}
	var output = [];

	for (var i = 0; i < lhs.length; i++) {
		output.push(func(lhs[i],rhs[i]));
	}

	return output;
}

function classifyr(arr, func) {
	var output = [];
	var classes = {};
	for (var i in arr) {
		if (!classes[func(arr[i])]) {
			classes[func(arr[i])] = [arr[i]];
		} else {
			classes[func(arr[i])].push(arr[i]);
		}
	}
	for (var key in classes) {
		output.push(classes[key]);
	}

	return output;
}

function GoBoard(size) {
	this.size = size;
	this.data = [];
	for (var i = 0; i < size; i++) {
		this.data.push([]);
		for (var j = 0; j < size; j++) {
			this.data[i].push(0);
		}
	}

	this.get = function(i,j) {
		if (i < 0 || i >= this.size) { throw(i + " is out of range."); }
		if (j < 0 || j >= this.size) { throw(j + " is out of range."); }
		return this.data[i][j];
	}

	this.copy = function() {
		var output = new GoBoard(this.size);
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				output.data[i][j] = this.get(i,j);
			}
		}
		return output;
	}

	this.moveValid = function(i,j) {
		if (i < 0 || i >= this.size) { return false; }
		if (j < 0 || j >= this.size) { return false; }
		return this.get(i,j) === 0;
	}
}

