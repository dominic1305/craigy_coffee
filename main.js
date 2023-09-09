'use strict';

void function() {
	if (window.location.href.includes('.html')) {
		document.body.innerHTML += '<iframe id="server" style="display: none;" src="./../php_server.php"></iframe>';
		document.querySelectorAll('.navbar > p').forEach((bin) => {
			if (bin.id == 'logout-btn') bin.addEventListener('click', async () => {
				await php_cmd('clear_credential_cache');
				window.location.assign('./../index.html');
			});
			if (bin.style.cursor == '') bin.style.setProperty('--const-width', `${parseInt(window.getComputedStyle(bin).width) + 10}px`);
		});
	}
}();

function php_cmd(cmd = 'test_response', input_data) {
	return new Promise((resolve, reject) => {
		document.querySelector('#server').contentWindow.postMessage(stringEncrypter(JSON.stringify({cmd: cmd, val: input_data}), 'encode', 16), '*');
		window.addEventListener('message', (e) => {//listen for server response
			const msg = JSON.parse(stringEncrypter(e.data, 'decode', 32));
			if (msg['cmd'] != cmd) return reject('invalid command response');
			else if (String(msg['response']).includes('ERROR:')) return reject(msg['response']);
			return resolve(msg['response']);
		}, {once: true});
		setTimeout(() => {return reject('SERVER ERROR: timed out');}, 5000); //expire
	});
}

function formatDate(str, inverse = true) {
	let year = String(str).split('-')[0];
	let month = String(str).split('-')[1];
	let day = String(str).split('-')[2];
	if (month.length == 1) month = '0' + month;
	if (day.length == 1) day = '0' + day;
	return (inverse) ? `${year}-${month}-${day}` : `${day}-${month}-${year}`;
}

function formatTime(str) {
	let hours = String(str).split(':')[0];
	let minutes = String(str).split(':')[1];
	if (hours.length == 1) hours = '0' + hours;
	if (minutes.length == 1) minutes = '0' + minutes;
	return `${hours}:${minutes}`;
}

Date.prototype.setDay = function(newDay) {
	const day = this.getDay() || 7;
	if (day != newDay) this.setHours(-24 * (day - newDay));
	return this;
}

function confirmPrompt(txt = 'demo') {
	return new Promise((resolve, reject) => {
		if (document.querySelector('.confirm-backdrop') != null) return reject('too many instances');
		const element = document.createElement('div');
		element.innerHTML = '<div class="confirm-backdrop"><div class="confirm-container"><div class="head"><p id="txt"></p></div><div class="foot"><div id="confirm-input-yes">Yes</div><div id="confirm-input-no">No</div></div></div></div>'; //this is so dumb, please never do anything like this again
		document.body.appendChild(element);
		element.querySelector('#txt').innerHTML = txt;
		element.querySelector('#confirm-input-yes').addEventListener('click', () => {//true value return
			document.body.removeChild(document.querySelector('.confirm-backdrop').parentElement);
			return resolve(true);
		}, {once: true});
		element.querySelector('#confirm-input-no').addEventListener('click', () => {//false value return
			document.body.removeChild(document.querySelector('.confirm-backdrop').parentElement);
			return resolve(false);
		}, {once: true});
	});
}

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

function getShuffledArr(length) {
	const arr = [];
	for (let i = 0; i < length; i++) arr.push(i);
	return arr.sort(() => (Boolean(Math.floor(Math.random() * 2))) ? 1 : -1);
}

String.prototype.splitSpace = function(spaces) {
	let arr = [];
	for (let i = 0; i < this.length; i += spaces) {
		arr.push(this.slice(i, i + spaces));
	}
	return arr;
}

function findSubString(str, start, end = start) {//find substring within given brackets
	let bool = false;
	return String(str).split('').map((bin) => {
		if (bin == start || bin == end) bool = !bool;
		else if (bool) return bin;
	}).filter(bin => bin != null).join('');
}

function stringEncrypter(str = '', method = 'encode', register = 16) {//converts ascii to hex and vice versa
	if (register < 2 || register > 32) throw new Error(`invalid register: ${register}`);
	if (method == 'encode') {//encode a string
		const cypher = Math.floor(Math.random() * (100 - 10) + 10);
		const substiutionArr = getShuffledArr(256).map(bin => enforceByteSize(bin.toString(register), register));
		return [`[${enforceByteSize(cypher.toString(register), register)}]`, `{${hashGen(str, cypher)}}`, `(${substiutionArr.join('')})`, ...String(str).split('').map((bin) => {
			return substiutionArr[parseInt(enforceByteSize((bin.charCodeAt() + cypher).toString(register), register), register)];
		}).reverse()].join(' ');
	} else if (method == 'decode') {//decode to string
		const cypher = parseInt(findSubString(str, '[', ']'), register) || void function() {throw new Error('cannot find cypher')}();
		const hash = findSubString(str, '{', '}') || void function() {throw new Error('cannot find hash code')}();
		const substiutionArr = findSubString(str, '(', ')').splitSpace((255).toString(register).length) || void function () {throw new Error('cannot find substiution array')}();
		const finalStr = String(str).split(' ').reverse().slice(0, -3).map((bin) => {//translate characters
			return String.fromCharCode(substiutionArr.indexOf(bin) - cypher);
		}).join('');
		if (hashGen(finalStr, cypher) != hash) throw new Error(`invalid hash: ${hash}`);
		else return finalStr;
	} else throw new Error(`invalid method: ${method}`);
}

function enforceByteSize(str, register) {//adds zeros to stay within byte size
	const registerLength = (255).toString(register).length;
	while (String(str).length < registerLength) {
		str = '0' + str;
	}
	return String(str);
}

function hashGen(str, seed) {//thank you smart internet man
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;
	for (let i = 0; i < str.length; i++) {
		h1 = Math.imul(h1 ^ str.charCodeAt(i), 2654435761);
		h2 = Math.imul(h2 ^ str.charCodeAt(i), 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >> 16), 2246822507);
	h2 = Math.imul(h2 ^ (h2 >> 16), 2246822507);
	return (4294967296 * (2097151 & h2) + (h1 >> 0)).toString(32);
}

function notification(str) {//display a notification to the screen
	if (document.querySelector('.notification-container') == null) {//add container if not present
		const parent = document.createElement('div');
		parent.className = 'notification-container';
		document.body.appendChild(parent);
	}
	const element = document.createElement('p');
	element.className = 'notification';
	element.innerHTML = str;
	document.querySelector('.notification-container').appendChild(element);
	setTimeout(() => {
		let opacity = 100;
		const interval = setInterval(() => {//fade animation
			opacity--;
			element.style.opacity = `${opacity}%`;
			if (opacity <= 0) {//fade is done
				document.querySelector('.notification-container').removeChild(element);
				clearInterval(interval);
			}
		}, 10);
	}, 2000);
}