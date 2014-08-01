$( document ).ready(function(){

	var socket = io()
	var username
	var typing = false

	// connection
	$('#login-form').submit(function(e){
		e.preventDefault()
		$email = $('#email').val().trim()
		$nickname = $('#nickname').val().trim()
		socket.emit('login', {email: $email, nickname: $nickname}, function(msg){
			if(!msg){
				// hide login form
				$('.login').fadeOut()
				$('.overlay').fadeOut()
				$('#username').html($nickname)
				username = $nickname
			}
			else{
				$('#login-message').html(msg).fadeIn()
			}
		})


	})


	socket.on('newUser', function(user){
		// add notification to all other users about new user logged
		if(user.present){
			$('#messages-list').append('<li class="messages-item new-user"><strong>'+ user.nickname+ '</strong> vient de se connecter<span class="messages-date">'+user.h+':'+user.m+'</span></li>');
		}
		else{
			$('#messages-list').append('<li class="messages-item new-user"><strong>'+ user.nickname+ '</strong> vient de se déconnecter<span class="messages-date">'+user.h+':'+user.m+'</span></li>');
		}
		// scroll to bottom
		$("#messages-list").animate({ scrollTop: $('#messages-list').prop('scrollHeight') }, 0)
	})

	socket.on('showCommands', function(commandes){
		commandes = 'Voici la liste des commandes disponibles :<br>' + commandes
		printNotif(commandes);
	})

	var printNotif = function(notif){
		$('#messages-list').append('<li class="messages-item"><p>'+notif+'</p></li>');
	}

	// update the number of users and print their names
	socket.on('updateUsersList', function(nbUsers, user){

		// update number of users
		$('#users-number').html(nbUsers)

		// add user to the list
		var html = '<li id="'+user.id+'" class="users-item">\
	        <div class="users-avatar">\
	            <img src="'+user.avatar+'" alt="">\
	        </div>\
	        <div class="users-name">\
	            <p>'+user.nickname+'</p>\
	        </div>\
	    </li>'
	    $(html).hide().appendTo('#users-list').fadeIn(500)


	})

	socket.on('rename', function(user){
		var html = '<li id="'+user.id+'" class="users-item">\
	        <div class="users-avatar">\
	            <img src="'+user.avatar+'" alt="">\
	        </div>\
	        <div class="users-name">\
	            <p>'+user.nickname+'</p>\
	        </div>\
	    </li>'
		$("#" + user.id).empty().append(html)
	})

	socket.on('newUserInChan', function(data){
		if(data.present){
			$('#messages-list').append('<li class="messages-item new-user"><strong>'+ data.nickname+ '</strong> vient d\'entrer dans le salon<span class="messages-date">'+data.h+':'+data.m+'</span></li>')
		}else{
			$('#messages-list').append('<li class="messages-item new-user"><strong>'+ data.nickname+ '</strong> a quitté le salon<span class="messages-date">'+data.h+':'+data.m+'</span></li>')
		}
	})

	socket.on('renameHeader', function(nickname){
		$('#username').html(nickname)
	})

	socket.on('welcome', function(nickname, channel){
		msg = 'Bienvenue sur my_irc <strong>' +nickname+ '</strong> ! Vous êtes dans le salon <strong>'+channel+'</strong><br>Tapez <strong>/help</strong> pour obtenir la liste des commandes disponibles'
		printNotif(msg)
	})

	socket.on('delUser', function(nbUsers, user){
		$('#users-number').html(nbUsers)

		$('#'+user.id).fadeOut(500,function(){
			$(this).remove();
		})

	})


	//send message
	$('#messages-form').submit(function(e){
		e.preventDefault();
		$message = $('#message').val();
		if($message.length > 0){
			socket.emit('sendMessage', $message, function(data){
				// if an error war raised
				var html = '<li class="messages-item">\
		            <div class="messages-content messages-error">\
		                <p>'+data+'</p>\
		            </div>\
			    </li>'
			    $('#messages-list').append(html)
			})
		}
		$('#message').val('');
		$('#message').focus()

	})

	socket.on('listChannel', function(channels){
		$('#channels-list').empty()
		for(var i in channels){
			var html = '<li class="channels-item">'
		    if(channels[i].active){
		    	html += '<span class="active">' +channels[i].name + '</span>'
		    }
		    else{
		    	html += channels[i].name
		    	html += '<button id="'+channels[i].id+'"class="btn btn-primary btn-join">Rejoindre</button>'
		    }
		    html += '</li>'
			$('#channels-list').append(html)
		}
		$('.btn-join').click(function(){
			var id = $(this).attr('id')
			socket.emit('joinChannel', id)
		})
	});



	socket.on('joinChannel', function(channelName){
		joinChannel(channelName)
	})

	var joinChannel = function(channel){
		$('#messages-list').empty();
		printNotif('Vous avez rejoint le channel ' + channel)
	}

	// receive message
	socket.on('newMessage', function(message){
		$('#messages-list').append('<li class="messages-item">\
	        <div class="messages-message">\
	            <div class="messages-avatar">\
	                <img src="'+message.avatar+'">\
	            </div>\
	            <div class="messages-content">\
	                <p><span class="messages-author">'+message.nickname+'</span><span class="messages-date">'+message.h+':'+message.m+'</span></p>\
	                <p>'+message.msg+'</p>\
	            </div>\
	        </div>\
	    </li>')
	    $("#messages-list").animate({ scrollTop: $('#messages-list').prop('scrollHeight') }, 0)


	})
	socket.on('sendPm', function(data){ // /msg command
		$('#messages-list').append('<li class="messages-item">\
	        <div class="messages-message">\
	            <div class="messages-avatar">\
	                <img src="'+data.avatar+'">\
	            </div>\
	            <div class="messages-content">\
	                <p><span class="messages-author">'+username+'</span><span class="messages-date">'+data.h+':'+data.m+'</span></p>\
	                <p>'+data.msg+'</p>\
	            </div>\
	        </div>\
	    </li>')
	    $("#messages-list").animate({ scrollTop: $('#messages-list').prop('scrollHeight') }, 0)
	})

	socket.on('displayListChannels', function(data){ // /list command
		var string = '';
		if(data.length > 0){
			for(var i = 0; i < data.length; i++){
				if(i != data.length){
					string += data[i] + '<br>'
				}
				else{
					string += data[i]
				}
			}
		}
		else{
			string = 'Aucun résultat'
		}
		printNotif(string)
	})

	socket.on('listUsers', function(data){
		var string = 'Liste des utilisateurs dans le salon :<br>';
		for(var i = 0; i < data.length; i++){
			if(i != data.length){
				string += data[i] + '<br>'
			}
			else{
				string += data[i]
			}
		}
		printNotif(string)
	})

})


