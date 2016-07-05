<?php
header('Content-Type: application/json');

if (isset($_POST["request"])) {
	$post_data = json_decode($_POST["request"]);
	if (!$post_data) {
		die('{"status":"error", "detail":"malformed request: ' . $_POST["request"] . '."}');
	}
	if (!isset($post_data['type'])) {
		die('{"status":"error", "detail":"request type is missing."}');
	}
} else {
	echo '{"status":"error", "detail":"no request sent."}';
}

?>
