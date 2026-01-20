import { ajax as Ajax, Runtime, Text, Type } from 'main.core';
import PreviewPopup, { PREVIEW_POPUP_CONTENT_STATUS } from './preview-popup';
import 'crm_common';

export type PreviewerParams = {
	entityTypeId: number,
	entityId: number,
	categoryId: ?number,
	bindElement?: HTMLElement,
	isDisplayFormat: ?boolean,
};

export class Previewer
{
	#entityTypeId: number = null;
	#entityId: number = null;
	#categoryId: ?number = null;
	#bindElement: ?HTMLElement = null;
	#isDisplayFormat: boolean = false;

	#isUsePreviewRequestRunning: boolean = false;
	#previewCache: Map<string, string> = new Map();
	#previewPopup: ?PreviewPopup = null;
	#unsubscribe: ?() => void = null;

	constructor(params: PreviewerParams)
	{
		this.#entityTypeId = Text.toInteger(params.entityTypeId);
		if (!BX.CrmEntityType.isDefined(this.#entityTypeId))
		{
			throw new Error('Previewer: entityTypeId must be a valid entity type ID');
		}

		this.#entityId = Text.toInteger(params.entityId);
		if (params.entityId <= 0)
		{
			throw new Error('Previewer: entityId must be greater than 0');
		}

		this.#categoryId = Type.isNil(params.categoryId) ? null : Text.toInteger(params.categoryId);
		if (!Type.isNil(this.#categoryId) && this.#categoryId < 0)
		{
			throw new Error('Previewer: categoryId must be a non-negative integer');
		}

		this.#bindElement = Type.isDomNode(params.bindElement) ? params.bindElement : null;

		this.#isDisplayFormat = Type.isBoolean(params.isDisplayFormat) ? params.isDisplayFormat : this.#isDisplayFormat;

		this.#unsubscribe = BX.Crm.EntityEvent.subscribeToItem(this.#entityTypeId, this.#entityId, () => {
			this.#previewCache.clear();
		});
	}

	preview(template: string, bindElement?: HTMLElement): void
	{
		const bindElementToUse = Type.isDomNode(bindElement) ? bindElement : this.#bindElement;
		if (!Type.isDomNode(bindElementToUse))
		{
			throw new Error('Previewer: bindElement must be a valid DOM element');
		}

		if (this.#previewPopup?.isShown())
		{
			return;
		}

		if (this.#isUsePreviewRequestRunning)
		{
			this.#previewPopup?.show();

			return;
		}

		this.#previewPopup?.destroy();

		const cachedPreview = this.#previewCache.get(template);

		if (cachedPreview)
		{
			this.#previewPopup = new PreviewPopup(bindElementToUse, this.#entityTypeId, this.#entityId);
			this.#previewPopup.apply(PREVIEW_POPUP_CONTENT_STATUS.SUCCESS, cachedPreview);
			this.#previewPopup.show();

			return;
		}

		this.#previewPopup = new PreviewPopup(bindElementToUse, this.#entityTypeId, this.#entityId);
		this.#previewPopup.apply(PREVIEW_POPUP_CONTENT_STATUS.LOADING);
		this.#previewPopup.show();
		this.#isUsePreviewRequestRunning = true;

		Ajax.runAction(
			'crm.activity.smsplaceholder.preview',
			{
				data: {
					entityTypeId: this.#entityTypeId,
					entityId: this.#entityId,
					message: template,
					entityCategoryId: this.#categoryId,
					isDisplayFormat: this.#isDisplayFormat,
				},
			},
		).then((response) => {
			this.#previewPopup?.apply(
				PREVIEW_POPUP_CONTENT_STATUS.SUCCESS,
				response.data.preview,
			);
			this.#isUsePreviewRequestRunning = false;

			this.#previewCache.set(template, response.data.preview);
		}).catch((response) => {
			this.#previewPopup?.apply(
				PREVIEW_POPUP_CONTENT_STATUS.FAILED,
				response.errors[0].message ?? 'Unknown error',
			);
			this.#isUsePreviewRequestRunning = false;
		});
	}

	isShown(): boolean
	{
		return this.#previewPopup?.isShown() ?? false;
	}

	close(): void
	{
		this.#isUsePreviewRequestRunning = false;
		this.#previewPopup?.destroy();
		this.#previewPopup = null;
	}

	destroy(): void
	{
		this.#previewPopup?.destroy();
		this.#previewPopup = null;

		this.#unsubscribe?.();

		this.#previewCache = null;

		Runtime.destroy(this);
	}
}
