import { ajax as Ajax, type AjaxResponse, Cache, Runtime, Text, Type } from 'main.core';
import 'crm_common';
import { type BaseEvent, EventEmitter } from 'main.core.events';

export type PreviewerParams = {
	entityTypeId: number,
	entityId: number,
	categoryId: ?number,
};

export class PreviewLoader
{
	#entityTypeId: number = null;
	#entityId: number = null;
	#categoryId: ?number = null;
	#previewCache = new Cache.MemoryCache();

	#unsubscribe: ?() => void = null;

	constructor(params: PreviewerParams)
	{
		this.#entityTypeId = Text.toInteger(params.entityTypeId);
		if (!BX.CrmEntityType.isDefined(this.#entityTypeId))
		{
			throw new Error('PreviewLoader: entityTypeId must be a valid entity type ID');
		}

		this.#entityId = Text.toInteger(params.entityId);
		if (params.entityId <= 0)
		{
			throw new Error('PreviewLoader: entityId must be greater than 0');
		}

		this.#categoryId = Type.isNil(params.categoryId) ? null : Text.toInteger(params.categoryId);
		if (!Type.isNil(this.#categoryId) && this.#categoryId < 0)
		{
			throw new Error('PreviewLoader: categoryId must be a non-negative integer');
		}

		const internalHandler = (event: BaseEvent) => {
			const [eventData] = event.getCompatData();
			if (eventData.entityTypeId === this.#entityTypeId && eventData.entityId === this.#entityId)
			{
				this.#previewCache.clear();
			}
		};
		EventEmitter.subscribe('onCrmEntityUpdate', internalHandler);

		const unsubscribeExternal = BX.Crm.EntityEvent.subscribeToItem(this.#entityTypeId, this.#entityId, () => {
			this.#previewCache.clear();
		});

		this.#unsubscribe = () => {
			EventEmitter.unsubscribe('onCrmEntityUpdate', internalHandler);
			unsubscribeExternal();
		};
	}

	loadPreview(template: string): Promise<AjaxResponse<{ preview: string }>>
	{
		return this.#previewCache.remember(template, () => {
			return new Promise((resolve) => {
				Ajax.runAction(
					'crm.activity.smsplaceholder.preview',
					{
						data: {
							entityTypeId: this.#entityTypeId,
							entityId: this.#entityId,
							message: template,
							entityCategoryId: this.#categoryId,
						},
					},
				).then(resolve).catch(resolve);
			});
		});
	}

	destroy(): void
	{
		this.#unsubscribe?.();
		this.#unsubscribe = null;

		this.#previewCache = null;

		Runtime.destroy(this);
	}
}
