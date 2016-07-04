
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
	};

	this.copy = function() {
		var output = new GoBoard(this.size);
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				output.data[i][j] = this.get(i,j);
			}
		}
		return output;
	};

	this.moveValid = function(i,j, color) {
		if (i < 0 || i >= this.size) { return false; }
		if (j < 0 || j >= this.size) { return false; }
		return this.get(i,j) === 0;
	};

	this.add = function(i,j, color) {
		var output = this.copy();
		output.data[i][j] = color;
		return output;
	};

	this.addSeq = function(arr, color) {
		var current = this;
		for (var i = 0; i < arr.length; i++) {
			current = current.add(arr[i][0], arr[i][1], ((color + i) % 2) +1);
		}
		return current;
	};

	this.firstInvalid = function(arr, color) {
		var current = this;
		for (var i = 0; i < arr.length; i++) {
			if (!current.moveValid(arr[i][0], arr[i][1], ((color+i) % 2) + 1)) {
				return i;
			}
			current = current.add(arr[i][0], arr[i][1], ((color+i) % 2) + 1);
		}
		return -1;
	};

	this.moveSeqValid = function (arr, color) {
		return this.firstInvalid(arr, color) == -1;
	};

	this.neigh = function(i,j) {
		var output = [];
		if (i > 0) {output.push([i-1, j, this.get(i-1, j)]); }
		if (j > 0) {output.push([i, j-1, this.get(i, j-j)]); }
		if (i+1 < this.size) {output.push([i+1, j, this.get(i+1, j)]); }
		if (j+1 < this.size) {output.push([i, j+1, this.get(i, j+1)]); }
		return output;
	}

	this.lib_map = function() {
		var output = this.data.map(function(row) { return row.map(function (col) { return []; }); });
		var n;
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				if (this.get(i,j) !== 0) {

					n = this.neigh(i,j).filter(function(x) {return x[2] === 0; });
					output[i][j] = output[i][j].concat(n.map(function(x) { return [x[0],x[1]]; }));
				}
			}
		}
		return output;
	};
}

