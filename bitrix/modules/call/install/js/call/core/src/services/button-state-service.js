import { EventEmitter } from 'main.core.events';

/**
 * Manages call toolbar button states: active/blocked/counter updates for all call buttons.
 */
export class ButtonStateService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.ButtonStateService');

		this.viewPort = viewPort;
		this.callStore = callStore ?? null;
	}

	/**
	 * Blocks all buttons that legacy mobile clients do not support.
	 * Called when a connected user is identified as a legacy mobile client.
	 */
	blockForLegacyMobile()
	{
		this.viewPort.blockAddUser();
		this.viewPort.blockSwitchCamera();
		this.viewPort.blockScreenSharing();
		this.viewPort.disableMediaSelection();
		this.viewPort.updateButtons();
	}

	/**
	 * Unblocks buttons when a remote user connects.
	 * Determines which buttons to unblock based on call capabilities and user state.
	 *
	 * @param {object} options
	 * @param {boolean} options.isLegacyMobile - Whether the connected user is a legacy mobile client
	 * @param {boolean} options.isNeedUnblockCameraButton - Whether the camera button should be unblocked
	 * @param {boolean} options.isCopilotFeaturesEnabled - Whether Copilot features are available for this call
	 * @param {boolean} options.isCommonRecordStateInactive - Whether common recording is currently inactive
	 */
	unblockOnUserConnected({
		isLegacyMobile,
		isNeedUnblockCameraButton,
		isCopilotFeaturesEnabled,
		isCommonRecordStateInactive,
	})
	{
		const unblockButtonsList = [];

		if (!isLegacyMobile)
		{
			unblockButtonsList.push('floorRequest', 'screen');
		}

		if (!isLegacyMobile && isCopilotFeaturesEnabled)
		{
			unblockButtonsList.push('copilot');
		}

		if (!isLegacyMobile && isNeedUnblockCameraButton)
		{
			unblockButtonsList.push('camera');
		}

		if (unblockButtonsList.length > 0)
		{
			this.viewPort.unblockButtons(unblockButtonsList);
		}

		// todo: add the 'record' button to unblockButtonsList to call unblockButtons 1 time

		if (isCommonRecordStateInactive)
		{
			this.viewPort.unblockButtons(['record']);
		}
	}

	/**
	 * Updates button availability after a fullscreen mode change.
	 * Blocks promo-tier and document buttons in fullscreen to reduce UI clutter,
	 * and restores them when exiting fullscreen.
	 *
	 * @param {boolean} isFullScreen - Whether fullscreen mode was entered
	 * @param {object} callState
	 * @param {string} callState.provider - Current call provider
	 * @param {boolean} callState.isCopilotFeaturesEnabled - Whether Copilot features are enabled
	 * @param {boolean} callState.isCloudRecordFeaturesEnabled - Whether cloud record is blocked by tariff
	 * @param {boolean} callState.hasDocumentButton - Whether the document button is present
	 */
	updateForFullScreenChange(
		isFullScreen,
		{ isCopilotFeaturesEnabled, isCloudRecordFeaturesEnabled, hasDocumentButton },
	)
	{
		const buttons = [];

		if (isCloudRecordFeaturesEnabled)
		{
			buttons.push('record');
		}

		if (hasDocumentButton)
		{
			buttons.push('document');
		}

		if (isCopilotFeaturesEnabled)
		{
			buttons.push('copilot');
		}

		buttons.push('feedback');

		if (buttons.length === 0)
		{
			return;
		}

		if (isFullScreen)
		{
			this.viewPort.blockButtons(buttons);
		}
		else
		{
			this.viewPort.unblockButtons(buttons);
		}
	}

	/**
	 * Updates the chat button badge with an unread message counter.
	 * Ignores negative counter values.
	 *
	 * @param {number} counter - The number of unread messages (must be >= 0)
	 */
	setChatCounter(counter)
	{
		if (counter < 0)
		{
			return;
		}

		this.viewPort.setButtonCounter('chat', counter);
	}

	/**
	 * Sets the record button active or inactive state.
	 *
	 * @param {boolean} active - True to activate, false to deactivate
	 */
	activateRecordButton(active)
	{
		this.viewPort.setButtonActive('record', active);
	}

	/**
	 * Disables the record button entirely (e.g. while a cloud record operation is pending).
	 */
	blockRecordButton()
	{
		this.viewPort.blockButtons(['record']);
	}

	/**
	 * Re-enables the record button (e.g. after a record operation completes or a user connects).
	 */
	unblockRecordButton()
	{
		this.viewPort.unblockButtons(['record']);
	}

	/**
	 * Re-enables the floor-request and screen-share buttons when the local user joins the call.
	 */
	unblockFloorRequestAndScreenButtons()
	{
		this.viewPort.unblockButtons(['floorRequest', 'screen']);
	}

	/**
	 * Sets the document button active or inactive state.
	 *
	 * @param {boolean} active - True to activate, false to deactivate
	 */
	activateDocumentButton(active)
	{
		this.viewPort.setButtonActive('document', active);
	}

	/**
	 * Blocks the camera switch button (e.g. camera permission denied).
	 */
	blockCameraButton()
	{
		this.viewPort?.blockSwitchCamera();
	}

	/**
	 * Unblocks the camera switch button (e.g. camera permission granted).
	 */
	unblockCameraButton()
	{
		this.viewPort?.unblockSwitchCamera();
	}

	/**
	 * Blocks the microphone switch button (e.g. mic permission denied).
	 */
	blockMicrophoneButton()
	{
		this.viewPort?.blockSwitchMicrophone();
	}

	/**
	 * Unblocks the microphone switch button (e.g. mic permission granted).
	 */
	unblockMicrophoneButton()
	{
		this.viewPort?.unblockSwitchMicrophone();
	}

	/**
	 * Updates camera and microphone button blocked state based on broadcast permissions.
	/**
	 * Blocks or unblocks a device button while the stream is being published.
	 *
	 * @param {'camera'|'microphone'} device
	 * @param {boolean} isPublishing
	 */
	updatePublishingState(device, isPublishing)
	{
		if (device === 'camera')
		{
			if (isPublishing)
			{
				this.blockCameraButton();
			}
			else
			{
				this.unblockCameraButton();
			}
		}
		else if (device === 'microphone')
		{
			if (isPublishing)
			{
				this.blockMicrophoneButton();
			}
			else
			{
				this.unblockMicrophoneButton();
			}
		}
	}

	updatePermissionButtons(canBroadcastCam, canBroadcastMic)
	{
		if (canBroadcastCam)
		{
			this.unblockCameraButton();
		}
		else
		{
			this.blockCameraButton();
		}

		if (canBroadcastMic)
		{
			this.unblockMicrophoneButton();
		}
		else
		{
			this.blockMicrophoneButton();
		}
	}

	/**
	 * Sets the active state of a button by name.
	 *
	 * @param {string} name - Button name
	 * @param {boolean} active - Active state
	 */
	setButtonActive(name, active)
	{
		this.viewPort.setButtonActive(name, active);

		if (this.callStore)
		{
			this.callStore.setButtonState(name, { active });
		}
	}

	/**
	 * Blocks a list of buttons.
	 *
	 * @param {string[]} names - Button names to block
	 */
	blockButtons(names)
	{
		this.viewPort.blockButtons(names);

		if (this.callStore)
		{
			this.callStore.blockButtons(names);
		}
	}

	/**
	 * Unblocks a list of buttons.
	 *
	 * @param {string[]} names - Button names to unblock
	 */
	unblockButtons(names)
	{
		this.viewPort.unblockButtons(names);

		if (this.callStore)
		{
			this.callStore.unblockButtons(names);
		}
	}

	/**
	 * Sets a counter badge on a button.
	 *
	 * @param {string} name - Button name
	 * @param {number} counter - Counter value
	 */
	setButtonCounter(name, counter)
	{
		this.viewPort.setButtonCounter(name, counter);

		if (this.callStore)
		{
			this.callStore.setButtonState(name, { counter });
		}
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.callStore = null;
		this.viewPort = null;
	}
}
