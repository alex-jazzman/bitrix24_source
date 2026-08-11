import { ajax as Ajax, type JsonObject, Type } from 'main.core';

import { replaceCustomMessagePlaceholders } from 'messageservice.message.editor';

import { BaseContentProvider } from '../content-provider/base-content-provider';
import { type State } from '../editor';

type Params = {
	entityTypeId: ?number,
	entityId: ?number,
	providerFactory: Object,
};

export class SendService
{
	#entityTypeId: ?number;
	#entityId: ?number;
	#providerFactory;

	constructor({ entityTypeId, entityId, providerFactory }: Params)
	{
		this.#entityTypeId = entityTypeId;
		this.#entityId = entityId;
		this.#providerFactory = providerFactory;
	}

	sendMessage(state: State): Promise<void>
	{
		const params = this.#prepareParams(state);

		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.activity.sms.send', {
				data: {
					ownerTypeId: this.#entityTypeId,
					ownerId: this.#entityId,
					params,
				},
			})
				.then((result) => {
					this.#resetProviderData();
					resolve(result);
				})
				.catch(reject)
			;
		});
	}

	#prepareParams(state: State): JsonObject
	{
		const { channel } = state;

		if (channel.backend.senderCode === 'bitrix24')
		{
			return this.#prepareNotificationParams(state);
		}

		if (channel.isTemplatesBased)
		{
			return this.#prepareTemplateParams(state);
		}

		return this.#prepareCustomTextParams(state);
	}

	#prepareNotificationParams(state: State): JsonObject
	{
		return {
			...this.#prepareCommonParams(state),
			signedTemplate: state.notificationTemplate.signed,
		};
	}

	#prepareTemplateParams(state: State): JsonObject
	{
		const { template } = state;

		return {
			...this.#prepareCommonParams(state),
			body: state.message.body,
			template: template.ID,
			templateOriginalId: template.ORIGINAL_ID,
			isTemplateWithPlaceholders: Type.isPlainObject(template.PLACEHOLDERS),
			isReplacePlaceholders: true,
		};
	}

	#prepareCustomTextParams(state: State): JsonObject
	{
		return {
			...this.#prepareCommonParams(state),
			body: replaceCustomMessagePlaceholders(
				state.message.body,
				(value) => `{${value}}`,
			),
			...this.#collectProviderData(),
			isReplacePlaceholders: true,
		};
	}

	#collectProviderData(): Object
	{
		let data = {};
		for (const provider of this.#providerFactory.getProviders())
		{
			if (provider instanceof BaseContentProvider)
			{
				data = { ...data, ...provider.getSendData() };
			}
		}

		return data;
	}

	#resetProviderData(): void
	{
		for (const provider of this.#providerFactory.getProviders())
		{
			if (provider instanceof BaseContentProvider)
			{
				provider.resetSendData();
			}
		}
	}

	#prepareCommonParams(state: State): JsonObject
	{
		const { channel, from, to } = state;
		const addressSource = to.customData?.addressSource ?? {};

		return {
			senderId: channel.backend.id,
			from: from.id,
			to: to.value,
			entityTypeId: addressSource.entityTypeId,
			entityId: addressSource.entityId,
		};
	}
}
