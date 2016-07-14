var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var querystring = require('querystring');

var host = "192.168.1.32";
var url = "/nn_go_js/go_json.php";
var user_id = 1;
var session_id = 79660248;

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
	return String.fromCharCode(65 + loc[0])+loc[1];
}

function alphaNumToLoc(alpha) {
	var first = alpha.toLowerCase().charCodeAt(0) - 97;
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

function findAndSendMove(obj) {
	fs.writeFile("movefile.txt", adaptSeqToGTP(obj), function(err) {
		exec("gnugo --mode gtp < movefile.txt", function (error, stdout, stderr) {
			var parts = breakOnDelim(stdout, "=");
			parts = parts.map(function (x) {
				return x.replace(/^[ \r\n]+/, "").replace(/[ \r\n]+$/, "");
			}).filter(function (x) {
				return x != "";
			});
			if (parts.length > 1) {
				throw("An error occured: " + JSON.stringify(parts));
			}

			console.log(obj.id + ": " + JSON.stringify(alphaNumToLoc(parts[0])));
		});
	});
}

function getGames(host, url, user_id, session_id) {
	var req = {"type": "games", "uid": user_id};
	doPost(host, url, user_id, session_id, req, function (data) {
		var obj = JSON.parse(data);
		var list = obj.detail;
		for (var i = 0; i < list.length; i++) {
			findAndSendMove(list[i]);
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

getGames(host, url, user_id, session_id);

