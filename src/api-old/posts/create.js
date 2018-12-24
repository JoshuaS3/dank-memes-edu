const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");
const md5 = require("md5");
const uuidv4 = require("uuid/v4");
const jwt = require("../../JWTsecret.js");
const cookie = require("cookie");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	logger.v("PostsCreate", "Processing request to create a new post");

	let cookies = cookie.parse(fullHeaders.cookie || "");
	if (!cookies.authToken) {
		responseJSON.success = false;
		responseJSON.status = 400;
		responseJSON.message = "Not signed in";
		logger.v("PostsCreate", "Request to create a new post denied for not being signed in");
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	}

	httpBodyParser(request, responseJSON, function(body) {
		let imageid = body.imageid;
		let title = body.title;

		jwt.verify(cookies.authToken, function(err, decoded) {
			if (err) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "Not signed in";
				logger.v("PostsCreate", "Request to create a new post denied for not being signed in");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			if (!imageid) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "Parameter `imageid` is required"
				logger.v("PostsCreate", "Request to create a new post denied for not supplying an imageid");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			if (!title) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "Parameter `title` is required"
				logger.v("PostsCreate", "Request to create a new post denied for not supplying a title");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			if (title.length > 120) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "Parameter `title` is longer than 120 characters"
				logger.v("PostsCreate", "Request to create a new post denied for giving a title longer than 120 characters");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}

			let dateCreated = new Date();
			let id = md5((title + decoded.userId + imageid + uuidv4()).toString('hex'));

		    let query = "INSERT INTO `joshuas3`.`posts` SET ? ";
		    let values = {
		    	id: id,
		    	uid: decoded.userId,
		    	imageid: imageid,
		    	dateCreated: dateCreated,
		    	title: title
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
		    	logger.v("PostsCreate", "Request to create a new post processed");
		    	responseSetting.setResponseFullJSON(response, responseJSON);
		    });
	    });
	});
}