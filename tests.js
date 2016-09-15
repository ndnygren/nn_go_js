
var test_setup1 = [[1,0],[2,2],[0,1],[3,3],[2,1],[4,4],[1,2],[5,5],[2,0],[4,5],[0,2]];

function hable(num) {
	this.data = num;

	this.hash = function() { return this.data; };
	this.equalTo = function(rhs) { return this.data==rhs.data; };
}

function goTests() {
	var gt = this;
	this.tests = [];

	this.runTests = function() {
		var results = this.tests.map(function(x) { return x();});
		var numeric = results.map(function(x) { return x ? 1 : 0;});
		var log_entry = "";
		for(var i = 0; i < results.length; i++) {
			if (!results[i]) {
				log_entry += "test " + i + " failed.\n";
			}
		}
		if(log_entry != "") { console.log(log_entry); }
		return assocFoldr(numeric, function(a,b) {return a+b; })
			+ " tests out of " + numeric.length + " passed.";
	};

	this.tests.push(function() {
		var board = new GoBoard(9);
		return board.moveValid(1,4,1) && !board.moveValid(10,10,1);
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		return board.moveSeqValid([[1,1],[0,0],[1,0]],1) && !board.moveSeqValid([[1,1],[0,0],[1,1]],1);
	});
	this.tests.push(function() {
		var board = boardCache.getBoard(9, test_setup1);
		var libs = board.lib_map();
		return libs[0][1].length == 2;
	});
	this.tests.push(function() {
		var board = boardCache.getBoard(9, test_setup1);
		var min = board.pointMin([2,6],[3,5]);
		return min[0] == 2 && min[1] == 6;
	});
	this.tests.push(function() {
		var board = boardCache.getBoard(9, test_setup1);
		var groups = board.group_map();
		return groups[1][0] == groups[2][0] && groups[1][2] != groups[2][2];
	});
	this.tests.push(function() {
		var board = boardCache.getBoard(9, test_setup1);
		var libs = board.groupLib(0,1);
		return libs.length == 4;
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		var arr1 = [1,2,3,4,5,6];
		var arr2 = [1,3,5,6,8,9];
		var m = uniqueMerge(arr1,arr2, function(a,b) { return a-b; });
		return board.pointOrder([1,2,3,4,5,6,8,9],m) === 0;
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		var seq = [[3,2],[2,4],[4,3],[4,5],[5,2],[6,5],[4,1],[4,2]];
		return !board.moveSeqValid(seq,1);
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		var seq = [[2,3],[5,3],[3,4],[4,2],[3,2],[4,4],[4,3],[3,3]];
		return board.moveSeqValid(seq,1);
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		var seq = [[1,0],[2,2],[0,1],[3,0],[2,1],[3,1],[1,2],[0,3],[2,0],[1,3],[0,2],[4,2],[0,0],[1,1]];
		return board.moveSeqValid(seq,1);
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		var seq = [[1,0],[2,2],[0,1],[3,0],[2,1],[3,1],[1,2],[0,3],[2,0],[1,3],[0,2],[1,1]];
		return !board.moveSeqValid(seq,1);
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		var seq = [[3,3],[4,3],[4,4],[3,4],[4,2],[3,5],[5,3],[5,4],[4,3]];
		return board.moveSeqValid(seq,1);
	});
	this.tests.push(function() {
		var board = new GoBoard(9);
		var seq = [[2,4],[5,4],[3,5],[4,3],[3,3],[4,5],[4,4],[3,4],[4,4],[3,4]];
		return !board.moveSeqValid(seq,1);
	});
	this.tests.push(function() {
		var ht = new HashTable();
		ht.set(new hable(3),3);
		ht.set(new hable(4),4);
		ht.set(new hable(5),5);
		ht.set(new hable(6),6);
		ht.set(new hable(1004),1004);
		return ht.get(new hable(4))==4 && ht.has(new hable(6)) && !ht.has(new hable(7));
	});
	this.tests.push(function() {
		var seq = [[2,4],[0,1],[3,3],[1,0],[4,2],[1,1],[2,3],[2,1],[3,2],[1,2],[4,4],[0,3],[1,4],[3,0]];
		var board = boardCache.getBoard(5, seq);
		var score = board.scoreFromMap();
		return score.w == 3 && score.b == 2;
	});
	this.tests.push(function() {
		var seq = [[2,4],[0,1],[3,3],[1,0],[4,2]];
		var board = boardCache.getBoard(5, seq);
		var score = board.scoreFromMap();
		return score.w == 1 && score.b == 3;
	});
	this.tests.push(function() {
		var seq = [[0,2],[0,0],[1,1],[2,1],[0,1],[1,2],[1,0],[0,3],[0,0],[2,0]];
		var board = boardCache.getBoard(5, seq);
		var score = board.captureCount();
		return score.w == 5 && score.b == 1;
	});
	this.tests.push(function() {
		var board = new GoBoard(5);
		var seq = [[0,2],[0,0],[-1,-1]];
		return board.moveSeqValid(seq);
	});
	this.tests.push(function() {
		var board = new GoBoard(5);
		var seq = [[0,2],[0,0],[-1,-1],[-1,-1]];
		return board.moveSeqValid(seq);
	});
	this.tests.push(function() {
		var board = new GoBoard(5);
		var seq = [[0,2],[0,0],[-1,-1],[-1,-1],[1,1]];
		return !board.moveSeqValid(seq);
	});
	this.tests.push(function() {
		var s1 = new SeqHashTable.prototype.SeqHashable([[0,0]]);
		var s2 = new SeqHashTable.prototype.SeqHashable([[0,1]]);
		return s1.equalTo(s1) && !s1.equalTo(s2);
	});
	this.tests.push(function() {
		var s1 = new SeqHashTable.prototype.SeqHashable([[0,0],[0,1],[1,0]]);
		var s2 = new SeqHashTable.prototype.SeqHashable([[0,0],[0,2],[1,0]]);
		return s1.equalTo(s1) && !s1.equalTo(s2);
	});
	this.tests.push(function() {
		var ht = new HashTable();
		var s1 = new SeqHashTable.prototype.SeqHashable([[0,0],[0,1],[1,0]]);
		var s2 = new SeqHashTable.prototype.SeqHashable([[0,0],[0,2],[1,0]]);
		ht.set(s1, true);
		return ht.has(s1) && !ht.has(s2);
	});
	this.tests.push(function() {
		var s1 = new SeqHashTable.prototype.SeqHashable(test_setup1);
		var board = boardCache.getBoard(9, test_setup1);
		return boardCache.data.has(s1);
	});
	this.tests.push(function() {
		var board = boardCache.getBoard(9, test_setup1);
		var group = board.getGroup(0,1);
		var scores = zippr(group, [[0,1],[0,2],[1,2]], function(a,b){
			return a[0]==b[0] && a[1]==b[1];
		});
		return assocFoldr(scores, function(a,b) {
			return a && b;
		});

	});
	this.tests.push(function() {
		var board = boardCache.getBoard(9, test_setup1);
		var group = board.getGroup(0,0);
		return group.length == 1 && group[0][0] == 0 && group[0][1]==0;
	});


	this.tests.push(function() {
		var moves = [[4,4],[6,3],[6,5],[2,3],[4,2],[4,3],[4,6],[3,6],[3,5],[2,6],[3,3],[2,4],[5,3],[5,5],[5,6],[2,5],[7,2],[3,2],[2,2],[3,1],[1,2],[3,4],[4,3],[4,5],[4,1],[1,3],[5,7],[6,4],[5,4],[3,5],[7,5],[5,1],[2,1],[7,6],[8,7],[7,7],[6,2],[6,6],[7,4],[8,6],[6,7],[6,8],[8,5],[8,8],[5,8],[4,7],[2,0],[3,8],[7,8],[2,7],[8,7],[0,2],[0,1],[5,2],[8,3],[4,0],[1,0],[7,1],[6,1],[6,0],[4,8],[3,7],[7,3],[7,0],[0,3],[0,4],[8,1],[5,0],[6,6],[0,2],[5,3],[5,4],[0,3],[4,3],[0,2],[1,5],[8,0],[8,2],[8,1]];
		var board = new GoBoard(9);
		return !board.moveSeqValid(moves);
	});
}
