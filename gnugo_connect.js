var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var querystring = require('querystring');

var go_board_data = fs.readFileSync('./go_board.js','utf8');
eval(go_board_data);
var last_posts = {};

function breakOnDelim(input, delim) {
	var output = [];
	var last = -1;
	for (var i = 0; i < input.length; i++) {
		if (input[i] == delim) {
			output.push(input.substr(last + 1, i - last -1));
			last = i;
		}
	}
	output.push(input.substr(last + 1, i - last -1));

	return output;
}

function locToAlphaNum(loc) {
	if (loc[0] == -1) { return "pass"; }
	var left = String.fromCharCode(65 + (loc[0] >= 8 ? loc[0] + 1: loc[0]));
	return left+(loc[1]+1);
}

function alphaNumToLoc(alpha) {
	var first = alpha.toLowerCase().charCodeAt(0) - 97;
	if (first >= 8) { first--; }
	if (alpha == "PASS") { return {"l": -1, "r": -1}; }
	return {"l": first, "r": parseInt(alpha.slice(1)) - 1};
}

function adaptSeqToGTPopen(game_obj) {
	var color = "black";
	var output = "";
	output += "boardsize " + game_obj.size + "\n";
	output += "clear_board\n";
	for (var i = 0; i < game_obj.seq.length; i++) {
		output += "play " + color + " " + locToAlphaNum(game_obj.seq[i]) + "\n";
		color = color == "black" ? "white" : "black";
	}
	return output;
}

function adaptSeqToJudge(game_obj) {
	var output = adaptSeqToGTPopen(game_obj);
	var color = game_obj % 2 == 0 ? "black" : "white";
	output += "final_score \n";
	output += "quit\n"
	return output;
}

function adaptSeqToGTP(game_obj) {
	var output = adaptSeqToGTPopen(game_obj);
	var color = game_obj % 2 == 0 ? "black" : "white";
	output += "genmove " + color + "\n";
	output += "quit\n"
	return output;
}

function makePassReq(obj) {
	var board = new GoBoard(obj.size).addSeq(obj.seq);
	var ter_score = board.scoreFromMap();
	var cap_score = board.captureCount();
	var req = {"type": "pass", "id": obj.id, "b": ter_score.b+cap_score.b, "w":ter_score.w+cap_score.w};
	return req;
}

function addNoise(loc, obj, mistake) {
	var board = new GoBoard(obj.size).addSeq(obj.seq);
	var color = 2 - (board.seq.length % 2);
	var cand = {"l": loc.l + 1, "r": loc.r }, count = 0, limit = 10;
	if (Math.random() > mistake) { return loc; }
	cand = {"l": loc.l + 1, "r": loc.r };
	if (board.moveValid(cand.l, cand.r, color)) { return cand; }
	cand = {"l": loc.l - 1, "r": loc.r };
	if (board.moveValid(cand.l, cand.r, color)) { return cand; }
	cand = {"l": loc.l, "r": loc.r + 1 };
	if (board.moveValid(cand.l, cand.r, color)) { return cand; }
	cand = {"l": loc.l, "r": loc.r - 1 };
	if (board.moveValid(cand.l, cand.r, color)) { return cand; }

	while (count < limit) {
		cand = {"l": Math.floor(Math.random()*obj.size), "r": Math.floor(Math.random()*obj.size) };
		if (board.moveValid(cand.l, cand.r, color)){ return cand; }
	}
	return {"l":-1, "r":-1};
}

function findAndSendMove(obj, conn) {
	var req = {"type": "move", "uid": conn.user_id};
	var loc;

	if (last_posts[obj.id] >= obj.seq.length) { return; }
	last_posts[obj.id] = obj.seq.length;

	fs.writeFile("movefile"+obj.id+".txt", adaptSeqToGTP(obj), function(err) {
		exec("gnugo  --level 1 --mode gtp < movefile"+obj.id+".txt", function (error, stdout, stderr) {
			var parts = breakOnDelim(stdout, "=");
			parts = parts.map(function (x) {
				return x.replace(/^[ \r\n]+/, "").replace(/[ \r\n]+$/, "");
			}).filter(function (x) {
				return x != "";
			});
			if (parts.length != 1) {
				throw("An error occured: " + JSON.stringify(parts));
			}
			loc = addNoise(alphaNumToLoc(parts[0]), obj, conn.mistake);
			console.log(obj.id + ": " + JSON.stringify(loc));
			req.id = obj.id;
			req.l = loc.l;
			req.r = loc.r;
			if (req.l == -1) { req = makePassReq(obj); }
			doPost(conn.host, conn.url, conn.user_id, conn.session_id, req, function (data) {});
		});
	});
}

function myTurn(obj, user_id) {
	if (obj.buid == user_id && obj.seq.length % 2 == 0) { return true; }
	else if (obj.wuid == user_id && obj.seq.length % 2 == 1) { return true; }
	else { return false; }
}

function getGames(conn) {
	var req = {"type": "games", "uid": conn.user_id};
	doPost(conn.host, conn.url, conn.user_id, conn.session_id, req, function (data) {
		var obj;
		try {
			obj = JSON.parse(data);
		} catch (e) {
			console.log("could not parse data: " + data);
			return;
		}
		var list = obj.detail;
		for (var i = 0; i < list.length; i++) {
			if (myTurn(list[i],conn.user_id)) {
				findAndSendMove(list[i], conn);
			}
		}
	});
}

function getHistory(conn, callback) {
	var req = {"type":"history_list"};
	doPost(conn.host, conn.url, conn.user_id, conn.session_id, req, callback);
}

function filterForJudgement(conn, min) {
	return function (data){
		var list = JSON.parse(data).detail.filter(function (x) {
			return x.b_score > 0 && x.w_score > 0
				&& (x.status == "W" || x.status == "B")
				&& x.game_id >= min;
		});
		list.map(function(x) {
			var req = {"type":"game", "id": parseInt(x.game_id)};
			doPost(conn.host, conn.url, conn.user_id, conn.session_id, req, getJudgement);
		});
	}

}

function doPost(host, url, user_id, session_id, req, callback) {
	var cookie = "u_t_index="+user_id+"; Session_Id=" + session_id;
	var qs = querystring.stringify({'request': JSON.stringify(req)});
	var options = {
		hostname: host,
		port: 80,
		path: url,
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded',
			'Cookie': cookie,
			'Content-Length': Buffer.byteLength(qs)
		}
	};
	var req = http.request(options, function(res) {
		var buffer = "";
		res.setEncoding('utf8');
		res.on('data', function (data) { buffer += data;});
		res.on('end', function (data) { callback(buffer); });
	});
	req.write(qs);
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	req.end();
}

function getJudgement(data) {
	var req = {"type": "move"};
	var loc;
	var obj = JSON.parse(data).detail;
	var filename = "judgefile"+obj.id+".txt";

	if (last_posts[obj.id] >= obj.seq.length) { return; }
	last_posts[obj.id] = obj.seq.length;

	fs.writeFile(filename , adaptSeqToJudge(obj), function(err) {
		exec("gnugo  --level 1 --mode gtp < " + filename, function (error, stdout, stderr) {
			var parts = breakOnDelim(stdout, "=");
			var b_score = parseInt(obj.b_score);
			var w_score = parseInt(obj.w_score);
			parts = parts.map(function (x) {
				return x.replace(/^[ \r\n]+/, "").replace(/[ \r\n]+$/, "");
			}).filter(function (x) {
				return x != "";
			});
			if (parts.length != 1) {
				throw("An error occured: " + JSON.stringify(parts));
			}
			console.log(makeJudgeUpdate(obj, parts[0]));
		});
	});
}

function makeJudgeUpdate(obj, score) {
	var winner = score.substr(0,1);
	var diff = parseInt(score.substr(2));
	var output = "UPDATE go_header SET status = '" + winner + "'";
	if (winner == "B") {
		output += ", b_score=" + diff;
		output += ", w_score=0";
	} else {
		output += ", w_score=" + diff;
		output += ", b_score=0";
	}
	output += " WHERE game_id=" + obj.id + ";";
	return output;
}

exports.getGames = getGames;
exports.getHistory = getHistory;
exports.filterForJudgement = filterForJudgement;

