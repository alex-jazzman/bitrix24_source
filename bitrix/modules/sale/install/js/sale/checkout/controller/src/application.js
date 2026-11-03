import { Loc, Runtime, Type, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BasketRestHandler } from 'sale.checkout.provider.rest';
import {
	Application as ApplicationConst,
	RestMethod as RestMethodConst,
	Component as ComponentConst,
	Consent as ConsentConst,
	Loader as LoaderConst,
	EventType,
} from 'sale.checkout.const';

import { Announcer, History } from 'sale.checkout.lib';

import { Basket } from './basket';

// the page opens on the editing stage and nothing returns to it, so it is not announced;
// the screens of a placed order are said by their heading, which names the screen the focus enters
const stageMessageId = {
	[ApplicationConst.stage.view]: 'CHECKOUT_CONTROLLER_ANNOUNCE_STAGE_VIEW',
	[ApplicationConst.stage.empty]: 'CHECKOUT_CONTROLLER_ANNOUNCE_STAGE_EMPTY',
};

const waitMessageId = {
	'application/setStatus':
	{
		[LoaderConst.status.wait]: 'CHECKOUT_CONTROLLER_ANNOUNCE_ORDER_WAIT',
		[LoaderConst.status.none]: 'CHECKOUT_CONTROLLER_ANNOUNCE_ORDER_WAIT_END',
	},
	// the end of the basket wait is said by its own result, the recalculated total below
	'basket/setStatus':
	{
		[LoaderConst.status.wait]: 'CHECKOUT_CONTROLLER_ANNOUNCE_BASKET_WAIT',
	},
};

const errorMutations = new Set([
	'application/setErrors',
	'basket/setErrors',
	'property/setErrors',
]);

const clearErrorMutations = new Map([
	['application/clearErrors', 'application/setErrors'],
	['basket/clearErrors', 'basket/setErrors'],
	['property/clearErrors', 'property/setErrors'],
]);

export class Application
{
	constructor(option)
	{
		this.init(option)
			.then(() => this.initProvider())
			.then(() => this.iniController())
			.then(() => this.subscribeToEvents())
			.then(() => this.subscribeToStoreChanges())
		;
	}

	/**
	 * @private
	 */
	init(option)
	{
		this.store = option.store;
		this.orderSaveAllowed = false;
		this.preselectedConsentsIsSubmitted = false;
		this.orderRefused = false;

		return new Promise((resolve, reject) => resolve());
	}

	/**
	 * @private
	 */
	isAllowOrderSave(): boolean
	{
		return this.orderSaveAllowed;
	}

	/**
	 * @private
	 */
	allowOrderSave(): void
	{
		this.orderSaveAllowed = true;
	}

	/**
	 * @private
	 */
	disallowOrderSave(): void
	{
		this.orderSaveAllowed = false;
	}

	/**
	 * @private
	 */
	initProvider()
	{
		this.provider = BasketRestHandler.create({ store: this.store });

		return new Promise((resolve, reject) => resolve());
	}

	/**
	 * @private
	 */
	iniController()
	{
		this.basket = new Basket().setStore(this.store).setProvider(this.provider);

		return new Promise((resolve, reject) => resolve());
	}

	/**
	 * @private
	 */
	executeRestAnswer(command, result, extra)
	{
		return this.provider.execute(command, result, extra);
	}

	/**
	 * @private
	 */
	subscribeToEvents()
	{
		EventEmitter.subscribe(EventType.order.success, (e) => this.basket.handlerOrderSuccess(e));

		EventEmitter.subscribe(EventType.basket.removeProduct, (e) => this.basket.handlerRemoveProductSuccess(e));
		EventEmitter.subscribe(EventType.basket.restoreProduct, (e) => this.basket.handlerRestoreProductSuccess(e));

		EventEmitter.subscribe(EventType.basket.buttonRemoveProduct, Runtime.debounce((e) => this.basket.handlerRemove(e), 500, this));
		EventEmitter.subscribe(EventType.basket.buttonPlusProduct, (e) => this.basket.handlerQuantityPlus(e));
		EventEmitter.subscribe(EventType.basket.buttonMinusProduct, (e) => this.basket.handlerQuantityMinus(e));
		EventEmitter.subscribe(EventType.basket.inputChangeQuantityProduct, (e) => this.basket.handlerChangeQuantity(e));
		EventEmitter.subscribe(EventType.basket.buttonRestoreProduct, Runtime.debounce((e) => this.basket.handlerRestore(e), 500, this));
		EventEmitter.subscribe(EventType.basket.needRefresh, (e) => this.basket.handlerNeedRefreshY(e));
		EventEmitter.subscribe(EventType.basket.refreshAfter, (e) => this.basket.handlerNeedRefreshN(e));

		EventEmitter.subscribe(EventType.basket.changeSku, (e) => this.basket.handlerChangeSku(e));

		EventEmitter.subscribe(EventType.consent.refused, (e) => this.handlerConsentRefused(e));
		EventEmitter.subscribe(EventType.consent.accepted, (e) => this.handlerConsentAccepted(e));

		EventEmitter.subscribe(EventType.property.validate, (e) => this.handlerValidateProperty(e));

		EventEmitter.subscribe(EventType.element.buttonCheckout, Runtime.debounce(() => this.handlerCheckout(), 1000, this));
		EventEmitter.subscribe(EventType.element.buttonShipping, Runtime.debounce(() => this.handlerShipping(), 1000, this));

		EventEmitter.subscribe(EventType.paysystem.beforeInitList, () => this.paySystemSetStatusWait());
		EventEmitter.subscribe(EventType.paysystem.afterInitList, () => this.paySystemSetStatusNone());
	}

	/**
	 * @private
	 */
	subscribeToStoreChanges()
	{
		this.announcedStage = this.store.getters['application/getStage'];
		this.announcedStatus = {};
		this.announcedErrors = new Map();
		this.unsaidErrors = [];

		this.store.subscribe((mutation) => this.handlerStoreMutation(mutation));

		return new Promise((resolve, reject) => resolve());
	}

	/**
	 * The single source of announcements, so that no block of the checkout keeps a live region of its own.
	 *
	 * @private
	 */
	handlerStoreMutation(mutation)
	{
		if (errorMutations.has(mutation.type))
		{
			this.announceErrors(mutation.type, mutation.payload);

			return;
		}

		if (clearErrorMutations.has(mutation.type))
		{
			this.announcedErrors.delete(clearErrorMutations.get(mutation.type));

			return;
		}

		if (mutation.type === 'application/setStage')
		{
			this.announceStage(mutation.payload.stage);

			return;
		}

		if (mutation.type === 'basket/setTotal')
		{
			if (!this.isOrderPlaced())
			{
				Announcer.announceRecalculation(Loc.getMessage('CHECKOUT_CONTROLLER_ANNOUNCE_BASKET_TOTAL'));
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
	announceErrors(type, payload)
	{
		const errors = this.collectErrors(payload);
		const announced = this.announcedErrors.get(type) ?? new Set();

		this.announcedErrors.set(type, new Set(errors.map(({ key }) => key)));

		const messages = errors
			.filter(({ key }) => !announced.has(key))
			.map(({ message }) => message)
		;

		if (messages.length === 0)
		{
			return;
		}

		if (this.unsaidErrors.length === 0)
		{
			queueMicrotask(() => {
				Announcer.announceError(this.unsaidErrors.join(' '));
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
	collectErrors(payload)
	{
		if (!Type.isArrayFilled(payload))
		{
			return [];
		}

		const errors = [];

		payload.forEach((error) => {
			const list = Type.isArrayFilled(error.list) ? error.list : [error];

			list.forEach((item) => {
				if (Type.isStringFilled(item.message))
				{
					errors.push({
						key: error.propertyId ?? [error.index, item.message].join(':'),
						message: this.getErrorAnnouncement(item),
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
	getErrorAnnouncement(error): string
	{
		if (error.message !== Loc.getMessage('CHECKOUT_CONTROLLER_PROPERTY_ERROR_REQUIRED'))
		{
			return error.message;
		}

		const property = this.store.getters['property/getProperty'].find(({ id }) => id === error.propertyId);

		if (!Type.isStringFilled(property?.name))
		{
			return error.message;
		}

		return Loc.getMessage('CHECKOUT_CONTROLLER_ANNOUNCE_PROPERTY_ERROR_REQUIRED', {
			'#PROPERTY_NAME#': property.name,
		});
	}

	/**
	 * A placed order is said by the heading of its screen: the end of the wait and a new total would only repeat it.
	 *
	 * @private
	 */
	isOrderPlaced(): boolean
	{
		return this.store.getters['application/getStage'] === ApplicationConst.stage.success;
	}

	/**
	 * @private
	 */
	announceStage(stage)
	{
		if (stage === this.announcedStage)
		{
			return;
		}

		this.announcedStage = stage;

		if (stageMessageId[stage])
		{
			Announcer.announce(Loc.getMessage(stageMessageId[stage]));
		}
	}

	/**
	 * @private
	 */
	announceWait(type, payload)
	{
		const messageIds = waitMessageId[type];

		if (!messageIds || this.announcedStatus[type] === payload.status)
		{
			return;
		}

		this.announcedStatus[type] = payload.status;

		if (this.isOrderPlaced() || (type === 'application/setStatus' && this.orderRefused))
		{
			return;
		}

		Announcer.announce(Loc.getMessage(messageIds[payload.status]));
	}

	/**
	 * @private
	 */
	paySystemSetStatusWait()
	{
		const paySystem = { status: LoaderConst.status.wait };

		return this.store.dispatch('pay-system/setStatus', paySystem);
	}

	/**
	 * @private
	 */
	paySystemSetStatusNone()
	{
		const paySystem = { status: LoaderConst.status.none };

		return this.store.dispatch('pay-system/setStatus', paySystem);
	}

	/**
	 * @private
	 */
	appSetStatusWait()
	{
		const app = { status: LoaderConst.status.wait };

		return this.store.dispatch('application/setStatus', app);
	}

	/**
	 * @private
	 */
	appSetStatusNone()
	{
		const app = { status: LoaderConst.status.none };

		return this.store.dispatch('application/setStatus', app);
	}

	/**
	 * @private
	 */
	handlerConsentAccepted(event)
	{
		const item = event.getData()[0];
		this.store.dispatch('consent/setChecked', { id: item.config.id, checked: 'Y' });
		if (this.isAllowOrderSave())
		{
			this.handlerCheckout();
		}
	}

	/**
	 * @private
	 */
	handlerConsentRefused(event)
	{
		const item = event.getData()[0];
		this.store.dispatch('consent/setChecked', { id: item.config.id, checked: 'N' });
		this.disallowOrderSave();
	}

	sendEventsForCheckedConsents(): void
	{
		const consent = this.store.getters['consent/get'];
		consent.items.forEach((item) => {
			if (item.checked === 'Y')
			{
				EventEmitter.emit(`${ConsentConst.validate.submit}-${item.id}`, []);
			}
		});
	}

	getFirstRequiredUncheckedConsentItem()
	{
		const consent = this.store.getters['consent/get'];

		return consent.items.find((item) => item.required === 'Y' && item.checked === 'N');
	}

	/**
	 * @private
	 */
	handlerCheckout()
	{
		this.allowOrderSave();
		if (!this.preselectedConsentsIsSubmitted)
		{
			this.sendEventsForCheckedConsents();
			this.preselectedConsentsIsSubmitted = true;
		}

		const firstRequiredUncheckedConsentItem = this.getFirstRequiredUncheckedConsentItem();
		if (firstRequiredUncheckedConsentItem)
		{
			// the dialog of the consent opens without a word of why the order has not gone
			Announcer.announce(Loc.getMessage('CHECKOUT_CONTROLLER_ANNOUNCE_CONSENT_REQUIRED'));
			EventEmitter.emit(`${ConsentConst.validate.submit}-${firstRequiredUncheckedConsentItem.id}`, []);

			return;
		}

		// this.propertiesValidate();
		// this.propertiesIsValid() ? alert('propsSuccess'):alert('propsError')

		// a new attempt is said from its start, whatever the server answered the last time
		this.orderRefused = false;
		this.appSetStatusWait();

		this.saveOrder()
			.then(() => {
				this.appSetStatusNone()
					.then(() => {
						const order = this.store.getters['order/getOrder'];

						if (order.id > 0)
						{
							const url = History.pushState(
								this.store.getters['application/getPathLocation'],
								{
									accountNumber: order.accountNumber,
									access: order.hash,
								},
							);

							this.store.dispatch('application/setPathLocation', url);
						}
					});
			})
			.catch(() => this.appSetStatusNone());
	}

	/**
	 * @private
	 */
	handlerShipping()
	{
		this.store.dispatch('application/setStage', { stage: ApplicationConst.stage.view });
		// todo
		delete BX.UserConsent;

		const order = this.store.getters['order/getOrder'];
		if (order.id > 0)
		{
			const component = ComponentConst.bitrixSaleOrderCheckout;
			const cmd = RestMethodConst.saleEntityPaymentPay;

			return ajax.runComponentAction(
				component,
				cmd,
				{
					data: {
						fields: {
							orderId: order.id,
							accessCode: order.hash,
						},
					},
					signedParameters: this.store.getters['application/getSignedParameters'],
				},
			);
		}
	}

	/**
	 * @private
	 */
	saveOrder()
	{
		const component = ComponentConst.bitrixSaleOrderCheckout;
		const cmd = RestMethodConst.saleEntitySaveOrder;

		// the answer to a new attempt is said in full, even when it repeats the last one
		this.announcedErrors.clear();

		return ajax.runComponentAction(
			component,
			cmd,
			{
				data: {
					fields: {
						siteId: this.store.getters['application/getSiteId'],
						personTypeId: this.store.getters['application/getPersonTypeId'],
						tradingPlatformId: this.store.getters['application/getTradingPlatformId'],
						properties: this.preparePropertyFields(
							this.getPropertyList(),
						),
					},
				},
				signedParameters: this.store.getters['application/getSignedParameters'],
			},
		)
			.then((result) => this.executeRestAnswer(cmd, result))
			.catch((result) => {
				// the errors are the whole answer to a refused order, the end of the wait is not said after them
				this.orderRefused = true;

				return this.executeRestAnswer(cmd, { error: result.errors });
			});
	}

	/**
	 * @private
	 */
	handlerValidateProperty(event)
	{
		const property = {};
		property.index = event.getData().index;
		property.fields = this.getPropertyItem(property.index);
		this.changeValidatedProperty(property);
	}

	/**
	 * @private
	 */
	getPropertyItem(index)
	{
		return this.store.getters['property/get'](index);
	}

	/**
	 * @private
	 */
	changeValidatedProperty(property)
	{
		const fields = property.fields;
		let errors = this.store.getters['property/getErrors'];
		if (this.propertyDataValidate(fields))
		{
			errors = this.deletePropertyError(fields, errors);
		}
		else
		{
			errors = this.addPropertyError(fields, errors);
		}
		this.provider.setModelPropertyError(errors);
	}

	/**
	 * @private
	 */
	propertyDataValidate(fields)
	{
		return !(fields.required === 'Y' && fields.value === '');
	}

	/**
	 * @private
	 */
	deletePropertyError(fields, errors)
	{
		for (const errorIndex in errors)
		{
			if (errors[errorIndex].propertyId === fields.id)
			{
				errors.splice(errorIndex, 1);
			}
		}

		return errors;
	}

	/**
	 * @private
	 */
	addPropertyError(fields, errors)
	{
		const errorIds = errors.map((item) => item.propertyId);
		if (!errorIds.includes(fields.id))
		{
			// without the text the form shows an empty message block and a reader hears nothing
			errors.push({
				message: Loc.getMessage('CHECKOUT_CONTROLLER_PROPERTY_ERROR_REQUIRED'),
				propertyId: fields.id,
			});
		}

		return errors;
	}

	/**
	 * @private
	 */
	getPropertyList()
	{
		const result = [];
		const list = this.store.getters['property/getProperty'];
		try
		{
			for (const key in list)
			{
				if (!list.hasOwnProperty(key))
				{
					continue;
				}

				result[list[key].id] = list[key];
			}
		}
		catch
		{}

		return result;
	}

	/**
	 * @private
	 */
	preparePropertyFields(list)
	{
		const fields = {};
		list.forEach((property, inx) => {
			fields[inx] = property.value;
		});

		return fields;
	}
}
