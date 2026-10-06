import { Dom } from 'main.core';

import { Button, type ButtonOptions } from './button';

/**
 * @deprecated use BX.UI.Button
 */
export class ButtonLink extends Button
{
	constructor(params: ButtonOptions)
	{
		super(params);

		const customClassName = this.className.length > 0 ? ` ${this.className}` : '';
		this.buttonNode = Dom.create('button', {
			props: {
				className: `popup-window-button popup-window-button-link${customClassName}`,
				id: this.id,
			},
			attrs: {
				tabindex: '0',
				type: 'button',
			},
			text: this.text,
			events: this.contextEvents,
		});
	}
}
