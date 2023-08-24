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
		return new OrderItem(this.name, this.cost, this.element.querySelector('#milk-type').value, this.sugars, Boolean(Number(document.querySelector('.biscuit-inclusion').dataset['state'])));
	}
	error(err) {
		this.element.querySelector('.error-msg-container').appendChild(document.querySelector('#menu-item-error-msg').content.cloneNode(true));
		const element = this.element.querySelector('#error:last-child');
		element.innerHTML = err;
		setTimeout(() => {
			let opacity = 100;
			const interval = setInterval(() => {//fade animation
				opacity--;
				element.style.opacity = `${opacity}%`;
				if (opacity < 0) {
					clearInterval(interval);
					this.element.querySelector('.error-msg-container').removeChild(element);
				}
			}, 10);
		}, 250);
	}
	init() {
		document.querySelector('main').appendChild(document.querySelector('#menu-item-template').content.cloneNode(true));
		document.querySelector('.menu-item:last-child').id = this.name.replaceAll(' ', '-');
		this.element.querySelector('#item-name').innerHTML = this.name;
		this.element.querySelector('#menu-item-img').src = `./img/${this.name.replaceAll(' ', '_')}.png`;
		this.element.querySelector('#cost').innerHTML = `$${suffixApplier(this.cost)}`;
		this.element.querySelector('#quantity-selector #decrease').addEventListener('click', () => {//decrease quantity
			if (this.quantity <= 1) return; //go no smaller
			this.quantity--;
			this.element.querySelector('#quantity-amount').innerHTML = this.quantity;
			this.element.querySelector('#cost').innerHTML = `$${suffixApplier(this.cost * this.quantity)}`;
		});
		this.element.querySelector('#quantity-selector #increase').addEventListener('click', () => {//increase quantity
			if (this.quantity >= 50) return; //go no higher
			this.quantity++;
			this.element.querySelector('#quantity-amount').innerHTML = this.quantity;
			this.element.querySelector('#cost').innerHTML = `$${suffixApplier(this.cost * this.quantity)}`;
		});
		this.element.querySelector('#sugar-selector #decrease').addEventListener('click', () => {//decrease sugar
			if (this.sugars <= 0) return; //go no smaller
			this.sugars--;
			this.element.querySelector('#sugar-amount').innerHTML = this.sugars;
		});
		this.element.querySelector('#sugar-selector #increase').addEventListener('click', () => {//increase sugar
			if (this.sugars >= 3) return; //go no higher
			this.sugars++;
			this.element.querySelector('#sugar-amount').innerHTML = this.sugars;
		});
		this.element.querySelector('#add-to-order').addEventListener('click', () => {//add to order array
			for (let i = 0; i < this.quantity; i++) {
				if (currentOrder.length >= 50) {this.error('Invalid: Too Many Order Items'); break;}
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
		if (this.element != null) document.querySelector('#current-order-table').removeChild(this.element);
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
	}).catch(err => alert(err));
	let date = new Date().setDay(1);
	document.querySelector('#pick-up-date').value = formatDate(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`);
	document.querySelector('#pick-up-date').min = document.querySelector('#pick-up-date').value;
	date = new Date(date.valueOf() + 864e+5 * 4); //864e+5 milliseconds = 1 day offset
	document.querySelector('#pick-up-date').max = formatDate(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`); //set max date value
}

let invalidPickupTimeAnimation;

function getPickUpTime() {
	const date = Number(document.querySelector('#pick-up-date').valueAsNumber) || 0;
	try {
		var time = translateTimeStr([...document.querySelectorAll('.time-select > input')].filter(bin => bin.checked)[0].dataset['time'] || '00:00');
	} catch {//error animation
		clearInterval(invalidPickupTimeAnimation);
		let opacity = 100;
		document.querySelectorAll('.time-select').forEach(bin => bin.style.outline = '1px solid rgba(255, 0, 0, 1)');
		invalidPickupTimeAnimation = setInterval(() => {//fade animation
			opacity--;
			document.querySelectorAll('.time-select').forEach(bin => bin.style.outline = `1px solid rgba(255, 0, 0, ${opacity / 100})`);
			if (opacity <= 0) {//animation is done
				clearInterval(invalidPickupTimeAnimation);
				document.querySelectorAll('.time-select').forEach(bin => bin.style.outline = '');
			}
		}, 10);
		throw 0; //return
	}
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
	currentOrder.forEach(bin => bin.deload());
	document.querySelector('#current-order-modal').close();
});

document.querySelector('.clear-order-modal-btn').addEventListener('click', () => {//clear current order
	currentOrder.forEach(bin => bin.delete());
});

document.querySelector('.biscuit-inclusion').addEventListener('click', () => {//toggle total biscuit content
	const active = !Boolean(Number(document.querySelector('.biscuit-inclusion').dataset['state']));
	document.querySelector('.biscuit-inclusion').dataset['state'] = Number(active);
	document.querySelector('.biscuit-inclusion').style.backgroundColor = (active) ? 'lightgreen' : '#FF4A3F';
	currentOrder.forEach(bin => bin.biscuit = active);
});

document.querySelector('.place-order-btn').addEventListener('click', () => placeOrder());

function placeOrder(override = false) {
	if (currentOrder.map(bin => bin.cost).reduce((bin, count) => bin + count) >= 100 && !override) {//check with user
		confirmPrompt(`are you sure you want to spend $${suffixApplier(currentOrder.map(bin => bin.cost).reduce((bin, count) => bin + count))} on this order`).then((bool) => {
			if (bool) placeOrder(true);
		}).catch(err => alert(err));
	} else try {
		const obj = {
			placement_time: new Date().valueOf(),
			pickup_time: getPickUpTime(),
			order: currentOrder,
			comment: document.querySelector('#order-comment').value,
		};
		php_cmd('insert_order_data', obj).then((msg) => {
			console.log(msg);
			document.querySelector('.clear-order-modal-btn').click();
		}).catch(err => alert(err));
	} catch (err) {
		if (err != 0) console.error(err);
	}
}

document.querySelector('.modal-body').addEventListener('scroll', () => {//disable blur effect on modal body if last entry is visible to browser | bit hacky but works... kinda
	document.querySelector('.blur-backdrop').style.opacity = (document.querySelector('#entry:last-child').getBoundingClientRect().bottom <= window.innerHeight) ? '0%' : '100%';
});

function togglePlacementMenu(active = !Boolean(Number(document.querySelector('.order-placement-menu').dataset['active']))) {
	document.querySelector('.order-placement-menu').dataset['active'] = Number(active);
	if (!active) document.querySelector('.order-placement-menu').style.transition = '500ms';
	document.querySelector('main').style.marginBottom = (!active) ? '0px' : `${parseInt(window.getComputedStyle(document.querySelector('.order-placement-menu')).height) + 50}px`;
	document.querySelector('.order-placement-menu').style.visibility = (!active) ? 'hidden' : 'visible';
	document.querySelector('.order-placement-menu').style.bottom = (!active) ? '-250px' : '0px';
	if (active) setTimeout(() => document.querySelector('.order-placement-menu').style.transition = '0ms', 250);
}