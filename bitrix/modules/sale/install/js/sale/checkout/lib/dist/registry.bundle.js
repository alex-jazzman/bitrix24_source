/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sale = this.BX.Sale || {};
this.BX.Sale.Checkout = this.BX.Sale.Checkout || {};
(function (exports, main_core, sale_checkout_const, ui_a11y) {
	'use strict';

	class Url {
		static getCurrentUrl() {
			return window.location.protocol + "//" + window.location.hostname + (window.location.port != '' ? ':' + window.location.port : '') + window.location.pathname + window.location.search;
		}
		static addLinkParam(link, name, value) {
			if (!link.length) {
				return '?' + name + '=' + value;
			}
			link = main_core.Uri.removeParam(link, name);
			if (link.indexOf('?') != -1) {
				return link + '&' + name + '=' + value;
			}
			return link + '?' + name + '=' + value;
		}
	}

	class Pool {
		constructor() {
			this.pool = {};
		}
		add(cmd, index, fields) {
			if (!this.pool.hasOwnProperty(index)) {
				this.pool[index] = [];
			}
			this.pool[index].push({
				[cmd]: {
					fields
				}
			});
		}
		get() {
			return this.pool;
		}
		clean() {
			this.pool = {};
		}
		isEmpty() {
			return Object.keys(this.pool).length === 0;
		}
	}

	class Timer {
		constructor() {
			this.list = [];
		}
		add(fields) {
			if (!fields.hasOwnProperty('index')) {
				return false;
			}
			this.list[fields.index] = {
				id: fields.id
			};
		}
		get(index) {
			if (!this.list[index] || this.list[index].length <= 0) {
				return {};
			}
			return this.list[index];
		}
		delete(fields) {
			this.list.splice(fields.index, 1);
		}
		clean(fields) {
			let timer = this.get(fields.index);
			clearTimeout(timer.id);
			this.delete({
				index: fields.index
			});
		}
		create(time, index = 'default', callback = null, callbackParams) {
			this.clean({
				index
			});
			index = index == null ? 'default' : index;
			callback = typeof callback === 'function' ? callback : function () {};
			let timer = setTimeout(callback, time);
			let item = {
				id: timer,
				index: index
			};
			this.add(item);
		}
		isEmpty() {
			return this.list.length === 0;
		}
	}

	class Basket {
		static toFixed(quantity, measureRatio, availableQuantity = 0) {
			let precisionFactor = Math.pow(10, 6);
			let reminder = (quantity / measureRatio - (quantity / measureRatio).toFixed(0)).toFixed(5),
				remain;
			if (parseFloat(reminder) === 0) {
				return quantity;
			}
			if (measureRatio !== 0 && measureRatio !== 1) {
				remain = quantity * precisionFactor % (measureRatio * precisionFactor) / precisionFactor;
				if (measureRatio > 0 && remain > 0) {
					if (remain >= measureRatio / 2 && (availableQuantity === 0 || quantity + measureRatio - remain <= availableQuantity)) {
						quantity += (measureRatio * precisionFactor - remain * precisionFactor) / precisionFactor;
					} else {
						quantity = (quantity * precisionFactor - remain * precisionFactor) / precisionFactor;
					}
				}
			}
			return quantity;
		}

		// isRatioFloat(value)
		// {
		// 	return parseInt(value) !== parseFloat(value)
		// }

		static isValueFloat(value) {
			return parseInt(value) !== parseFloat(value);
		}
		static roundValue(value) {
			if (Basket.isValueFloat(value)) {
				return Basket.roundFloatValue(value);
			} else {
				return parseInt(value, 10);
			}
		}
		static roundFloatValue(value) {
			let precision = 6;
			let precisionFactor = Math.pow(10, precision);
			return Math.round(parseFloat(value) * precisionFactor) / precisionFactor;
		}
	}

	class Product {
		static isService(item) {
			return item.product.type === sale_checkout_const.Product.type.service;
		}
		static isLimitedQuantity(item) {
			return item.product.checkMaxQuantity === 'Y';
		}
	}

	class History {
		constructor(options) {
			this.location = options.location;
			this.params = options.params;
		}
		build() {
			let path = this.location;
			let params = this.params;
			try {
				for (let name in params) {
					if (!params.hasOwnProperty(name)) {
						continue;
					}
					path = Url.addLinkParam(path, name, params[name]);
				}
			} catch (e) {}
			return path;
		}
		static pushState(location, params) {
			let url = new History({
				location,
				params
			}).build();
			window.history.pushState(null, null, url);
			return url;
		}
	}

	// outlasts the price animation and typing in the quantity field: one announcement per recalculation
	const recalculationDelay = 700;
	function speak(message, politeness) {
		if (!main_core.Type.isStringFilled(message)) {
			return;
		}
		ui_a11y.LiveAnnouncer.announce(message, politeness);
	}
	const speakRecalculation = main_core.Runtime.debounce(message => speak(message, 'polite'), recalculationDelay);

	/**
	 * The only speaker of the checkout: its live region belongs to ui.a11y and survives focus trap isolation.
	 */
	class Announcer {
		static announce(message) {
			speak(message, 'polite');
		}
		static announceError(message) {
			speak(message, 'assertive');
		}
		static announceRecalculation(message) {
			speakRecalculation(message);
		}
	}

	// the shutters of the checkout fade in faster than this, and a browser without transitions never ends a fade
	const fadeTimeout = 250;

	/**
	 * Focus primitives skip a transparent node, so a layer looks for its stops once the shutter has faded in.
	 * A layer closed before that drops the wait with the returned call.
	 */
	class Shutter {
		static whenVisible(shutter, callback) {
			if (shutter === null || ui_a11y.InteractivityChecker.isVisible(shutter)) {
				callback();
				return () => {};
			}
			let fadeTimer = null;
			const stopWaiting = () => {
				shutter.removeEventListener('transitionend', onFade);
				clearTimeout(fadeTimer);
				fadeTimer = null;
			};
			const onFade = event => {
				if (event.propertyName === 'opacity' && event.target === shutter) {
					stopWaiting();
					callback();
				}
			};
			shutter.addEventListener('transitionend', onFade);
			fadeTimer = setTimeout(() => {
				stopWaiting();
				callback();
			}, fadeTimeout);
			return stopWaiting;
		}
	}

	exports.Announcer = Announcer;
	exports.Basket = Basket;
	exports.History = History;
	exports.Pool = Pool;
	exports.Product = Product;
	exports.Shutter = Shutter;
	exports.Timer = Timer;
	exports.Url = Url;

})(this.BX.Sale.Checkout.Lib = this.BX.Sale.Checkout.Lib || {}, BX, BX.Sale.Checkout.Const, BX.UI.Accessibility);
//# sourceMappingURL=registry.bundle.js.map
