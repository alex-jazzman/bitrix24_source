import {Cache, Dom, Tag, Text, Type, Event} from 'main.core';
import {EventEmitter} from 'main.core.events';
import {Loc} from 'landing.loc';

import 'ui.fonts.opensans';
import './css/base_card.css';

/**
 * @memberOf BX.Landing.UI.Card
 */
export class BaseCard extends EventEmitter
{
	constructor(options = {})
	{
		super();
		this.setEventNamespace('BX.Landing.UI.Card.BaseCard');
		this.cache = new Cache.MemoryCache();

		this.data = {...options};
		this.options = this.data;
		this.id = Type.isStringFilled(this.options.id) ? this.options.id : Text.getRandom();
		this.hidden = Text.toBoolean(this.options.hidden);

		this.layout = this.getLayout();
		this.header = this.getHeader();
		this.body = this.getBody();

		this.setTitle(this.options.title || '');
		this.setHidden(this.options.hidden);

		if (Type.isStringFilled(this.options.className))
		{
			Dom.addClass(this.layout, this.options.className);
		}

		if (Type.isObject(this.options.attrs))
		{
			Dom.adjust(this.layout, {attrs: this.options.attrs});
		}

		this.onClickHandler = Type.isFunction(this.options.onClick) ? this.options.onClick : () => {};
		this.onClick = this.onClick.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onActionKeyDown = this.onActionKeyDown.bind(this);
		this.onCardFocusIn = this.onCardFocusIn.bind(this);
		this.onCardFocusOut = this.onCardFocusOut.bind(this);
		Event.bind(this.layout, 'click', this.onClick);

		// Composite (roving) a11y is opt-in: the card becomes a focusable gridcell
		// only when placed into a role="grid" container (e.g. the "Add block" panel).
		this.role = Type.isStringFilled(this.options.role) ? this.options.role : null;
		if (this.role)
		{
			this.setupGridcell();
		}
	}

	setupGridcell()
	{
		Dom.attr(this.layout, {
			'role': this.role,
			'tabindex': '-1',
		});
		this.setAriaLabel(this.options.title || '');
		Event.bind(this.layout, 'keydown', this.onKeyDown);
		Event.bind(this.layout, 'focusin', this.onCardFocusIn);
		Event.bind(this.layout, 'focusout', this.onCardFocusOut);
	}

	setAriaLabel(title: string)
	{
		if (this.role && Type.isStringFilled(title))
		{
			Dom.attr(this.layout, 'aria-label', title);
		}
	}

	getCardActions(): Array<HTMLElement>
	{
		return [...this.layout.querySelectorAll('[data-card-action]')];
	}

	onKeyDown(event: KeyboardEvent)
	{
		if (event.target !== this.layout)
		{
			return;
		}

		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			this.onClick();
		}
	}

	onActionKeyDown(event: KeyboardEvent)
	{
		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			event.stopPropagation();
			event.currentTarget.click();
		}
	}

	onCardFocusIn()
	{
		this.getCardActions().forEach((action) => {
			Dom.attr(action, 'tabindex', '0');
		});
	}

	onCardFocusOut(event: FocusEvent)
	{
		if (this.layout.contains(event.relatedTarget))
		{
			return;
		}

		this.getCardActions().forEach((action) => {
			Dom.attr(action, 'tabindex', '-1');
		});
	}

	getLayout(): HTMLDivElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div class="landing-ui-card">
					<div class="landing-ui-card-header-wrapper">
						${this.getHeader()}
					</div>
					${this.getBody()}
				</div>
			`;
		});
	}

	getRemoveButton(): HTMLDivElement
	{
		return this.cache.remember('remove', () =>
		{
			const button = Tag.render`
				<div class="landing-ui-card-block-remove"></div>
			`;

			Dom.attr(button, {
				'role': 'button',
				'tabindex': '-1',
				'data-card-action': '',
				'aria-label': Loc.getMessage('LANDING_UI_CARD_REMOVE_BLOCK_LABEL'),
			});
			Event.bind(button, 'keydown', this.onActionKeyDown);

			return button;
		});
	}

	getHeader(): HTMLDivElement
	{
		return this.cache.remember('header', () => {
			return Tag.render`
				<div class="landing-ui-card-header"></div>
			`;
		});
	}

	getBody(): HTMLDivElement
	{
		return this.cache.remember('body', () => {
			return Tag.render`
				<div class="landing-ui-card-body"></div>
			`;
		});
	}

	addWarning(warning: string)
	{
		Dom.append(
			Tag.render`
				<div class="landing-ui-card-body-warning">${warning}</div>
			`,
			this.getBody()
		);
		Dom.addClass(this.getBody(), '--warning');
	}

	setTitle(title: string)
	{
		this.getHeader().textContent = title;
		this.setAriaLabel(title);
	}

	setHidden(hidden: boolean)
	{
		Dom.attr(this.getLayout(), 'hidden', hidden || null);
	}

	onClick()
	{
		this.onClickHandler(this);
		this.emit('onClick');
	}

	/**
	 * Can be overwriting in child classes. Called at the added card to panel
	 */
	onAppend()
	{}

	show()
	{
		this.setHidden(false);
	}

	isShown()
	{
		return Dom.attr(this.getLayout(), 'hidden') === null;
	}

	hide()
	{
		this.setHidden(true);
	}

	getNode(): HTMLDivElement
	{
		return this.getLayout();
	}
}