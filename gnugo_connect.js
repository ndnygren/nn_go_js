var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var querystring = require('querystring');

var host = "192.168.1.32";
var url = "/nn_go_js/go_json.php";
var user_id = 2;
var session_id = 78521752;
var go_board_data = fs.readFileSync('./go_board.js','utf8');
eval(go_board_data);

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

function adaptSeqToGTP(game_obj) {
	var color = "black";
	var output = "";
	output += "boardsize " + game_obj.size + "\n";
	output += "clear_board\n";
	for (var i = 0; i < game_obj.seq.length; i++) {
		output += "play " + color + " " + locToAlphaNum(game_obj.seq[i]) + "\n";
		color = color == "black" ? "white" : "black";
	}
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

function findAndSendMove(obj) {
	var req = {"type": "move", "uid": user_id};
	var loc;
	fs.writeFile("movefile"+obj.id+".txt", adaptSeqToGTP(obj), function(err) {
		exec("gnugo --mode gtp --capture-all-dead < movefile"+obj.id+".txt", function (error, stdout, stderr) {
			var parts = breakOnDelim(stdout, "=");
			parts = parts.map(function (x) {
				return x.replace(/^[ \r\n]+/, "").replace(/[ \r\n]+$/, "");
			}).filter(function (x) {
				return x != "";
			});
			if (parts.length != 1) {
				throw("An error occured: " + JSON.stringify(parts));
			}
			loc = alphaNumToLoc(parts[0]);
			console.log(obj.id + ": " + JSON.stringify(loc));
			req.id = obj.id;
			req.l = loc.l;
			req.r = loc.r;
			if (req.l == -1) { req = makePassReq(obj); }
			doPost(host, url, user_id, session_id, req, function (data) {});
		});
	});
}

function myTurn(obj, user_id) {
	if (obj.buid == user_id && obj.seq.length % 2 == 0) { return true; }
	else if (obj.wuid == user_id && obj.seq.length % 2 == 1) { return true; }
	else { return false; }
}

function getGames(host, url, user_id, session_id) {
	var req = {"type": "games", "uid": user_id};
	doPost(host, url, user_id, session_id, req, function (data) {
		var obj = JSON.parse(data);
		var list = obj.detail;
		for (var i = 0; i < list.length; i++) {
			if (myTurn(list[i],user_id)) {
				findAndSendMove(list[i]);
			}
		}
	});
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
		res.setEncoding('utf8');
		res.on('data', callback);
	});
	req.write(qs);
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	req.end();
}

setInterval(function (x) {
	getGames(host, url, user_id, session_id);
}, 3000);

