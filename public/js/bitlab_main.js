/* 
This file contains general purpose code that works with the bitlab server. 
*/

console.log("loading bitlab_main.js")



var getJSON = function(endpoint, callback) {
    console.log("getJSON "+endpoint)
    $.ajax({
        url: endpoint, 
        type: 'GET', 
        contentType: 'application/json', 
        data: JSON.stringify({}) }
    ).done(function( serverJSON ) {
    console.log("getJSON "+endpoint+" success!")
    callback(serverJSON)
    });
}

