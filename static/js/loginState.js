function checkLoginState(callback) {
	let xmlHTTP = new XMLHttpRequest();
	let url = "/api/accounts/state";

	xmlHTTP.onreadystatechange = function() {
		if (this.readyState == 4) {
			let loginState = JSON.parse(this.responseText);
			callback(loginState);
		}
	}
	xmlHTTP.open("GET", url, true);
	xmlHTTP.send();
}
