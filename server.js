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
var sockets = {}
var users = {}
var nbUsers = 0
var nicknames = []

io.on('connection', function(socket){


	socket.on('login', function(user, callback){
		// user already exists
		if(user.nickname in sockets){
			callback("Votre pseudo est déjà pris !")
		}
		else
		{
			if(user.nickname.length < 3){
				callback("Votre pseudo est trop court !")
			}
			else if(!validateEmail(user.email)){
				callback("Veuillez entrer une adresse e-mail valide !")
			}
			else{
				// user is valid and can now log in
				callback(false)
				user.nickname = user.nickname
				user.avatar = 'https://gravatar.com/avatar/' + md5(user.email) + '?s=50'
				sockets[user.nickname] = socket
				users[user.nickname] = user
				++nbUsers
				console.log(users)
				nicknames.push(users[i].nickname)
				console.log(nicknames)
				io.emit('updateUsersList',nbUsers, nicknames);
			}
		}
	})



	socket.on('disconnect', function(){
		if(!socket.nickname) return;
		delete sockets[socket.nickname]
		--nbUsers
	})

})


function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}