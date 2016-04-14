// blockchain.info api for browsers

var blockchainListen = function(walletaddress, callback) {

	var connect = function() {
		var wsUri = "ws://ws.blockchain.info/inv";
		var websocket = new WebSocket(wsUri);
		
		websocket.onopen = function(e) { 
			var message = {}
			
			//subscribe to own account client side
			message.op = "addr_sub"
			message.addr = walletaddress
			
			//message.op = "unconfirmed_sub"

			websocket.send(JSON.stringify(message)); 
		};

		websocket.onclose = function(e)   { 
			//console.log("connection closed")
			connect();
		};

		websocket.onmessage = function(message) { 
			var parsed = JSON.parse(message.data);
			//console.log(parsed);
			callback(parsed)
		};

		websocket.onerror = function(err)   { console.log(err) };
	}

	connect();
}

