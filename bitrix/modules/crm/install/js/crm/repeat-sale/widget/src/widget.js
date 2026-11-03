import { ContentFactory } from './content-factory';
import { Base } from './content/base';
import type { WidgetParams, WidgetTypeEnum } from './types';
import 'ui.design-tokens';
import 'ui.design-tokens.air';
import './widget.css';

export { PeriodType, WidgetType } from './types';
export type { WidgetParams, WidgetTypeEnum } from './types';

export class Widget
{
	static instance: Array = [];
	#widgetType: WidgetTypeEnum;
	#params: WidgetParams = {};
	#bindElement: ?HTMLElement = null;
	#contentPopupPromise: ?Promise<?Base> = null;
	#contentPopupInstance: ?Base = null;

	static execute(
		widgetType: WidgetTypeEnum,
		bindElement: ?HTMLElement = null,
		params: WidgetParams = {},
		event: ?Event = null,
		onCloseCallback: ?Function = null,
	): void
	{
		if (!this.instance[widgetType])
		{
			this.instance[widgetType] = new Widget(widgetType, bindElement, params);
		}

		const widget = this.instance[widgetType];

		if (widget.isShown())
		{
			widget.close();

			return;
		}

		const forceShowConfetti = (event?.altKey && event?.ctrlKey) ?? false;

		void widget.show(forceShowConfetti, onCloseCallback);
	}

	constructor(widgetType: WidgetTypeEnum, bindElement: ?HTMLElement = null, params: WidgetParams = {})
	{
		this.#widgetType = widgetType;
		this.#params = params;
		this.#bindElement = bindElement;
	}

	// The content of a widget type may live in an extension of its own (statistics), so it is built on
	// the first opening rather than in the constructor. The promise is kept, so reopening the widget
	// reuses the content instance instead of asking for the extension again.
	#getContentPopup(): Promise<?Base>
	{
		if (this.#contentPopupPromise === null)
		{
			this.#contentPopupPromise = ContentFactory
				.getContentInstance(this.#widgetType, this.#params)
				.then((contentPopup: ?Base) => {
					if (contentPopup !== null && this.#bindElement)
					{
						contentPopup.setBindElement(this.#bindElement);
					}

					this.#contentPopupInstance = contentPopup;

					return contentPopup;
				})
			;
		}

		return this.#contentPopupPromise;
	}

	async show(forceShowConfetti: boolean = false, onCloseCallback: ?Function = null): Promise<void>
	{
		const contentPopup = await this.#getContentPopup();

		void contentPopup?.show(forceShowConfetti, onCloseCallback);
	}

	isShown(): boolean
	{
		return this.#contentPopupInstance?.isShown() ?? false;
	}

	close(): void
	{
		this.#contentPopupInstance?.close();
	}
}

// Building blocks of the widget contents, published for the extensions that carry a content of their own
// (crm.repeat-sale.widget.statistics).
export { Base as WidgetContentBase };
export { Footer as WidgetFooter } from './footer';
