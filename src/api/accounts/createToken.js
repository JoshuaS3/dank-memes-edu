const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const jwt = require("jsonwebtoken");
const JWTsecret = require("../../JWTsecret.js");
const md5 = require("md5");
const uuidv4 = require("uuid/v4");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};
	responseJSON.success = true;
	responseJSON.status = 200;
	let allowCreationToken = jwt.sign(
		{
			accountCreation: true,
			exp: Math.floor(Date.now() / 1000) + 3600,
			uuid: uuidv4()
		},
		JWTsecret
	)
	responseJSON.data = allowCreationToken;
	responseSetting.setResponseFullJSON(response, responseJSON);
}