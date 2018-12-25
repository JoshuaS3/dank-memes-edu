const logger = require("./src/logger.js");
logger.i("Process", "Entry point");
logger.i("Process", `Running Node.JS version ${process.version} on ${process.platform} ${process.arch}`);
logger.i("Process", `Process ID: ${process.pid}`);

function acquire(module) {
	logger.i("Init", `Acquiring \`${module}\``);
	return require(module);
}

logger.i("Init", "Acquiring necessary modules");

const http = acquire("http");
const subdomainTypeHandler = acquire("./src/subdomainTypeHandler.js");

logger.i("Init", "Loading server structure");
const serverStructure = require("./serverStructure.json");

logger.i("Init", "Establishing MySQL connection");
const mySQLconnection = require("./src/mySQLconnection.js");

logger.i("Init", "Generating secret key for JSON Web Token");
const JWTsecret = require("./src/JWTsecret.js");


serverStructure.forEach(function (subdomain) {

	if (!subdomain.port) return;
	if (!subdomain.type) return;

	let on_connect = subdomainTypeHandler(subdomain);
	if (!on_connect) {
		logger.w(`The subdomain at port ${subdomain.port} has incorrect configuration`);
		return;
	}

	let newHttpServer = http.createServer(on_connect);
	newHttpServer.listen(subdomain.port);
	newHttpServer.on('close', function () {
		logger.i("Server", "HTTP server closed");
	});
	process.on('beforeExit', () => {
		if (newHttpServer.listening) newHttpServer.close();
	});
	logger.i("Server", `Listening on port ${subdomain.port}`);
});

process.on('uncaughtException', (e) => {
	logger.e("Unknown", "Uncaught process exception", e);
});

process.on('beforeExit', (code) => {
	console.log(code);
	logger.write();
});

logger.write();
