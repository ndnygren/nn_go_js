<?php
header('Content-Type: application/json');

include '../security/dbconnect.php';
include 'go_db.php';

$user_id = $_COOKIE['u_t_index'];

if (isset($_POST["request"])) {
	$post_data = json_decode($_POST["request"],true);
	if (!$post_data) {
		die('{"status":"error", "detail":"malformed request: ' . $_POST["request"] . '."}');
	}
	if (!isset($post_data['type'])) {
		die('{"status":"error", "detail":"request type is missing."}');
	}
	if ($post_data['type'] == "games") {
		if (!isset($post_data['uid']) || $post_data['uid'] != $user_id) {
			die('{"status":"error", "detail":"User id is not set."}');
		}
		echo '{"status":"success", "detail": ' . json_encode(
			getGames($user_id)
		) . '}';
	}
	if ($post_data['type'] == "move") {
		if (!isset($post_data['id']) || !isset($post_data['l']) || !isset($post_data['r'])) {
			die('{"status":"error", "detail":"incomplete move request."}');
		}
		if (!myTurn($post_data['id'], $user_id)) {
			die('{"status":"error", "detail":"Not your turn."}');
		}
		addMove($post_data['id'], $post_data['l'], $post_data['r']);
		echo '{"status":"success", "detail":"good job."}';
	}
} else {
	die('{"status":"error", "detail":"no request sent."}');
}

?>
