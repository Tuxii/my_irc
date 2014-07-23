var socket = io()

$('#login-form').submit(function(e){
	e.preventDefault()
	$email = $('#email').val().trim()
	$nickname = $('#nickname').val().trim()
	socket.emit('login', {email: $email, nickname: $nickname}, function(msg){
		if(!msg){
			// hide login form
			$('.login').fadeOut()
		}
		else{
			$('#login-message').html(msg).fadeIn()
		}
	})


})

socket.on('updateUsersList', function(lol){
	$('#users-number').html(lol);
	$('#users-number').html(Mustache.render($('#users-number').html(), lol));
	alert(Mustache.render($('#users-number').html(), lol))

})