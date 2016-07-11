<?php

include '../security/dbconnect.php';

function getGames($usr_id) {
	$result = db_query("SELECT go_header.game_id, size, W.id AS wid, B.id AS bid, W.username AS wname, B.username AS bname, move_id, l, r "
		." FROM users AS B, users AS W, go_header "
		." LEFT JOIN go_moves ON go_header.game_id=go_moves.game_id "
		." WHERE B.id=black_user "
		." AND W.id=white_user "
		." AND (W.id= " . $usr_id . " || B.id=" . $usr_id . " )"
		." AND status IS NULL"
		." ORDER BY go_header.game_id, move_id ");

	return $result;
}

echo json_encode(getGames(1));

?>
