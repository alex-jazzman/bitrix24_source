import { Dom } from 'main.core';

import { Button, type ButtonOptions } from './button';

/**
 * @deprecated use BX.UI.Button
 */
export class CustomButton extends Button
{
	constructor(params: ButtonOptions)
	{
		super(params);

		this.buttonNode = Dom.create('span', {
			props: {
				className: this.className.length > 0 ? this.className : '',
				id: this.id,
			},
			events: this.contextEvents,
			text: this.text,
		});
	}
}
