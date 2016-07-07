<?php
header('Content-Type: application/json');

class GoGame {
	public $id = -1;
	public $buid  = -1;
	public $wuid = -1;
	public $size = 9;
	public $seq = Array();

	public function __construct($id, $buid, $wuid, $seq) {
		$this->id = $id;
		$this->wuid = $wuid;
		$this->buid = $buid;
		$this->seq = $seq;
	}
}

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
		echo '{"status":"success", "detail": ' . json_encode(Array(
			new GoGame(1,1,40, $seq1),
			new GoGame(2,2,40, $seq2),
			new GoGame(3,1,32, $seq3)
		)) . '}';
	}
} else {
	die('{"status":"error", "detail":"no request sent."}');
}

?>
