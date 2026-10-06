import {EventEmitter} from 'main.core.events';
import {Cache, Tag, Event, Loc, Dom} from 'main.core';

import './css/zeroing.css';

export default class Zeroing extends EventEmitter
{
	static ACTIVE_CLASS: string = 'active';

	constructor(options)
	{
		super();
		this.options = options;
		this.cache = new Cache.MemoryCache();
		this.setEventNamespace('BX.Landing.UI.Field.Color.Zeroing');
		Event.bind(this.getLayout(), 'click', () => this.onClick());
		Event.bind(this.getLayout(), 'keydown', this.onKeyDown.bind(this));
	}

	getLayout(): HTMLElement | null
	{
		let textCode = 'LANDING_FIELD_COLOR-ZEROING_TITLE_2';
		if (this.options)
		{
			if (!this.options.styleNode)
			{
				return null;
			}

			if (this.options.textCode)
			{
				textCode = this.options.textCode;
			}
		}

		return this.cache.remember('layout', () => {
			return Tag.render`<div
				class="landing-ui-field-color-zeroing"
				role="button"
				tabindex="0"
				aria-pressed="false"
			>
				<div class="landing-ui-field-color-zeroing-preview">
					<div class="landing-ui-field-color-zeroing-state"></div>
				</div>
				<span class="landing-ui-field-color-primary-text">
					${Loc.getMessage(textCode)}
				</span>
			</div>`;
		});
	}

	onClick()
	{
		this.emit('onChange', {color: null});
	}

	onKeyDown(event: KeyboardEvent)
	{
		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			this.onClick();
		}
	}

	setActive()
	{
		Dom.addClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
		Dom.attr(this.getLayout(), 'aria-pressed', 'true');
	}

	unsetActive()
	{
		Dom.removeClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
		Dom.attr(this.getLayout(), 'aria-pressed', 'false');
	}

	isActive(): boolean
	{
		return Dom.hasClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
	}
}
