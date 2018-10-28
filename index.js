const logger = require("./src/logger.js");
logger.i("Entry", "Entry point");

logger.i("Init", "Acquiring necessary modules");

logger.d("Init", "Acquiring `http`");
const http = require("http");
logger.d("Init", "Acquiring `fs`");
const fs = require("fs");
logger.d("Init", "Acquiring `path`");
const path = require("path");
logger.d("Init", "Acquiring `url`");
const urlLib = require("url");
logger.d("Init", "Acquiring `./src/responseSetting.js`");
const responseSetting = require("./src/responseSetting.js");
logger.d("Init", "Acquiring `./src/addressChecker.js`");
const addressChecker = require("./src/addressChecker.js");

logger.i("Init", "Loading server structure");
const serverStructure = require("./serverStructure.json");

logger.i("Init", "Acquiring API endpoint logic handlers");
for (var serverDataNum in serverStructure) {
	serverData = serverStructure[serverDataNum];
	for (var apiEndpointDataNum in serverData.apiEndpoints) {
		apiEndpointData = serverData.apiEndpoints[apiEndpointDataNum];
		logger.d("Init", `Acquiring API endpoint logic handler for ${apiEndpointData.acceptedMethod} ${apiEndpointData.webAddress}`);
		apiEndpointData.logicHandler = require(apiEndpointData.logicHandler); // require the API endpoint logic handlers before use
	};
};

logger.i("Init", "Establishing MySQL connection");
const mySQLconnection = require("./src/mySQLconnection.js");

logger.i("Init", "Generating secret key for JSON Web Token");
const JWTsecret = require("./src/JWTsecret.js");


serverStructure.forEach(function (serverData) {
	function serverFunction(request, response) {
		let responseSent = false;
		let fullHeaders = Object.assign(urlLib.parse(request.url, true).query, request.headers);
		let truncatedUrl = request.url.split("?")[0].replace(/\/$/, "");

		if (responseSent) return;

		// Logic for API endpoints
		serverData.apiEndpoints.forEach(function (apiEndpointData) {

			if (responseSent) return;

			if (addressChecker(truncatedUrl, apiEndpointData)) {

				if (request.method == apiEndpointData.acceptedMethod) {

					apiEndpointData.logicHandler(request, fullHeaders, response, truncatedUrl);
					responseSent = true;
					return;

				} else {
					let anotherUniteratedRequestTypeExists = false;
					serverData.apiEndpoints.forEach(function (possibleDuplicateApiEndpointData) { // iterate through the API pages again to find a potential match
						if (anotherUniteratedRequestTypeExists) return;
						if (responseSent) return;

						if (possibleDuplicateApiEndpointData != apiEndpointData) { // make sure it's not the current one
							if (serverData.apiEndpoints.indexOf(possibleDuplicateApiEndpointData) > serverData.apiEndpoints.indexOf(apiEndpointData)) { // make sure it's not already been iterated through
								if (truncatedUrl == possibleDuplicateApiEndpointData.webAddress || possibleDuplicateApiEndpointData.aliases.indexOf(truncatedUrl) > -1) { // if there's a match
									anotherUniteratedRequestTypeExists = true;
									return;
								}
							}
						}

						if (anotherUniteratedRequestTypeExists) {
							let responseJSON = {};
							responseJSON.success = false;
							responseJSON.status = 400;
							responseJSON.message = "Incorrect HTTP method used.";
							responseSetting.setResponseFullJSON(response, responseJSON);
							responseSent = true;
						}
					});
				}
			}
		});
		if (responseSent) return;

		serverData.staticServing.forEach(function (staticPageData) { // server static pages to users
			if (responseSent) return;

			if (addressChecker(truncatedUrl, staticPageData)) {

				let staticPath = path.join(__dirname, staticPageData.localResponseFile);
				if (fs.existsSync(staticPath)) { // if the file exists
					let staticPageResponseContent = fs.readFileSync(staticPath).toString(); // read from file

					for (var fragmentName in staticPageData.fragments) { // file may be split into fragments
						fragmentPath = staticPageData.fragments[fragmentName];

						if (fs.existsSync(fragmentPath)) { // if fragment exists

							let fragmentContent = fs.readFileSync(fragmentPath).toString(); // read content of fragment
							staticPageResponseContent = staticPageResponseContent.replace(`<@${fragmentName}>`, fragmentContent); // place fragment in full file
						
						} else { // no such fragment exists
							staticPageResponseContent = staticPageResponseContent.replace(`<@${fragmentName}>`, ""); // remove snippet from code
						}
					}
					responseSetting.setResponseHeader(response, 200, 'text/html');
					response.write(staticPageResponseContent);
					response.end();
					responseSent = true;
				}
			}
		});
		if (responseSent) return;


		if (!responseSent) { // none of the iterated pages matches the request URL, 404 not found
			responseSetting.setResponseFullHTML(response, 404);
			return response.end();
		} else { // error handling; it is said that a response can be sent but it hasn't already
			let responseJSON = {};
			responseJSON.success = false;
			responseJSON.status = 500;
			responseJSON.message = "Internal server failure.";
			responseSetting.setResponseFullJSON(response, responseJSON);
			return response.end();
		}
	}
	serverData.activePorts.forEach(function (port) {
		newHttpServer = http.createServer(serverFunction);
		newHttpServer.listen(port);
		newHttpServer.on('error', function (e) {
			console.log("Server error: ");
			console.log(e.toString());
		});
		console.log("Listening on port " + port);
	});
});

process.on('uncaughtException', (e) => {
	logger.e("Unknown", "Uncaught process exception", e);
});

throw(new Error("reeeee"));