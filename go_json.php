<?php
header('Content-Type: application/json');

include 'security/dbconnect.php';
include 'security/sessioncheckhead.php';
include 'go_db.php';

$TGILI = checkBadge();

$user_id = $_COOKIE['u_t_index'];

if (isset($_POST["request"])) {
	$post_data = json_decode($_POST["request"],true);
	if (!$post_data) {
		die('{"status":"error", "detail":"malformed request: ' . $_POST["request"] . '."}');
	}
	if (!isset($post_data['type'])) {
		die('{"status":"error", "detail":"request type is missing."}');
	}
	if ($post_data['type'] == "game") {
		if (!isset($post_data['id'])) {
			die('{"status":"error", "detail":"incomplete game request."}');
		}
		echo '{"status":"success", "detail": ' . json_encode(
			getGame($post_data['id'])
		) . '}';
	} else if ($post_data['type'] == "games") {
/*
		if (!isset($post_data['uid']) || $post_data['uid'] != $user_id) {
			die('{"status":"error", "detail":"User id is not set."}');
		}
*/
		echo '{"status":"success", "detail": ' . json_encode(
			getGames($user_id)
		) . '}';
	}
	else if ($post_data['type'] == "move") {
		if (!$TGILI) { die('{"status":"error", "detail":"faile authentication."}'); }
		if (!isset($post_data['id']) || !isset($post_data['l']) || !isset($post_data['r'])) {
			die('{"status":"error", "detail":"incomplete move request."}');
		}
		if (!myTurn($post_data['id'], $user_id)) {
			die('{"status":"error", "detail":"Not your turn."}');
		}
		addMove($post_data['id'], $post_data['l'], $post_data['r']);
		echo '{"status":"success", "detail":"good job."}';
	} else if ($post_data['type'] == "pass") {
		if (!$TGILI) { die('{"status":"error", "detail":"faile authentication."}'); }
		if (!isset($post_data['id']) || !isset($post_data['b']) || !isset($post_data['w'])) {
			die('{"status":"error", "detail":"incomplete pass request."}');
		}
		if (!myTurn($post_data['id'], $user_id)) {
			die('{"status":"error", "detail":"Not your turn."}');
		}
		addPass($post_data['id'], $post_data['b'], $post_data['w']);
		echo '{"status":"success", "detail":"good job."}';
	} else if ($post_data['type'] == "challenges") {
		echo '{"status":"success", "detail":' . json_encode(getChallenges($user_id)) . '}';

	} else if ($post_data['type'] == "challenge") {
		if (!$TGILI) { die('{"status":"error", "detail":"faile authentication."}'); }
		if (!isset($post_data['id']) || !isset($post_data['size'])) {
			die('{"status":"error", "detail":"incomplete challenge request."}');
		}
		addChallenge($post_data['id'], $user_id, $post_data['size']);
		echo '{"status":"success", "detail":"good job."}';
	} else if ($post_data['type'] == "chat") {
		if (!isset($post_data['games'])) {
			die('{"status":"error", "detail":"incomplete chat request."}');
		}
		echo '{"status":"success", "detail":' . json_encode(getChat($post_data['games'])) . '}';
	} else {
		die('{"status":"error", "detail":"Unrecognized type."}');
	}
} else {
	die('{"status":"error", "detail":"no request sent."}');
}

?>
