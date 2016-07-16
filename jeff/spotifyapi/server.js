var express = require('express');
var server = express();

server.use(express.static(__dirname + '/public'));

server.get('/', (req, res) => {
  res.render('index');
});

server.listen(3000, () => {
  console.log('Listening on port 3000.');
});