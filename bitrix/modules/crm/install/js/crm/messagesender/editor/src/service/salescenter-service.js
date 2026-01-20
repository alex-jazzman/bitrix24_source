import { Runtime, Text, Type } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import { type Logger } from './logger';

export type ApplicationResult = {
	source?: string,
	page?: {
		name: string,
		url: string,
	},
	payment?: {
		name: string,
		paymentId: ?number,
		shipmentId: ?number,
	},
	compilation?: {
		name: string,
		productIds: Array<number>,
	}
};

export class SalescenterService
{
	#logger: Logger;
	#store: Store;

	constructor(params: { logger: Logger, store: Store })
	{
		this.#logger = params.logger;
		this.#store = params.store;
	}

	showSalescenterDisabledSlider(): void
	{
		Runtime.loadExtension('salescenter.tool-availability-manager')
			.then(({ ToolAvailabilityManager }) => {
				/** @see BX.Salescenter.ToolAvailabilityManager.openSalescenterToolDisabledSlider */
				ToolAvailabilityManager.openSalescenterToolDisabledSlider();
			})
			.catch((error) => {
				this.#logger.error('Failed to load salescenter.tool-availability-manager', error);
			});
	}

	openApplication(): Promise<ApplicationResult>
	{
		return Runtime.loadExtension('salescenter.manager')
			.then(({ Manager }) => {
				/** @see BX.Salescenter.Manager.openApplication */
				return Manager.openApplication({
					disableSendButton: this.#store.getters['channels/canSendMessage'] ? '' : 'y',
					context: 'sms',
					ownerTypeId: this.#store.state.application.context.entityTypeId,
					ownerId: this.#store.state.application.context.entityId,
					mode: this.#store.state.application.contentProviders.salescenter.mode,
					st: {
						tool: 'crm',
						category: 'payments',
						event: 'payment_create_click',
						c_section: 'crm_sms',
						c_sub_section: 'web',
						type: 'delivery_payment',
					},
				});
			})
			.then((result: BX.SidePanel.Dictionary): ApplicationResult => {
				if (result.get('action') === 'sendPage' && Type.isStringFilled(result.get('page')?.url))
				{
					return {
						page: {
							name: String(result.get('page').name),
							url: String(result.get('page').url),
						},
					};
				}

				if (result.get('action') === 'sendPayment' && Type.isObject(result.get('order')))
				{
					const order = result.get('order');

					return {
						source: 'order',
						payment: {
							name: String(order.title),
							paymentId: Type.isNil(order.paymentId) ? null : Text.toInteger(order.paymentId),
							shipmentId: Type.isNil(order.shipmentId) ? null : Text.toInteger(order.shipmentId),
						},
					};
				}

				if (result.get('action') === 'sendCompilation' && Type.isObject(result.get('compilation')))
				{
					const compilation = result.get('compilation');

					let productIds = null;
					if (Type.isArray(compilation.productIds))
					{
						productIds = compilation.productIds.map((id) => Text.toInteger(id));
					}

					return {
						source: 'deal',
						compilation: {
							name: String(compilation.title),
							productIds,
						},
					};
				}

				return {};
			})
			.catch((error) => {
				this.#logger.error('Failed to open salescenter application', error);
				throw error;
			});
	}
}
