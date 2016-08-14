
var gnugo = require('./gnugo_connect');


var conn_obj = {};
conn_obj.host = "192.168.1.33";
conn_obj.url = "/nn_go_js/go_json.php";
conn_obj.user_id = 2;
conn_obj.session_id = 78521752;
conn_obj.mistake = 0.51;
conn_obj.delay = 3000;


gnugo.getHistory(conn_obj, gnugo.filterForJudgement(conn_obj, 10));


