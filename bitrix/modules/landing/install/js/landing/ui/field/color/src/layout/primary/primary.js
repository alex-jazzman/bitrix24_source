import {EventEmitter} from 'main.core.events';
import {Cache, Tag, Event, Dom, Loc} from 'main.core';

import ColorValue from "../../color_value";

import 'ui.fonts.opensans';
import './css/primary.css';

export default class Primary extends EventEmitter
{
	static ACTIVE_CLASS: string = 'active';
	static CSS_VAR: string = '--primary';

	// todo: layout or control?
	constructor(options = {})
	{
		super();
		this.cache = new Cache.MemoryCache();
		this.setEventNamespace('BX.Landing.UI.Field.Color.Primary');
		Event.bind(this.getLayout(), 'click', () => this.onClick());
		Event.bind(this.getLayout(), 'keydown', this.onKeyDown.bind(this));

		if (options.content && options.content === 'var(--primary)')
		{
			this.setActive();
		}
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div
					class="landing-ui-field-color-primary"
					role="button"
					tabindex="0"
					aria-pressed="false"
				>
					<i class="landing-ui-field-color-primary-preview"></i>
					<span class="landing-ui-field-color-primary-text">
						${Loc.getMessage('LANDING_FIELD_COLOR-PRIMARY_TITLE')}
					</span>
				</div>
			`;
		});
	}

	onKeyDown(event: KeyboardEvent)
	{
		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			this.onClick();
		}
	}

	getValue(): ColorValue
	{
		return this.cache.remember('value', () => {
			return new ColorValue(Primary.CSS_VAR);
		});
	}

	onClick()
	{
		this.setActive();
		this.emit('onChange', {color: this.getValue()});
	}

	setActive()
	{
		Dom.addClass(this.getLayout(), Primary.ACTIVE_CLASS);
		Dom.attr(this.getLayout(), 'aria-pressed', 'true');
	}

	unsetActive()
	{
		Dom.removeClass(this.getLayout(), Primary.ACTIVE_CLASS);
		Dom.attr(this.getLayout(), 'aria-pressed', 'false');
	}

	isActive(): boolean
	{
		return Dom.hasClass(this.getLayout(), Primary.ACTIVE_CLASS);
	}

	isPrimaryValue(value: ColorValue): boolean
	{
		return (value !== null) && (this.getValue().getCssVar() === value.getCssVar());
	}
}
