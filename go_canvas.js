/*
* nn_go_js - WebUI for Go, deployed on nygren.ca
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

var birch_bk = new Image();
birch_bk.src = "Images/birch1.jpg";


function GoHTML () {
	this.emptyObj = function(elem) {
		while (elem.hasChildNodes()) {
			elem.removeChild(elem.childNodes[0]);
		}
	};

	this.tableFrom2dArray = function(arr1) {
		var output = document.createElement("table");
		var topheader = document.createElement("tr");
		if (arr1.length === 0) { return output; }
		arr1[0].map( function(cell) {
			var th = document.createElement("th");
			th.appendChild(document.createTextNode(cell));
			topheader.appendChild(th);
		});
		output.appendChild(topheader);
		arr1.slice(1).map(function(row) {
			var tr = document.createElement("tr");
			var th = document.createElement("th");
			th.appendChild(document.createTextNode(row[0]));
			tr.appendChild(th);
			row.slice(1).map(function(cell){
				var td = document.createElement("td");
				td.appendChild(document.createTextNode(cell));
				tr.appendChild(td);
			});
			output.appendChild(tr);

		});

		return output;
	};
}

function GameManagerInt(canvas, gamelist, swindow, cwindow, twindow, uid) {
	this.cw = new CanvasWriter(new GoBoard(5), canvas);
	this.gamelist = gamelist;
	this.swindow = swindow;
	this.cwindow = cwindow;
	this.tm = new TalkManager(twindow);
	this.gamedata = null;
	this.uid = uid;
	this.current_game = -1;
	this.servertime = -1;

	this.findIdxById = function(id, arr) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].id == id) { return i; }
		}
		return -1;
	};

	this.findById = function(id, arr) {
		var single = arr.filter(function (x) { return x.id == id; });
		if (single.length === 0) { throw("id " + id + " not found."); }
		return single[0];
	};

	this.addMove = function(x,y) {
		if (this.current_game == -1) { throw("no game selected"); }
		var game = this.findById(this.current_game, this.gamedata);
		if (!this.myTurn(game)) {
			throw("not your turn on game " + game.id + ".");
		}
		game.seq.push([x,y]);
		this.addGames(this.gamedata);
	};

	this.myTurn = function(obj) {
		if (obj.buid == this.uid && obj.seq.length % 2 === 0) {
			return true;
		} else if (obj.wuid == this.uid && obj.seq.length % 2 === 1) {
			return true;
		} else {
			return false;
		}
	};

	this.findChallenges = function() {
		var gm = this;
		var req = {"type": "challenges"};
		$.post('go_json.php', {request: JSON.stringify(req)}, function(data){
			var selec = document.createElement("select");
			var bsize = document.createElement("select");
			var button = document.createElement("button");
			var opt;
			opt = document.createElement("option");
			opt.value = 5;
			opt.appendChild(document.createTextNode("5x5"));
			bsize.appendChild(opt);
			opt = document.createElement("option");
			opt.value = 9;
			opt.appendChild(document.createTextNode("9x9"));
			opt.selected = true;
			bsize.appendChild(opt);
			opt = document.createElement("option");
			opt.value = 13;
			opt.appendChild(document.createTextNode("13x13"));
			bsize.appendChild(opt);
			button.appendChild(document.createTextNode("Challenge"));
			button.addEventListener('click', function() {
				var req2 = {"type": "challenge", "id": selec.value, "size": bsize.value};
				$.post('go_json.php', {request: JSON.stringify(req2)}, function(data) { });
				selec.remove(selec.selectedIndex);
			});
			data.detail.map(function(x) {
				var opt = document.createElement("option");
				opt.value = x.id;
				opt.appendChild(document.createTextNode(x.username));
				selec.appendChild(opt);
			});
			gm.cwindow.appendChild(bsize);
			gm.cwindow.appendChild(selec);
			gm.cwindow.appendChild(button);


		});

	};

	this.loadGames = function() {
		var gm = this;
		var req = {"type":"games", "uid": this.uid};
		var count = gm.gamedata ? assocFoldr(gm.gamedata.map(function(game) {
			return gm.myTurn(game) ? 1 : 0;
		}), function(a,b) {
			return a+b;
		}) : 0;
		if (count < 1) {
			$.post('go_json.php', {request: JSON.stringify(req)},
				function(data){
					gm.addGames(data.detail);
					gm.tm.loadChat(data.detail);
				});
		}
	};

	this.makeButtonCallback = function (obj) {
		var gm = this;
		var board = boardCache.getBoard(obj.size, obj.seq);
		var ter_score = board.scoreFromMap();
		var cap_score = board.captureCount();
		var req = {"type": "pass", "id": gm.current_game, "b": ter_score.b+cap_score.b, "w":ter_score.w+cap_score.w};
		return function () {
			$.post('go_json.php', {request: JSON.stringify(req)}, function(data){ });
			gm.addMove(-1,-1);
		};
	};

	this.softTime = function(movetime) {
		if (!movetime) { return "never"; }
		var now = this.servertime;
		var then = gm.convertMySQLDate(movetime) / 1000.0;
		var diff = Math.floor(now - then);
		if (diff > 24*60*60) { return Math.floor(diff/24/60/60) + " days ago"; }
		else if (diff > 60*60) { return Math.floor(diff/60/60) + " hours ago"; }
		else if (diff > 60) { return Math.floor(diff/60) + " minutes ago"; }
		return diff + " seconds ago";
	}

	this.makeLiCallback = function (obj) {
		this.servertime = Math.max(this.servertime, obj.time);
		var gm = this;
		var button;
		return function() {
			new GoHTML().emptyObj(gm.swindow);
			var board = new GoBoard(obj.size);
			var h3 = document.createElement("h3");
			var timediv = document.createElement("div");
			if (board.moveSeqValid(obj.seq,2)) {
				board = boardCache.getBoard(obj.size, obj.seq);
			} else {
				gm.swindow.appendChild(document.createTextNode( "invalid move seq in game " + obj.id));
				return;
			}
			var ter_score = board.scoreFromMap();
			var cap_score = board.captureCount();
			var scoretable = new GoHTML().tableFrom2dArray([["","black","white"],
				["users", obj.bname, obj.wname],
				["moves", Math.ceil(obj.seq.length/2), Math.floor(obj.seq.length/2)],
				["territory", ter_score.b, ter_score.w],
				["capture", cap_score.b, cap_score.w]]);

			gm.current_game = obj.id;
			gm.tm.buildChatBox(gm.current_game);
			gm.cw.redraw(board);
			h3.appendChild(document.createTextNode("Game " + obj.id));
			timediv.appendChild(document.createTextNode("moved " + (obj.seq.length > 0 ? gm.softTime(obj.seq[obj.seq.length -1][2]) : "never")));
			gm.swindow.appendChild(h3);
			gm.swindow.appendChild(scoretable);
			gm.swindow.appendChild(timediv);
			button = document.createElement("button");
			button.appendChild(document.createTextNode(board.seq.length === 0 || board.seq[board.seq.length - 1][0] > -1 ? "Pass" : "End Game"));
			button.addEventListener('click', gm.makeButtonCallback(obj));
			gm.swindow.appendChild(button);
		};
	};

	this.gameObjToLi = function(obj) {
		var li = document.createElement("li");
		li.appendChild(document.createTextNode("game " + obj.id));
		li.className = this.myTurn(obj) ? "activeTurn" : "inactiveTurn";
		li.addEventListener('click', this.makeLiCallback(obj));

		return li;
	};

	this.addGames = function(games) {
		var gm = this;
		this.gamedata = games;
		var g1;
		var items = games.map(function (x) { return gm.gameObjToLi(x); });
		while (gm.gamelist.hasChildNodes()) {
			gm.gamelist.removeChild(gm.gamelist.childNodes[0]);
		}
		items.map(function(li) {
			gm.gamelist.appendChild(li);
		});
		if (gm.current_game != -1) {
			try {
				g1 = gm.findById(gm.current_game, gm.gamedata);
				(gm.makeLiCallback(g1))();
			} catch(e) {
			}
		}
	};

	this.convertMySQLDate = function(x) {
		if (!x) { return 0; }
		var t = x.split(/[- :]/);
		var ts = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		return ts.getTime();
	};

	this.msToMySQL = function (x) {
		var parsed = new Date(x);
		var outtime = "";
		outtime += parsed.getFullYear();
		outtime += "-" + (parsed.getMonth() + 1);
		outtime += "-" + parsed.getDate();
		outtime += " " + this.padDigits(parsed.getUTCHours());
		outtime += ":" + this.padDigits(parsed.getUTCMinutes());
		outtime += ":" + this.padDigits(parsed.getUTCSeconds());
		return outtime;
	};

	this.padDigits = function(i) {
		return i < 10 ? "0"+i : i;
	};

	this.findMaxTime = function() {
		var gm = this;
		var timelist;
		if (this.gamedata.length === 0) {
			var ts = new Date();
			ts.setDate(1);
			ts.setHour(1);
			return ts.toUTCString();
		}
		timelist = assocFoldr(this.gamedata.map(function(x) {
			return x.seq.filter(function(z){
				return z[2];
			}).map(function(y) {
				return gm.convertMySQLDate(y[2]);
			});
		}), function(a,b) {
			return a.concat(b);
		}).concat(this.tm.data.map(function(y) {
			return gm.convertMySQLDate(y.post_date);
		}));
		return this.msToMySQL(Math.max.apply(null, timelist));
	};

	this.loadNews = function() {
		var gm = this;
		var maxtime = this.findMaxTime();
		var req = {"type":"news", "last_time": maxtime};
		$.post('go_json.php', {request: JSON.stringify(req)},
			function(data){
				gm.mergeInChanges(data.detail.games);
				gm.tm.mergeInChanges(data.detail.chat);
			});
	};

	this.mergeInChanges = function(changes) {
		var idx;
		for (var i = 0; i < changes.length; i++) {
			idx = this.findIdxById(changes[i].id, this.gamedata);
			if (idx == -1) {
				this.gamedata.push(changes[i]);
			} else {
				this.gamedata[idx] = changes[i];
			}
		}
		if (changes.length > 0) {
			this.addGames(this.gamedata);
		}
	};

	var gm = this;
	this.findChallenges();
	this.loadGames();

	setInterval(function(x) { gm.loadNews(); }, 2000);

	gm.cw.canvas.addEventListener('click', function(e) {
		var nb;
		var rect = canvas.getBoundingClientRect();
		var x = Math.floor(gm.cw.scaleXRev(e.clientX - rect.left)+0.5);
		var y = Math.floor(gm.cw.scaleYRev(e.clientY - rect.top)+0.5);
		var req = {"type": "move", "id": gm.current_game, "l":x, "r": y };
		if (gm.cw.board.moveValid(x,y,gm.cw.color) && gm.myTurn(gm.findById(gm.current_game, gm.gamedata))) {
			nb = gm.cw.board.add(x,y, gm.cw.color);
			if (new GoBoard(nb.size).moveSeqValid(nb.seq)){
				gm.cw.redraw(nb);
				//console.log(JSON.stringify(cw.board.seq));
				$.post('go_json.php', {request: JSON.stringify(req)}, function(data){ });
				gm.addMove(x,y);
			}
		}
	});
}

// Class to act as a wrapper for the HTML5 canvas
function CanvasWriter(board, canvas) {
	this.canvas = canvas;
	this.board = board;
	this.border = 40.0;
	this.width = canvas.width - 2*this.border;
	this.height = canvas.height - 2*this.border;
	this.data_x_low = 0.0;
	this.data_y_low = 0.0;
	this.data_x_high = this.board.size;
	this.data_y_high = this.board.size;
	this.data_scale = 10.0;
	this.vert_offs = 0.0;
	this.color = 2;

	// blanks-out canvas (white)
	this.reset = function() {
		this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
	};

	// finds an appropriate scale for the diagram,
	// depending on the size of the input
	this.setSizeBasedOnDataSet = function(list) {
		var l2;
		this.data_y_low = -1;
		this.data_y_high = 1;
		this.data_x_low = -1;
		this.data_x_high = 1;
		if (!list || list.length < 1) { throw("bad data set"); }
		l2 = list.map(function(x) { return parseFloat(x.x); });
		this.data_x_low = Math.min(this.data_x_low, Math.min.apply(null, l2));
		this.data_x_high = Math.max(this.data_x_high, Math.max.apply(null, l2));
		l2 = list.map(function(x) { return parseFloat(x.y); });
		this.data_y_low = Math.min(this.data_y_low, Math.min.apply(null, l2));
		this.data_y_high = Math.max(this.data_y_high, Math.max.apply(null, l2));
		this.reset();
		this.resetScale();
		this.drawAxis();
	};

	// direct canvas interaction, creates a circle
	this.drawCircle = function(x,y,r,color) {
		this.drawCircle_uns(x,y,r,color,'#000000');
	};

	// direct canvas interaction, creates a circle
	this.drawCircle_uns = function(x,y,r,fill_color, line_color) {
		var context = this.canvas.getContext('2d');

		context.beginPath();
		context.arc(x, y, r, 0, 2 * Math.PI, false);
		context.fillStyle = fill_color;
		if (fill_color != "none" ) { context.fill(); }
		context.lineWidth = 1;
		context.strokeStyle = line_color;
		context.stroke();
	};

	this.drawCross = function(x,y,r,color) {
		var context = this.canvas.getContext('2d');

		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(x + r, y + r);
		context.lineWidth = 3;
		context.strokeStyle = "black";
		context.stroke();
		context.lineWidth = 2;
		context.strokeStyle = "yellow";
		context.stroke();

	};

	// direct canvas interaction, creates a line
	this.drawLine_uns = function(x1,y1,x2,y2,color,width) {
		var context = this.canvas.getContext('2d');

		context.strokeStyle = color;
		context.lineWidth = width;
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
	};

	// fixes the scale for multiple diagrams on a single canvas
	this.resetScale = function() {
		this.scaleh = this.width/(this.data_x_high - this.data_x_low);
		this.scalev = (this.height + 2 * this.border - 2*this.border) /(this.data_y_high - this.data_y_low);
		this.scaleh = Math.min(this.scaleh, this.scalev);
		this.scalev = this.scaleh;
	};

	// stretches and translates a single point horizontally
	this.scaleX = function(x) {
		return (x - this.data_x_low)*this.scaleh + this.border;
	};
	this.scaleXRev = function(x) {
		return (x - this.border)/this.scaleh + this.data_x_low;
	};

	// stretches and translates a single point vertically
	this.scaleY = function(y) {
		return this.height - (y - this.data_y_low)*this.scalev + this.border + this.vert_offs;
	};
	this.scaleYRev = function(y) {
		return (this.height + this.border + this.vert_offs - y)/this.scalev + this.data_y_low;
	};

	this.drawLines = function() {
		var context = this.canvas.getContext('2d');
		var color = "rgba(0, 0, 0, 0.5)";
		context.drawImage(birch_bk,0,0, this.canvas.width, this.canvas.height);
		for (var j = 0; j < this.board.size; j++ ){
			this.drawLine_uns( this.scaleX(0), this.scaleY(j), this.scaleX(this.board.size-1), this.scaleY(j), color, 1);
			this.drawLine_uns( this.scaleX(j), this.scaleY(0), this.scaleX(j), this.scaleY(this.board.size-1), color, 1);
		}
	};

	this.drawPieces = function () {
		var radius = Math.abs(this.scaleX(1) - this.scaleX(0))/2.3;
		for (var i = 0; i < this.board.size; i++) {
			for (var j = 0; j < this.board.size; j++) {
				if (this.board.get(i,j) == 1) {
					this.drawCircle_uns(this.scaleX(i),this.scaleY(j), radius, "white", "gray");
				} else if (this.board.get(i,j) == 2) {
					this.drawCircle_uns(this.scaleX(i),this.scaleY(j), radius, "black", "gray");
				}
			}
		}
		if (this.board.seq.length > 0) {
			last_point = this.board.seq[this.board.seq.length - 1];
			if (last_point[0] > -1) {
				this.drawCross(this.scaleX(last_point[0]),this.scaleY(last_point[1]), 15, "white", "gray");
			}

		}
	};

	this.addLettering = function() {
		var context = this.canvas.getContext("2d");
		var offedge = 8;
		context.font = "15px monospace";
		context.textBaseline = "middle";
		context.textAlign = "center";
		context.fillStyle="black";
		for (var i = 0; i < this.board.size; i++) {
			context.fillText(this.board.letters[i], this.scaleX(i), offedge);
			context.fillText(this.board.letters[i], this.scaleX(i), this.canvas.height - offedge);
			context.fillText(i+1, offedge, this.scaleY(i));
			context.fillText(i+1, this.canvas.width - offedge, this.scaleY(i));
		}
	};

	this.redraw = function(board) {
		this.board = board;
		this.color = ((board.seq.length + 1) % 2) + 1;
		this.data_x_high = this.board.size - 1;
		this.data_y_high = this.board.size - 1;
		this.resetScale();
		this.reset();
		this.drawLines();
		this.drawPieces();
		this.addLettering();
	};

	this.resetScale();
	this.drawLines();
	this.drawPieces();

}

function HistoryManager(hwindow, game_id) {
	this.hwindow=hwindow;
	this.cw = null;
	this.game_id = game_id;

	this.makeCanvas = function() {
		var hm = this;
		var board = new GoBoard(5);
		var h3 = document.createElement("h3");
		var timebox = document.createElement("div");
		this.timespan = document.createElement("i");
		var ldiv = document.createElement("div");
		var rdiv = document.createElement("div");
		this.tablediv = document.createElement("div");
		var canvas = document.createElement("canvas");
		var bl = document.createElement("button");
		var br = document.createElement("button");
		h3.appendChild(document.createTextNode("Game " + this.game_id));
		bl.appendChild(document.createTextNode("< Back"));
		br.appendChild(document.createTextNode("Forward >"));
		bl.addEventListener('click', function() { hm.decMove(); });
		br.addEventListener('click', function() { hm.incMove(); });
		ldiv.className = "inner_div";
		rdiv.className = "inner_div";
		canvas.width = 400;
		canvas.height = 400;
		timebox.appendChild(this.timespan);
		ldiv.appendChild(canvas);
		rdiv.appendChild(h3);
		rdiv.appendChild(timebox);
		rdiv.appendChild(bl);
		rdiv.appendChild(br);
		rdiv.appendChild(this.tablediv);
		this.hwindow.appendChild(ldiv);
		this.hwindow.appendChild(rdiv);
		this.cw = new CanvasWriter(board, canvas);
	};

	this.setMove = function(i) {
		var board = boardCache.getBoard(this.obj.size, this.obj.seq.slice(0,i));
		var last = i > 0 ? this.obj.seq[i-1] : [-2,-1, "Never"];
		var ter_score = board.scoreFromMap();
		var cap_score = board.captureCount();
		var scoretable = new GoHTML().tableFrom2dArray([
				["","black","white"],
				["users", this.obj.bname, this.obj.wname],
				["moves", Math.ceil(board.seq.length/2), Math.floor(board.seq.length/2)],
				["territory", ter_score.b, ter_score.w],
				["capture", cap_score.b, cap_score.w],
				["judge", this.obj.b_score, this.obj.w_score]]);
		new GoHTML().emptyObj(this.tablediv);
		this.tablediv.appendChild(scoretable);
		new GoHTML().emptyObj(this.timespan);
		this.timespan.appendChild(document.createTextNode(last[2]));
		this.cw.redraw(board);
		this.move = i;
	};

	this.incMove = function() {
		if (this.move < this.obj.seq.length) {
			this.setMove(this.move + 1);
		}
	};

	this.decMove = function() {
		if (this.move > 0) {
			this.setMove(this.move - 1);
		}
	};

	this.makeCanvas();
	var hm = this;
	var req = {"type": "game", "id" : game_id };
	$.post('go_json.php', {request: JSON.stringify(req)}, function(data){
		hm.obj = data.detail;
		hm.setMove(hm.obj.seq.length);
	});
}

function HistoryList(outdiv) {
	this.hwindow = outdiv;
	this.data = [];

	this.populateList = function() {
		var h3 = document.createElement("h3");
		var ul = document.createElement("ul");
		h3.appendChild(document.createTextNode("Games"));
		new GoHTML().emptyObj(this.hwindow);
		this.hwindow.appendChild(h3);
		this.data.map(function (x) {
			var li = document.createElement("li");
			var sp1 = document.createElement("span");
			var sp2 = document.createElement("span");
			var sp3 = document.createElement("span");
			var sp4 = document.createElement("span");
			var link = document.createElement("a");
			link.href = "go_hist.php?id=" + x.game_id;
			li.className = "history_list";
			sp1.className = "game_id";
			link.appendChild(document.createTextNode("Game " + x.game_id));
			sp1.appendChild(link);
			li.appendChild(sp1);
			sp2.className = "black_user";
			sp2.appendChild(document.createTextNode("B:" + x.bname));
			li.appendChild(sp2);
			sp3.className = "white_user";
			sp3.appendChild(document.createTextNode("W:" + x.wname));
			li.appendChild(sp3);
			sp4.className = "status";
			sp4.appendChild(document.createTextNode("S:" + x.status));
			li.appendChild(sp4);
			ul.appendChild(li)
		});
		this.hwindow.appendChild(ul);
	}

	var hm = this;
	var req = {"type": "history_list"};
	$.post('go_json.php', {request: JSON.stringify(req)}, function(data){
		hm.data = data.detail;
		hm.populateList();
	});
}

function TalkManager (twindow) {
	this.twindow = twindow;
	this.data;
	this.current_id = -1;

	this.makePostCallback = function(id, textarea) {
		return function () {
			var req = {"type":"chatpost", "game": parseInt(id), "content": textarea.value };
			$.post('go_json.php', {request: JSON.stringify(req)},
					function () {
						textarea.value = "";
					}
			      );
		};
	};

	this.buildChatBox = function (id) {
		if (id == this.current_id) { return; }
		var tm = this;
		new GoHTML().emptyObj(this.twindow);
		var ta = document.createElement("textarea");
		var button = document.createElement("button");
		var ul = document.createElement("ul");
		this.output_list = ul;
		button.appendChild(document.createTextNode("Post"));
		button.addEventListener('click', tm.makePostCallback(id,ta));
		ta.style = "width:200px";
		button.style = "width:200px";
		this.twindow.appendChild(ta);
		this.twindow.appendChild(button);
		this.twindow.appendChild(ul);
		this.populateOutput(id);
	};

	this.populateOutput = function(id) {
		var ul = this.output_list;
		if (!ul) { return; }
		new GoHTML().emptyObj(ul);
		var list = this.data.filter(function (x) { return x.topic_subject=="Go"+id; });
		var lilist = list.map(function(x) {
			var li = document.createElement("li");
			var b = document.createElement("b");
			var i = document.createElement("i");
			var div = document.createElement("div");
			b.appendChild(document.createTextNode(x.username));
			i.appendChild(document.createTextNode(x.post_date));
			li.appendChild(b);
			li.appendChild(i);
			div.appendChild(document.createTextNode(x.post_content));
			li.appendChild(div);
			ul.appendChild(li);
		});
		this.current_id = id;
	};

	this.addChatData = function(data) {
		this.data = data;
		if (this.current_id > -1) {
			this.populateOutput(this.current_id);
		}
	};

	this.loadChat = function(gamedata) {
		var tm = this;
		var idlist = gamedata.map(function(x) { return parseInt(x.id); });
		var req1 = {"type":"chat", "games": idlist };
		$.post('go_json.php', {request: JSON.stringify(req1)},
				function(data) {
					tm.addChatData(data.detail);
				});
	};

	this.findIdxById = function(id, arr) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].post_id == id) { return i; }
		}
		return -1;
	};

	this.mergeInChanges = function(changes) {
		var idx;
		for (var i = 0; i < changes.length; i++) {
			idx = this.findIdxById(changes[i].post_id, this.data);
			if (idx == -1) {
				this.data.push(changes[i]);
			} else {
				this.data[idx] = changes[i];
			}
		}
		if (changes.length > 0) {
			this.populateOutput(this.current_id);
		}
	};
}

