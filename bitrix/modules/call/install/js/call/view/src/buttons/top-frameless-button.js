import { Dom, Type } from 'main.core';

import { createCssTooltip } from './helpers/create-css-tooltip';

export class TopFramelessButton
{
	constructor(config)
	{
		this.iconClass = config.iconClass ?? '';
		this.textClass = config.textClass ?? '';
		this.text = config.text ?? '';
		this.tooltip = createCssTooltip(Type.isPlainObject(config.tooltip) ? config.tooltip : {});

		this.elements = {
			root: null,
		};

		this.callbacks = {
			onClick: Type.isFunction(config.onClick) ? config.onClick : () => {},
		};
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const {
			tooltipClass, tooltipStyle,
		} = this.tooltip;

		this.elements.root = Dom.create('button', {
			props: {
				type: 'button',
				className: `bx-messenger-videocall-top-button-frameless ${tooltipClass}`,
			},
			attrs: {
				style: tooltipStyle,
			},
			children: [
				Dom.create('div', {
					props: { className: `bx-messenger-videocall-top-button-icon ${this.iconClass}` },
					attrs: { 'aria-hidden': 'true' },
				}),
				(this.text === ''
					? null
					: Dom.create('div', {
						props: { className: `bx-messenger-videocall-top-button-text ${this.textClass}` },
						text: this.text,
					})
				),
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		return this.elements.root;
	}
}
