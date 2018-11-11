const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const logger = require("./logger.js");

let pathToSecrets = path.join(__dirname, "../JWTsecrets.json");

function secretKeyGen() {
	var secretKey = "";
	var possibleChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[]\\{}|;':\",./<>?`~!@#$%^&*()-=_+\ ";
	for (var i = 0; i < 512; i++)
		secretKey += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
	let now = new Date();
	logger.d("JsonWebToken", "New secret key generated");
	return {secret: secretKey, dateCreated: now};
}

let secrets = JSON.parse(fs.readFileSync(pathToSecrets).toString());

const one_day = 1000 * 60 * 60 * 24;

function checkForOldSecrets() {
	logger.vv("JsonWebToken","Checking for old secrets");
	let now = new Date();
	for (var secretIndex in secrets) {
		secret = secrets[secretIndex];
		if ((now - secret.dateCreated) > one_day*30) {
			let position = secrets.indexOf(secret);
			secrets.slice(position, position);
			logger.d("JsonWebToken","Removed a secret key older than a month");
		}
	};
	if (secrets.length == 0) {
		secrets.unshift(secretKeyGen());
	}
	fs.writeFileSync(pathToSecrets, JSON.stringify(secrets));
}

function verify(data, callback) {
	checkForOldSecrets();
	
	let error = new Error('NoSecretError');
	error.name = 'NoSecretError';
	error.message = 'no secrets generated';
	error.date = new Date();
	let success = false;

	for (var secretIndex in secrets) {
		if (success) return;
		let secret = secrets[secretIndex];
		try {
			jwt.verify(data, secret.secret, function(err, verified) {
				if (err) {
					throw err;
				}
				logger.vv("JsonWebToken", "Successful verification");
				callback(null, verified); // no error caught, correct signature and payload
				success = true;
				return;
			});
		} catch (e) {
			if (e.name == "TokenExpiredError") { // correct signature, just an old token
				logger.vv("JsonWebToken", "TokenExpiredError");
				callback(e, null);
				return;
			}
			error = e;
		}
	};
	if (success) return;
	logger.vv("JsonWebToken", "JsonWebTokenError");
	callback(error, null);
}

function sign(data) {
	checkForOldSecrets();
	return jwt.sign(data, secrets[0].secret);
}


checkForOldSecrets();



module.exports = {
	verify: verify,
	sign: sign
};