var express = require('express');
var cors = require('cors');
var fs = require('fs');

var server = express();

// Allow requests from all origins
server.use(function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

server.get('/', function( request, response, next ) {
  fs.createReadStream('test.mp3', { 'encoding': 'binary' }).pipe(response);
  // {'encoding': 'base64'}, 
  // fs.readFile('test.mp3', function(err, data) {
  //   response.send(data);
  // });

  // response.send('test.mp3');
});

server.listen(3000, function() {
  console.log('Test server listening on port 3000!');
});