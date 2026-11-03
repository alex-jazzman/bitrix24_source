import { Dom, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Switcher } from 'ui.switcher';

export const ParticipantsPermissionSwitcherEvents = {
	onSwitch: 'onSwitch',
};

export class ParticipantsPermissionSwitcher
{
	constructor(config = {})
	{
		this.label = config.label || '';
		this.typeOfSetting = config.typeOfSetting || '';
		this.settingEnabled = config.settingEnabled || false;
		this.idSuffix = config.idSuffix || '';
		this.eventEmitter = new EventEmitter(this, 'ParticipantsPermissionSwitcher');

		this.switcher = null;
		this.switchNode = null;
		this.wrapperNode = null;

		const events = config.events ?? {};
		for (const [eventName, handler = () => {}] of Object.entries(events))
		{
			this.eventEmitter.subscribe(eventName, handler);
		}
	}

	static create(config)
	{
		return new ParticipantsPermissionSwitcher(config);
	}

	onSwitchToggled()
	{
		// Widget assigns its `checked` before emitting 'toggled', so isChecked() is already the new state
		this.settingEnabled = this.switcher.isChecked();

		if (this.switchNode)
		{
			// State comes only from the widget; its 'toggled' event carries no payload
			Dom.attr(this.switchNode, 'aria-checked', String(this.switcher.isChecked()));
		}

		this.eventEmitter.emit(ParticipantsPermissionSwitcherEvents.onSwitch, {
			settingEnabled: this.settingEnabled,
			typeOfSetting: this.typeOfSetting,
		});
	}

	onSwitchNodeKeydown(event)
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

	getSwitchNode()
	{
		return this.switchNode;
	}

	focus()
	{
		this.switchNode?.focus();
	}

	render()
	{
		const suffix = this.idSuffix ? `-${this.idSuffix}` : '';
		const labelId = `call-participants-permissions-switch-label-${this.typeOfSetting}${suffix}`;

		this.switcher = new Switcher({
			size: 'small',
			checked: this.settingEnabled,
			handlers: {
				toggled: this.onSwitchToggled.bind(this),
			},
		});

		this.switchNode = this.switcher.getNode();

		// Give the widget's own node switch semantics: the wrapper stays a plain div
		Dom.attr(this.switchNode, {
			role: 'switch',
			tabindex: '0',
			'aria-checked': String(this.switcher.isChecked()),
			'aria-labelledby': labelId,
			'data-testid': `participants-permission-popup-switch-${this.typeOfSetting}`,
		});
		Event.bind(this.switchNode, 'keydown', this.onSwitchNodeKeydown.bind(this));

		this.wrapperNode = Dom.create('div', {
			props: {
				className: 'bx-call-view-participants-permissions-switch-wrapper',
			},
			dataset: {
				id: `call-participants-permissions-switch-${this.typeOfSetting}`,
			},
			children: [
				Dom.create('span', {
					props: { className: 'bx-call-view-participants-permissions-label' },
					attrs: { id: labelId },
					text: this.label,
				}),
				Dom.create('div', {
					props: { className: 'bx-call-view-participants-permissions-switch' },
					children: [
						this.switchNode,
					],
				}),
			],
		});

		return this.wrapperNode;
	}
}
