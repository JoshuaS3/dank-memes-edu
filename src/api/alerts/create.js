const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");
const md5 = require("md5");
const uuidv4 = require("uuid/v4");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		let content = fullHeaders.content || body.content;

		if (!content) {
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = "Parameter `content` is required"
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}

		content = content.substr(0, 280); // cap at 280 chars

		if (content.length == 0) {
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = "Parameter `content` cannot be an empty string";
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		let severity = parseInt(fullHeaders.severity) || parseInt(body.severity) || 3; // 3 = INFO, default level

		// get expiration date and convert to MySQL format
		let tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1); // a day from now, default
		let expirationDate = (fullHeaders.expirationDate || body.expirationDate || tomorrow)//.toISOString().slice(0, 19).replace('T', ' ');

		let alertHash = md5((content + severity + expirationDate + uuidv4()).toString('hex'));

	    let query = "INSERT INTO `joshuas3`.`alerts` SET ? ";
	    let values = {
	    	id: alertHash,
	    	content: content,
	    	severity: severity,
	    	expirationDate: expirationDate,
	    	timeAdded: new Date()
	    }
	    mySQLconnection.query(query, values, function(err) {
	    	if (err) {
	    		responseJSON.success = false;
				responseJSON.status = 500;
				responseJSON.message = err.toString();
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
	    	}
	    	responseJSON.success = true;
	    	responseJSON.status = 200;
	    	responseJSON.data = values;
	    	responseSetting.setResponseFullJSON(response, responseJSON);
	    });
	});
}