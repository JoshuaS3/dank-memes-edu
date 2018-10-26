const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");

module.exports = function(request, fullHeaders, response) {
	let responseJSON = {};

	let count = parseInt(fullHeaders['count']);
	if (count.toString() == 'NaN') {
		count = 10;
	}
	if (count > 100) {
		count = 100;
		responseJSON.message = "Response limited to 100 results";
	}

	let query = "SELECT id FROM joshuas3.images ORDER BY dateAdded DESC LIMIT ?"
	mySQLconnection.query(query, [count], function(err, results) {
		if (err) {
			responseJSON.status = "error";
			responseJSON.message = err.toString();
			responseJSON.code = 400;
			responseSetting.setResponseFullJSON(response, 400, responseJSON);
			return;
		}
		let listOfIds = [];
		results.forEach(function (row) {
			listOfIds.push(row.id);
		});
		responseJSON.status = "success";
		responseJSON.code = 200;
		responseJSON.data = {};
		responseJSON.data.ids = listOfIds;

		responseSetting.setResponseFullJSON(response, 200, responseJSON);
		return;
	});
}