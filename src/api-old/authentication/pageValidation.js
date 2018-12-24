const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const jwt = require("../../JWTsecret.js");
const md5 = require("md5");
const uuidv4 = require("uuid/v4");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};
	responseJSON.success = true;
	responseJSON.status = 200;
	let allowCreationToken = jwt.sign(
		{
			pageValidation: true,
			exp: Math.floor(Date.now() / 1000) + 3600,
			uuid: uuidv4()
		}
	)
	logger.v("Authentication", "New page validation token created");
	responseJSON.data = allowCreationToken;
	responseSetting.setResponseFullJSON(response, responseJSON);
}