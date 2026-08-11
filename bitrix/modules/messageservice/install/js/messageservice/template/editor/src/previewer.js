import { type AjaxResponse, Runtime, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { PREVIEW_POPUP_CONTENT_STATUS, PreviewPopup } from './preview-popup';

export type PreviewerParams = {
	bindElement?: HTMLElement,
	events?: { [eventName: string]: (BaseEvent) => any },
};

export class Previewer extends EventEmitter
{
	#bindElement: ?HTMLElement = null;

	#isUsePreviewRequestRunning: boolean = false;
	#previewPopup: ?PreviewPopup = null;

	constructor(params: PreviewerParams)
	{
		super();

		this.setEventNamespace('BX.MessageService.Template.Editor.Previewer');

		this.#bindElement = Type.isDomNode(params.bindElement) ? params.bindElement : null;

		this.subscribeFromOptions(params.events ?? {});
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

		this.#previewPopup = new PreviewPopup(bindElementToUse);
		this.#previewPopup.apply(PREVIEW_POPUP_CONTENT_STATUS.LOADING);
		this.#previewPopup.show();
		this.#isUsePreviewRequestRunning = true;

		this.emitAsync('onLoadPreview', { template })
			.then((eventResults: AjaxResponse<{ preview: string }>[]) => {
				const successResult = eventResults.find((candidate) => {
					return Type.isPlainObject(candidate)
						&& candidate.status === 'success'
						&& Type.isStringFilled(candidate.data?.preview);
				});
				if (successResult)
				{
					this.#previewPopup?.apply(
						PREVIEW_POPUP_CONTENT_STATUS.SUCCESS,
						successResult.data.preview,
					);

					return;
				}

				const errorResult = eventResults.find((candidate) => {
					return Type.isPlainObject(candidate)
						&& candidate.status === 'error'
						&& Type.isArrayFilled(candidate.errors);
				});
				if (errorResult)
				{
					this.#previewPopup?.apply(
						PREVIEW_POPUP_CONTENT_STATUS.FAILED,
						errorResult.errors[0].message,
					);

					return;
				}

				throw new Error('No valid preview result');
			}).catch((error) => {
				console.error('Previewer: onLoadPreview event error', error);

				this.#previewPopup?.apply(
					PREVIEW_POPUP_CONTENT_STATUS.FAILED,
					'Unknown error',
				);
			}).finally(() => {
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
		this.unsubscribeAll();

		this.#previewPopup?.destroy();
		this.#previewPopup = null;

		Runtime.destroy(this);
	}
}
