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
		require("./conn.php");
		if (!empty($_POST["submit"])) {
			try {
				$input = json_decode($_POST["input"]); //input structure = {cmd: string, val: any}
				switch ($input->cmd) {
					case "test_response": printf("<p id=\"php-response\">hello</p>"); break;
					case "get_menu_data": //pull all menu items from SQL database
						$data = (array) [];
						$query = mysqli_query($conn, "SELECT * FROM menu_items ORDER BY cost ASC") or throwError("cannot find menu data");
						while ($row = mysqli_fetch_array($query)) {
							array_push($data, ["item" => $row["item"], "cost" => $row["cost"]]);
						}
						printf("<p id=\"php-response\">%s</p>", json_encode($data));
						break;
					case "insert_order_data": //insert new SQL entry and return success bool
						mysqli_query($conn, sprintf("INSERT INTO active_orders (user, pickup_time, placement_time, order_JSON, comment) VALUES (\"%s\", %d, %d, '%s', \"%s\")", $input->val->user, $input->val->pickup_time, $input->val->placement_time, json_encode($input->val->order), $input->val->comment)) or throwError("unable to place order");
						$order = mysqli_fetch_array(mysqli_query($conn, sprintf("SELECT DISTINCT * FROM active_orders WHERE placement_time = %d", $input->val->placement_time))) or throwError("unable to find order");
						printf("<p id=\"php-response\">%s</p>", ($order["placement_time"] == $input->val->placement_time && $order["user"] == $input->val->user) ? "true" : "false");
						break;
					case "get_admin_order_data": //pull all active orders from SQL database
						$query = mysqli_query($conn, "SELECT * FROM active_orders ORDER BY placement_time ASC") or throwError("unable to find order data");
						$arr = (array) [];
						while ($row = mysqli_fetch_array($query)) {
							array_push($arr, ["user" => $row["user"], "placement_time" => (int) $row["placement_time"], "pickup_time" => (int) $row["pickup_time"], "order" => json_decode($row["order_JSON"]), "comment" => $row["comment"]]);
						}
						printf("<p id=\"php-response\">%s</p>", json_encode($arr));
						break;
					case "delete_active_order": //delete SQL entry and return success bool
						mysqli_query($conn, sprintf("DELETE FROM active_orders WHERE placement_time = %d", $input->val)) or throwError("unable to delete order");
						$data = mysqli_fetch_array(mysqli_query($conn, sprintf("SELECT DISTINCT * FROM active_orders WHERE placement_time = %d", $input->val)));
						printf("<p id=\"php-response\">%s</p>", is_null($data) ? "true" : "false");
						break;
					case "user_login_data_check": //return bool obj of login detail validity
						$data = mysqli_fetch_array(mysqli_query($conn, sprintf("SELECT DISTINCT * FROM users WHERE username = \"%s\" and password = \"%s\"", $input->val->username, $input->val->password)));
						$obj = (array) [
							"username_bool" => $input->val->username == $data["username"],
							"username_str" => $input->val->username,
							"password_bool" => $input->val->password == $data["password"],
							"password_str" => $input->val->password,
						];
						printf("<p id=\"php-response\">%s</p>", json_encode($obj));
						break;
					case "admin_login_data_check": //return bool obj of login detail validity
						$data = mysqli_fetch_array(mysqli_query($conn, sprintf("SELECT DISTINCT * FROM admin_users WHERE username = \"%s\" and password = \"%s\"", $input->val->username, $input->val->password)));
						$obj = (array) [
							"username_bool" => $input->val->username == $data["username"],
							"username_str" => $input->val->username,
							"password_bool" => $input->val->password == $data["password"],
							"password_str" => $input->val->password,
						];
						printf("<p id=\"php-response\">%s</p>", json_encode($obj));
						break;
					case "user_signup": //return bool obj of available account details
						$dataName = mysqli_fetch_array(mysqli_query($conn, sprintf("SELECT DISTINCT * FROM users WHERE username = \"%s\"", $input->val->username)));
						$dataPwd = mysqli_fetch_array(mysqli_query($conn, sprintf("SELECT DISTINCT * FROM users WHERE password = \"%s\"", $input->val->password)));
						$obj = (array) [
							"username_bool" => $input->val->username == $dataName["username"],
							"username_str" => $input->val->username,
							"password_bool" => $input->val->password == $dataPwd["password"],
							"password_str" => $input->val->password,
						];
						printf("<p id=\"php-response\">%s</p>", json_encode($obj));
						break;
					case "insert_new_user_credentials": //inset new user account entry
						mysqli_query($conn, sprintf("INSERT INTO users (username, password) VALUES (\"%s\", \"%s\")", $input->val->username_str, $input->val->password_str)) or throwError("unable to insert user");
						printf("<p id=\"php-response\">true</p>");
						break;
					case "get_user_orders": //returns only a single users active orders
						$query = mysqli_query($conn, sprintf("SELECT * FROM active_orders WHERE user = \"%s\"", $input->val)) or throwError("unable to find order data");
						$arr = (array) [];
						while ($row = mysqli_fetch_array($query)) {
							array_push($arr, ["user" => $row["user"], "placement_time" => (int) $row["placement_time"], "pickup_time" => (int) $row["pickup_time"], "order" => json_decode($row["order_JSON"]), "comment" => $row["comment"]]);
						}
						printf("<p id=\"php-response\">%s</p>", json_encode($arr));
						break;
					default: printf("<p id=\"php-response\">SERVER ERROR: invalid command</p>"); break;
				}
			} catch (Exception $err) {
				printf("<p id=\"php-response\">SERVER ERROR: something went wrong: %s</p>", $err->getMessage());
			}
		}

		function throwError($error) {//i shouldn't have to have a helper function to throw an error
			throw new Exception($error);
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