var render = function () {
	//console.log($("#topbannerContent").height())
}
	
function keydown(e) {
	render();
}

var posts = []

function renderPosts() {
	var postsHtml = ``;
	var counter = 0;
	for (var p in posts) {
		if (posts[p].page != 1) {
			//console.log(posts[p])
			if (counter == 0) { postsHtml +=  `<div class="row" style="">`; }
			counter++;
			postsHtml += `<div class="four columns" style="margin-bottom:20px;">`
			postsHtml += `<a href="/`+posts[p].slug+`" class="varela caps title">`
			postsHtml += `<div class="darkbg pad white blocklink">`
			postsHtml += posts[p].title
			postsHtml += `</div></a>`
			postsHtml += `</div>`

			if (counter == 3) { postsHtml +=  `</div>`; counter = 0; }
		}
		
	}
	$("#posts").html(postsHtml)
}

function sortDate(a, b){
 if (a.created_at < b.created_at) { return 1 } else { return -1}
}

$(document).ready( function() {

	$.ajax({
		    url: '/api/search', 
		    type: 'GET', 
		    contentType: 'application/json', 
		    data: ''}
		).done( function( data ) {
			console.log('recieved posts');
			posts = data;
			posts.sort(sortDate)
			renderPosts();
		});
		
		window.addEventListener( "resize", render);	
		window.addEventListener( "keydown", keydown);
		render();		
	})