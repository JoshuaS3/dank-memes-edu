const logger = require("./src/logger.js");
logger.i("Process", "Entry point");
logger.i("Process", `Running Node.JS version ${process.version} on ${process.platform} ${process.arch}`);
logger.i("Process", `Process ID: ${process.pid}`);

logger.i("Init", "Acquiring necessary modules");

logger.i("Init", "Acquiring `http`");
const http = require("http");
logger.i("Init", "Acquiring `fs`");
const fs = require("fs");
logger.i("Init", "Acquiring `path`");
const path = require("path");
logger.i("Init", "Acquiring `url`");
const urlLib = require("url");
logger.i("Init", "Acquiring `md5`");
const md5 = require("md5");
logger.i("Init", "Acquiring `./src/responseSetting.js`");
const responseSetting = require("./src/responseSetting.js");
logger.i("Init", "Acquiring `./src/addressChecker.js`");
const addressChecker = require("./src/addressChecker.js");

logger.i("Init", "Loading server structure");
const serverStructure = require("./serverStructure.json");

logger.i("Init", "Acquiring API endpoint logic handlers");
for (let serverDataNum in serverStructure) {
	let serverData = serverStructure[serverDataNum];
	for (let apiEndpointDataNum in serverData.apiEndpoints) {
		let apiEndpointData = serverData.apiEndpoints[apiEndpointDataNum];
		logger.d("Init", `Grabbing the logic handler for ${apiEndpointData.acceptedMethod.toUpperCase() + " " + apiEndpointData.webAddress} in the server structure`);
		apiEndpointData.logicHandler = require(apiEndpointData.logicHandler); // require the API endpoint logic handlers before use
	};
};

logger.i("Init", "Hashing server structure");
for (let serverDataNum in serverStructure) {
	let serverData = serverStructure[serverDataNum];
	for (let apiEndpointDataNum in serverData.apiEndpoints) {
		let apiEndpointData = serverData.apiEndpoints[apiEndpointDataNum];
		let toHash = apiEndpointData.acceptedMethod.toUpperCase() + " " + apiEndpointData.webAddress;
		logger.d("Init", `Hashing ${toHash} in the server structure`);
		let hashedApiEndpointUrl = md5(toHash);
		serverData.apiEndpoints[hashedApiEndpointUrl] = apiEndpointData;
		if (apiEndpointData.aliases) {
			apiEndpointData.aliases.forEach(function (alias) {
				toHash = apiEndpointData.acceptedMethod.toUpperCase() + " " + alias;
				logger.d("Init", `Hashing ${toHash} in the server structure`);
				hashedApiEndpointUrl = md5(toHash);
				serverData.apiEndpoints[hashedApiEndpointUrl] = apiEndpointData;
			});
		}
	}
	for (let staticPageDataNum in serverData.staticServing) {
		let staticPageData = serverData.staticServing[staticPageDataNum];
		let toHash = "GET " + staticPageData.webAddress;
		logger.d("Init", `Hashing ${toHash} in the server structure`);
		let hashedStaticPageUrl = md5(toHash);
		serverData.staticServing[hashedStaticPageUrl] = staticPageData;
		if (staticPageData.aliases) {
			staticPageData.aliases.forEach(function (alias) {
				toHash = "GET " + staticPageData.webAddress;
				logger.d("Init", `Hashing ${toHash} in the server structure`);
				hashedStaticPageUrl = md5(toHash);
				serverData.staticServing[hashedStaticPageUrl] = staticPageData;
			});
		}
	}
}


logger.i("Init", "Establishing MySQL connection");
const mySQLconnection = require("./src/mySQLconnection.js");

logger.i("Init", "Generating secret key for JSON Web Token");
const JWTsecret = require("./src/JWTsecret.js");


serverStructure.forEach(function (serverData) {
	function serverFunction(request, response) {
		let responseSent = false;
		let truncatedUrl = request.url.split("?")[0].replace(/\/$/, "");
		let url = request.method.toUpperCase() + " " + truncatedUrl;
		logger.d("Request", `Request made by ${request.connection.remoteAddress} at ${url}`);
		logger.v("Request", `Request made by ${request.connection.remoteAddress} at ${url} headers: ${JSON.stringify(request.headers)}`);
		let fullHeaders = Object.assign(urlLib.parse(request.url, true).query, request.headers);
		hashedUrl = md5(url);

		// Logic for API endpoints
		if (serverData.apiEndpoints[hashedUrl]) {
			let apiEndpointData = serverData.apiEndpoints[hashedUrl];
			apiEndpointData.logicHandler(request, fullHeaders, response, truncatedUrl);
			responseSent = true;
			logger.d("Response", `Responded to request made by ${request.connection.remoteAddress} at ${url}`);
			return;
		} else {
			serverData.apiEndpoints.forEach(function (apiEndpointData) {

				if (responseSent) return;

				if (addressChecker(truncatedUrl, apiEndpointData)) {

					if (request.method == apiEndpointData.acceptedMethod) {

						apiEndpointData.logicHandler(request, fullHeaders, response, truncatedUrl);
						responseSent = true;
						logger.d("Response", `Responded to request made by ${request.connection.remoteAddress} at ${url}`);
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
								logger.v("Response", "Incorrect HTTP method used, returned 400");
							}
						});
					}
				}
			});
		}
		if (responseSent) return;

		if (serverData.staticServing[hashedUrl]) {
			let staticPageData = serverData.staticServing[hashedUrl];
			let staticPath = path.join(__dirname, staticPageData.localResponseFile);
			if (fs.existsSync(staticPath)) { // if the file exists
				let staticPageResponseContent;
				if (staticPageData.binary) {
					staticPageResponseContent = fs.readFileSync(staticPath); // read from file
				} else {
					staticPageResponseContent = fs.readFileSync(staticPath).toString(); // read from file
				}

				if (staticPageData.fragments && !staticPageData.binary) {
					for (var fragmentName in staticPageData.fragments) { // file may be split into fragments
						fragmentPath = staticPageData.fragments[fragmentName];

						if (fs.existsSync(fragmentPath)) { // if fragment exists

							let fragmentContent = fs.readFileSync(fragmentPath).toString(); // read content of fragment
							staticPageResponseContent = staticPageResponseContent.replace(`<@${fragmentName}>`, fragmentContent); // place fragment in full file
						
						} else { // no such fragment exists
							staticPageResponseContent = staticPageResponseContent.replace(`<@${fragmentName}>`, ""); // remove snippet from code
						}
					}
				}
				responseSetting.setResponseHeader(response, 200, staticPageData.mime);
				logger.d("Response", `Responded to request made by ${request.connection.remoteAddress} at ${url}`);
				if (staticPageData.binary) {
					response.end(staticPageResponseContent, 'binary');
				} else {
					response.write(staticPageResponseContent);
					response.end();
				}
				responseSent = true;
				return;
			}
		} else {
			serverData.staticServing.forEach(function (staticPageData) { // server static pages to users
				if (responseSent) return;

				if (addressChecker(truncatedUrl, staticPageData)) {

					let staticPath = path.join(__dirname, staticPageData.localResponseFile);
					if (fs.existsSync(staticPath)) { // if the file exists
						let staticPageResponseContent;
						if (staticPageData.binary) {
							staticPageResponseContent = fs.readFileSync(staticPath); // read from file
						} else {
							staticPageResponseContent = fs.readFileSync(staticPath).toString(); // read from file
						}

						if (staticPageData.fragments && !staticPageData.binary) {
							for (var fragmentName in staticPageData.fragments) { // file may be split into fragments
								fragmentPath = staticPageData.fragments[fragmentName];

								if (fs.existsSync(fragmentPath)) { // if fragment exists

									let fragmentContent = fs.readFileSync(fragmentPath).toString(); // read content of fragment
									staticPageResponseContent = staticPageResponseContent.replace(`<@${fragmentName}>`, fragmentContent); // place fragment in full file
								
								} else { // no such fragment exists
									staticPageResponseContent = staticPageResponseContent.replace(`<@${fragmentName}>`, ""); // remove snippet from code
								}
							}
						}
						responseSetting.setResponseHeader(response, 200, staticPageData.mime);
						logger.d("Response", `Responded to request made by ${request.connection.remoteAddress} at ${url}`);
						if (staticPageData.binary) {
							response.end(staticPageResponseContent, 'binary');
						} else {
							response.write(staticPageResponseContent);
							response.end();
						}
						responseSent = true;
					}
				}
			});
		}
		if (responseSent) return;


		if (!responseSent) { // none of the iterated pages matches the request URL, 404 not found
			logger.d("Response", `Responded to request made by ${request.connection.remoteAddress} at ${hashedUrl} with error 404`);
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
		newHttpServer.on('close', function () {
			logger.i("Server", "HTTP server closed");
		});
		process.on('beforeExit', () => {
			if (newHttpServer.listening) newHttpServer.close();
		});
		logger.i("Server", "Listening on port " + port);
	});
});

process.on('uncaughtException', (e) => {
	logger.e("Unknown", "Uncaught process exception", e);
});

process.on('beforeExit', (code) => {
	console.log(code);
	logger.write();
});

logger.write();