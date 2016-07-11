<?php
header('Content-Type: application/json');

include '../security/dbconnect.php';
include 'go_db.php';

$seq1 = [[1,0],[2,2],[0,1],[3,3],[2,1],[4,4],[1,2],[5,5],[2,0],[4,5],[0,2]];
$seq2 = [[1,0],[2,2],[0,1],[3,3]];
$seq3 = [[1,0],[2,2],[0,1],[3,3],[2,1]];

if (isset($_POST["request"])) {
	$post_data = json_decode($_POST["request"],true);
	if (!$post_data) {
		die('{"status":"error", "detail":"malformed request: ' . $_POST["request"] . '."}');
	}
	if (!isset($post_data['type'])) {
		die('{"status":"error", "detail":"request type is missing."}');
	}
	if ($post_data['type'] == "games") {
		if (!isset($post_data['uid'])) {
			die('{"status":"error", "detail":"User id is not set."}');
		}
		echo '{"status":"success", "detail": ' . json_encode(
			getGames(1)
		) . '}';
	}
} else {
	die('{"status":"error", "detail":"no request sent."}');
}

?>
