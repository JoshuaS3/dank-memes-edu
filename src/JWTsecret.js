function secretKeyGen() {
	var secretKey = "";
	var possibleChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[]\\{}|;':\",./<>?`~!@#$%^&*()-=_+\ ";
	for (var i = 0; i < 512; i++)
		secretKey += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
	return secretKey;
}

module.exports = secretKeyGen();