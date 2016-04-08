//HTML FRONTEND

var workers = []

var socket = io('http://localhost:3001');

socket.emit('bitblenderwebconnect', {});

socket.on('workers', function (data) {

	workers = data
	render();
});

socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});

socket.on('bitblenderworkerconnect', function(worker) {
	console.log(worker)
})

var render = function() {

	
	$(`#workerListHeading`).html(workers.length+" worker nodes")

	var workerHtml = ``
	for (var w in workers) {
		workerHtml += ``+workers[w].workername+`<br>socketid:`+workers[w].socketid+` <br>rate: `+workers[w].rate+`<br>last activity: `+moment(workers[w].timestamp).fromNow()+`<br><hr>`
	}

	$(`#workerlist`).html(workerHtml)

}

setInterval(render, 1000);

onload = function() {
  console.log("loaded.")
  $("#controlleft").click( function () {
    console.log("left")
    socket.emit('message', { msg: 'left' });
  })

  $("#controlright").click( function () {
    console.log("right")
    socket.emit('message', { msg: 'right' });
  })
};
