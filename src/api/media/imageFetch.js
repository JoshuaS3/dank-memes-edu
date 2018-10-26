const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");

module.exports = function(request, fullHeaders, response) {
	let responseJSON = {};
	let imageHashValue = fullHeaders['h'];

	// check to make sure the hash is a proper MD5 hash
	let properHeaderRegex = /^[0-9A-Fa-f]{32}$/g;
	if (!imageHashValue.match(properHeaderRegex)) {
		responseJSON.status = "fail";
		responseJSON.code = 400;
		responseJSON.message = "Improper hash format";
		responseSetting.setResponseFullJSON(response, 400, responseJSON);
		return;
	}


	let query = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
	mySQLconnection.query(query, [imageHashValue], function (err, result) {
		if (err) // if it got past the regex, this is a SQL error
		{
			responseJSON.status = "error";
			responseJSON.code = 500;
			responseJSON.message = err.toString();
			responseSetting.setResponseFullJSON(response, 500, responseJSON);
			return;
		}
		if (result.length == 0) {
			responseSetting.setResponseFullHTML(response, 404);
			return true;
		}

		let htmlCode = 200;
		responseSetting.setResponseHeader(response, htmlCode, result[0].mime);
		response.end(result[0].image, 'binary');
		return true;
	});
}