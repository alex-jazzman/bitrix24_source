import { Dom, Loc, Type } from 'main.core';

import { guardedClick } from './helpers/guarded-click';

export class ParticipantsButtonMobile
{
	constructor(config)
	{
		this.count = config.count ?? 0;
		this.elements = {
			root: null,
			icon: null,
			text: null,
			arrow: null,
		};

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

		this.elements.root = Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-messenger-videocall-top-participants-mobile',
			},
			children: [
				this.elements.icon = Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-participants-mobile-icon',
					},
					attrs: { 'aria-hidden': 'true' },
				}),
				this.elements.text = Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-participants-mobile-text',
					},
					text: Loc.getMessage('IM_M_CALL_PARTICIPANTS').replace('#COUNT#', this.count),
				}),
				this.elements.arrow = Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-participants-mobile-arrow',
					},
					attrs: { 'aria-hidden': 'true' },
				}),
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		return this.elements.root;
	}

	setCount(count)
	{
		if (this.count === count || !this.elements.text)
		{
			return;
		}
		this.count = count;
		this.elements.text.innerText = Loc.getMessage('IM_M_CALL_PARTICIPANTS').replace('#COUNT#', this.count);
	}
}
