var express = require('express');
var cors = require('cors');
var path = require('path');
var fs = require('fs');

var port = 3000;
var server = express();

// Middleware
server.use(cors());

// Routing
server.get('/*', function(request, response, next) {
  console.log('Now sending test MP3 file');
  response.sendFile(__dirname + '/audio/test.mp3');
});

// Listening
server.listen(3000, function() {
  console.log('Now listening on port ', port);
});