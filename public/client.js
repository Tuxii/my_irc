var socket = io()

$('.login-form').submit(function(e){
	e.preventDefault()
	$email = $('#email').val().trim()
	$nickname = $('#nickname').val().trim()
	socket.emit('login', {email: $email, nickname: $nickname}, function(valid){
		if(valid){
			// hide login form
		}
		else{
			//display error
		}
	})


})