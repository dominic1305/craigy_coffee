'use strict';

void function() {
	document.body.innerHTML += '<iframe id="server" style="display: none;" src="./../php_server.php"></iframe>';
}();

function php_cmd(cmd = 'test_response', inputData) {
	return new Promise((resolve, reject) => {
		document.querySelector('#server').contentWindow.postMessage(JSON.stringify({cmd: cmd, val: inputData}), '*');
		window.addEventListener('message', (e) => {//listen for server response
			const msg = JSON.parse(e.data);
			if (msg.cmd != cmd) return reject('invalid command response');
			else if (String(msg.response).includes('ERROR:')) return reject(String(msg.response).split(': ')[1]);
			return resolve(msg.response);
		});
		setTimeout(() => {return reject('timed out');}, 5000); //expire
	});
}