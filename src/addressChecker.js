module.exports = function (requestUrl, pageData) {
	regexs = [];
	regexs.push(
		new RegExp(
			("^" + pageData.webAddress.replace(/\//g, "\\/") + "$"),
			"g"
		)
	);
	
	if (pageData.aliases) {
		pageData.aliases.forEach(function (alias) {
			regexs.push(
				new RegExp(
					("^" + alias.replace(/\//g, "\\/") + "$"),
					"g"
				)
			);
		});
	}

	let gotMatch = false;
	regexs.forEach(function (regex) {
		if (gotMatch) return;
		if (requestUrl.match(regex)) {
			gotMatch = true;
			return;
		};
	});

	return gotMatch;
}
