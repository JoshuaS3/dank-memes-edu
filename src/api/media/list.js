const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");

module.exports = function(request, fullHeaders, response, truncatedUrl, body) {
	let responseJSON = {};

	let count = parseInt(fullHeaders.count) || body.count || 10;
	if (count > 100) {
		count = 100;
		responseJSON.message = "Response limited to 100 results";
	}

	let query = "SELECT id FROM joshuas3.images ORDER BY dateAdded DESC LIMIT ?"
	mySQLconnection.query(query, [count], function(err, results) {
		if (err) {
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = err.toString();
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		let listOfIds = [];
		results.forEach(function (row) {
			listOfIds.push(row.id);
		});
		responseJSON.success = true;
		responseJSON.status = 200;
		responseJSON.data = {};
		responseJSON.data.ids = listOfIds;

		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	});
}