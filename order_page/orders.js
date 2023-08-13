'use strict';

class MenuItem {
	constructor (name, cost) {
		this.name = String(name);
		this.cost = parseFloat(cost);
		this.sugars = 0;
		this.quantity = 0;
	}
	get element() {
		return document.querySelector(`#${this.name.replaceAll(' ', '-')}`);
	}
	translateTime(str) {
		const hours = Number(str.split(':')[0]);
		const minutes = Number(str.split(':')[1]);
		return ((hours * 3.6e+6) - (10 * 3.6e+6)) + (minutes * 60000);
	}
	get time() {
		const date = this.element.querySelector('#date').valueAsNumber || 0;
		const time = this.element.querySelector('#time').value || 0;
		return date + this.translateTime(time);
	}
	get orderData() {
		return {
			item: this.name,
			cost: this.cost,
			placementTime: new Date().valueOf(),
			pickupTime: this.time,
			sugar: this.sugars,
			quantity: this.quantity,
			biscuit: false,
		};
	}
	init() {
		document.querySelector('main').appendChild(document.querySelector('#menu-item-template').content.cloneNode(true));
		[...document.querySelectorAll('.menu-item')].reverse()[0].id = this.name.replaceAll(' ', '-');
		this.element.querySelector('#item-name').innerHTML = this.name;
		this.element.querySelector('#menu-item-img').src = `./img/${this.name.replaceAll(' ', '_')}.png`;
		this.element.querySelector('#quantity-selector > tbody > tr > #decrease').addEventListener('click', () => {//decrease quantity
			if (this.quantity <= 0) return; //go no smaller
			this.quantity--;
			this.element.querySelector('#quantity-amount').innerHTML = this.quantity;
		});
		this.element.querySelector('#quantity-selector > tbody > tr > #increase').addEventListener('click', () => {//increase quantity
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
		return this;
	}
}

const menuItems = [new MenuItem()].filter(() => false);

document.body.onload = () => {
	php_cmd('get_menu_data').then((msg) => {
		for (const obj of JSON.parse(msg)) {
			menuItems.push(new MenuItem(obj.item, obj.cost).init());
		}
	}).catch(err => alert(`An Error Occured: ${err}`));
}