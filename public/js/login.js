var scrypt = scrypt_module_factory();

$(document).ready( function() {


	$("#submitLogin").mousedown(function() {
		//$("#submitLogin").html("REQUESTING..")
	});

	$("#submitLogin").click( function() {
		$('#submitLogin').prop('disabled', true);
		$('#submitLogin').css('background', "none");
		$('#submitLogin').css('color', "rgba(255,255,255,1)");
		$("#submitLogin").html("REQUESTING SALT...")

		$.ajax({
		    url: '/api/login', 
		    type: 'POST', 
		    contentType: 'application/json', 
		    data: JSON.stringify({"request": "salt"}) }
		).done(function( salt ) {
			console.log(salt)
			$("#submitLogin").html("ENCRYPTING...")
			var p = $("#password").val();
			var enc = hash(p, salt);
			console.log(enc);
			
			$.ajax({url:'/api/login', type:'POST', contentType: 'application/json', data: JSON.stringify({"request":"login","hash": enc})}).done( function(result) {
				console.log(result)
				if (result == "success") {
					$('#submitLogin').css('color', "#fff");
					$('#submitLogin').css('background', "#7abb17");
					$("#submitLogin").html("SUCCESS")
					window.location.replace("/");
				} else {
					$('#submitLogin').css('color', "#fff");
					$('#submitLogin').css('background', "#f0491f");
					$("#submitLogin").html("ERROR")

					$('#submitLogin').prop('disabled', false);
				}
			})

			
		});
		

	})

});


function hash(input, salt) {
	var encrypted = scrypt.crypto_scrypt(scrypt.encode_utf8(input), scrypt.encode_utf8(salt), 16384, 8, 1, 32);
	return scrypt.to_hex(encrypted)
}