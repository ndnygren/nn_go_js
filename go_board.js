
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

// assumes argument lists are already sorted and unique
function uniqueMerge(arr1, arr2, order) {
	var output = [];
	var i = 0,j = 0;

	while (i < arr1.length || j < arr2.length) {
		if (i == arr1.length) {
			output.push(arr2[j]);
			j++;
		} else if (j == arr2.length) {
			output.push(arr1[i]);
			i++;
		} else if (order(arr1[i],arr2[j]) === 0) {
			i++;
		} else if (order(arr1[i],arr2[j]) < 0) {
			output.push(arr1[i]);
			i++;
		} else {
			output.push(arr2[j]);
			j++;
		}
	}

	return output;
}

function HashTable() {
	this.cap = 1000;
	this.data = [];
	for (var i = 0; i < this.cap; i++) { this.data.push([]); }

	this.set = function(key, data) {
		var h = key.hash()%this.cap;
		this.data[h].push({"key":key, "data":data});
	};

	this.get = function(key) {
		var h = key.hash()%this.cap;
		for (var i = 0; i < this.data[h].length; i++) {
			if (key.equalTo(this.data[h][i].key)) {
				return this.data[h][i].data;
			}
		}
		throw("key " + key + " not found");
	};

	this.has = function(key) {
		try {
			this.get(key);
		} catch (e) {
			return false;
		}
		return true;
	};
}

function GoBoard(size) {
	this.size = size;
	this.seq = [];
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

	this.hash = function() {
		var cap = 10000;
		var flat = assocFoldr(this.data, function (a,b) {
			return a.concat(b);
		});
		return assocFoldr(flat, function (a,b) {
			return (2*a + b)%cap;
		});
	};

	this.equalTo = function(rhs) {
		var mask = zippr(this.data, rhs.data, function(a,b){
			return zippr(a,b, function(q,r) {
				return q == r;
			});
		});
		return assocFoldr(mask.map(function(x) {
			return assocFoldr(x, function(a,b) {return a && b;});
		}), function(a,b) { return a && b; });
	};

	this.matchNeigh = function (i,j,color) {
		var n = this.neigh(i,j);
		return n.filter(function(x) {return x[2] === color; });
	};
	this.nonemptyNeigh = function (i,j) {
		var n = this.neigh(i,j);
		return n.filter(function(x) {return x[2] !== 0; });
	};
	this.emptyNeigh = function(i,j) {
		return this.matchNeigh(i,j,0);
	};
	this.friendNeigh = function(i, j) {
		return this.matchNeigh(i,j, this.get(i,j));
	};
	this.enemyNeigh = function(i,j) {
		return this.matchNeigh(i,j, this.get(i,j) == 1 ? 2 : 1);
	};

	this.moveValid = function(i,j, color) {
		if (i < 0 || i >= this.size) { return false; }
		if (j < 0 || j >= this.size) { return false; }
		if (this.get(i,j) !== 0) { return false; }
		if (this.emptyNeigh(i,j).length > 0) { return true; }
		var n = this.matchNeigh(i,j,color);
		for (var k = 0; k < n.length; k++) {
			if (this.groupLib(n[k][0],n[k][1]).length > 1) { return true; }
		}
		n = this.matchNeigh(i,j, color == 1 ? 2 : 1);
		for (k = 0; k < n.length; k++) {
			if (this.groupLib(n[k][0],n[k][1]).length == 1) { return true; }
		}
		return false;
	};

	this.removeGroup = function (rast, g) {
		return zippr(rast, this.group_map(), function(a,b){
			return zippr(a, b, function (ocell, gcell) {
				return gcell == g ? 0 : ocell;
			});
		});
	};

	this.add = function(i,j, color) {
		var output = this.copy();
		var grp = this.group_map();
		var g;
		output.seq = this.seq.concat([[i,j]]);
		output.data[i][j] = color;
		n = this.matchNeigh(i,j, color == 1 ? 2 : 1);
		for (k = 0; k < n.length; k++) {
			if (this.groupLib(n[k][0],n[k][1]).length == 1) {
				g = grp[n[k][0]][n[k][1]];
				output.data = this.removeGroup(output.data, g);
			}
		}

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
		var history = new HashTable();
		for (var i = 0; i < arr.length; i++) {
			if (!current.moveValid(arr[i][0], arr[i][1], ((color+i) % 2) + 1)) {
				return i;
			}
			current = current.add(arr[i][0], arr[i][1], ((color+i) % 2) + 1);
			if (history.has(current)) {
				return i;
			}
			history.set(current,true);
		}
		return -1;
	};

	this.moveSeqValid = function (arr, color) {
		return this.firstInvalid(arr, color) == -1;
	};

	this.neigh = function(i,j) {
		var output = [];
		if (i > 0) {output.push([i-1, j, this.get(i-1, j)]); }
		if (j > 0) {output.push([i, j-1, this.get(i, j-1)]); }
		if (i+1 < this.size) {output.push([i+1, j, this.get(i+1, j)]); }
		if (j+1 < this.size) {output.push([i, j+1, this.get(i, j+1)]); }
		return output;
	};

	// argument function must take 2 args (i,j)
	this.grid_walk = function(func) {
		var output = this.data.map(function(row) { return row.map(function (col) { return null; }); });
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				output[i][j] = func(i,j);
			}
		}
		return output;
	}

	this.lib_map = function() {
		if (this.l_cache) { return this.l_cache; }
		var board = this;
		var n;
		var output = this.grid_walk(function (i,j) {
			if (board.get(i,j) !== 0) {
				n = board.emptyNeigh(i,j);
				return n.map(function(x) { return [x[0],x[1]]; });
			}
			return [];
		});

		this.l_cache = output;
		return output;
	};

	this.classesToOwners = function(classes) {
		var owners = classes.map(function (x) {
			return {"grp": x[0].grp, "owner":assocFoldr(x.map(function (y) {
				var b = y.neigh.filter(function (z) {return z[2] == 2; });
				var w = y.neigh.filter(function (z) {return z[2] == 1; });
				if (y.neigh.length === 0) {
					return "unclaimed";
				} else if (b.length === 0) {
					return "white";
				} else if (w.length === 0) {
					return "black";
				} else {
					return "mixed";
				}
			}), function(a,b) {
				if (a == "unclaimed" ) { return b; }
				else if (b == "unclaimed" ) { return a; }
				else if (a == "mixed" ) { return a; }
				else if (b == "mixed" ) { return b; }
				else if (a == b) { return a; }
				return "mixed";
			})};
		});
		return owners;
	};

	this.simpTerritoryMap = function() {
		if (this.t_cache) { return this.t_cache; }
		var grps = this.group_map();
		var board = this;
		var neigh = this.grid_walk(function (i,j) {
			if (board.get(i,j) === 0) {
				return board.nonemptyNeigh(i,j);
			}
			return [];
		});
		var loosegroups = assocFoldr(zippr(neigh, grps, function(a,b) {
			return zippr(a,b, function(q,r) {
				return {"grp": r, "neigh":q};
			});
		}), function(a,b) {
			return a.concat(b);
		});
		var classes = classifyr(loosegroups, function (x) {return x.grp;} );
		var sizes = classes.map(function(x) { return {"grp": x[0].grp, "size": x.length}; });

		var owners = this.classesToOwners(classes);

		var output = zippr(owners, sizes, function(a,b) {
			if (a.id != b.id) { throw("zipping out of order"); }
			return {"id":a.id, "owner":a.owner, "size": b.size};
		});
		this.t_cache = output;
		return output;
	}

	this.scoreFromMap = function() {
		var tmap = this.simpTerritoryMap();
		var score = assocFoldr(tmap.map(function (x) {
			if (x.owner == "black") {return {"b":x.size, "w": 0}; }
			else if (x.owner == "black") {return {"b":0, "w": x.size}; }
			return {"b":0, "w": 0};
		}), function (a,b) {
			return {"b":a.b+b.b, "w": a.w+b.w};
		});
		return score;
	}

	this.pointOrder = function (a,b) {
		for (var i = 0; i < a.length; i++) {
			if (a[i] < b[i]) {
				return -1;
			} else if (a[i] > b[i]) {
				return 1;
			}
		}
		return 0;
	};

	this.pointMin = function (a,b) {
		if (this.pointOrder(a,b) < 0) {
			return a;
		}
		return b;
	};

	this.group_map = function() {
		if (this.g_cache) { return this.g_cache; }
		var output = this.data.map(function(row) { return row.map(function(cell) { return -1; }); });
		var n;
		var board = this;
		var current;
		var g_id = 1;
		var stack = [];
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				if (output[i][j] == -1) {
					stack.push([i,j]);
					while (stack.length > 0) {
						current = stack[stack.length -1];
						stack.pop();
						output[current[0]][current[1]] = g_id;
						n = this.friendNeigh(current[0],current[1]);
						for (var k = 0; k < n.length; k++) {
							if (output[n[k][0]][n[k][1]] == -1) {
								stack.push(n[k]);
							}
						}
					}
					g_id++;
				}
			}
		}
		this.g_cache = output;
		return output;
	};

	this.comb_map = function() {
		var board = this;
		if (this.c_cache) { return this.c_cache; }
		var libs = this.lib_map();
		var grps = this.group_map();
		var output = zippr(libs,grps, function(a,b) {
			return zippr(a,b, function(q,r) {
				return {"grp": r, "libs":q};
			});
		});
		output = assocFoldr(output, function(a,b) {
			return a.concat(b);
		}).filter(function(x) {
			return x.grp != -1;
		});

		output.map(function (x) { x.libs.sort(board.pointOrder);});
		output = classifyr(output, function(x){
			return x.grp;
		}).map(function (x) {
			return assocFoldr(x, function(a,b) {
				return {"grp": a.grp, "libs": uniqueMerge(a.libs, b.libs, board.pointOrder)};
			});
		});
		this.c_cache = output;
		return output;
	};

	this.groupLib = function(i,j) {
		var libs = this.comb_map();
		var grp = this.group_map();
		if (grp[i][j] == -1) { throw("no piece at " + i + "," + j); }
		for (var k = 0; k < libs.length; k++) {
			if (libs[k].grp == grp[i][j]) {
				return libs[k].libs;
			}
		}
		throw("group id " + grp[i][j] + " not found.");
	};
}

