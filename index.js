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
const fs = acquire("fs");
const path = acquire("path");
const urlLib = acquire("url");
const md5 = acquire("md5");
const responseSetting = acquire("./src/responseSetting.js");
const addressChecker = acquire("./src/addressChecker.js");

logger.i("Init", "Loading server structure");
const serverStructure = require("./serverStructure.json");
