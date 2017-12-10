/*
* nn_go_js - Move validity tests and calculation for Go
* Copyright (C) 2016 Nick Nygren
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*/

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
		var h = key.hash()%this.cap;
		for (var i = 0; i < this.data[h].length; i++) {
			if (key.equalTo(this.data[h][i].key)) {
				return true;
			}
		}
		return false;
	};
}

function SeqHashTable () {
	this.data = new HashTable();

	this.getBoard = function(size, seq) {
		var hashable = new this.SeqHashable(seq);
		var board;
		var seq2;
		var i, limit=50;
		if (this.data.has(hashable) && this.data.get(hashable).size == size) {
			board = this.data.get(hashable);
			board.seq = seq;
			return board;
		}
		seq2 = seq.map(function(x) { return [x[0],x[1]]; });
		i = 0;
		do {
			seq2.pop();
			hashable = new this.SeqHashable(seq2);
			i++;
			//console.log("checking seq2:" + JSON.stringify(seq2));
		} while (!this.data.has(hashable) && i < limit)
		board = new GoBoard(size).addSeq(seq2);
		for (i = seq2.length; i < seq.length; i++) {
			seq2.push(seq[i]);
			hashable = new this.SeqHashable(seq2);
			board = board.add(seq[i][0], seq[i][1]);
			this.data.set(hashable, board.copy());
		}
		return board;
	};
}

SeqHashTable.prototype.SeqHashable = function(seq) {
	this.seq = seq.map(function(x) { return [x[0],x[1]]; });

	this.hash = function() {
		if (this.hashed) { return this.hashed; }
		this.hashed = 0;
		for (var i = this.seq.length-1; i >= 0 && this.seq.length - i < 20; i--) {
			this.hashed += this.seq[i][0];
			this.hashed *= 2;
			this.hashed += this.seq[i][1];
			this.hashed *= 2;
			this.hashed = Math.abs(this.hashed % 100000);
		}
		return this.hashed;
	};

	this.equalTo = function(rhs) {
		if (this.seq.length != rhs.seq.length) {
			return false;
		}
		if (this.seq.length == 0) {
			return true;
		}
		for (var i = this.seq.length-1; i >= 0; i--){
			if (this.seq[i][0]!=rhs.seq[i][0] ||
				this.seq[i][1]!=rhs.seq[i][1]) {
				return false
			}
		}
		return true;
	};
};

var boardCache = new SeqHashTable();

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

	this.moveValid = function(i,j) {
		if (i == -1 && j == -1) { return true; }
		if (i < 0 || i >= this.size) { return false; }
		if (j < 0 || j >= this.size) { return false; }
		if (this.get(i,j) !== 0) { return false; }
		if (this.emptyNeigh(i,j).length > 0) { return true; }
		var color = ((this.seq.length + 1) % 2) + 1;
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

	this.add = function(i,j) {
		var output = this.copy();
		output.seq = this.seq;
		output.dangerAdd(i,j);
		output.seq = this.seq.concat([[i,j]]);

		return output;
	};

	// "danger" because it is not referentially transparent
	// (modifies in place)
	this.dangerAdd = function(i,j) {
		var board = this;
		var g;
		var lib;
		var color = ((this.seq.length+1) % 2) + 1;
		if (i == -1) { return; }
		var n = this.matchNeigh(i,j, color == 1 ? 2 : 1);
		for (k = 0; k < n.length; k++) {
			g = this.getGroup(n[k][0],n[k][1]);
			lib = g.map(function (x) { return board.emptyNeigh(x[0],x[1]); });
			lib = assocFoldr(lib, function(a,b) { return b.length == 0 ? a : a.concat(b); });
			lib = lib.filter(function (x) { return x[0] != i || x[1] != j; });
			if (lib.length == 0) {
				this.writeGroup(this.data, g, 0);
			}
		}
		this.data[i][j] = color;
		this.g_cache = undefined;
		this.c_cache = undefined;
		this.l_cache = undefined;
		this.t_cache = undefined;
	};

	this.addSeq = function(arr) {
		var current = this.copy();
		for (var i = 0; i < arr.length; i++) {
			current.dangerAdd(arr[i][0], arr[i][1]);
			current.seq.push([arr[i][0], arr[i][1]]);
		}
		return current;
	};

	this.boardDiff = function(before,after) {
		var sub = zippr(before, after, function(br, ar) {
			return zippr(br,ar, function(b,a) {
				return Math.max(b - a, 0);
			});
		});
		var flat = assocFoldr(sub, function(a,b) { return a.concat(b); });
		return assocFoldr(flat.map(function (x) {
			if (x == 2) { return {"w": 1, "b": 0}; }
			else if (x == 1) { return {"w": 0, "b": 1}; }
			else { return {"w": 0, "b": 0}; }
		}), function (a,b) {
			return {"w": a.w+b.w, "b":a.b+b.b};
		});
	}

	this.captureCount = function() {
		var current = new GoBoard(this.size), next;
		var output = {"w":0,"b":0}, score;

		for (var i = 0; i < this.seq.length; i++) {
			next = current.add(this.seq[i][0], this.seq[i][1], ((i+1) % 2) + 1);
			score = this.boardDiff(current.data, next.data);
			output.w += score.w;
			output.b += score.b;
			current = next;
		}

		return output;
	}

	this.firstInvalid = function(arr) {
		var color = 1;
		var current = this;
		var history = new HashTable();
		for (var i = 0; i < arr.length; i++) {
			if (!current.moveValid(arr[i][0], arr[i][1], ((color+i) % 2) + 1)) {
//				console.log("move " + i + " is invalid.");
				return i;
			}
			current = current.add(arr[i][0], arr[i][1], ((color+i) % 2) + 1);
			if (arr[i][0] != -1 && history.has(current)) {
//				console.log("move " + i + "(" +arr[i][0] +"," +arr[i][1]+ ")" + " violates ko. previous: " + history.get(current));
//				console.log(JSON.stringify(current.data));
				return i;
			}
			else if (i > 1 && arr[i-1][0] == -1 && arr[i-2][0] == -1) {
//				console.log("move " + i + " occurs after game ends.");
				return i;
			}
			history.set(current,i);
		}
		return -1;
	};

	this.moveSeqValid = function (arr) {
		return this.firstInvalid(arr) == -1;
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
			else if (x.owner == "white") {return {"b":0, "w": x.size}; }
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

	this.writeGroup = function(array, list, color) {
		for (var i = 0; i < list.length; i++) {
			array[list[i][0]][list[i][1]] = color;
		}
	}

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
					n = this.getGroup(i,j);
					this.writeGroup(output,n,g_id);
					g_id++;
				}
			}
		}
		this.g_cache = output;
		return output;
	};

	this.getGroup = function(i,j) {
		if (i < 0 || i >= this.size || j < 0 || j >= this.size) {
			return [];
		}
		var color = this.data[i][j];
		var visited = {};
		var output = [[i,j,color]];
		var stack = [[i,j]];
		var current;
		var n;
		visited[i+"_"+j] = true;
		while (stack.length > 0) {
			current = stack[stack.length -1];
			stack.pop();
			n = this.friendNeigh(current[0],current[1]);
			for (var k = 0; k < n.length; k++) {
				if (!visited[n[k][0]+"_"+n[k][1]]) {
					visited[n[k][0]+"_"+n[k][1]] = true;
					output.push(n[k]);
					stack.push(n[k]);
				}
			}
		}
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

function GoAnalysis () {
	this.validAndGood = function(board, x,y){
		var color = ((board.seq.length+1) % 2) + 1;
		var mn = board.matchNeigh(x,y, color);
		var n = board.neigh(x,y);
		if (n.length == mn.length){
				return false;
		}
		if (board.moveValid(x, y)){
			return true;
		}
		return false;
	};

	this.randomMove = function(board) {
		var x, y;
		var limit = 10;

		//The following section captures groups with only 1 liberty, in a very not-random way

		var libs = board.comb_map();

		for (var i = 0; i < libs.length; i++) {
			if (libs[i].libs.length == 1) {
				if (board.moveValid(libs[i].libs[0][0], libs[i].libs[0][1])){
					//console.log("ending it " + JSON.stringify(libs[i].libs[0]));
					return libs[i].libs[0];
				}
			}
		}

		// This is acutal random
		for (i = 0; i < limit; i++) {
			x = Math.floor(Math.random() * board.size);
			y = Math.floor(Math.random() * board.size);
			if (this.validAndGood(board,x,y)){
				return [x,y];
			}
		}

		// This is a final non-random filling
		for (i = 0; i < board.size; i++) {
			for (var j = 0; j < board.size; j++) {
				if (this.validAndGood(board,i,j)){
					return [i,j];
				}
			}
		}
		return [-1,-1];
	};

	this.randomFinish = function(board) {
		var seq = board.seq.slice(0,board.seq.length);
		if (seq.length > 0 && seq[seq.length - 1][0] < 0) {
			seq = seq.slice(0,seq.length-1);
		}
		var board2 = new GoBoard(board.size).addSeq(seq);
		var limit = 300;
		var move;

		for (var i = 0; i < limit; i++) {
			move = this.randomMove(board2);
			board2.dangerAdd(move[0], move[1]);
			board2.seq.push(move);
			if (move[0] < 0 && board2.seq.length > 2 && board2.seq[board2.seq.length-2][0] < 0){
				return board2;
			}
		}

		var libs = board2.comb_map().filter(function (q) { return q.libs.length == 1; } ).map(function (q) { return q.grp; });
		var grps = board2.group_map();
		//console.log(JSON.stringify(libs) + "\n\ngroups: " + JSON.stringify(grps));
		for (i = 0; i < board2.size; i++) {
			for (var j = 0; j < board2.size; j++) {
				if (libs.indexOf(grps[i][j]) >= 0) {
					board2.data[i][j] = 0;
				}
			}
		}

		return board2;
	};

	this.getColor = function(board, x, y) {
		if (board.get(x,y) > 0) {
			return board.get(x,y);
		} else {
			var nb = board.neigh(x,y).filter(function (x) { return x[2] == 2; } );
			var nw = board.neigh(x,y).filter(function (x) { return x[2] == 1; } );
			if (nb.length > nw.length) {return 2; }
			if (nb.length < nw.length) {return 1; }
			else { return 0; }
		}
	};

	this.getTerritoryEstimate = function(board) {
		var limit = 5;
		var attempts = [];
		for (var i = 0; i < limit; i++) {
			attempts.push(this.randomFinish(board));
		}
		return this.aggregateBoards(attempts);
	};

	this.terrEstAsync = function(board, limit, attempts, callback) {
		var self = this;
		if (limit > 0) {
			var next = this.randomFinish(board);
			var arr = attempts.slice(0);
			arr.push(next);
			callback(self.aggregateBoards(arr));
			setTimeout(function() { self.terrEstAsync(board, limit-1, arr, callback); }, 100);
		}
	};

	this.aggregateBoards = function(attempts) {
		var board = attempts[0];
		var output = [];
		var color;
		for (i = 0; i < board.size; i++) {
			output.push([]);
			for (var j = 0; j < board.size; j++){
				output[i].push(0);
				for (var k = 0; k < attempts.length; k++) {
					color = this.getColor(attempts[k],i,j);
					output[i][j] += (color == 2 ? -1 : color);
				}
			}
		}
		return output;
	};
}

GoBoard.prototype.letters = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T','U','V','W'];

