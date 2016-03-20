/* SUBMIT PAGE */


$(document).ready(function() 
{
  
	var propType = 2		//1 = unselected, 2 = buy, 3 = rent

	$("#propTypeSwitch").click( function() {
	  		switch (propType) {
	  			case 1: 
	  				propType = 3
	  				break
	  			case 2:
	  				propType = 3
	  				break
	  			case 3:
	  				propType = 1
	  				break	}
	  		update();
	  	})

  	$("#propSwitchRent").click( function () { propType = 1; update(); })
  	$("#propSwitchBuy").click( function () { propType = 3; update(); })

	function update() {
      //FULL RENDER
  		if (propType == 1) { 
  			$("#propType").css("margin-left", 1 ) 
  			$("#propType").css("background", "#3670b2")
  			$("#propSwitchRent").css("color", "#3670b2")
  			$("#propSwitchBuy").css("color", "#8a8a8a")
  		}
  		if (propType == 2) { //MID
  			$("#propType").css("margin-left", 8 ) 
  			$("#propType").css("background", "#878b8c")
  			$("#propSwitchRent").css("color", "#8a8a8a")
  			$("#propSwitchBuy").css("color", "#8a8a8a")
  		}
  		if (propType == 3) { 
  			$("#propType").css("margin-left", 15 ) 
  			$("#propType").css("background", "#be0121")
  			$("#propSwitchRent").css("color", "#8a8a8a")
  			$("#propSwitchBuy").css("color", "#be0121")
  		}	
  	}
	
  	$("#submitSave").click( function() {

	  	var newprop = {}
	  	newprop.short = $("#propInName").val();
	  	newprop.location = $("#propInLocation").val();
	  	newprop.price = parseInt($("#propInPrice").val());
	  	newprop.propType = propType;
	  	newprop.bed = parseInt($("#propInBed").val());
	  	newprop.bath = parseFloat($("#propInBath").val());
	  	newprop.car = parseInt($("#propInGarage").val());
	  	newprop.sqm = parseInt($("#propInSqm").val());
	  	newprop.long = $("#propInLong").val();

		$.ajax({
		    url: '/api/submit', 
		    type: 'POST', 
		    contentType: 'application/json', 
		    data: JSON.stringify(newprop)}
		).done ( function (result) {
			window.location.replace("/view/"+result);
		})
  	})

  	update();

});