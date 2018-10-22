const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");

module.exports = function(request, fullHeaders, response, responseJSON) {
	let imageHashValue = fullHeaders['h'];

	// check to make sure the hash is a proper MD5 hash
	let properHeaderRegex = /^[0-9A-Fa-f]{32}$/g;
	if (!imageHashValue.match(properHeaderRegex)) {
		let htmlCode = 400;
		responseSetting.setResponseFullHTML(response, htmlCode);
		response.end();
		return true;
	}


	let query = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
	mySQLconnection.query(query, [imageHashValue], function (err, result) {
		if (err) // if it got past the regex, this is a SQL error
		{
			let htmlCode = 500;
			responseSetting.setResponseFullHTML(response, htmlCode);
			return true;
		}
		if (result == '') {
			let htmlCode = 400;
			responseSetting.setResponseFullHTML(response, htmlCode);
			return true;
		}

		let htmlCode = 200;
		responseSetting.setResponseHeader(response, htmlCode, result[0].mime);
		response.end(result[0].image, 'binary');
		return true;
	});
}