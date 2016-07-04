
var test_setup1 = [[1,0],[2,2],[0,1],[3,3],[2,1],[4,4],[1,2],[5,5],[2,0],[4,5],[0,2]];

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
		var board = new GoBoard(9).addSeq(test_setup1,1);
		var libs = board.lib_map();
		return libs[0][1].length == 2;
	});
	this.tests.push(function() {
		var board = new GoBoard(9).addSeq(test_setup1,1);
		var min = board.pointMin([2,6],[3,5]);
		return min[0] == 2 && min[1] == 6;
	});
	this.tests.push(function() {
		var board = new GoBoard(9).addSeq(test_setup1,1);
		var groups = board.group_map();
		console.log(JSON.stringify(groups));
		return groups[1][0] == groups[2][0] && groups[1][2] != groups[2][2];
	});
}
