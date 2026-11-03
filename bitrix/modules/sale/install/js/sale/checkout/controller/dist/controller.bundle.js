/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sale = this.BX.Sale || {};
this.BX.Sale.Checkout = this.BX.Sale.Checkout || {};
(function (exports, main_core, sale_checkout_lib, sale_checkout_const, main_core_events, sale_checkout_provider_rest) {
		'use strict';

		class Basket {
			constructor() {
				this.pool = this.getPool();
				this.timer = this.getTimer();
				this.running = 'N';
			}

			/**
			 * @private
			 */
			getPool() {
				return new sale_checkout_lib.Pool();
			}

			/**
			 * @private
			 */
			getTimer() {
				return new sale_checkout_lib.Timer();
			}

			/**
			 * @private
			 */
			isRunning() {
				return this.running === 'Y';
			}

			/**
			 * @private
			 */
			setRunningY() {
				this.running = 'Y';
			}

			/**
			 * @private
			 */
			setRunningN() {
				this.running = 'N';
			}

			/**
			 * @private
			 */
			setStore(store) {
				this.store = store;
				return this;
			}

			/**
			 * @private
			 */
			setProvider(provider) {
				this.provider = provider;
				return this;
			}

			/**
			 * @private
			 */
			executeRestAnswer(command, result, extra) {
				return this.provider.execute(command, result, extra);
			}

			/**
			 * @private
			 */
			getItem(index) {
				return this.store.getters['basket/get'](index);
			}

			/**
			 * @private
			 */
			getBasket() {
				return this.store.getters['basket/getBasket'];
			}

			/**
			 * @private
			 */
			getBasketCollection() {
				return this.getBasket().filter(item => item.deleted === 'N');
			}

			/**
			 * @private
			 */
			changeItem(product) {
				this.store.dispatch('basket/changeItem', {
					index: product.index,
					fields: product.fields
				});
			}

			/**
			 * @private
			 */
			setQuantity(index, quantity) {
				let fields = this.getItem(index);
				fields.quantity = quantity;
				fields.baseSum = this.round(fields.basePrice * fields.quantity);
				fields.sum = this.round(fields.price * fields.quantity);
				fields.discount.sum = this.round(fields.discount.price * fields.quantity);
				this.refreshDiscount();
				this.refreshTotal();
				this.pool.add(sale_checkout_const.Pool.action.quantity, index, {
					id: fields.id,
					value: fields.quantity
				});
				this.changeItem({
					index,
					fields
				});
				this.shelveCommit();
			}
			refreshDiscount() {
				let basket = this.getBasket();
				if (basket.length > 0) {
					this.store.dispatch('basket/setDiscount', {
						sum: basket.reduce((result, value) => result + value.discount.sum, 0)
					});
				}
			}
			refreshTotal() {
				let basket = this.getBasketCollection();
				if (basket.length > 0) {
					this.store.dispatch('basket/setTotal', {
						price: basket.reduce((result, value) => result + value.sum, 0),
						basePrice: basket.reduce((result, value) => result + value.baseSum, 0)
					});
				}
			}

			/**
			 * @private
			 */
			removeItem(product) {
				return this.store.dispatch('basket/removeItem', {
					index: product.index
				});
			}

			/**
			 * @private
			 */
			round(value, precision = 10) {
				const factor = Math.pow(10, precision);
				return Math.round(value * factor) / factor;
			}
			emitOnBasketChange() {
				BX.onCustomEvent('OnBasketChange');
			}

			/**
			 * @private
			 */
			handlerOrderSuccess() {
				this.emitOnBasketChange();
			}

			/**
			 * @private
			 */
			handlerRemoveProductSuccess() {
				this.emitOnBasketChange();
			}

			/**
			 * @private
			 */
			handlerRestoreProductSuccess() {
				this.emitOnBasketChange();
			}

			/**
			 * @private
			 */
			handlerRemove(event) {
				let index = event.getData().index;
				let fields = this.getItem(index);
				if (fields.status === sale_checkout_const.Loader.status.wait) {
					return;
				}
				fields.deleted = 'Y';
				fields.status = sale_checkout_const.Loader.status.wait;
				this.announceRowChange('CHECKOUT_CONTROLLER_ANNOUNCE_BASKET_ITEM_REMOVED', fields);
				this.pool.add(sale_checkout_const.Pool.action.delete, index, {
					id: fields.id,
					fields: {
						value: 'Y'
					}
				});
				this.changeItem({
					index,
					fields
				});
				this.shelveCommit();
			}

			/**
			 * @private
			 */
			handlerSuccessRemove(event) {
				let index = event.getData().index;
				this.timer.create(5000, index + '_DELETE', () => this.removeItem({
					index
				}).then(() => {
					if (this.getBasket().length === 0) {
						this.store.dispatch('application/setStage', {
							stage: sale_checkout_const.Application.stage.empty
						});
					}
				}));
			}

			/**
			 * @private
			 */
			handlerRestore(event) {
				let index = event.getData().index;
				let fields = this.getItem(index);
				if (fields.status === sale_checkout_const.Loader.status.wait) {
					return;
				}
				this.timer.clean({
					index: index + '_DELETE'
				});
				fields.deleted = 'N';
				fields.status = sale_checkout_const.Loader.status.wait;
				this.announceRowChange('CHECKOUT_CONTROLLER_ANNOUNCE_BASKET_ITEM_RESTORED', fields);

				//todo: send all fields ?
				this.pool.add(sale_checkout_const.Pool.action.restore, index, {
					basePrice: fields.basePrice,
					baseSum: fields.baseSum,
					currency: fields.currency,
					discount: fields.discount,
					id: fields.id,
					measureText: fields.measureText,
					module: fields.module,
					name: fields.name,
					price: fields.price,
					product: fields.product,
					productProviderClass: fields.productProviderClass,
					props: fields.props,
					quantity: fields.quantity,
					sum: fields.sum
				});
				this.changeItem({
					index,
					fields
				});
				this.shelveCommit();
			}

			/**
			 * What has happened to the row and the start of the recalculation are one action and go as one message.
			 *
			 * @private
			 */
			announceRowChange(messageId, fields) {
				const wait = main_core.Loc.getMessage('CHECKOUT_CONTROLLER_ANNOUNCE_BASKET_WAIT');
				if (messageId === null) {
					sale_checkout_lib.Announcer.announce(wait);
					return;
				}
				const change = main_core.Loc.getMessage(messageId, {
					'#PRODUCT_NAME#': fields.name
				});
				sale_checkout_lib.Announcer.announce(`${change}. ${wait}`);
			}

			/**
			 * @private
			 */
			handlerChangeQuantity(event) {
				// let data = event.getData().data;
				let index = event.getData().index;
				let fields = this.getItem(index);
				let quantity = fields.quantity;
				let ratio = fields.product.ratio;
				let available = fields.product.availableQuantity;
				quantity = sale_checkout_lib.Basket.roundValue(quantity);
				ratio = sale_checkout_lib.Basket.roundValue(ratio);
				quantity = isNaN(quantity) ? 0 : quantity;
				if (ratio > 0 && quantity < ratio) {
					quantity = ratio;
				}
				if (sale_checkout_lib.Product.isService(fields)) ; else {
					// for products
					if (sale_checkout_lib.Product.isLimitedQuantity(fields)) {
						if (available > 0 && quantity > available) {
							quantity = available;
						}
					}
				}
				quantity = sale_checkout_lib.Basket.toFixed(quantity, ratio, available);
				if (fields.quantity !== quantity) {
					this.setQuantity(index, quantity);
				}
			}

			/**
			 * @private
			 */
			handlerQuantityPlus(event) {
				let index = event.getData().index;
				let fields = this.getItem(index);
				let quantity = fields.quantity;
				let ratio = fields.product.ratio;
				let available = fields.product.availableQuantity;
				quantity = sale_checkout_lib.Basket.roundValue(quantity);
				ratio = sale_checkout_lib.Basket.roundValue(ratio);
				quantity = quantity + ratio;
				if (sale_checkout_lib.Basket.isValueFloat(quantity)) {
					quantity = sale_checkout_lib.Basket.roundFloatValue(quantity);
				}
				if (sale_checkout_lib.Product.isService(fields)) ; else {
					// for products
					if (sale_checkout_lib.Product.isLimitedQuantity(fields)) {
						if (available > 0 && quantity > available) {
							quantity = available;
						}
					}
				}
				quantity = sale_checkout_lib.Basket.toFixed(quantity, ratio, available);
				if (fields.quantity < quantity) {
					this.setQuantity(index, quantity);
				}
			}

			/**
			 * @private
			 */
			handlerQuantityMinus(event) {
				let index = event.getData().index;
				let fields = this.getItem(index);
				let quantity = fields.quantity;
				let ratio = fields.product.ratio;
				let available = fields.product.availableQuantity;
				quantity = sale_checkout_lib.Basket.roundValue(quantity);
				ratio = sale_checkout_lib.Basket.roundValue(ratio);
				let delta = quantity = quantity - ratio;
				if (sale_checkout_lib.Basket.isValueFloat(quantity)) {
					quantity = sale_checkout_lib.Basket.roundFloatValue(quantity);
					delta = sale_checkout_lib.Basket.roundFloatValue(delta);
				}
				if (ratio > 0 && quantity < ratio) {
					quantity = ratio;
				}
				if (sale_checkout_lib.Product.isService(fields)) ; else {
					// for products
					if (sale_checkout_lib.Product.isLimitedQuantity(fields)) {
						if (available > 0 && quantity > available) {
							quantity = available;
						}
					}
				}
				quantity = sale_checkout_lib.Basket.toFixed(quantity, ratio, available);
				if (delta >= ratio) {
					this.setQuantity(index, quantity);
				}
			}

			/**
			 * @private
			 */
			commit() {
				return new Promise((resolve, reject) => {
					let fields = {};
					if (this.pool.isEmpty() === false) {
						fields = this.pool.get();
						this.pool.clean();
						const component = sale_checkout_const.Component.bitrixSaleOrderCheckout;
						const cmd = sale_checkout_const.RestMethod.saleEntityRecalculateBasket;
						main_core.ajax.runComponentAction(component, cmd, {
							data: {
								actions: fields
							},
							signedParameters: this.store.getters['application/getSignedParameters']
						}).then(result => this.executeRestAnswer(cmd, result, this.pool).then(() => this.commit().then(() => resolve()))).catch();
					} else {
						resolve();
					}
				});
			}

			/**
			 * @private
			 */
			shelveCommit(index = 'BASKET') {
				if (this.isRunning() === false) {
					this.timer.create(300, index, () => {
						this.setRunningY();
						this.commit().then(() => this.setRunningN());
					});
				}
			}

			/**
			 * @private
			 */
			getStatus() {
				return this.store.getters['basket/getStatus'];
			}

			/**
			 * @private
			 */
			setStatusWait() {
				let app = {
					status: sale_checkout_const.Loader.status.wait
				};
				return this.store.dispatch('basket/setStatus', app);
			}

			/**
			 * @private
			 */
			setStatusNone() {
				let app = {
					status: sale_checkout_const.Loader.status.none
				};
				return this.store.dispatch('basket/setStatus', app);
			}

			/**
			 * @private
			 */
			handlerNeedRefreshY() {
				this.setNeedRefreshY();
				this.setStatusWait();
			}

			/**
			 * @private
			 */
			handlerNeedRefreshN() {
				this.setNeedRefreshN();
				this.setStatusNone();
			}

			/**
			 * @private
			 */
			setNeedRefreshY() {
				let app = {
					needRefresh: 'Y'
				};
				return this.store.dispatch('basket/setNeedRefresh', app);
			}

			/**
			 * @private
			 */
			setNeedRefreshN() {
				let app = {
					needRefresh: 'N'
				};
				return this.store.dispatch('basket/setNeedRefresh', app);
			}

			/**
			 * @private
			 */
			handlerChangeSku(event) {
				let offerId = event.getData().data[0].ID;
				let index = event.getData().index;
				let fields = this.getItem(index);
				if (fields.status === sale_checkout_const.Loader.status.wait) {
					return;
				}
				fields.status = sale_checkout_const.Loader.status.wait;

				// the choice itself is named by the tree of the row
				this.announceRowChange(null, fields);
				this.pool.add(sale_checkout_const.Pool.action.offer, index, {
					id: fields.id,
					fields: {
						offerId: offerId
					}
				});
				this.changeItem({
					index,
					fields
				});
				this.shelveCommit();
			}
		}

		// the page opens on the editing stage and nothing returns to it, so it is not announced;
		// the screens of a placed order are said by their heading, which names the screen the focus enters
		const stageMessageId = {
			[sale_checkout_const.Application.stage.view]: 'CHECKOUT_CONTROLLER_ANNOUNCE_STAGE_VIEW',
			[sale_checkout_const.Application.stage.empty]: 'CHECKOUT_CONTROLLER_ANNOUNCE_STAGE_EMPTY'
		};
		const waitMessageId = {
			'application/setStatus': {
				[sale_checkout_const.Loader.status.wait]: 'CHECKOUT_CONTROLLER_ANNOUNCE_ORDER_WAIT',
				[sale_checkout_const.Loader.status.none]: 'CHECKOUT_CONTROLLER_ANNOUNCE_ORDER_WAIT_END'
			},
			// the end of the basket wait is said by its own result, the recalculated total below
			'basket/setStatus': {
				[sale_checkout_const.Loader.status.wait]: 'CHECKOUT_CONTROLLER_ANNOUNCE_BASKET_WAIT'
			}
		};
		const errorMutations = new Set(['application/setErrors', 'basket/setErrors', 'property/setErrors']);
		const clearErrorMutations = new Map([['application/clearErrors', 'application/setErrors'], ['basket/clearErrors', 'basket/setErrors'], ['property/clearErrors', 'property/setErrors']]);
		class Application {
			constructor(option) {
				this.init(option).then(() => this.initProvider()).then(() => this.iniController()).then(() => this.subscribeToEvents()).then(() => this.subscribeToStoreChanges());
			}

			/**
			 * @private
			 */
			init(option) {
				this.store = option.store;
				this.orderSaveAllowed = false;
				this.preselectedConsentsIsSubmitted = false;
				this.orderRefused = false;
				return new Promise((resolve, reject) => resolve());
			}

			/**
			 * @private
			 */
			isAllowOrderSave() {
				return this.orderSaveAllowed;
			}

			/**
			 * @private
			 */
			allowOrderSave() {
				this.orderSaveAllowed = true;
			}

			/**
			 * @private
			 */
			disallowOrderSave() {
				this.orderSaveAllowed = false;
			}

			/**
			 * @private
			 */
			initProvider() {
				this.provider = sale_checkout_provider_rest.BasketRestHandler.create({
					store: this.store
				});
				return new Promise((resolve, reject) => resolve());
			}

			/**
			 * @private
			 */
			iniController() {
				this.basket = new Basket().setStore(this.store).setProvider(this.provider);
				return new Promise((resolve, reject) => resolve());
			}

			/**
			 * @private
			 */
			executeRestAnswer(command, result, extra) {
				return this.provider.execute(command, result, extra);
			}

			/**
			 * @private
			 */
			subscribeToEvents() {
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.order.success, e => this.basket.handlerOrderSuccess(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.removeProduct, e => this.basket.handlerRemoveProductSuccess(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.restoreProduct, e => this.basket.handlerRestoreProductSuccess(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.buttonRemoveProduct, main_core.Runtime.debounce(e => this.basket.handlerRemove(e), 500, this));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.buttonPlusProduct, e => this.basket.handlerQuantityPlus(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.buttonMinusProduct, e => this.basket.handlerQuantityMinus(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.inputChangeQuantityProduct, e => this.basket.handlerChangeQuantity(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.buttonRestoreProduct, main_core.Runtime.debounce(e => this.basket.handlerRestore(e), 500, this));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.needRefresh, e => this.basket.handlerNeedRefreshY(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.refreshAfter, e => this.basket.handlerNeedRefreshN(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.changeSku, e => this.basket.handlerChangeSku(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.consent.refused, e => this.handlerConsentRefused(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.consent.accepted, e => this.handlerConsentAccepted(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.property.validate, e => this.handlerValidateProperty(e));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.element.buttonCheckout, main_core.Runtime.debounce(() => this.handlerCheckout(), 1000, this));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.element.buttonShipping, main_core.Runtime.debounce(() => this.handlerShipping(), 1000, this));
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.paysystem.beforeInitList, () => this.paySystemSetStatusWait());
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.paysystem.afterInitList, () => this.paySystemSetStatusNone());
			}

			/**
			 * @private
			 */
			subscribeToStoreChanges() {
				this.announcedStage = this.store.getters['application/getStage'];
				this.announcedStatus = {};
				this.announcedErrors = new Map();
				this.unsaidErrors = [];
				this.store.subscribe(mutation => this.handlerStoreMutation(mutation));
				return new Promise((resolve, reject) => resolve());
			}

			/**
			 * The single source of announcements, so that no block of the checkout keeps a live region of its own.
			 *
			 * @private
			 */
			handlerStoreMutation(mutation) {
				if (errorMutations.has(mutation.type)) {
					this.announceErrors(mutation.type, mutation.payload);
					return;
				}
				if (clearErrorMutations.has(mutation.type)) {
					this.announcedErrors.delete(clearErrorMutations.get(mutation.type));
					return;
				}
				if (mutation.type === 'application/setStage') {
					this.announceStage(mutation.payload.stage);
					return;
				}
				if (mutation.type === 'basket/setTotal') {
					if (!this.isOrderPlaced()) {
						sale_checkout_lib.Announcer.announceRecalculation(main_core.Loc.getMessage('CHECKOUT_CONTROLLER_ANNOUNCE_BASKET_TOTAL'));
					}
					return;
				}
				this.announceWait(mutation.type, mutation.payload);
			}

			/**
			 * Only new errors are said, since every field rewrites the whole list on blur. The errors of one
			 * server answer go as one message: an assertive message cuts off the one before it.
			 *
			 * @private
			 */
			announceErrors(type, payload) {
				const errors = this.collectErrors(payload);
				const announced = this.announcedErrors.get(type) ?? new Set();
				this.announcedErrors.set(type, new Set(errors.map(({
					key
				}) => key)));
				const messages = errors.filter(({
					key
				}) => !announced.has(key)).map(({
					message
				}) => message);
				if (messages.length === 0) {
					return;
				}
				if (this.unsaidErrors.length === 0) {
					queueMicrotask(() => {
						sale_checkout_lib.Announcer.announceError(this.unsaidErrors.join(' '));
						this.unsaidErrors = [];
					});
				}
				this.unsaidErrors.push(...messages);
			}

			/**
			 * General and property errors carry their text; a basket row error keeps it in a list of its own.
			 *
			 * @private
			 */
			collectErrors(payload) {
				if (!main_core.Type.isArrayFilled(payload)) {
					return [];
				}
				const errors = [];
				payload.forEach(error => {
					const list = main_core.Type.isArrayFilled(error.list) ? error.list : [error];
					list.forEach(item => {
						if (main_core.Type.isStringFilled(item.message)) {
							errors.push({
								key: error.propertyId ?? [error.index, item.message].join(':'),
								message: this.getErrorAnnouncement(item)
							});
						}
					});
				});
				return errors;
			}

			/**
			 * The required-field error does not name the field, and a reader says it once the focus has moved on.
			 *
			 * @private
			 */
			getErrorAnnouncement(error) {
				if (error.message !== main_core.Loc.getMessage('CHECKOUT_CONTROLLER_PROPERTY_ERROR_REQUIRED')) {
					return error.message;
				}
				const property = this.store.getters['property/getProperty'].find(({
					id
				}) => id === error.propertyId);
				if (!main_core.Type.isStringFilled(property?.name)) {
					return error.message;
				}
				return main_core.Loc.getMessage('CHECKOUT_CONTROLLER_ANNOUNCE_PROPERTY_ERROR_REQUIRED', {
					'#PROPERTY_NAME#': property.name
				});
			}

			/**
			 * A placed order is said by the heading of its screen: the end of the wait and a new total would only repeat it.
			 *
			 * @private
			 */
			isOrderPlaced() {
				return this.store.getters['application/getStage'] === sale_checkout_const.Application.stage.success;
			}

			/**
			 * @private
			 */
			announceStage(stage) {
				if (stage === this.announcedStage) {
					return;
				}
				this.announcedStage = stage;
				if (stageMessageId[stage]) {
					sale_checkout_lib.Announcer.announce(main_core.Loc.getMessage(stageMessageId[stage]));
				}
			}

			/**
			 * @private
			 */
			announceWait(type, payload) {
				const messageIds = waitMessageId[type];
				if (!messageIds || this.announcedStatus[type] === payload.status) {
					return;
				}
				this.announcedStatus[type] = payload.status;
				if (this.isOrderPlaced() || type === 'application/setStatus' && this.orderRefused) {
					return;
				}
				sale_checkout_lib.Announcer.announce(main_core.Loc.getMessage(messageIds[payload.status]));
			}

			/**
			 * @private
			 */
			paySystemSetStatusWait() {
				const paySystem = {
					status: sale_checkout_const.Loader.status.wait
				};
				return this.store.dispatch('pay-system/setStatus', paySystem);
			}

			/**
			 * @private
			 */
			paySystemSetStatusNone() {
				const paySystem = {
					status: sale_checkout_const.Loader.status.none
				};
				return this.store.dispatch('pay-system/setStatus', paySystem);
			}

			/**
			 * @private
			 */
			appSetStatusWait() {
				const app = {
					status: sale_checkout_const.Loader.status.wait
				};
				return this.store.dispatch('application/setStatus', app);
			}

			/**
			 * @private
			 */
			appSetStatusNone() {
				const app = {
					status: sale_checkout_const.Loader.status.none
				};
				return this.store.dispatch('application/setStatus', app);
			}

			/**
			 * @private
			 */
			handlerConsentAccepted(event) {
				const item = event.getData()[0];
				this.store.dispatch('consent/setChecked', {
					id: item.config.id,
					checked: 'Y'
				});
				if (this.isAllowOrderSave()) {
					this.handlerCheckout();
				}
			}

			/**
			 * @private
			 */
			handlerConsentRefused(event) {
				const item = event.getData()[0];
				this.store.dispatch('consent/setChecked', {
					id: item.config.id,
					checked: 'N'
				});
				this.disallowOrderSave();
			}
			sendEventsForCheckedConsents() {
				const consent = this.store.getters['consent/get'];
				consent.items.forEach(item => {
					if (item.checked === 'Y') {
						main_core_events.EventEmitter.emit(`${sale_checkout_const.Consent.validate.submit}-${item.id}`, []);
					}
				});
			}
			getFirstRequiredUncheckedConsentItem() {
				const consent = this.store.getters['consent/get'];
				return consent.items.find(item => item.required === 'Y' && item.checked === 'N');
			}

			/**
			 * @private
			 */
			handlerCheckout() {
				this.allowOrderSave();
				if (!this.preselectedConsentsIsSubmitted) {
					this.sendEventsForCheckedConsents();
					this.preselectedConsentsIsSubmitted = true;
				}
				const firstRequiredUncheckedConsentItem = this.getFirstRequiredUncheckedConsentItem();
				if (firstRequiredUncheckedConsentItem) {
					// the dialog of the consent opens without a word of why the order has not gone
					sale_checkout_lib.Announcer.announce(main_core.Loc.getMessage('CHECKOUT_CONTROLLER_ANNOUNCE_CONSENT_REQUIRED'));
					main_core_events.EventEmitter.emit(`${sale_checkout_const.Consent.validate.submit}-${firstRequiredUncheckedConsentItem.id}`, []);
					return;
				}

				// this.propertiesValidate();
				// this.propertiesIsValid() ? alert('propsSuccess'):alert('propsError')

				// a new attempt is said from its start, whatever the server answered the last time
				this.orderRefused = false;
				this.appSetStatusWait();
				this.saveOrder().then(() => {
					this.appSetStatusNone().then(() => {
						const order = this.store.getters['order/getOrder'];
						if (order.id > 0) {
							const url = sale_checkout_lib.History.pushState(this.store.getters['application/getPathLocation'], {
								accountNumber: order.accountNumber,
								access: order.hash
							});
							this.store.dispatch('application/setPathLocation', url);
						}
					});
				}).catch(() => this.appSetStatusNone());
			}

			/**
			 * @private
			 */
			handlerShipping() {
				this.store.dispatch('application/setStage', {
					stage: sale_checkout_const.Application.stage.view
				});
				// todo
				delete BX.UserConsent;
				const order = this.store.getters['order/getOrder'];
				if (order.id > 0) {
					const component = sale_checkout_const.Component.bitrixSaleOrderCheckout;
					const cmd = sale_checkout_const.RestMethod.saleEntityPaymentPay;
					return main_core.ajax.runComponentAction(component, cmd, {
						data: {
							fields: {
								orderId: order.id,
								accessCode: order.hash
							}
						},
						signedParameters: this.store.getters['application/getSignedParameters']
					});
				}
			}

			/**
			 * @private
			 */
			saveOrder() {
				const component = sale_checkout_const.Component.bitrixSaleOrderCheckout;
				const cmd = sale_checkout_const.RestMethod.saleEntitySaveOrder;

				// the answer to a new attempt is said in full, even when it repeats the last one
				this.announcedErrors.clear();
				return main_core.ajax.runComponentAction(component, cmd, {
					data: {
						fields: {
							siteId: this.store.getters['application/getSiteId'],
							personTypeId: this.store.getters['application/getPersonTypeId'],
							tradingPlatformId: this.store.getters['application/getTradingPlatformId'],
							properties: this.preparePropertyFields(this.getPropertyList())
						}
					},
					signedParameters: this.store.getters['application/getSignedParameters']
				}).then(result => this.executeRestAnswer(cmd, result)).catch(result => {
					// the errors are the whole answer to a refused order, the end of the wait is not said after them
					this.orderRefused = true;
					return this.executeRestAnswer(cmd, {
						error: result.errors
					});
				});
			}

			/**
			 * @private
			 */
			handlerValidateProperty(event) {
				const property = {};
				property.index = event.getData().index;
				property.fields = this.getPropertyItem(property.index);
				this.changeValidatedProperty(property);
			}

			/**
			 * @private
			 */
			getPropertyItem(index) {
				return this.store.getters['property/get'](index);
			}

			/**
			 * @private
			 */
			changeValidatedProperty(property) {
				const fields = property.fields;
				let errors = this.store.getters['property/getErrors'];
				if (this.propertyDataValidate(fields)) {
					errors = this.deletePropertyError(fields, errors);
				} else {
					errors = this.addPropertyError(fields, errors);
				}
				this.provider.setModelPropertyError(errors);
			}

			/**
			 * @private
			 */
			propertyDataValidate(fields) {
				return !(fields.required === 'Y' && fields.value === '');
			}

			/**
			 * @private
			 */
			deletePropertyError(fields, errors) {
				for (const errorIndex in errors) {
					if (errors[errorIndex].propertyId === fields.id) {
						errors.splice(errorIndex, 1);
					}
				}
				return errors;
			}

			/**
			 * @private
			 */
			addPropertyError(fields, errors) {
				const errorIds = errors.map(item => item.propertyId);
				if (!errorIds.includes(fields.id)) {
					// without the text the form shows an empty message block and a reader hears nothing
					errors.push({
						message: main_core.Loc.getMessage('CHECKOUT_CONTROLLER_PROPERTY_ERROR_REQUIRED'),
						propertyId: fields.id
					});
				}
				return errors;
			}

			/**
			 * @private
			 */
			getPropertyList() {
				const result = [];
				const list = this.store.getters['property/getProperty'];
				try {
					for (const key in list) {
						if (!list.hasOwnProperty(key)) {
							continue;
						}
						result[list[key].id] = list[key];
					}
				} catch {}
				return result;
			}

			/**
			 * @private
			 */
			preparePropertyFields(list) {
				const fields = {};
				list.forEach((property, inx) => {
					fields[inx] = property.value;
				});
				return fields;
			}
		}

		exports.Application = Application;
		exports.Basket = Basket;

})(this.BX.Sale.Checkout.Controller = this.BX.Sale.Checkout.Controller || {}, BX, BX.Sale.Checkout.Lib, BX.Sale.Checkout.Const, BX.Event, BX.Sale.Checkout.Provider);
//# sourceMappingURL=controller.bundle.js.map
