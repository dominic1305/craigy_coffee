'use strict';

class MenuItem {
	constructor (name, cost) {
		this.name = String(name);
		this.cost = parseFloat(cost);
		this.sugars = 0;
		this.quantity = 1;
	}
	get element() {
		return document.querySelector(`#${this.name.replaceAll(' ', '-')}`);
	}
	get order() {
		return new OrderItem(this.name, this.cost, this.element.querySelector('#milk-type').value, this.sugars, false);
	}
	init() {
		document.querySelector('main').appendChild(document.querySelector('#menu-item-template').content.cloneNode(true));
		[...document.querySelectorAll('.menu-item')].reverse()[0].id = this.name.replaceAll(' ', '-');
		this.element.querySelector('#item-name').innerHTML = this.name;
		this.element.querySelector('#menu-item-img').src = `./img/${this.name.replaceAll(' ', '_')}.png`;
		this.element.querySelector('#cost').innerHTML = `$${suffixApplier(this.cost)}`;
		this.element.querySelector('#quantity-selector > tbody > tr > #decrease').addEventListener('click', () => {//decrease quantity
			if (this.quantity <= 1) return; //go no smaller
			this.quantity--;
			this.element.querySelector('#quantity-amount').innerHTML = this.quantity;
		});
		this.element.querySelector('#quantity-selector > tbody > tr > #increase').addEventListener('click', () => {//increase quantity
			if (this.quantity >= 50) return; //go no higher
			this.quantity++;
			this.element.querySelector('#quantity-amount').innerHTML = this.quantity;
		});
		this.element.querySelector('#sugar-selector > tbody > tr > #decrease').addEventListener('click', () => {//decrease sugar
			if (this.sugars <= 0) return; //go no smaller
			this.sugars--;
			this.element.querySelector('#sugar-amount').innerHTML = this.sugars;
		});
		this.element.querySelector('#sugar-selector > tbody > tr > #increase').addEventListener('click', () => {//increase sugar
			if (this.sugars >= 3) return; //go no higher
			this.sugars++;
			this.element.querySelector('#sugar-amount').innerHTML = this.sugars;
		});
		this.element.querySelector('#add-to-order').addEventListener('click', () => {//add to order array
			for (let i = 0; i < this.quantity; i++) {
				currentOrder.push(this.order);
			}
			if (currentOrder.length > 0) togglePlacementMenu(true);
			document.querySelector('.total-price').innerHTML = `$${suffixApplier(currentOrder.map(bin => bin.cost).reduce((bin, count) => bin + count))}`;
		});
		return this;
	}
}

class OrderItem {
	constructor(item, cost, milk, sugars, biscuit) {
		this.item = String(item);
		this.cost = Number(cost);
		this.milk = String(milk);
		this.sugars = Number(sugars);
		this.biscuit = Boolean(biscuit);
	}
	get element() {
		return document.querySelectorAll('#entry')[currentOrder.indexOf(this)];
	}
	deload() {
		if (this.element) document.querySelector('#current-order-table').removeChild(this.element);
	}
	delete() {
		this.deload();
		currentOrder[currentOrder.indexOf(this)] = null;
		currentOrder = currentOrder.filter(bin => bin instanceof OrderItem);
		if (currentOrder.length == 0) {//array is now empty
			togglePlacementMenu(false);
			document.querySelector('.close-modal-btn').click();
			document.querySelector('.total-price').innerHTML = '$0.00';
		} else document.querySelector('.total-price').innerHTML = `$${suffixApplier(currentOrder.map(bin => bin.cost).reduce((bin, count) => bin + count))}`;
	}
	load() {
		document.querySelector('#current-order-table').appendChild(document.querySelector('#order-item-template').content.cloneNode(true));
		this.element.querySelector('#item').innerHTML = this.item;
		this.element.querySelector('#cost').innerHTML = this.cost;
		this.element.querySelector('#milk').innerHTML = this.milk;
		this.element.querySelector('#sugars').innerHTML = this.sugars;
		this.element.querySelector('#biscuit').innerHTML = (this.biscuit) ? '&#10003;' : '&#10006;';
		this.element.querySelector('#delete').addEventListener('click', () => this.delete());
		this.element.querySelector('#biscuit').addEventListener('click', (e) => {
			this.biscuit = !this.biscuit;
			e.target.innerHTML = (this.biscuit) ? '&#10003;' : '&#10006;';
		});
	}
}

const menuItems = [new MenuItem()].filter(() => false);
let currentOrder = [new OrderItem()].filter(() => false);

document.body.onload = () => {
	php_cmd('get_menu_data').then((msg) => {
		for (const obj of JSON.parse(msg)) {
			menuItems.push(new MenuItem(obj.item, obj.cost).init());
		}
	}).catch(err => alert(`An Error Occured: ${err}`));
	let date = new Date();
	document.querySelector('#pick-up-date').value = formatDate(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`);
	document.querySelector('#pick-up-date').min = document.querySelector('#pick-up-date').value;
	document.querySelector('#pick-up-time').value = formatTime(`${date.getHours()}:00`);
	date = new Date(new Date().valueOf() + 6.048e+8); //6.048e+8 milliseconds = 7 day offset
	document.querySelector('#pick-up-date').max = formatDate(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`); //set max date value
}

function formatDate(str) {
	let year = String(str).split('-')[0];
	let month = String(str).split('-')[1];
	let day = String(str).split('-')[2];
	if (month.length == 1) month = '0' + month;
	if (day.length == 1) day = '0' + day;
	return `${year}-${month}-${day}`;
}

function formatTime(str) {
	let hours = String(str).split(':')[0];
	let minutes = String(str).split(':')[1];
	if (hours.length == 1) hours = '0' + hours;
	if (minutes.length == 1) minutes = '0' + minutes;
	return `${hours}:${minutes}`;
}

function getPickUpTime() {
	const date = Number(document.querySelector('#pick-up-date').valueAsNumber) || 0;
	const time = translateTimeStr(document.querySelector('#pick-up-time').value || '00:00');
	return date + time;
}

function translateTimeStr(str) {
	const hours = Number(String(str).split(':')[0]) * 3.6e+6;
	const minutes = Number(String(str).split(':')[1]) * 60e+3;
	return (hours + minutes) - (10 * 3.6e+6); //-(10 * 3.6e+6) is to remove GMT time offset
}

document.querySelector('.edit-order-btn').addEventListener('click', () => {//open edit order modal
	currentOrder.forEach(bin => bin.load());
	document.querySelector('#current-order-modal').showModal();
});

document.querySelector('.close-modal-btn').addEventListener('click', () => {//close edit order modal
	document.querySelectorAll('#entry').forEach((bin => {
		document.querySelector('#current-order-table').removeChild(bin);
	}))
	document.querySelector('#current-order-modal').close();
});

document.querySelector('.biscuit-inclusion').addEventListener('click', () => {//toggle total biscuit content
	const active = !Boolean(Number(document.querySelector('.biscuit-inclusion').dataset.state));
	document.querySelector('.biscuit-inclusion').dataset.state = Number(active);
	document.querySelector('.biscuit-inclusion').style.backgroundColor = (active) ? 'lightgreen' : '#FF4A3F';
	currentOrder.forEach(bin => bin.biscuit = active);
});

document.querySelector('.place-order-btn').addEventListener('click', () => {
	const obj = {
		placement_time: new Date().valueOf(),
		pickup_time: getPickUpTime(),
		order: currentOrder,
		comment: document.querySelector('#order-comment').value,
	};
	console.log(JSON.stringify(obj));
});

document.querySelector('.modal-body').addEventListener('scroll', () => {//disable blur effect on modal body if last entry is visible to browser | bit hacky but works... kinda
	document.querySelector('.blur-backdrop').style.opacity = ([...document.querySelectorAll('#entry')].reverse()[0].getBoundingClientRect().bottom <= window.innerHeight) ? '0%' : '100%';
});

function togglePlacementMenu(active = !Boolean(Number(document.querySelector('.order-placement-menu').dataset.active))) {
	document.querySelector('.order-placement-menu').dataset.active = Number(active);
	if (!active) document.querySelector('.order-placement-menu').style.transition = '500ms';
	document.querySelector('main').style.marginBottom = (!active) ? '0px' : `${parseInt(window.getComputedStyle(document.querySelector('.order-placement-menu')).height) + 50}px`;
	document.querySelector('.order-placement-menu').style.visibility = (!active) ? 'hidden' : 'visible';
	document.querySelector('.order-placement-menu').style.bottom = (!active) ? '-250px' : '0px';
	if (active) setTimeout(() => document.querySelector('.order-placement-menu').style.transition = '0ms', 250);
}