import { Dom, Event, Loc } from 'main.core';

/**
 * Radio group semantics over the device list of a single column.
 * Owns the selected state and the only entry point of its change:
 * a user pick notifies the owner, an external confirmation stays silent.
 *
 * Focus movement inside the group belongs to the accessibility facade: the owner passes
 * a factory, the group never sets tabindex on its items by itself.
 *
 * Blocking is not its concern: picking a device is not the same as turning it on, so the list
 * stays alive while the column is blocked and the block stops at the switch and the slider.
 *
 * The name is a required input: the visible column label already names the switch, and one label
 * cannot name two different controls. A group left unnamed is reported and still rendered - a
 * nameless list is an accessibility defect, a missing device list is a broken call screen.
 */
export class DeviceRadioGroup
{
	constructor({
		deviceList = [],
		selectedDevice = '',
		ariaLabel,
		createFocusZone = null,
		onSelect = null,
	})
	{
		if (!ariaLabel)
		{
			console.error('DeviceRadioGroup: ariaLabel is required, the device list stays unnamed without it');
		}

		this.deviceList = deviceList;
		this.selectedDevice = selectedDevice;
		this.ariaLabel = ariaLabel ?? '';
		this.createFocusZone = createFocusZone;
		this.callbacks = { onSelect };
		this.itemClickHandler = this.onItemClick.bind(this);

		this.container = null;
		this.items = [];
		this.focusZone = null;
	}

	render()
	{
		if (this.container)
		{
			return this.container;
		}

		this.container = Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-menu-inner' },
			attrs: {
				role: 'radiogroup',
				'aria-label': this.ariaLabel,
				'data-testid': 'device-selector-device-list',
			},
			children: this.deviceList.map((deviceInfo) => this.renderDevice(deviceInfo)),
		});

		return this.container;
	}

	renderDevice(deviceInfo)
	{
		const checked = deviceInfo.deviceId === this.selectedDevice;

		const icon = Dom.create('div', {
			props: { className: `bx-call-view-device-selector-menu-item-icon ${checked ? 'selected' : ''}` },
			attrs: { 'aria-hidden': 'true' },
		});

		const root = Dom.create('button', {
			props: { className: 'bx-call-view-device-selector-menu-item' },
			attrs: {
				type: 'button',
				role: 'radio',
				'aria-checked': String(checked),
				'data-testid': 'device-selector-device-item',
			},
			dataset: {
				deviceId: deviceInfo.deviceId,
			},
			children: [
				icon,
				Dom.create('div', {
					props: { className: 'bx-call-view-device-selector-menu-item-text' },
					text: deviceInfo.label || `(${Loc.getMessage('IM_M_CALL_DEVICE_NO_NAME')})`,
				}),
			],
			events: {
				click: this.itemClickHandler,
			},
		});

		this.items.push({ deviceId: deviceInfo.deviceId, root, icon });

		return root;
	}

	onItemClick(event)
	{
		this.onUserPick(event.currentTarget.dataset.deviceId);
	}

	onUserPick(deviceId)
	{
		this.setChecked(deviceId, true);
	}

	confirmSelection(deviceId)
	{
		this.setChecked(deviceId, false);
	}

	setChecked(deviceId, notifyOutside)
	{
		if (deviceId === this.selectedDevice)
		{
			return;
		}

		this.selectedDevice = deviceId;

		this.items.forEach((item) => {
			const checked = item.deviceId === this.selectedDevice;

			Dom.attr(item.root, 'aria-checked', String(checked));

			if (checked)
			{
				Dom.addClass(item.icon, 'selected');
			}
			else
			{
				Dom.removeClass(item.icon, 'selected');
			}
		});

		if (notifyOutside)
		{
			this.callbacks.onSelect?.(this.selectedDevice);
		}
	}

	getFocusEntryPoint()
	{
		const selected = this.items.find((item) => item.deviceId === this.selectedDevice);

		return (selected ?? this.items[0])?.root ?? null;
	}

	activateFocusZone()
	{
		if (this.items.length === 0 || !this.createFocusZone)
		{
			return;
		}

		if (!this.focusZone)
		{
			this.focusZone = this.createFocusZone(this.container, () => this.getFocusEntryPoint());
		}

		this.focusZone.activate();
	}

	deactivateFocusZone()
	{
		this.focusZone?.deactivate();
	}

	destroy()
	{
		this.items.forEach((item) => Event.unbind(item.root, 'click', this.itemClickHandler));

		this.deactivateFocusZone();
		this.focusZone = null;
		this.items = [];
		this.container = null;
		this.callbacks = null;
	}
}
