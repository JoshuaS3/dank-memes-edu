const mysql = require("mysql");
const logger = require("./logger.js");
const mySqlConfig = require("../mySqlConfig.json");
logger.d("MySQL", "Creating connection pool");
var pool = mysql.createPool(mySqlConfig);


module.exports = {
	query: function(){
		var sql_args = [];
		var args = [];
		for(var i=0; i<arguments.length; i++){
			args.push(arguments[i]);
		}
		var callback = args[args.length-1];
		logger.vv("MySQL", "Attempting connect to server");
		pool.getConnection(function(err, connection) {
			if(err) {
				logger.e("MySQL", "Connection error", err);
				return callback(err);
			}
			logger.vv("MySQL", "Connected to server");
			if(args.length > 2){
				sql_args = args[1];
			}
			logger.v("MySQL", `Attempting query ${args[0]}`);
			connection.query(args[0], sql_args, function(err, results) {
				logger.vv("MySQL", "Releasing connection");
				connection.release();
				if(err){
					logger.e("MySQL", "Query error", err);
					return callback(err);
				}
				logger.v("MySQL", "Query success");
				callback(null, results);
			});
		});
	}
}