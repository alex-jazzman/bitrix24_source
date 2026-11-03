import { Dom, Loc, Text } from 'main.core';
import { Popup } from 'main.popup';
import { Hardware, BackgroundDialog, Provider, Util } from 'call.core';

import { DeviceMenu } from './device-menu';

export class DeviceSelector
{
	constructor(config)
	{
		this.viewElement = config.viewElement || null;
		this.parentElement = config.parentElement;
		// An explicitly passed call wins over the global one, including an explicit null:
		// the lobby and ServerPlainCall have no current Bitrix call to fall back to
		this.hasCurrentCall = Object.prototype.hasOwnProperty.call(config, 'currentCall');
		this.currentCall = config.currentCall ?? null;
		this.zIndex = config.zIndex;

		this.cameraEnabled = config.cameraEnabled ?? false;
		this.cameraId = config.cameraId ?? '';
		this.microphoneEnabled = config.microphoneEnabled ?? false;
		this.microphoneId = config.microphoneId ?? '';
		this.speakerEnabled = config.speakerEnabled ?? false;
		this.speakerId = config.speakerId ?? '';
		this.allowNoiseSuppression = config.allowNoiseSuppression ?? false;
		this.faceImproveEnabled = config.faceImproveEnabled ?? false;
		this.allowFaceImprove = config.allowFaceImprove ?? false;
		this.allowBackground = config.allowBackground ?? true;
		this.allowMask = config.allowMask ?? true;
		this.allowAdvancedSettings = config.allowAdvancedSettings ?? false;
		this.switchCameraBlocked = config.switchCameraBlocked || false;
		this.switchMicrophoneBlocked = config.switchMicrophoneBlocked || false;
		this.isDestroyed = false;
		this.isCameraWasEnabledBeforeQualityChanged = false;

		this.popup = null;

		// Two consumers instantiate the selector, so checkbox ids are per instance:
		// a static id would break the label-to-checkbox link of the second one
		this.noiseSuppressionId = `bx-call-view-device-selector-noise-suppression-${Text.getRandom()}`;
		this.faceImproveId = `bx-call-view-device-selector-face-improve-${Text.getRandom()}`;

		const callbacks = config.callbacks ?? {};
		this.callbacks = {
			onShow: callbacks.onShow,
			onMicrophoneSwitch: callbacks.onMicrophoneSwitch,
			onMicrophoneSelect: callbacks.onMicrophoneSelect,
			onCameraSwitch: callbacks.onCameraSwitch,
			onCameraSelect: callbacks.onCameraSelect,
			onChangeVideoQuality: callbacks.onChangeVideoQuality,
			onSpeakerSwitch: callbacks.onSpeakerSwitch,
			onSpeakerSelect: callbacks.onSpeakerSelect,
			onChangeNoiseSuppression: callbacks.onChangeNoiseSuppression,
			onChangeFaceImprove: callbacks.onChangeFaceImprove,
			onAdvancedSettingsClick: callbacks.onAdvancedSettingsClick,
			onDestroy: callbacks.onDestroy,
		};

		this.elements = {
			root: null,
		};
	}

	show()
	{
		// Destruction is terminal: the columns are released and never rebuilt,
		// so a second life of the instance would leak everything it creates here
		if (this.isDestroyed)
		{
			return;
		}

		this.isCameraWasEnabledBeforeQualityChanged = Hardware.isCameraOn;

		if (this.popup)
		{
			this.popup.show();

			return;
		}
		this.popup = new Popup({
			id: 'call-view-device-selector',
			className: 'call-view-device-selector-popup',
			ariaLabel: Loc.getMessage('CALL_DEVICE_SELECTOR_POPUP_ARIA'),
			// The platform keeps the focus trap off by default, so the popup enables it
			// explicitly: nothing else moves keyboard focus into a non-modal dialog.
			// Looping is switched off - Tab must leave the popup back to the call screen
			focusTrap: {
				isolateOutside: false,
				looped: false,
			},
			background: '#00428F',
			contentBackground: '#00428F',
			darkMode: true,
			contentBorderRadius: '6px',
			borderRadius: '6px',
			bindElement: this.parentElement,
			targetContainer: this.viewElement,
			autoHide: true,
			zIndex: this.zIndex,
			closeByEsc: true,
			angle: false,
			overlay: {
				backgroundColor: '#22272B',
				opacity: 0,
			},
			content: this.render(),
			events: {
				onAfterPopupShow: () => this.onAfterPopupShow(),
				onPopupClose: () => this.popup.destroy(),
				onPopupDestroy: () => this.destroy(),
			},
		});
		this.popup.show();

		this.callbacks.onShow?.();
	}

	// Focus management is activated only after the popup is shown: before that the columns
	// live in a hidden subtree and the focusable set comes out empty
	onAfterPopupShow()
	{
		this.microphoneContainer?.activateFocusManagement();
		this.cameraContainer?.activateFocusManagement();
		this.speakerContainer?.activateFocusManagement();
	}

	render()
	{
		// The columns are built as a side effect of the markup, so the result is cached:
		// a second render would replace them with a fresh set and drop the previous one unreleased
		if (this.elements.root)
		{
			return this.elements.root;
		}

		this.elements.root = Dom.create('div', {
			props: { className: 'bx-call-view-device-selector' },
			attrs: { 'data-testid': 'device-selector-popup' },
			children: [
				this.renderDeviceColumns(),
				this.renderBottomPanel(),
			],
		});

		return this.elements.root;
	}

	renderDeviceColumns()
	{
		this.microphoneContainer = DeviceMenu.create({
			testId: 'device-selector-column-microphone',
			blocked: this.switchMicrophoneBlocked,
			deviceLabel: Loc.getMessage('IM_M_CALL_BTN_MIC'),
			deviceListLabel: Loc.getMessage('CALL_VIEW_MIC_DEVICE_ARIA'),
			deviceList: Hardware.getMicrophoneList(),
			selectedDevice: this.microphoneId,
			deviceEnabled: this.microphoneEnabled,
			icons: ['microphone', 'microphone-off'],
			onSwitch: this.onMicrophoneSwitch.bind(this),
			onSelect: this.onMicrophoneSelect.bind(this),
		});

		this.cameraContainer = DeviceMenu.create({
			testId: 'device-selector-column-camera',
			blocked: this.switchCameraBlocked,
			deviceLabel: Loc.getMessage('IM_M_CALL_BTN_CAMERA'),
			deviceListLabel: Loc.getMessage('CALL_VIEW_CAMERA_DEVICE_ARIA'),
			deviceList: Hardware.getCameraList(),
			selectedDevice: this.cameraId,
			deviceEnabled: this.cameraEnabled,
			icons: ['camera', 'camera-off'],
			showVideoQuality: this.isVideoQualityAvailable(),
			onSwitch: this.onCameraSwitch.bind(this),
			onSelect: this.onCameraSelect.bind(this),
			onChangeVideoQuality: this.onVideoQualityChanged.bind(this),
		});

		return Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-top' },
			children: [
				this.microphoneContainer.render(),
				this.cameraContainer.render(),
				this.renderSpeakerColumn(),
			],
		});
	}

	// The slider lives in the camera column, but whether it is offered at all depends on the
	// current call: a column knows nothing about that and must be told
	isVideoQualityAvailable()
	{
		const currentCall = this.hasCurrentCall ? this.currentCall : Util.getCurrentBitrixCall();

		// A Plain call carries the slider only through the media server: peer-to-peer
		// has no server side to apply the chosen quality on
		const supportsVideoQuality = currentCall?.provider === Provider.Bitrix
			|| (currentCall?.provider === Provider.Plain && currentCall.useMediaServer === true);

		return Util.isStreamQualityFeatureEnabled() && supportsVideoQuality;
	}

	renderSpeakerColumn()
	{
		if (!Hardware.canSelectSpeaker())
		{
			return null;
		}

		this.speakerContainer = DeviceMenu.create({
			testId: 'device-selector-column-speaker',
			deviceLabel: Loc.getMessage('IM_M_CALL_BTN_SPEAKER'),
			deviceListLabel: Loc.getMessage('CALL_VIEW_SPEAKER_DEVICE_ARIA'),
			deviceList: Hardware.getSpeakerList(),
			selectedDevice: this.speakerId,
			deviceEnabled: this.speakerEnabled,
			icons: ['speaker', 'speaker-off'],
			onSwitch: this.onSpeakerSwitch.bind(this),
			onSelect: this.onSpeakerSelect.bind(this),
		});

		return this.speakerContainer.render();
	}

	renderBottomPanel()
	{
		return Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-bottom' },
			children: [
				this.renderNoiseSuppressionItem(),
				this.renderFaceImproveItem(),
				this.renderBackgroundItem(),
				this.renderSelfTestItem(),
				this.renderAdvancedSettingsItem(),
			],
		});
	}

	renderNoiseSuppressionItem()
	{
		return Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-bottom-item' },
			children: [
				Dom.create('input', {
					props: {
						id: this.noiseSuppressionId,
						className: 'bx-call-view-device-selector-bottom-item-checkbox',
					},
					attrs: {
						type: 'checkbox',
						checked: this.allowNoiseSuppression,
						'data-testid': 'device-selector-noise-suppression',
					},
					events: {
						change: this.onAllowNoiseSuppression.bind(this),
					},
				}),
				Dom.create('div', {
					props: { className: 'bx-call-view-device-selector-bottom-item-checkbox-checked' },
				}),
				Dom.create('label', {
					props: { className: 'bx-call-view-device-selector-bottom-item-label' },
					attrs: { for: this.noiseSuppressionId },
					text: Loc.getMessage('CALL_NOISE_SUPPRESSION'),
				}),
			],
		});
	}

	renderFaceImproveItem()
	{
		if (!this.allowFaceImprove)
		{
			return null;
		}

		return Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-bottom-item' },
			children: [
				Dom.create('input', {
					props: {
						id: this.faceImproveId,
						className: 'bx-call-view-device-selector-bottom-item-checkbox',
					},
					attrs: {
						type: 'checkbox',
						checked: this.faceImproveEnabled,
						'data-testid': 'device-selector-face-improve',
					},
					events: {
						change: this.onFaceImproveChange.bind(this),
					},
				}),
				Dom.create('label', {
					props: { className: 'bx-call-view-device-selector-bottom-item-label' },
					attrs: { for: this.faceImproveId },
					text: Loc.getMessage('IM_SETTINGS_HARDWARE_CAMERA_FACE_IMPROVE'),
				}),
			],
		});
	}

	renderBackgroundItem()
	{
		if (!this.allowBackground)
		{
			return null;
		}

		return Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-bottom-item' },
			children: [
				Dom.create('button', {
					props: { className: 'bx-call-view-device-selector-bottom-item-action' },
					attrs: { type: 'button', 'data-testid': 'device-selector-background' },
					text: this.allowMask ? Loc.getMessage('IM_M_CALL_BG_MASK_CHANGE') : Loc.getMessage('IM_M_CALL_BACKGROUND_CHANGE'),
					events: {
						click: () => {
							BackgroundDialog.open();
							this.popup?.close();
						},
					},
				}),
			],
		});
	}

	renderSelfTestItem()
	{
		return Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-bottom-item' },
			children: [
				Dom.create('button', {
					props: { className: 'bx-call-view-device-selector-bottom-item-action' },
					attrs: { type: 'button', 'data-testid': 'device-selector-self-test' },
					text: Loc.getMessage('CALL_RUN_SELF_TEST'),
					events: {
						click: () => {
							Util.startSelfTest();
							this.popup?.close();
						},
					},
				}),
			],
		});
	}

	renderAdvancedSettingsItem()
	{
		// BX.MessengerCommon is required by the handler itself: BX.IM.openSettings() calls
		// isPage()/isDesktop() on it, so without the legacy bundle the action just throws
		const isAdvancedSettingsAvailable = this.allowAdvancedSettings && Boolean(BX.MessengerCommon);
		if (!isAdvancedSettingsAvailable)
		{
			return null;
		}

		return Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-bottom-item' },
			children: [
				Dom.create('button', {
					props: { className: 'bx-call-view-device-selector-bottom-item-action' },
					attrs: { type: 'button', 'data-testid': 'device-selector-advanced-settings' },
					text: Loc.getMessage('IM_M_CALL_ADVANCED_SETTINGS'),
					events: {
						click: (e) => {
							// to prevent BX.IM.autoHide
							e.stopPropagation();
							this.callbacks?.onAdvancedSettingsClick?.();
							this.popup?.close();
						},
					},
				}),
			],
		});
	}

	toggleCameraAvailability(available)
	{
		if (available)
		{
			this.cameraContainer?.unblock();

			return;
		}

		this.cameraContainer?.block();
	}

	toggleMicrophoneAvailability(available)
	{
		if (available)
		{
			this.microphoneContainer?.unblock();

			return;
		}

		this.microphoneContainer?.block();
	}

	// The columns report to the methods below, and destroy() drops the callbacks they read,
	// so each of them is a no-op after the release: the same rule the columns follow
	onMicrophoneSwitch()
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.microphoneEnabled = !this.microphoneEnabled;
		this.callbacks.onMicrophoneSwitch?.(this.microphoneEnabled);
	}

	onMicrophoneSelect(deviceId)
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.callbacks.onMicrophoneSelect?.(deviceId);
	}

	onCameraSwitch()
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.cameraEnabled = !this.cameraEnabled;
		this.callbacks.onCameraSwitch?.(this.cameraEnabled);
	}

	onCameraSelect(deviceId)
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.callbacks.onCameraSelect?.(deviceId);
	}

	onVideoQualityChanged(videoQuality)
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.callbacks.onChangeVideoQuality?.({
			videoQuality,
			isCameraWasEnabledBeforeQualityChanged: this.isCameraWasEnabledBeforeQualityChanged,
		});
	}

	onSpeakerSwitch()
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.speakerEnabled = !this.speakerEnabled;
		this.callbacks.onSpeakerSwitch?.(this.speakerEnabled);
	}

	onSpeakerSelect(deviceId)
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.callbacks.onSpeakerSelect?.(deviceId);
	}

	confirmSpeakerSelection(deviceId)
	{
		this.speakerContainer?.confirmSelection(deviceId);
	}

	onAllowNoiseSuppression(e)
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.allowNoiseSuppression = e.currentTarget.checked;
		this.callbacks.onChangeNoiseSuppression?.(this.allowNoiseSuppression);
	}

	onFaceImproveChange(e)
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.faceImproveEnabled = e.currentTarget.checked;
		this.callbacks.onChangeFaceImprove?.(this.faceImproveEnabled);
	}

	destroy()
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.isDestroyed = true;

		this.microphoneContainer?.destroy();
		this.cameraContainer?.destroy();
		this.speakerContainer?.destroy();

		if (this.popup)
		{
			this.popup.destroy();
			this.popup = null;
		}
		this.callbacks.onDestroy?.();

		// The callbacks are closed over the call screen, so they are dropped only after
		// the owner has been notified: a column left here would keep that screen alive
		this.microphoneContainer = null;
		this.cameraContainer = null;
		this.speakerContainer = null;
		this.callbacks = null;

		// The detached popup subtree outlives the release, so the nodes it was bound to are
		// dropped as well: the call screen root is one of them
		this.viewElement = null;
		this.parentElement = null;
		this.elements.root = null;
	}
}
