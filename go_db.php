<?php

class GoGame {
	public $id = -1;
	public $buid  = -1;
	public $wuid = -1;
	public $bname  = -1;
	public $wname = -1;
	public $size = 9;
	public $seq = Array();

	public function __construct($id, $buid, $wuid, $bname, $wname, $seq) {
		$this->id = $id;
		$this->wuid = $wuid;
		$this->buid = $buid;
		$this->wname = $wname;
		$this->bname = $bname;
		$this->seq = $seq;
	}
}

function getGames($usr_id) {
	$result = db_query("SELECT go_header.game_id, size, W.id AS wid, B.id AS bid, W.username AS wname, B.username AS bname, move_id, l, r "
		." FROM users AS B, users AS W, go_header "
		." LEFT JOIN go_moves ON go_header.game_id=go_moves.game_id "
		." WHERE B.id=black_user "
		." AND W.id=white_user "
		." AND (W.id= " . $usr_id . " || B.id=" . $usr_id . " )"
		." AND status IS NULL"
		." ORDER BY go_header.game_id, move_id ");
	$prev = -1;
	$output = Array();
	$temp = null;
	foreach ($result as $row) {
		if ($prev != $row["game_id"]) {
			if ($prev > -1) {
				$output[] = $temp;
			}
			$temp = new GoGame($row["game_id"], $row["wid"], $row["bid"], $row["wname"], $row["bname"], Array());
			$prev = $row["game_id"];
		}
		if ($row["move_id"] != null) {
			$temp->seq[] = Array(intval($row["l"]),intval($row["r"]));
		}
	}
	if ($temp != null) {
		$output[] = $temp;
	}

	return $output;
}

function myTurn($game_id, $user_id) {
	$games = getGames($user_id);
	$count = 0;
	$white = false;
	$black = false;

	foreach ($games as $row) {
		if ($game_id == $row->id) {
			$count = count($row->seq);
			if ($row->buid == $user_id) { $black = true; }
			if ($row->wuid == $user_id) { $white = true; }
		}
	}
	if ($count % 2 == 0 && $black) { return true; }
	if ($count % 2 == 1 && $white) { return true; }

	return false;
}

function addMove($game_id, $l, $r) {
	db_query("INSERT INTO go_moves (game_id, l, r) VALUES (". $game_id .",". $l .",". $r .")");
}

function addPass($game_id, $b, $w) {
	$result = db_query("SELECT l, r FROM go_moves WHERE game_id = ". $game_id . " ORDER BY move_id DESC");
	if ($result && $result[0]["l"] == -1) {

	}
	addMove($game_id, -1, -1);
}

?>
