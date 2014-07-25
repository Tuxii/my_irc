var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var gravatar = require('gravatar')
var port =  1337;


http.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.set('views', __dirname + '/public');
app.use(express.static(__dirname + '/public'));
app.get('/', function(request, response){
	response.render('index.html');
});

var sockets = {}
var users = {}
var nbUsers = 0

io.on('connection', function(socket){

	// user already exists
	for(var i in users){
		socket.emit('updateUsersList', nbUsers, users[i])
	}
	var me = {}
	socket.on('login', function(user, callback){
		if(user.nickname in sockets){
			callback("Votre pseudo est déjà pris !")
		}
		else
		{
			if(user.nickname.length < 3){
				callback("Votre pseudo est trop court !")
			}
			// else if(!validateEmail(user.email)){
			// 	callback("Veuillez entrer une adresse e-mail valide !")
			// }
			else{
				// user is valid and can now log in
				callback(false)
				user.avatar = gravatar.url(user.email, {s:60})
				user.id = socket.id
				me = user
				socket.nickname = user.nickname
				sockets[user.nickname] = socket
				users[user.email] = user
				console.log(user)
				console.log(me)
				++nbUsers
				io.emit('updateUsersList', nbUsers, me);
				// for(var i in sockets){
				// 	if(i != socket.nickname){
				// 		sockets[i].emit('newUser', socket.nickname);
				// 	}
				// 	// sockets[i].emit('updateUsersList', nbUsers, users);
				// }
			}
		}
	})

	// for(var i in users){
	// 	socket.emit('updateUsersList', nbUsers, users[i])
	// }

	socket.on('sendMessage', function(message){
		date = new Date();
		io.emit('newMessage', {
			msg : message.message,
			nickname : socket.nickname,
			avatar : socket.avatar,
			h: date.getHours(),
			m: date.getMinutes()
		})
	})

	// refresh or exit browser
	socket.on('disconnect', function(data){
		if(!socket.nickname) return;


		delete users[me.email]
		delete sockets[socket.nickname]
		io.emit('delUser', me)
		--nbUsers
		// if(typeof users != "undefined" && users.length > 0){
		// 	for(var i=0; i< users.length; i++){
		// 		if(users[i].nickname == socket.nickname){
		// 			// empty users array when disconnect
		// 			users.splice(i, 1)
		// 		}
		// 	}
		// }

		// socket.broadcast.emit('updateUsersList', nbUsers, users);
	})

})


function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}