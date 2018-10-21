const responseSetting = require("../../responseSetting.js");

module.exports = function(request, headers, response, mySQLconnection) {
	let count = parseInt(headers['count']);
	if (count.toString() == 'NaN') {
		let htmlCode = 400;
		responseSetting.setResponseFullHTML(response, htmlCode);
		response.end();
		return true;
	}
	if (count > 100) {
		let htmlCode = 400;
		responseSetting.setResponseFullHTML(response, htmlCode);
		response.end();
		return true;
	}

	let query = "SELECT * FROM joshuas3.images ORDER BY dateAdded DESC LIMIT ?"
	mySQLconnection.query(query, [count], function(err, results) {
		if (err) {
			let htmlCode = 400;
			responseSetting.setResponseFullHTML(response, htmlCode);
			response.end();
			return true;
		}
		let listOfIds = [];
		results.forEach(function (row) {
			listOfIds.push(row.id);
		});

		response.writeHead(200, 'application/json');
		response.write(JSON.stringify(listOfIds));
		response.end();
		return true;
	});
}