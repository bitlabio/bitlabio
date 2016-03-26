var render = function () {
	//console.log($("#topbannerContent").height())
}
	
function keydown(e) {
	render();
}

var posts = []
var tags = []
var posts_tags = []

function findTagInfo(id) {
	console.log(".")
	var found = []
	for (var t in tags) {
		if (tags[t].id == id) {
			return tags[t]
		}
	}
}

function findTag(id) {
	console.log("!")
	var found = []
	for (var t in posts_tags) {
		if (posts_tags[t].post_id == id) {

			var tag = findTagInfo(posts_tags[t].tag_id)
			//found.push(posts_tags[t])
			found.push(tag)
		}
	}
	return found
}

var usedTags = []

function usedTagRecord(tag) {
	var found = 0;
	for (var t in usedTags) {
		if (usedTags[t].id == tag.id) { found++}
	}
	if (found == 0) { usedTags.push(tag); }
}

function renderPosts() {
	/* POST ARCHIVE ----------------------------------------------------------- */
	var postsHtml = ``;
	for (var p in posts) {
		if (posts[p].page != 1) {
			var tags = findTag(posts[p].id)
			console.log("found:")
			console.log(tags)
			//console.log(posts[p])
			postsHtml += `<div style="margin:0 0 10px 0; padding: 0;">`

			postsHtml += `<a href="/`+posts[p].slug+`" class="varela caps gray">`
			postsHtml += `<p style="font-size:12px; line-height: 105%; margin:0; padding: 0; ">`+posts[p].title+"</p></a>"

			postsHtml += `<p class="darkgray tiny caps" style="margin:0; padding: 0;line-height: -15px; ">`+moment(posts[p].created_at).fromNow()
			if (tags.length > 0) {
				for (var t in tags) {
					usedTagRecord(tags[t])
					postsHtml += `<a class="darkgray" href="">`+tags[t].name+`</a>`;	
					if (t != tags.length-1) { postsHtml += `, `; }
				}
			} 
			postsHtml += `</p>`
			
			postsHtml += `</div>`
		}
	}
	$("#posts").html(postsHtml)
	/* TAGS ----------------------------------------------------------- */
	var tagsHtml = ``;
	usedTags.sort(sortName)
	for (var t in usedTags) {
		tagsHtml += `<a href="/" class="gray" style="padding: 1px 3px 1px 3px; margin: 2px; display: inline-block; background: #000;">`+usedTags[t].name
		tagsHtml += `</a>`
		//if (t != usedTags.length-1) { tagsHtml += `,`; }
		
		
	}
	$("#tags").html(tagsHtml)
	
	/* MAIN POSTS ----------------------------------------------------------- */

	var mainPostsHtml = ``;
	var max = 3;
	if (max > posts.length) { max = posts.length - 1;}
	for (var p = 0; p < max; p++) {

mainPostsHtml += `<div class="bottomborder" style="margin-top:0px; padding-bottom: 60px; margin-bottom: 60px;">`

//META
mainPostsHtml += `<div class="row" style="margin-top:0px; margin-bottom: 0px;" >
<div id="sloganHolder" style="display: inline-block;">
<div class="varela gray" id="sloganBanner" style="background:rgb(0,0,0); letter-spacing: 0.025em; font-size: 12px; line-height: 2em; padding: 4px 12px 4px 12px; display: inline-block;" >`
mainPostsHtml += `Posted ` + moment(posts[p].created_at).fromNow()
var tags = findTag(posts[p].id)
if (tags.length > 0) {
mainPostsHtml += ` in `
for (var t in tags) {
usedTagRecord(tags[t])
mainPostsHtml += `<a class="darkgray" href="">`+tags[t].name+`</a>`;	
if (t != tags.length-1) { mainPostsHtml += `, `; }}} 
mainPostsHtml += `</div></div></div>`

//TITLE
mainPostsHtml += `<div class="row" style="margin-top:0px; margin-bottom: 40px;">
<span class="varela" style="color:rgb(40,40,40); text-transform: uppercase; background: #fff; letter-spacing: 0.025em; font-size: 22px; padding: 4px 12px 2px 12px;float:left;" >
`+posts[p].title+`</span></div>`


		mainPostsHtml += `<p class="gray" align="justify" style="font-size: 12px; hyphens: auto;">`+marked( posts[p].markdown )+`</p>`
	    mainPostsHtml += `</div>`

		
	}
	$("#mainposts").html(mainPostsHtml);
}

function sortName(a, b){
    if(a.name < b.name) return -1;
    if(a.name > b.name) return 1;
    return 0;
}

function sortDate(a, b){
 if (a.created_at < b.created_at) { return 1 } else { return -1}
}

function get_tags() {
	$.ajax({url: '/api/tags', type: 'GET', contentType: 'application/json', data: ''}).done( function( data ) { 
		tags = data;
		console.log("tags")
		console.log(tags)
		get_posts_tags();
	});	
}

function get_posts_tags() {
	$.ajax({url: '/api/posts_tags', type: 'GET', contentType: 'application/json', data: ''}).done( function( data ) { 
		posts_tags = data;
		console.log("posts_tags")
		console.log(posts_tags)
		get_posts()
	});	
}

function get_posts() {
	$.ajax({url: '/api/search', type: 'GET', contentType: 'application/json', data: ''}).done( function( data ) { 
		posts = data;
		posts.sort(sortDate)
		renderPosts();
	});
}

$(document).ready( function() {
		marked.setOptions({
		  highlight: function (code) {
		    return hljs.highlightAuto(code).value;
		  }
		});


		get_tags();

		
		window.addEventListener( "resize", render);	
		window.addEventListener( "keydown", keydown);
		render();		
})