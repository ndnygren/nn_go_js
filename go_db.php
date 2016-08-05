<?php


class GoGame {
	public $id = -1;
	public $buid  = -1;
	public $wuid = -1;
	public $bname  = -1;
	public $wname = -1;
	public $size = 9;
	public $seq = Array();
	public $b_score;
	public $w_score;
	public $time;

	public function latest() {
		if (count($this->seq) == 0) { return time(); }
		$max = strtotime($this->seq[0][2]);
		foreach ($this->seq as $move) {
			if (strtotime($move[2]) > $max) {
				$max = strtotime($move[2]);
			}
		}
		return $max;
	}

	public function __construct($id, $buid, $wuid, $bname, $wname, $size, $seq, $b_score, $w_score) {
		$this->id = $id;
		$this->wuid = $wuid;
		$this->buid = $buid;
		$this->wname = $wname;
		$this->bname = $bname;
		$this->size = $size;
		$this->seq = $seq;
		$this->b_score = $b_score;
		$this->w_score = $w_score;
		$this->time = time();
	}
}

function filterGameList($list, $last_time) {
	$output = Array();
	foreach ($list as $game) {
		if ($game->latest() > strtotime($last_time)) {
			$output[] = $game;
		}
	}
	return $output;
}

function idGameList($list) {
	$output = Array();
	foreach ($list as $game) {
		$output[] = intval($game->id);
	}
	return $output;
}

function getChallenges($usr_id) {
	$result = db_query("SELECT id,username FROM users WHERE NOT EXISTS (SELECT * FROM go_header WHERE status IS NULL AND ((black_user=id AND white_user=".$usr_id.") OR (black_user=".$usr_id." AND white_user=id))) AND id!=".$usr_id);
	return $result;
}

function getHistoryList() {
	$result = db_query("SELECT game_id, black_user AS buid, white_user AS wuid, W.username AS wname, B.username AS bname, status, b_score, w_score FROM go_header, users AS W, users AS B WHERE black_user = B.id AND white_user = W.id ORDER BY game_id DESC");
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
			$temp = new GoGame($row["game_id"], $row["bid"], $row["wid"], $row["bname"], $row["wname"], $row["size"], Array(), $row["b_score"], $row["w_score"]);
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
	$result = db_query("SELECT go_header.game_id, size, W.id AS wid, B.id AS bid, W.username AS wname, B.username AS bname, move_id, l, r, go_moves.created, b_score, w_score"
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

function getChat($game_ids, $last_time = "2016-01-22 17:48:58") {
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
		" AND topic_subject IN ('" . join("','",$glist) . "')".
		" AND post_date > '". $last_time ."'");
	return $result;
}

function postChat($user_id, $game_id, $content) {
	if (!is_int($game_id)) {
			die('{"status":"error", "detail":"this '.$game_id.' is not an int."}');
	}
	$subject = 'Go'.$game_id;
	db_update("INSERT INTO forum_topics (topic_subject, topic_cat, topic_by, topic_date)
		SELECT '".$subject."', 4, ".$user_id.", NOW() FROM dual WHERE NOT EXISTS (
			SELECT topic_id FROM forum_topics WHERE topic_cat=4 AND topic_subject='".$subject."')");

	db_update("INSERT INTO forum_posts (post_topic,post_content, post_by, post_date)
		SELECT topic_id, '".$content."', ".$user_id.", NOW() FROM forum_topics WHERE topic_subject='".$subject."' AND topic_cat=4
		");

}

function getGames($usr_id) {
	$result = db_query("SELECT go_header.game_id, size, W.id AS wid, B.id AS bid, W.username AS wname, B.username AS bname, move_id, l, r, go_moves.created, b_score, w_score "
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
