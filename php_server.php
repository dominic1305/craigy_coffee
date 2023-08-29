<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>php - server</title>
</head>
<body>

	<form method="POST">
		<input id="php-input" type="text" name="input">
		<input id="php-submit" type="submit" name="submit">
	</form>

	<?php
		if (!empty($_POST["submit"])) {
			$input = json_decode($_POST["input"]); //input structure = {cmd: string, val: any}
			switch ($input->cmd) {
				case "test_response": printf("<p id=\"php-response\">hello</p>"); break;
				case "get_menu_data": //TEST: to be updated with server response | pull all menu items from SQL database
					$data = (array) [
						["item" => "flat white", "cost" => 4.5],
						["item" => "cappuccino", "cost" => 4.5],
						["item" => "latte", "cost" => 4.5],
						["item" => "espresso", "cost" => 4.5],
						["item" => "hot chocolate", "cost" => 4.5],
						["item" => "chai latte", "cost" => 4.5],
						["item" => "iced coffee", "cost" => 5],
						["item" => "iced latte", "cost" => 5],
					];
					printf("<p id=\"php-response\">%s</p>", json_encode($data));
					break;
				case "insert_order_data": //TEST: to be updated with server response | insert new SQL entry and return success bool
					$server_arr = (array) [//data push
						"user" => $input->val->user,
						"placement_time" => $input->val->placement_time,
						"pickup_time" => $input->val->pickup_time,
						"order" => json_encode($input->val->order),
						"comment" => $input->val->comment,
					];
					$arr = (array) [//data pull
						"user" => $server_arr["user"],
						"placement_time" => $server_arr["placement_time"],
						"pickup_time" => $server_arr["pickup_time"],
						"order" => json_decode($server_arr["order"]),
						"comment" => $server_arr["comment"],
					];
					printf("<p id=\"php-response\">%s</p>", json_encode($arr));
					break;
				case "get_admin_order_data": //TEST: to be updated with server response | pull all active orders from SQL database
					printf("<p id=\"php-response\">%s</p>", '[{"user":"abc","placement_time":1692885268369,"pickup_time":1692570600000,"order":[{"item":"flat white","cost":4.5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"cappuccino","cost":4.5,"milk":"dairy","sugars":1,"biscuit":false},{"item":"cappuccino","cost":4.5,"milk":"dairy","sugars":1,"biscuit":false},{"item":"hot chocolate","cost":4.5,"milk":"dairy","sugars":3,"biscuit":false}],"comment":""},{"user":"abc","placement_time":1692885293752,"pickup_time":1692569700000,"order":[{"item":"iced coffee","cost":5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"iced coffee","cost":5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"iced coffee","cost":5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"iced coffee","cost":5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"iced coffee","cost":5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"iced coffee","cost":5,"milk":"dairy","sugars":0,"biscuit":false}],"comment":"this is a comment, yay!"}]');
					break;
				case "delete_active_order": //TEST: to be updated with server response | delete SQL entry and return success bool
					printf("<p id=\"php-response\">%s</p>", "true");
					break;
				case "user_login_data_check": //TEST: to be updated with server response | return bool obj of login detail validity
					$obj = (array) [
						"username_bool" => $input->val->username == "abc",
						"username_str" => $input->val->username,
						"password" => $input->val->password == "abc",
					];
					printf("<p id=\"php-response\">%s</p>", json_encode($obj));
					break;
				case "admin_login_data_check": //TEST: to be updated with server response | return bool obj of login detail validity
					$obj = (array) [
						"username" => $input->val->username == "admin",
						"password" => $input->val->username == "admin",
					];
					printf("<p id=\"php-response\">%s</p>", json_encode($obj));
					break;
				case "user_signup": //TEST: to be updated with server response | return bool obj of available account details
					$obj = (array) [
						"username" => $input->val->username == "abc",
						"password" => $input->val->password == "abc",
					];
					printf("<p id=\"php-response\">%s</p>", json_encode($obj));
					break;
				case "insert_new_user_credentials": //TEST: to be updated with server response | inset new user account entry
					printf("<p id=\"php-response\">%s</p>", true);
					break;
				default: printf("<p id=\"php-response\">SERVER ERROR: invalid command</p>"); break;
			}
		}
	?>

	<script src="./main.js"></script>
	<script defer>
		void function() {
			const php_response = document.querySelector('#php-response') || document.querySelector('.php-response');
			if (php_response != null) {//response found
				sendMessage(php_response.innerHTML);
				localStorage.removeItem('current_cmd');
				document.body.removeChild(php_response);
			}
		}();

		window.addEventListener('message', (e) => {//receive messages from parent
			const msg = JSON.parse(stringEncrypter(e.data, 'decode', 16));
			localStorage['current_cmd'] = stringEncrypter(msg['cmd'], 'encode', 32);
			switch (msg['cmd']) {
				case 'write_credential_cache':
					localStorage['user_data'] = msg['val'];
					if (localStorage['user_data'] != msg['val']) sendMessage('CACHE ERROR: unable to write to cache');
					else sendMessage(true);
					localStorage.removeItem('current_cmd');
					break;
				case 'read_credential_cache':
					sendMessage(localStorage['user_data'] || stringEncrypter(JSON.stringify({user: null, login: false, rank: null}), 'encode', 6));
					localStorage.removeItem('current_cmd');
					break;
				case 'clear_credential_cache':
					localStorage.removeItem('user_data');
					sendMessage(true);
					break;
				default: //send to server to handle
					document.querySelector('#php-input').value = JSON.stringify(msg);
					document.querySelector('#php-submit').click();
					break;
			}
		});

		function sendMessage(response) {
			window.parent.postMessage(stringEncrypter(JSON.stringify({cmd: stringEncrypter(localStorage['current_cmd'], 'decode', 32), response: response}), 'encode', 32), '*');
		}
	</script>
</body>
</html>