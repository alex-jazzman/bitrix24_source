import { Tag, Text, Type } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';

export type HintParams = {
	text: string,
	html: string,
	popupOptions: PopupOptions,
	position: 'top',
	timeout: number,
};

class Tooltip
{
	constructor(): void
	{
		this.popup = null;
	}

	show(element: HTMLElement, params: HintParams): void
	{
		this.hide();

		const popupOptions: PopupOptions = {
			id: 'bx-vue-hint',
			bindElement: element,
			bindOptions: {
				position: (params.position === 'top') ? 'top' : 'bottom',
			},
			content: Tag.render`
				<span class='ui-hint-content'>${this.#getText(element, params)}</span>
			`,
			darkMode: true,
			autoHide: true,
			cacheable: false,
			...(params.popupOptions ?? null),
		};

		this.popup = new Popup(popupOptions);
		this.popup.show();
	}

	hide(): void
	{
		this.popup?.close();
	}

	#getText(element: HTMLElement, params: HintParams): string
	{
		if (Type.isStringFilled(params) && Type.isUndefined(element.dataset.hintHtml))
		{
			return Text.encode(params);
		}

		return params.html || Text.encode(params.text) || params;
	}
}

export const tooltip = new Tooltip();
