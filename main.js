'use strict';

void function() {
	if (window.location.href.includes('.html')) document.body.innerHTML += '<iframe id="server" style="display: none;" src="./../php_server.php"></iframe>';
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

//taken from muffin masher
function Formatter(input = '', positve = isPositive(input)) {//formats given value
	const abbrev = ['', '', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion', 'Undecillion', 'Duodecillion', 'Tredecillion', 'Quattuordecillion', 'Quindecillion', 'Sexdecillion', 'Septemdecillion', 'Octodecillion', 'Novemdecillion', 'Vigintillion', 'Unvigintillion', 'Duovigintillion', 'Trevigintillion', 'Quattuorvigintillion'];
	if (input.length < abbrev.length * 3 + 1 && input != '∞') {
		const unrangifiedOrder = Math.floor(Math.log10(Math.abs(input)) / 3);
		const order = Math.max(0, Math.min(unrangifiedOrder, abbrev.length - 1));
		const str = `${(input / Math.pow(10, order * 3)).toFixed(2)} ${abbrev[order]}`;
		return (positve) ? str : `-${str}`;
	} else {
		return (positve) ? 'Infinity' : '-Infinity';
	}
}

function suffixApplier(input = 0) {//shortens value and adds suffixes
	if (Number(input) != String(input)) throw new Error(`invalid input type: ${typeof input}`);
	const number = Math.abs(input);
	if (number >= 1e+6 || number <= -1e+6) {//only formats if more than a million
		return Formatter((number).toLocaleString('fullwide', {useGrouping: false}), isPositive(input));
	} else {//less than a million
		return (isPositive(input) ? '' : '-') + parseFloat(number).toFixed(2).toLocaleString('fullwide', {useGrouping: true});
	}
}

function isPositive(val) {//returns if passed value is positve
	return (Math.abs(val) == val);
}