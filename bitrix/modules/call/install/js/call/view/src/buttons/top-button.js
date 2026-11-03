import { Dom, Type } from 'main.core';

import { createCssTooltip } from './helpers/create-css-tooltip';
import { guardedClick } from './helpers/guarded-click';

export class TopButton
{
	constructor(config)
	{
		this.iconClass = config.iconClass ?? '';
		this.text = config.text ?? '';
		this.elements = {
			root: null,
			icon: null,
			text: null,
		};
		this.tooltip = createCssTooltip(Type.isPlainObject(config.tooltip) ? config.tooltip : {});

		this.callbacks = {
			onClick: guardedClick(this, Type.isFunction(config.onClick) ? config.onClick : () => {}),
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
				className: `bx-messenger-videocall-top-button ${tooltipClass}`,
			},
			attrs: {
				style: tooltipStyle,
			},
			children: [
				this.elements.icon = Dom.create('div', {
					props: { className: `bx-messenger-videocall-top-button-icon ${this.iconClass}` },
					attrs: { 'aria-hidden': 'true' },
				}),
				this.elements.text = Dom.create('div', {
					props: { className: `bx-messenger-videocall-top-button-text ${this.iconClass}` },
					text: this.text,
				}),
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		return this.elements.root;
	}

	update(config)
	{
		const iconClass = config.iconClass ?? this.iconClass;
		const text = config.text ?? this.text;

		if (this.iconClass !== iconClass)
		{
			this.iconClass = iconClass;
			this.elements.icon.className = `bx-messenger-videocall-top-button-icon ${this.iconClass}`;
		}

		if (this.text !== text)
		{
			this.text = text;
			this.elements.text.innerText = this.text;
			this.elements.text.className = `bx-messenger-videocall-top-button-text ${this.iconClass}`;
		}
	}

	setBlocked(isBlocked)
	{
		if (this.blocked === isBlocked)
		{
			return;
		}

		this.blocked = isBlocked;
		if (this.blocked)
		{
			Dom.addClass(this.elements.root, 'blocked');
			this.elements.root.setAttribute('aria-disabled', 'true');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'blocked');
			this.elements.root.removeAttribute('aria-disabled');
		}
	}
}
