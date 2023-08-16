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
						"placement_time" => $input->val->placement_time,
						"pickup_time" => $input->val->pickup_time,
						"order" => json_encode($input->val->order),
						"comment" => $input->val->comment,
					];
					$arr = (array) [//data pull
						"placement_time" => $server_arr["placement_time"],
						"pickup_time" => $server_arr["pickup_time"],
						"order" => json_decode($server_arr["order"]),
						"comment" => $server_arr["comment"],
					];
					printf("<p id=\"php-response\">%s</p>", json_encode($arr));
					break;
				case "get_admin_order_data": //TEST: to be updated with server response | pull all active orders from SQL database
					printf("<p id=\"php-response\">%s</p>", '[{"placement_time":1692163992628,"pickup_time":1692162000000,"order":[{"item":"flat white","cost":4.5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"flat white","cost":4.5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"flat white","cost":4.5,"milk":"dairy","sugars":0,"biscuit":false},{"item":"hot chocolate","cost":4.5,"milk":"dairy","sugars":2,"biscuit":false},{"item":"hot chocolate","cost":4.5,"milk":"dairy","sugars":2,"biscuit":false}],"comment":""},{"placement_time":1692164019524,"pickup_time":1692162000000,"order":[{"item":"hot chocolate","cost":4.5,"milk":"dairy","sugars":1,"biscuit":false},{"item":"hot chocolate","cost":4.5,"milk":"dairy","sugars":1,"biscuit":false},{"item":"hot chocolate","cost":4.5,"milk":"dairy","sugars":1,"biscuit":false},{"item":"cappuccino","cost":4.5,"milk":"dairy","sugars":3,"biscuit":false}],"comment":"hello may name is bob"}]');
					break;
				case "delete_active_order": //TEST: to be updated with server response | delete SQL entry and return success bool
					printf("<p id=\"php-response\">%s</p>", "true");
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
				window.parent.postMessage(JSON.stringify({cmd: stringEncrypter(localStorage.getItem('current_cmd'), 'decode', 36), response: php_response.innerHTML}), '*');
				localStorage.removeItem('current_cmd');
				document.body.removeChild(php_response);
			}
		}();

		window.addEventListener('message', (e) => {//receive messages from parent
			const msg = JSON.parse(e.data);
			localStorage.setItem('current_cmd', stringEncrypter(msg.cmd, 'encode', 36));
			document.querySelector('#php-input').value = e.data;
			document.querySelector('#php-submit').click();
		});
	</script>
</body>
</html>