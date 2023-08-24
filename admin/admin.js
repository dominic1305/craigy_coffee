'use strict';

class ActiveOrder {
	constructor(placement_time, pickup_time, order = [], comment) {
		this.placement_time = new Date(placement_time);
		this.pickup_time = new Date(pickup_time);
		this.order = Array(...order);
		this.comment = String(comment);
	}
	get element() {
		return document.querySelector(`.admin-order-table:nth-child(${activeOrders.indexOf(this)+1})`);
	}
	get formatted_pickup_time() {
		const time = formatTime(`${this.pickup_time.getHours()}:${this.pickup_time.getMinutes()}`);
		const date = formatDate(`${this.pickup_time.getFullYear()}-${this.pickup_time.getMonth()}-${this.pickup_time.getDate()}`, false).replaceAll('-', '/');
		return `${time} ${date}`;
	}
	get formatted_placement_time() {
		const time = formatTime(`${this.placement_time.getHours()}:${this.placement_time.getMinutes()}`);
		const date = formatDate(`${this.placement_time.getFullYear()}-${this.placement_time.getMonth()}-${this.placement_time.getDate()}`, false).replaceAll('-', '/');
		return `${time} ${date}`;
	}
	async delete() {
		await php_cmd('delete_active_order', this).then((msg) => {
			if (!Boolean(msg)) return;
			document.querySelector('main').removeChild(this.element);
			activeOrders[activeOrders.indexOf(this)] = null;
			activeOrders = activeOrders.filter(bin => bin instanceof ActiveOrder);
		}).catch(err => alert(err));
	}
	loadComment() {
		if (this.comment.length == 0) return; //there is no comment
		this.element.style.setProperty('--comment-opacity', (parseInt(getComputedStyle(this.element).getPropertyValue('--comment-opacity')) == 0) ? '100%' : '0%');
	}
	init() {
		document.querySelector('main').appendChild(document.querySelector('#admin-order-object-template').content.cloneNode(true));
		setTimeout(() => {//wait to load element fully
			this.element.querySelector('#user').innerHTML = 'User: billy bob john'; //TODO: update order placement system to include user name
			this.element.querySelector('#pickup-time').innerHTML = `Pickup Time: ${this.formatted_pickup_time}`;
			this.element.querySelector('#placement-time').innerHTML = `Placement Time: ${this.formatted_placement_time}`
			this.element.querySelector('#cost').innerHTML = `Cost: $${suffixApplier(this.order.map(bin => bin.cost).reduce((bin, count) => bin + count))}`;
			this.element.querySelector('#delete').addEventListener('click', () => confirmPrompt('are you sure you want to delete this order?').then(bool => (bool) ? this.delete() : 0).catch(err => alert(err)));
			this.element.style.setProperty('--comment-text', `"${this.comment}"`);
			this.element.querySelector('#comment-btn').addEventListener('click', () => this.loadComment());
			for (const item of this.order) {//load each order item
				this.element.querySelector('.active-order').appendChild(document.querySelector('#active-order-row-template').content.cloneNode(true));
				const element = this.element.querySelector('#active-order-row:last-child');
				element.querySelector('#item').innerHTML = item.item;
				element.querySelector('#cost').innerHTML = `$${suffixApplier(item.cost)}`;
				element.querySelector('#milk-type').innerHTML = item.milk;
				element.querySelector('#sugars').innerHTML = item.sugars;
				element.querySelector('#biscuit').innerHTML = (item.biscuit) ? '&#10003;' : '&#10006;';
			}
		}, 10);
		return this;
	}
}

let activeOrders = [new ActiveOrder()].filter(() => false);

document.body.onload = () => {
	php_cmd('get_admin_order_data').then((msg) => {
		for (const obj of JSON.parse(msg)) {
			activeOrders.push(new ActiveOrder(obj.placement_time, obj.pickup_time, obj.order, obj.comment).init());
		}
	}).catch(err => alert(err));
}