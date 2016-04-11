// blockchain.info api for browsers

var blockchainListen = function(walletaddress, callback) {

	var connect = function() {
		var wsUri = "ws://ws.blockchain.info/inv";
		var websocket = new WebSocket(wsUri);
		
		websocket.onopen = function(e) { 
			var message = {}
			
			message.op = "addr_sub"
			message.addr = walletaddress
			
			//message.op = "unconfirmed_sub"

			websocket.send(JSON.stringify(message)); 
		};

		websocket.onclose = function(e)   { 
			connect();
		};

		websocket.onmessage = function(message) { callback(message) };
		websocket.onerror = function(err)   { console.log(err) };
	}

	connect();
}

