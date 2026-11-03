import { Dom, Loc, Type } from 'main.core';

import { guardedClick } from './helpers/guarded-click';

export class ParticipantsButton
{
	constructor(config)
	{
		this.count = config.count ?? 0;
		this.foldButtonState = config.foldButtonState ?? ParticipantsButton.FoldButtonState.Hidden;
		this.allowAdding = config.allowAdding ?? false;

		this.elements = {
			root: null,
			leftContainer: null,
			rightContainer: null,
			foldIcon: null,
			count: null,
			separator: null,
		};

		this.callbacks = {
			onListClick: guardedClick(this, Type.isFunction(config.onListClick) ? config.onListClick : () => {}),
			onAddClick: guardedClick(this, Type.isFunction(config.onAddClick) ? config.onAddClick : () => {}),
		};
	}

	static FoldButtonState = {
		Active: 'active',
		Fold: 'fold',
		Unfold: 'unfold',
		Hidden: 'hidden',
	};

	getListAriaLabel()
	{
		return Loc.getMessage('CALL_VIEW_PARTICIPANTS_LIST_ARIA').replace('#COUNT#', this.count);
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}
		this.elements.root = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-top-participants' },
			children: [
				this.elements.leftContainer = Dom.create('button', {
					props: {
						type: 'button',
						className: `bx-messenger-videocall-top-participants-inner left${this.foldButtonState === ParticipantsButton.FoldButtonState.Hidden ? '' : ' active'}`,
					},
					attrs: {
						'aria-label': this.getListAriaLabel(),
					},
					children: [
						Dom.create('div', {
							props: { className: 'bx-messenger-videocall-top-button-icon participants' },
							attrs: { 'aria-hidden': 'true' },
						}),
						this.elements.count = Dom.create('div', {
							props: { className: 'bx-messenger-videocall-top-participants-text-count' },
							text: String(this.count),
						}),
						this.elements.foldIcon = Dom.create('div', {
							props: { className: `bx-messenger-videocall-top-participants-fold-icon ${this.foldButtonState}` },
							attrs: { 'aria-hidden': 'true' },
						}),
					],
					events: {
						click: this.callbacks.onListClick,
					},
				}),

			],
		});

		this.elements.separator = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-top-participants-separator' },
		});
		this.elements.rightContainer = Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-messenger-videocall-top-participants-inner active',
			},
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-top-participants-text' },
					text: Loc.getMessage('IM_M_CALL_BTN_ADD'),
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-top-button-icon add' },
					attrs: { 'aria-hidden': 'true' },
				}),
			],
			events: {
				click: this.callbacks.onAddClick,
			},
		});

		if (this.allowAdding)
		{
			Dom.append(this.elements.separator, this.elements.root);
			Dom.append(this.elements.rightContainer, this.elements.root);
		}

		return this.elements.root;
	}

	update(config)
	{
		this.count = config.count ?? this.count;
		this.foldButtonState = config.foldButtonState ?? this.foldButtonState;
		this.allowAdding = config.allowAdding ?? this.allowAdding;

		this.elements.count.innerText = this.count;
		this.elements.leftContainer.setAttribute('aria-label', this.getListAriaLabel());

		this.elements.foldIcon.className = `bx-messenger-videocall-top-participants-fold-icon ${this.foldButtonState}`;
		if (this.foldButtonState === ParticipantsButton.FoldButtonState.Hidden)
		{
			Dom.removeClass(this.elements.leftContainer, 'active');
		}
		else
		{
			Dom.addClass(this.elements.leftContainer, 'active');
		}

		if (this.allowAdding && !this.elements.separator.parentElement)
		{
			Dom.append(this.elements.separator, this.elements.root);
			Dom.append(this.elements.rightContainer, this.elements.root);
		}

		if (!this.allowAdding && this.elements.separator.parentElement)
		{
			Dom.remove(this.elements.separator);
			Dom.remove(this.elements.rightContainer);
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
			this.elements.leftContainer.setAttribute('aria-disabled', 'true');
			this.elements.rightContainer.setAttribute('aria-disabled', 'true');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'blocked');
			this.elements.leftContainer.removeAttribute('aria-disabled');
			this.elements.rightContainer.removeAttribute('aria-disabled');
		}
	}
}
