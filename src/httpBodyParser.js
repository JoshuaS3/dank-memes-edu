const qs = require("querystring");
const responseSetting = require("./responseSetting.js");

module.exports = function (request, responseJSON, callback) {
	let responseSent = false;
	let body = ""

	request.on('data', (chunk) => {
		if (responseSent) return;
		if (body > 2.1e7) { // 21MB
			let responseJSON = {};
			responseJSON.success = false;
			responseJSON.code = 413;
			responseJSON.message = "Payload too large";
			responseSetting.setResponseFullJSON(response, responseJSON);
			responseSent = true;
			return;
		}
		body += chunk;
	})


	request.on('end', () => {
		body = qs.parse(body);
		callback(body);
	});

	return;
}