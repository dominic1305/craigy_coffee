'use strict';

let invalidInputFieldAnimation;

document.querySelector('.submit-btn').addEventListener('click', () => {
	try {
		var obj = {
			username: document.querySelector('#username').value || void function() {throw 1}(),
			password: document.querySelector('#password').value || void function() {throw 2}(),
		}
	} catch (error) {//error animation
		clearInterval(invalidInputFieldAnimation);
		let opacity = 100;
		document.querySelector(`.login-container tr:nth-child(${error})`).style.backgroundColor = 'rgba(255, 0, 0, 1)';
		invalidInputFieldAnimation = setInterval(() => {//fade animation
			opacity--;
			document.querySelector(`.login-container tr:nth-child(${error})`).style.backgroundColor = `rgba(255, 0, 0, ${opacity / 100})`;
			if (opacity <= 0) {//fade is done
				document.querySelector(`.login-container tr:nth-child(${error})`).style.backgroundColor = '';
				clearInterval(invalidInputFieldAnimation);
			}
		}, 10);
		return;
	}
	php_cmd('user_signup', obj).then(async (msg) => {
		const obj = JSON.parse(msg);
		document.querySelector('.error-msg').style.display = 'none';
		if (!obj['username'] && !obj['password']) {//account is available
			await php_cmd('insert_new_user_credentials', obj);
			await php_cmd('write_credential_cache', stringEncrypter(JSON.stringify({user: obj['username_str'], login: true, rank: 'user'}), 'encode', 6));
			window.location.assign('./../order_page/orders.html');
		} else if (obj['username'] && !obj['password']) {//user already has account
			document.querySelector('.error-msg').innerHTML = 'user already has account';
			document.querySelector('.error-msg').style.display = 'block';
		} else if (!obj['username'] && obj['password']) {//password already in use
			document.querySelector('.error-msg').innerHTML = 'password already in use';
			document.querySelector('.error-msg').style.display = 'block';
		} else if (obj['username'] && obj['password']) {//existing account found
			confirmPrompt('existing account found. would you like to sign in?').then(async (bool) => {
				if (bool) {
					await php_cmd('write_credential_cache', stringEncrypter(JSON.stringify({user: obj['username_str'], login: true, rank: 'user'}), 'encode', 6));
					window.location.assign('./../order_page/orders.html');
				} else {
					document.querySelector('#username').value = '';
					document.querySelector('#password').value = '';
				}
			});
		}
	}).catch(err => alert(err))
});