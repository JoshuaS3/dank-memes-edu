const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const md5 = require("md5");
const uuidv4 = require("uuid/v4");

module.exports = function(request, fullHeaders, response, responseJSON) {
	let content = fullHeaders['content'].substr(0, 280); // cap at 280 chars
	if (content == "") {
		responseJSON.status = "fail";
		responseJSON.code = 400;
		responseJSON.message = "`content` cannot be an empty string.";
		responseSetting.setResponseFullJSON(response, 400, responseJSON);
		return true;
	}
	let severity = fullHeaders['severity'] || 3; // 3 = INFO, default level

	// get expiration date and convert to MySQL format
	let now = new Date();
	now.setDate(now.getDate() + 1); // a day from now, default
	let expirationDate = (fullHeaders['expirationDate'] || now).toISOString().slice(0, 19).replace('T', ' ');

	let alertHash = md5((content + severity + expirationDate + uuidv4()).toString('hex'));

    let query = "INSERT INTO `joshuas3`.`alerts` SET ? ";
    let values = {
    	id: alertHash,
    	content: content,
    	severity: severity,
    	expirationDate: expirationDate,
    	timeAdded: now.toISOString().slice(0, 19).replace('T', ' ')
    }
    mySQLconnection.query(query, values, function(err) {
    	if (err) {
    		responseJSON.status = "error";
			responseJSON.code = 500;
			responseJSON.message = err.toString();
			responseSetting.setResponseFullJSON(response, 500, responseJSON);
			return true;
    	}
    	responseJSON.status = "success";
    	responseJSON.code = 200;
    	responseJSON.data = values;
    	responseSetting.setResponseFullJSON(response, 200, responseJSON);
    });
}