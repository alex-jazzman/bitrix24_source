import { Dom, Text } from 'main.core';
import { FocusKeys, FocusZone } from 'ui.a11y';
import { Switcher } from 'ui.switcher';

import { DeviceRadioGroup } from './device-radio-group';
import { DeviceSwitch } from './device-switch';
import { VideoQualityController } from './video-quality-controller';

const CONTAINER_CLASS = 'bx-call-view-device-selector-menu-container';
const CONTAINER_BLOCKED_CLASS = `${CONTAINER_CLASS}-blocked`;

export class DeviceMenu
{
	constructor({
		testId = '',
		blocked = false,
		deviceList = [],
		selectedDevice = '',
		deviceEnabled = false,
		deviceLabel = '',
		deviceListLabel = '',
		icons = [],
		showVideoQuality = false,
		onSwitch,
		onSelect,
		onChangeVideoQuality,
	})
	{
		this.testId = testId;
		this.menuBlocked = blocked;
		this.deviceEnabled = deviceEnabled;
		this.deviceLabel = deviceLabel;
		this.icons = icons;
		this.callbacks = { onSwitch, onSelect, onChangeVideoQuality };
		this.isDestroyed = false;
		this.labelId = `bx-call-view-device-selector-label-${Text.getRandom()}`;
		this.elements = {
			root: null,
			switchIcon: null,
		};

		this.switcher = new Switcher({
			size: 'small',
			checked: this.deviceEnabled,
			handlers: {
				toggled: this.onSwitchToggled.bind(this),
			},
			disabled: this.menuBlocked,
		});

		this.deviceSwitch = new DeviceSwitch({
			switcher: this.switcher,
			labelId: this.labelId,
			blocked: this.menuBlocked,
		});

		this.deviceRadioGroup = new DeviceRadioGroup({
			deviceList,
			selectedDevice,
			ariaLabel: deviceListLabel,
			createFocusZone: (container, focusInStrategy) => new FocusZone(container, {
				bindKeys: FocusKeys.ArrowAll | FocusKeys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				focusInStrategy,
			}),
			onSelect: (deviceId) => this.callbacks?.onSelect?.(deviceId),
		});

		this.videoQualityController = new VideoQualityController({
			isShowVideoQuality: showVideoQuality,
			menuBlocked: this.menuBlocked,
			onChangeVideoQuality: (videoQuality) => this.callbacks?.onChangeVideoQuality?.(videoQuality),
		});
	}

	static create(config)
	{
		return new DeviceMenu(config);
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		this.elements.root = Dom.create('div', {
			props: { className: this.getRootClassName() },
			attrs: { 'data-testid': this.testId },
			children: [
				Dom.create('div', {
					props: { className: 'bx-call-view-device-selector-switch-wrapper' },
					children: [
						this.elements.switchIcon = Dom.create('div', {
							props: { className: `bx-call-view-device-selector-device-icon ${this.getDeviceIconClass()}` },
						}),
						Dom.create('span', {
							props: { className: 'bx-call-view-device-selector-device-text' },
							attrs: { id: this.labelId },
							text: this.deviceLabel,
						}),
						Dom.create('div', {
							props: { className: 'bx-call-view-device-selector-device-switch' },
							attrs: { 'data-testid': 'device-selector-device-switch' },
							children: [
								this.deviceSwitch.getNode(),
							],
						}),
					],
				}),
				this.deviceRadioGroup.render(),
				this.videoQualityController.render(),
			],
		});

		return this.elements.root;
	}

	// Every public method below is a no-op once the column is released: destroy() nulls the
	// fields they work with, so without the guard a late call would throw instead of doing nothing
	activateFocusManagement()
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.deviceRadioGroup.activateFocusZone();
	}

	block()
	{
		if (this.isDestroyed || this.menuBlocked)
		{
			return;
		}

		this.menuBlocked = true;
		Dom.addClass(this.elements.root, CONTAINER_BLOCKED_CLASS);
		this.deviceSwitch.setBlocked(true);
		this.videoQualityController.setDisabled(true);
	}

	unblock()
	{
		if (this.isDestroyed || !this.menuBlocked)
		{
			return;
		}

		this.menuBlocked = false;
		Dom.removeClass(this.elements.root, CONTAINER_BLOCKED_CLASS);
		this.deviceSwitch.setBlocked(false);
		this.videoQualityController.setDisabled(false);
	}

	getRootClassName()
	{
		return this.menuBlocked ? `${CONTAINER_CLASS} ${CONTAINER_BLOCKED_CLASS}` : CONTAINER_CLASS;
	}

	getDeviceIconClass()
	{
		let result = '';
		if (this.deviceEnabled && this.icons.length > 0)
		{
			result = this.icons[0];
		}
		else if (!this.deviceEnabled && this.icons.length > 1)
		{
			result = this.icons[1];
		}

		return result;
	}

	onSwitchToggled()
	{
		// The widget cannot fire this after the release: its handler is unbound and its node
		// is detached. The guard covers a call made in bypass of the widget
		if (this.isDestroyed || this.menuBlocked)
		{
			return;
		}

		this.deviceEnabled = !this.deviceEnabled;
		this.elements.switchIcon.className = `bx-call-view-device-selector-device-icon ${this.getDeviceIconClass()}`;
		this.deviceSwitch.syncChecked();

		this.callbacks.onSwitch?.(this.deviceEnabled);
	}

	confirmSelection(deviceId)
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.deviceRadioGroup.confirmSelection(deviceId);
	}

	destroy()
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.isDestroyed = true;

		this.deviceSwitch.destroy();
		this.deviceRadioGroup.destroy();
		this.videoQualityController.destroy();

		// The widget stays in the static registry of the switcher forever, so the column
		// lets go of everything itself: otherwise the registry keeps the call screen too
		this.switcher = null;
		this.deviceSwitch = null;
		this.deviceRadioGroup = null;
		this.videoQualityController = null;
		this.callbacks = null;
		this.elements.root = null;
		this.elements.switchIcon = null;
	}
}
