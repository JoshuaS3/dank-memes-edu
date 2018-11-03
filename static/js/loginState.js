$(document).ready(function(){
	$.getJSON('/api/accounts/state', null, function(result) {
		var loginState = result;
	});
});
