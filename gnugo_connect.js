var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;

var fixt = [{ "id": "4", "buid": "40", "wuid": "1", "bname": "R2D2", "wname": "Nick", "size": "9", "seq": [ [2, 2], [6, 2] ] },
	{ "id": "10", "buid": "2", "wuid": "1", "bname": "Brick", "wname": "Nick", "size": "9", "seq": [ [2, 3], [5, 2], [3, 2], [6, 2], [1, 3], [2, 1], [3, 1] ]
	},
{ "id": "11", "buid": "41", "wuid": "1", "bname": "Clamp", "wname": "Nick", "size": "9", "seq": [] }];

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

fs.writeFile("movefile.txt", adaptSeqToGTP(fixt[1]), function(err) {
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

		console.log(JSON.stringify(alphaNumToLoc(parts[0])));
	});
});


