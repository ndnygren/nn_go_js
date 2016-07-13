
var fixt = [{ "id": "4", "buid": "40", "wuid": "1", "bname": "R2D2", "wname": "Nick", "size": "9", "seq": [ [2, 2], [6, 2] ] },
	{ "id": "10", "buid": "2", "wuid": "1", "bname": "Brick", "wname": "Nick", "size": "9", "seq": [ [2, 3], [5, 2], [3, 2], [6, 2], [1, 3], [2, 1], [3, 1] ]
	},
{ "id": "11", "buid": "41", "wuid": "1", "bname": "Clamp", "wname": "Nick", "size": "9", "seq": [] }];

function locToAlphaNum(loc) {
	return String.fromCharCode(65 + loc[0])+loc[1];
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

console.log(adaptSeqToGTP(fixt[1]));

