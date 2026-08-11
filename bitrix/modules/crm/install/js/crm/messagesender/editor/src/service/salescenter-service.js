import { Runtime, Text, Type } from 'main.core';
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

	constructor({ logger }: { logger: Logger })
	{
		this.#logger = logger;
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

	openApplication(customData: Object): Promise<ApplicationResult>
	{
		return Runtime.loadExtension('salescenter.manager')
			.then(({ Manager }) => {
				const { ownerTypeId, ownerId, mode, st, canSendMessage } = customData;

				/** @see BX.Salescenter.Manager.openApplication */
				return Manager.openApplication({
					disableSendButton: canSendMessage ? '' : 'y',
					context: 'sms',
					ownerTypeId,
					ownerId,
					mode,
					st,
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

				this.#logger.warn('Unknown salescenter action', result.get('action'));

				return {};
			})
			.catch((error) => {
				this.#logger.error('Failed to open salescenter application', error);
				throw error;
			});
	}
}
