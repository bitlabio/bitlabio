//HTML FRONTEND
var user = {}
var wallet = {}
wallet.balance = "0.000"
wallet.txs = []

var workers = []

//var socket = io('http://bitlab.io:3001');
var socket = io('http://bitlab.io:3001');

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





var updateUser = function() {
    console.log("updating user")
    $.ajax({
        url: '/api/user', 
        type: 'GET', 
        contentType: 'application/json', 
        data: JSON.stringify({}) }
        ).done(function( userdata ) {
            user = userdata
            console.log(user)
            bitcoinUpdateBalance(user.walletaddress)
        });
}


var bitcoinUpdateBalance = function(walletaddress) {
    console.log("updating balance")
    // DEPREC: https://blockchain.info/rawaddr/1EgsQ28DHSdrhHgK2ZJVYU4747nFBYxzab

    // http://localhost/api/blockr/address/balance/1EgsQ28DHSdrhHgK2ZJVYU4747nFBYxzab
    // http://localhost/api/blockr/address/txs/1EgsQ28DHSdrhHgK2ZJVYU4747nFBYxzab
    $.ajax({
        url: '/api/blockr/address/balance/'+walletaddress, 
        type: 'GET', 
        contentType: 'application/json'}
    ).done(function( addressdata ) {
        console.log("balance:")
        var parsed = JSON.parse(addressdata)
        console.log(parsed)
        wallet.balance = parsed.data.balance
        $("#balance").html( wallet.balance )
    });
}








var render = function() {
    $("#alias").html(user.alias)
    $("#walletaddress").html(`<a href="https://blockchain.info/address/`+user.walletaddress+`">`+user.walletaddress+`</a>`)
            
	
	$(`#workerListHeading`).html(workers.length+" worker nodes")

	var workerHtml = ``
	for (var w in workers) {
		workerHtml += ``+workers[w].workername+`<br>socketid:`+workers[w].socketid+` <br>rate: `+workers[w].rate+`<br>last activity: `+moment(workers[w].timestamp).fromNow()+`<br><hr>`
	}

	$(`#workerlist`).html(workerHtml)


}

setInterval(render, 1000);

/******* FILE UPLOADER **///

var step2 = function(job) {
    $("#tabstep1").removeClass("tabactive")
    $("#tabstep1").addClass("tabinactive")
    $("#windowstep1").hide();
    $("#tabstep2").removeClass("tabinactive")
    $("#tabstep2").addClass("tabactive")
    $("#windowstep2").show();

    //$("#windowstep2").append(job+"<br>")

    //var setupform = JSON.stringify(job)+"<br>"

    var setupform = "JOB: "+job.file+" (#"+job.jobnum+") <br>"
    setupform += `Render from frame <input type="text" value="1"> to <input type="text" value="10"> <button>render</button>`
    setupform += `<hr>`

    $("#windowstep2").append(setupform)

}

var step3 = function() {
    $("#tabstep1").removeClass("tabactive")
    $("#tabstep1").addClass("tabinactive")
    $("#windowstep1").hide();    
    $("#tabstep2").removeClass("tabactive")
    $("#tabstep2").addClass("tabinactive")
    $("#windowstep2").hide();
    $("#tabstep3").removeClass("tabinactive")
    $("#tabstep3").addClass("tabactive")
    $("#windowstep3").show();
}


$(document).ready( function () {
    

    updateUser();

	console.log("loading upload code...")


    var files = Array()
    var queue = Array()

    $(window).bind('beforeunload', function(){
        if (queue.length==0) 
            return;

        return 'There are still ' + queue.length + ' files being uploaded.';
    });

    function upload(file) {
        $('.browse').addClass('uploading');

        var li = $('<li style="clear:both;"/>');

        li.append($('<div><div class="upload-progress"><span></span><div class="bar" style="width:0%;">####################################################</div></div><p>Uploading... ' + file.name + '</p></div>'));
        $(li).appendTo($('.queue'));

        var xhr = new XMLHttpRequest();

        var lastdata = 0
        var lasttime = Date.now()
        xhr.upload.addEventListener("progress", function(e) {
        	var now = Date.now();
        	var datasent = (e.loaded - lastdata)
        	var speed = datasent/(now-lasttime)
        	var speedformat = Math.round(speed)
        	lasttime = now
        	lastdata = e.loaded
            var pc = parseInt((e.loaded / e.total * 100));
            $('.upload-progress', $(li)).show();
            $('.upload-progress .bar', $(li)).css('width', pc + "%");
            $('.upload-progress span  ', $(li)).empty().append(pc + "% " + "speed: "+ speedformat + "kB/sec" );

        }, false);

        xhr.onreadystatechange = function(e) {
            if (xhr.readyState == 4) {
                /*            $('.upload-progress', $(li)).hide();*/
                $('#web').addClass('uploading');
                // progress.className = (xhr.status == 200 ? "success" : "failure");
                if (xhr.status == 200) {
                    $(li).html('<a target="_blank" href="' + xhr.responseText + '">' + xhr.responseText + '</a>');
                    var serverResponse = JSON.parse(xhr.responseText)
                    step2(serverResponse);

                } else {
                    $(li).html('<span>Error (' + xhr.status + ') during upload of file ' + file.name + '</span>');
                }

                // file uploaded successfully, remove from queue
                var index = queue.indexOf(xhr);
                if (index > -1) {
                    queue.splice(index, 1);
                }

                files.push(URI(xhr.responseText.replace("\n", "")).path());

                /*
                $(".download-zip").attr("href", URI("(" + files.join(",") + ").zip").absoluteTo(location.href).toString());
                $(".download-tar").attr("href", URI("(" + files.join(",") + ").tar.gz").absoluteTo(location.href).toString());
                $(".all-files").addClass('show');
                */
            }
        };

        // should queue all uploads. 
        queue.push(xhr);

        // start upload
        xhr.open("PUT", '/bitblender/upload/' + file.name, true);
        xhr.setRequestHeader("X_FILENAME", file.name);
        xhr.send(file);
    };

    $(document).bind("dragenter", function(event) {
        event.preventDefault();
    }).bind("dragover", function(event) {
        console.log("dragOver")
        event.preventDefault();
        // show drop indicator
        $('#terminal').addClass('dragged');
        $('#web').addClass('dragged');
    }).bind("dragleave", function(event) {
        $('#terminal').removeClass('dragged');
        $('#web').removeClass('dragged');
    }).bind("drop dragdrop", function(event) {
        var files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files;

        $.each(files, function(index, file) {
            upload(file);
        });

        event.stopPropagation();
        event.preventDefault();
    });

    $('a.browse').on('click', function(event) {
        $("input[type=file]").click();
        return (false);
    });


    $('input[type=file]').on('change', function(event) {
        $.each(this.files, function(index, file) {
            if (file instanceof Blob) {
                upload(file);
            }
        });
    });   

    



}); //END .ready

