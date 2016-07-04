
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
	this.colors = {};

	// blanks-out canvas (white)
	this.reset = function() {
		this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	this.drawPointList = function(list) {
		for (var i in list.line) {
			this.drawLine(list.line[i]);
		}
		for (var i in list.circle) {
			this.drawArc(list.circle[i]);
		}
		for (var i in list.point) {
			this.drawPoint(list.point[i].x, list.point[i].y);
		}
	}

	this.drawPoint = function(x,y) {
		this.drawCircle(this.scaleX(x), this.scaleY(y), 2, "red");
	}

	this.drawLine = function(line) {
		var s = line.y2 - line.y1; //rise
		var n = line.x2 - line.x1; //run
		this.drawLine_uns(this.scaleX(line.x1),
				this.scaleY(line.y1),
				this.scaleX(line.x2),
				this.scaleY(line.y2),
				"rgba(0,255,0,196)", 1);
		this.drawLine_uns(this.scaleX(line.x1),
				this.scaleY(line.y1),
				this.scaleX(line.x1-n),
				this.scaleY(line.y1-s),
				"rgba(0,255,0,127)", 1);
		this.drawLine_uns(this.scaleX(line.x2+n),
				this.scaleY(line.y2+s),
				this.scaleX(line.x2),
				this.scaleY(line.y2),
				"rgba(0,255,0,127)", 1);
	}

	this.drawArc = function(circle) {
		this.drawCircle_uns(this.scaleX(circle.x),
				this.scaleY(circle.y),
				Math.abs(this.scaleX(circle.x)-this.scaleX(circle.x+circle.r)),
				"none",
				"rgba(0,0,200,128)");
	}

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
	}

	// direct canvas interaction, creates a circle
	this.drawCircle = function(x,y,r,color) {
		this.drawCircle_uns(x,y,r,color,'#000000');
	}

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
	}

	// direct canvas interaction, creates a line
	this.drawLine_uns = function(x1,y1,x2,y2,color,width) {
		var context = this.canvas.getContext('2d');

		context.strokeStyle = color;
		context.lineWidth = width;
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
	}

	// fixes the scale for multiple diagrams on a single canvas
	this.resetScale = function() {
		this.scaleh = this.width/(this.data_x_high - this.data_x_low);
		this.scalev = (this.height + 2 * this.border - 2*this.border)
			/(this.data_y_high - this.data_y_low);
		this.scaleh = Math.min(this.scaleh, this.scalev);
		this.scalev = this.scaleh;
	}

	// stretches and translates a single point horizontally
	this.scaleX = function(x) {
		return (x - this.data_x_low)*this.scaleh + this.border;
	}

	// stretches and translates a single point vertically
	this.scaleY = function(y) {
		return this.height - (y - this.data_y_low)*this.scalev + this.border + this.vert_offs;
	}

	this.drawLines = function() {
		for (var i = 0; i < this.board.size; i++ ){ 
			for (var j = 0; j < this.board.size; j++ ){
				this.drawLine_uns( this.scaleX(0), this.scaleY(j), this.scaleX(this.board.size-1), this.scaleY(j), "black", 1);
				this.drawLine_uns( this.scaleX(i), this.scaleY(0), this.scaleX(i), this.scaleY(this.board.size-1), "black", 1);
			}
		}
	}

	this.drawPieces = function () {
		for (var i = 0; i < this.board.size; i++) {
			for (var j = 0; j < this.board.size; j++) {
				if (this.board.get(i,j) == 1) {
					this.drawCircle_uns(this.scaleX(i),this.scaleY(j), 15, "white", "gray");
				} else if (this.board.get(i,j) == 2) {
					this.drawCircle_uns(this.scaleX(i),this.scaleY(j), 15, "black", "gray");
				}
			}
		}
	}

	this.resetScale();
	this.drawLines();
	this.drawPieces();
}

