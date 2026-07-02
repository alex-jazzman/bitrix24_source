import { Dom } from 'main.core';

import { Button } from './button';

/**
 * @deprecated use BX.UI.Button
 */
export class ButtonLink extends Button
{
	constructor(params)
	{
		super(params);

		this.buttonNode = Dom.create(
			'button',
			{
				props: {
					className:
						'popup-window-button popup-window-button-link' +
						(this.className.length > 0 ? ` ${this.className}` : ''),
					id: this.id,
				},
				attrs: {
					tabindex: '0',
					type: 'button',
				},
				text: this.text,
				events: this.contextEvents,
			},
		);
	}
}
