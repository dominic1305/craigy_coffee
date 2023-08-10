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
			$input = json_decode($_POST["input"]);
			switch ($input->cmd) {
				case "test_response": printf("<p id=\"php-response\">hello</p>"); break;
				case "get_menu_data": //TEST: to be updated with server response 
					$data = (array) [
						["item" => "flat white", "cost" => 4.5],
						["item" => "cappuccino", "cost" => 4.5],
						["item" => "latte", "cost" => 4.5],
						["item" => "espresso", "cost" => 4.5],
						["item" => "hot chocolate", "cost" => 4.5],
						["item" => "chai latte", "cost" => 4.5],
						["item" => "iced coffee", "cost" => 5],
						["item" => "iced latter", "cost" => 5],
					];
					printf("<p id=\"php-response\">%s</p>", json_encode($data));
					break;
				default: printf("<p id=\"php-response\">ERROR: invalid command</p>"); break;
			}
		}
	?>

	<script defer>
		void function() {
			const php_response = document.querySelector('#php-response') || document.querySelector('.php-response');
			if (php_response != null) {//response found
				const cmd = localStorage.getItem('current_cmd');
				window.parent.postMessage(JSON.stringify({cmd: cmd, response: php_response.innerHTML}), '*');
				localStorage.removeItem('current_cmd');
				document.body.removeChild(php_response);
			}
		}();

		window.addEventListener('message', (e) => {//receive messages from parent
			const msg = JSON.parse(e.data);
			console.log(msg);
			localStorage.setItem('current_cmd', msg.cmd);
			document.querySelector('#php-input').value = e.data;
			document.querySelector('#php-submit').click();
		});
	</script>
</body>
</html>