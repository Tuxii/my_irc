var socket = io()

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

socket.on('updateUsersList', function(lol, data){

	var test= {}
	test.nickname = "test"
	console.log(data)
	console.log(JSON.stringify(data));
	console.log(Mustache.render($('#users-list').html(), test))
 	$('#users-list').html(Mustache.render($('#users-list').html(), {users: JSON.stringify(data)}));



})