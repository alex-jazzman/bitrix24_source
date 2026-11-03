import { Dom, Event } from 'main.core';

/**
 * Switch semantics over the node of a third-party switcher widget: role, state, keyboard.
 * The widget instance is owned by the column and comes in ready: the adapter neither creates
 * nor looks it up. Keyboard activation goes through the same public method as a mouse click.
 */
export class DeviceSwitch
{
	constructor({ switcher, labelId = '', blocked = false })
	{
		this.switcher = switcher;
		this.node = switcher.getNode();
		this.keydownHandler = this.onKeydown.bind(this);

		Dom.attr(this.node, {
			role: 'switch',
			tabindex: '0',
			'aria-checked': String(this.switcher.isChecked()),
			'aria-disabled': String(blocked),
			'aria-labelledby': labelId,
			'data-testid': 'device-selector-switcher',
		});
		Event.bind(this.node, 'keydown', this.keydownHandler);
	}

	getNode()
	{
		return this.node;
	}

	onKeydown(event)
	{
		const isEnter = event.key === 'Enter';
		const isSpace = event.key === ' ';

		if (!isEnter && !isSpace)
		{
			return;
		}

		if (isSpace)
		{
			// Prevent page scroll on Space activation
			event.preventDefault();
		}

		// toggle() self-guards isDisabled(); no extra check needed
		this.switcher.toggle(event);
	}

	syncChecked()
	{
		if (!this.node)
		{
			return;
		}

		Dom.attr(this.node, 'aria-checked', String(this.switcher.isChecked()));
	}

	setBlocked(value)
	{
		if (!this.node)
		{
			return;
		}

		Dom.attr(this.node, 'aria-disabled', String(value));

		// Soft state only: the widget must stay reachable by keyboard, so its second argument
		// is silenced: by default disable() fires a lock event nobody listens to
		this.switcher.disable(value, false);
	}

	destroy()
	{
		if (!this.node)
		{
			return;
		}

		Event.unbind(this.node, 'keydown', this.keydownHandler);
		this.node = null;
		this.switcher = null;
	}
}
