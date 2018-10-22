const mysql = require("mysql");
const mySqlConfig = require("../mySqlConfig.json");
var mySQLconnection;
function handleMySqlConnectionLoss() {
	mySQLconnection = mysql.createConnection(mySqlConfig);

	mySQLconnection.connect(function (err) {
		if (err) {
			console.log("Error when establishing MySQL connection: ", err);
			setTimeout(handleMySqlConnectionLoss, 2000);
		}
	});
	mySQLconnection.on('error', function(err){
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleMySqlConnectionLoss();
		} else {
			throw err;
		}
	});
}
handleMySqlConnectionLoss();
module.exports = mySQLconnection;