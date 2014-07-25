var socket = io()


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
		}
		else{
			$('#login-message').html(msg).fadeIn()
		}
	})


})


socket.on('newUser', function(data){
	$('#messages-list').append(data+ ' vient de se connecter');
})

// update the number of users and print their names
socket.on('updateUsersList', function(nbUsers, user){
	// var $usertpl = $('#user-tpl').html();
	// $('#user-tpl').remove()
	// // $('#users-list').append(Mustache.render($usertpl, user));
	// update number of users
	$('#users-number').html(nbUsers)

	// add user to the list
	$('#users-list').append('<li id="'+user.id+'" class="users-item">\
        <div class="users-avatar">\
            <img src="'+user.avatar+'" alt="">\
        </div>\
        <div class="users-name">\
            <p>'+user.nickname+'</p>\
        </div>\
    </li>')

 	// $('#users-list').html(
 	// 	Mustache.render($('#users-list').html(), {users: users})
 	// );

})

socket.on('delUser', function(user){
	$('#'+user.id).remove();
})

//send message
$('#messages-form').submit(function(e){
	e.preventDefault();
	$message = $('#message').val();
	if($message.length > 0){
		socket.emit('sendMessage', {message : $message})
	}
	$('#message').val('');

})

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


