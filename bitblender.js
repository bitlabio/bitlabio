var bitblender = {version: 1, server:'http://localhost:3001'}
//var bitblender = {version: 1, server:'http://bitlab.io:3001'}

/* 
bitblender worker client
by bitlab.io - author: Rouan van der Ende

----------------------------------------------------------------------------
Copyright (c) 2016 bitlab.io

MIT License

Permission is hereby granted, free of charge, to any person obtaining a 
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
----------------------------------------------------------------------------


HOWTO:
========

Install needed nodejs packages:

# npm install socket.io-client 

Set your bitcoin recieve address below. This is where your earnings will be paid to.
If you set this wrong you wont get paid!!                     
 													*/

bitblender.workername = "rouanTestNode" 						// identifier
bitblender.bitcoin = "1B4Ve9dh4qfG1SqYSXiTtceJ95iv5Y3d3s"		// your wallet where you want to recieve payment
bitblender.rate = 0.00001  										// how many btc per frame you charge
bitblender.autowithdraw = 0.005  								// tells server to send when you've acquired atleast this amount (to minimize loss on fees)

/* 
 note: In future we will probably adjust the way rate works to be more fair in terms of processing time etc.

 now run it!
 # node --harmony bitblender.js

 done. sit back and earn btc

================================================================
DO NOT ALTER BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING!

*/

bitblender.state = "idle" 										
console.log("bitBlender v"+bitblender.version)

//var socket = require('socket.io-client')('http://bitlab.io:3001');
var socket = require('socket.io-client')(bitblender.server);

socket.emit('bitblenderworkerconnect', bitblender );

socket.on('message', function(data) {
	console.log("message from dispatch:")
  	console.log(data.msg)
})

socket.on('jobs', function(jobs) {
	console.log("JOBS:")
  	console.log(jobs)
})

socket.on('connect', function(data) {
	console.log("connected")
})

socket.on('disconnect', function(data) {
	console.log("Disconnected! Trying to reconnect...")
	socket.emit('bitblenderworkerconnect', bitblender ); //reconnect
  	//console.log(data.msg)
})

/* // RUNS BLENDER

var path = require('path')
var child_process = require('child_process');

var arguments = [
        '-b',
        'test.blend',
        '-o', 'test-#',
        '-f', 0
];

var t = path.resolve(__dirname, 'blender.app', 'Contents', 'MacOS', 'blender')

var child = child_process.spawn(t, arguments);

child.stdout.on('data', function(data) {
    console.log('data out: ', data.toString());
});
child.stderr.on('data', function(data) {
    console.error('error out: ',data);
});
child.on('close', function(code) {
    console.log('closing code: ' + code);
});

*/