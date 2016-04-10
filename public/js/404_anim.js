var particles = []
var lines = []
var particleLife = 500
var scale = $(window).width()

function newparticles() {
	particles = []
	lines = []
	if ($(window).height() > scale) { scale = $(window).height()}
	for (var a = 0; a<(scale/10);a++){  particles.push( makeparticle()) }	
}

newparticles();

function makeparticle() {
	var part = {}
	part.x = -50 + (Math.random()*(scale+100))
	part.y = Math.random()*scale
	part.z = Math.random()*scale/10
	part.vely = -scale*0.00025 + (Math.random()*scale*0.0005)
	part.velx = -scale*0.00025 + (Math.random()*scale*0.0005)
	part.velz = -scale*0.00025 + (Math.random()*scale*0.0005)
	part.connections = 0
	return part
}

function newSpawns() {
	var part = {}
	part.x = -50 + (Math.random()*(scale+100))
	part.y = lasth;
	part.z = 0
	part.vely = -scale*0.00025 + (Math.random()*scale*0.0005)
	part.velx = -scale*0.00025 + (Math.random()*scale*0.0005)
	part.velz = -scale*0.00025 + (Math.random()*scale*0.0005)
	part.connections = 0
	return part	
}

function particleUpdate() {
	for (var p in particles) {
		if (particles[p].y > scale) { particles[p] = makeparticle() }
		if (particles[p].x > scale) { particles[p] = makeparticle() }
		if (particles[p].y < -50) { particles[p] = makeparticle() }
		if (particles[p].x < -50) { particles[p] = makeparticle() }
		if (particles[p].z < -50) { particles[p] = makeparticle() }
		if (particles[p].z > scale) { particles[p] = makeparticle() }
			particles[p].vely -= 0.01
		particles[p].y += particles[p].vely
		particles[p].x += particles[p].velx
		particles[p].z += particles[p].velz
		particles[p].connections = 0

	}
	lines = []
		for (var p in particles) {
			for (var o in particles) {

				var d = dist(particles[p], particles[o])
				if (p == o) { d = 999999}

				if (d < scale/5) { 
					var closeness = (scale/10) - d
					var p1 = {}
					p1.x = particles[p].x
					p1.y = particles[p].y + (((particles[p].z/$(window).width())-0.5) * $(window).height())

					var p2 = {}
					p2.x = particles[o].x
					p2.y = particles[o].y + (((particles[o].z/$(window).width())-0.5) * $(window).height())

		

					var line = {}
					line.p1 = p1
					line.p2 = p2
					line.closeness = closeness
					lines.push(line)
					}
				}
			}
}



var lastw = 0
var lasth = 0
var globalpr = {}
var dopt = scale/5

function screensize(e) {
	
	var ratiow = $(window).width()/lastw
	
	for (var p in particles) {
		particles[p].x *= ratiow
	}

	for (var l in lines) {
		lines[l].p1.x *= ratiow
		lines[l].p2.x *= ratiow
	}


	
	var h = $("#topbannerContent").height()
	
	globalpr.size( $(window).width(), $(window).height()) 
	lastw = $(window).width()
	lasth = h
	$("#topbanner").height(h)
}

function game(pr) {

		pr.setup = function () 
		{
			globalpr = pr;
			screensize();
			pr.frameRate(60)

			console.log(  );
		} 
		
		
		pr.draw = function () 
		{
			if (window.document.hasFocus()){
					
					//pr.size( $(window).width(), h)			
					
					pr.background(40, 40, 40) //clears the frame
					

					
					for (var p in particles) {
						

						var opacity = ($(window).width() - particles[p].z) * 255
						pr.fill(55,55,55,opacity)
						pr.noStroke()
						var size = ($(window).width() - particles[p].z)/$(window).width()*5
						var y = particles[p].y + (((particles[p].z/$(window).width())-0.5) * $(window).height())
						pr.ellipse(particles[p].x,y, size, size)

						
						
					}

					for (var l in lines) {
					//var light = 50+ lines[l].closeness%16*5
						var light = lines[l].closeness*5
						pr.stroke(100,100,100,light)

						if (light > 150) { pr.stroke(61,215,171,light) }

						pr.line(lines[l].p1.x, lines[l].p1.y, lines[l].p2.x, lines[l].p2.y)
						var s = lines[l].closeness/3
						if (s > 5) { s = 5}


						pr.noStroke()
						pr.fill(61,215,171,light)
						pr.ellipse(lines[l].p1.x, lines[l].p1.y,s,s)
					}
			
			}
			particleUpdate();
		} //END DRAW
}//END PROCESSING

function out(d) {
	if (d > dopt) { return 1}
	if (d < -dopt) { return 1 }
	return 0
}

function dist(p1, p2) {
	var dx = p1.x - p2.x; if (out(dx)) {return dopt}
	var dy = p1.y - p2.y; if (out(dy)) {return dopt}
	var dz = p1.z - p2.z; if (out(dz)) {return dopt}
	return Math.sqrt( dx*dx + dy*dy + dz*dz)
}


function keydown(key) 
{
	console.log(key)
	if (key.keyCode == 87) { player.y -= 15}  //UP
	if (key.keyCode == 83) { player.y += 15}  //DOWN
	if (key.keyCode == 65) { player.x -= 15}  //LEFT
	if (key.keyCode == 68) { player.x += 15}  //RIGHT	
}

function keyup(key) 
{        
	//console.log(key)
}



$(document).ready(function() 
{

  var canvas = document.getElementById("processing")
  var processing = new Processing(canvas, game); 
	document.addEventListener( 'keydown', keydown );
	document.addEventListener( 'keyup', keyup );
	window.addEventListener( "resize", screensize);
})
