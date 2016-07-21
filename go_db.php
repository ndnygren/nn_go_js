<?php

class GoGame {
	public $id = -1;
	public $buid  = -1;
	public $wuid = -1;
	public $bname  = -1;
	public $wname = -1;
	public $size = 9;
	public $seq = Array();

	public function __construct($id, $buid, $wuid, $bname, $wname, $size, $seq) {
		$this->id = $id;
		$this->wuid = $wuid;
		$this->buid = $buid;
		$this->wname = $wname;
		$this->bname = $bname;
		$this->size = $size;
		$this->seq = $seq;
	}
}

function getChallenges($usr_id) {
	$result = db_query("SELECT id,username FROM users WHERE NOT EXISTS (SELECT * FROM go_header WHERE status IS NULL AND ((black_user=id AND white_user=".$usr_id.") OR (black_user=".$usr_id." AND white_user=id))) AND id!=".$usr_id);
	return $result;
}

function addChallenge($aid, $bid, $size) {
	$coin = rand(0,1) == 0;
	$w = $coin ? $aid : $bid;
	$b = $coin ? $bid : $aid;
	return db_update("INSERT INTO go_header (white_user, black_user, size) VALUES (".$w.",".$b.",".$size.")");
}

function resToGameObj($result) {
	$prev = -1;
	$output = Array();
	$temp = null;
	foreach ($result as $row) {
		if ($prev != $row["game_id"]) {
			if ($prev > -1) {
				$output[] = $temp;
			}
			$temp = new GoGame($row["game_id"], $row["wid"], $row["bid"], $row["wname"], $row["bname"], $row["size"], Array());
			$prev = $row["game_id"];
		}
		if ($row["move_id"] != null) {
			$temp->seq[] = Array(intval($row["l"]),intval($row["r"]), $row["created"]);
		}
	}
	if ($temp != null) {
		$output[] = $temp;
	}

	return $output;
}

function getGame($game_id) {
	$result = db_query("SELECT go_header.game_id, size, W.id AS wid, B.id AS bid, W.username AS wname, B.username AS bname, move_id, l, r, go_moves.created"
		." FROM users AS B, users AS W, go_header "
		." LEFT JOIN go_moves ON go_header.game_id=go_moves.game_id "
		." WHERE B.id=black_user "
		." AND W.id=white_user "
		." AND go_header.game_id=" . $game_id
		." ORDER BY go_header.game_id, move_id ");
	if (count($result) > 0) {
		return resToGameObj($result)[0];
	}
	die('{"status":"error", "detail":"no game '.$game_id.' found"}');
}

function getChat($game_ids) {
	$glist = [];
	foreach ($game_ids as $game_id) {
		if (!is_int($game_id)) {
			die('{"status":"error", "detail":"this '.$game_id.' is not an int."}');
		}
		$glist[] = "Go".$game_id;
	}

	$result = db_query("SELECT cat_id, topic_id, topic_subject, post_id, post_content, post_date, post_by, username "
		." FROM forum_categories, forum_topics, forum_posts, users "
		." WHERE cat_id=topic_cat AND topic_id=post_topic AND post_by=users.id AND cat_name='Go'".
		" AND topic_subject IN ('" . join("','",$glist) . "')");
	return $result;
}

function getGames($usr_id) {
	$result = db_query("SELECT go_header.game_id, size, W.id AS wid, B.id AS bid, W.username AS wname, B.username AS bname, move_id, l, r, go_moves.created "
		." FROM users AS B, users AS W, go_header "
		." LEFT JOIN go_moves ON go_header.game_id=go_moves.game_id "
		." WHERE B.id=black_user "
		." AND W.id=white_user "
		." AND (W.id= " . $usr_id . " || B.id=" . $usr_id . " )"
		." AND status IS NULL"
		." ORDER BY go_header.game_id, move_id ");
	return resToGameObj($result);
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
	db_update("INSERT INTO go_moves (game_id, l, r) VALUES (". $game_id .",". $l .",". $r .")");
}

function addPass($game_id, $b, $w) {
	$result = db_query("SELECT l, r FROM go_moves WHERE game_id = ". $game_id . " ORDER BY move_id DESC");
	$status = $b > $w ? "B" : "W";
	if ($result && $result[0]["l"] == -1) {
		db_update("UPDATE go_header SET status='" . $status
			."', b_score='". $b
			."', w_score='" . $w . "' "
			." WHERE game_id='".$game_id."'");
	}
	addMove($game_id, -1, -1);
}

?>
