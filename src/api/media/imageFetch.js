const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const qs = require("querystring");

module.exports = function(request, fullHeaders, response, body, truncatedUrl) {
	let responseJSON = {};
	body = qs.parse(body);

	let tryUrlParse = truncatedUrl.match(/\/[0-9A-Fa-f]{32}/g) ? true : false;
	let imageHashValue = fullHeaders.h || (tryUrlParse ? truncatedUrl.match(/[0-9A-Fa-f]{32}/g)[0] : false) || body.h;

	if (!imageHashValue) {
		responseJSON.success = false;
		responseJSON.status = 400;
		responseJSON.message = "Required payload `h` not present";
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	}
	if (!imageHashValue.match(/^[0-9A-Fa-f]{32}$/g)) {
		responseJSON.success = false;
		responseJSON.status = 400;
		responseJSON.message = "Improper hash format";
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	}


	let query = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
	mySQLconnection.query(query, [imageHashValue], function (err, result) {
		if (err)
		{
			responseJSON.success = false;
			responseJSON.status = 500;
			responseJSON.message = err.toString();
			responseSetting.setResponseFullJSON(response, responseJSON);
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