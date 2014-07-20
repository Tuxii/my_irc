var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var md5 = require('md5');
var port = process.env.PORT || 3000;

http.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public');
app.use(express.static(__dirname + '/public'));
app.get('/', function(request, response){
	response.render('index.ejs');
});

var client
var user = {}
var users = []

io.on('connection', function(socket){

	socket.on('login', function(user){
		socket.nickname = user.nickname
		socket.avatar = 'https://gravatar.com/avatar/' + md5(user.email) + '?s=50'
		users.push[nickname];
		user
	})
})



function checkNickname(nickname){
	return users.indexOf(nickname) != -1
}