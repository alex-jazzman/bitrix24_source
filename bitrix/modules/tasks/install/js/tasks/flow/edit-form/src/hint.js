import { Event } from 'main.core';
import { Popup } from 'main.popup';

type Params = {
	text: string,
};

export class Hint
{
	#text: string;

	constructor(params: Params)
	{
		this.#text = params.text;
	}

	bindTo(bindElement: HTMLElement): HTMLElement
	{
		let timer = null;
		let hintNodePopup = null;
		let handleScroll = null;

		Event.bind(bindElement, 'mouseenter', () => {
			timer = setTimeout(() => {
				hintNodePopup = new Popup({
					bindElement: this.getBindRect(bindElement),
					angle: {
						offset: bindElement.offsetWidth / 2 + 23,
					},
					darkMode: true,
					content: this.#text,
					animation: 'fading-slide',
					cacheable: false,
				});
				handleScroll = () => {
					hintNodePopup.setBindElement(this.getBindRect(bindElement));
					hintNodePopup?.adjustPosition();
				};
				Event.bind(document, 'scroll', handleScroll, true);

				hintNodePopup.show();
			}, 100);
		});

		Event.bind(bindElement, 'mouseleave', () => {
			clearTimeout(timer);
			if (hintNodePopup)
			{
				Event.unbind(document, 'scroll', handleScroll, true);
				hintNodePopup.close();
				hintNodePopup = null;
			}
		});

		return bindElement;
	}

	getBindRect(bindElement: HTMLElement): DOMRect
	{
		const rect = bindElement.getBoundingClientRect();

		return new DOMRect(rect.x + window.scrollX, rect.y + window.scrollY, rect.width, rect.height);
	}
}
