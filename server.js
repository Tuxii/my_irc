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

var commandes = '\
<strong>/nick _nickname_ :</strong> définit le surnom de l’utilisateur au sein du channel<br>\
<strong>/list [string] :</strong> liste les channels disponibles sur le serveur. N’affiche que les channels contenant la chaîne "string" si celle-ci est spécifiée.<br>\
<strong>/join _channel_ :</strong> rejoint un channel sur le serveur<br>\
<strong>/part _channel_ :</strong> quitte le channel<br>\
<strong>/users :</strong> liste les utilisateurs connectés au channel<br>\
<strong>/msg _nickname_ _message_ :</strong> envoie un message à un utilisateur spécifique'
io.on('connection', function(socket){

	var present = false
	// user already exists
	for(var i in users){
		socket.emit('updateUsersList', nbUsers, users[i])
	}
	var me = {}
	var channels = {
		"Général":{name: 'Général', id:"general", active: true},
		'Jeux': {name: 'Jeux', id:"jeux", active: false},
		'Sport': {name: 'Sport', id:"sport", active: false},
		'Cinéma':{name: 'Cinéma', id:"cinema", active: false},
		'Musique':{name: 'Musique', id:"musique", active: false},
		'Cuisine':{name: 'Cuisine', id:"cuisine", active: false},
		'Poneys':{name: 'Poneys', id:"poneys", active: false}
	}

	socket.join('Général')
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
				var date = new Date();
				callback(false)
				user.avatar = gravatar.url(user.email, {s:60})
				user.id = socket.id
				me = user
				present = true
				// notifiy already logged users that a new user logged in
				for(var i in sockets){
					sockets[i].emit('newUser', {nickname: me.nickname, present:present, h: date.getHours(),	m: (date.getMinutes()<10?'0':'') + date.getMinutes()})
				}
				socket.nickname = user.nickname
				sockets[user.nickname] = socket
				me.currentChannel = 'Général'
				users[user.email] = me
				console.log(users)
				++nbUsers
				io.emit('updateUsersList', nbUsers, me);
				socket.emit('welcome', me.nickname, me.currentChannel)
				socket.emit('listChannel', channels)


			}
		}
	})


	socket.on('sendMessage', function(data, callback){
		var date = new Date();
		var msg = data.trim()
		var nicknames = []
		for(var i in users){
			nicknames.push(users[i].nickname)
		}
		// PM
		if(msg.substring(0,5) === "/msg "){
			msg = msg.substring(5)
			var index = msg.indexOf(' ')
			if(index !== -1){
				console.log('presque')
				var receiver = msg.substring(0, index)
				msg = msg.substring(index + 1)
				console.log(receiver)
				if(nicknames.indexOf(receiver) !== -1){
					console.log('new pm')
					var pm = {
						receiver: receiver,
						sender:me.nickname,
						avatar : me.avatar,
						msg:msg,
						h: date.getHours(),
						m: (date.getMinutes()<10?'0':'') + date.getMinutes()
					}
					sockets[receiver].emit('sendPm', pm)
					socket.emit('sendPm', pm)
				}
				else{
					callback("Cet utilisteur n'existe pas !")
				}
			} else {
				callback("Veuillez enter un message !")
			}
		}
		else if(msg === "/users"){
			// print users connected to current channel

			var nicknames = []
			for(var i in users){
				if(users[i].currentChannel == me.currentChannel){
					nicknames.push(users[i].nickname)
				}
			}
			io.emit('listUsers', nicknames)

		}
		else if (msg.substring(0,6) === "/nick "){
			// rename users
			var newNick = msg.substring(6)
			var valid;
			for(var i in users){
				if(users[i].nickname == newNick){
					callback('Pseudo déjà pris !')
					valid=false
				}
			}
			me.nickname = newNick
			users[me.email] = me
			io.emit('rename', me);
			socket.emit('renameHeader', me.nickname)
		}
		else if(msg.substring(0,5) === "/list"){

			msg = msg.substring(5).trim()
			var response

			if(msg.length > 0){ // if a string paramter is present
				response = listChannels(msg)
			}
			else{
				response = listChannels(false)
			}
			socket.emit('displayListChannels', response)

		}
		else if(msg.substring(0,6) === "/join "){ // join channel
			channelName = msg.substring(6)

			if(channelName in channels){ // that channel exists
				joinChannel(channelName)
			}
			else{
				callback("Ce salon n'existe pas")
			}
		}
		else if(msg.substring(0,6) === "/part "){ // leave channel
			channelName = msg.substring(6)
			if(channelName in channels){ // that channel exists
				socket.leave(channelName)
				channels[channelName].active = false
				me.currentChannel = 'Général'
				users[me.email] = me
				channels[me.currentChannel].active = true
				socket.emit('leaveChannel', channelName)
				// list channels
				socket.emit('listChannel', channels)
			}
			else{
				callback("Ce salon n'existe pas")
			}
		}
		else if(msg === "/help"){
			socket.emit('showCommands', commandes)
		}
		else if (msg.substring(0,1) === "/"){
			// unknown command
			callback('Commande inconnue')
		}
		else{

			io.in(me.currentChannel).emit('newMessage', {
				msg : msg,
				nickname : me.nickname,
				avatar : me.avatar,
				h: date.getHours(),
				m: (date.getMinutes()<10?'0':'') + date.getMinutes()
			})
		}
	})

	// refresh or exit browser
	socket.on('disconnect', function(data){
		if(!socket.nickname) return;

		var date = new Date();
		delete users[me.email]
		delete sockets[socket.nickname]
		--nbUsers
		present = false;
		for(var i in users){
			sockets[i].emit('newUser', {nickname: me.nickname, present:present, h: date.getHours(),	m: (date.getMinutes()<10?'0':'') + date.getMinutes()})
		}
		io.emit('delUser',nbUsers, me)
	})

	socket.on('joinChannel', function(channelId){ // join channel by pressing button
		for(var i in channels){
			if(channels[i].id == channelId){
				console.log(i)
				joinChannel(i)
			}
		}
	})
	var joinChannel = function(channelName){
		date = new Date()
		socket.leave(me.currentChannel)
		socket.join(channelName)
		channels[channelName].active = true

		socket.broadcast.in(me.currentChannel).emit('newUserInChan', {nickname: me.nickname, present:false, h: date.getHours(),	m: (date.getMinutes()<10?'0':'') + date.getMinutes()})
		channels[me.currentChannel].active = false
		me.currentChannel = channelName
		users[me.email] = me
		// list channels
		socket.emit('listChannel', channels)
		socket.emit('joinChannel', channelName)
		if(channelName != 'Général'){
			socket.broadcast.in(channelName).emit('newUserInChan', {nickname: me.nickname, present:true, h: date.getHours(),	m: (date.getMinutes()<10?'0':'') + date.getMinutes()})
		}
	}

	var listChannels = function(search){
		results = []
		for(var i in channels){
			if(!search){ // one parameter after /list = search the string in channels list
				results.push(i)
			}
			else{
				if(i.indexOf(search) !== -1){
					results.push(i)
				}
			}
		}
		return results
	}


})

var validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}