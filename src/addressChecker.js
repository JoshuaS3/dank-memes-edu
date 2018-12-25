module.exports = function (requestAddress, checkAddress) {
	regex = 
		new RegExp(
			("^" + checkAddress.replace(/\//g, "\\/") + "$"),
			"g"
		);

	return requestAddress.match(regex);
}
