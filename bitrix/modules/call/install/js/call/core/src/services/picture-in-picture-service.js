import { EventEmitter } from 'main.core.events';

/**
 * Manages the Picture-in-Picture call window: toggling, debounce, and file-chooser tracking.
 */
export class PictureInPictureService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.PictureInPictureService');

		this.viewPort = viewPort;
		this.callStore = callStore ?? null;
		this.pictureInPictureDebounceForOpen = null;
		this.isFileChooserActive = false;
	}

	/**
	 * Toggles the Picture-in-Picture window with the given configuration.
	 *
	 * @param {object} config
	 * @param {boolean} [config.isForceOpen]
	 * @param {boolean} [config.isForceClose]
	 * @param {boolean} [config.mediaReceived]
	 * @param {boolean} config.hasActiveCall
	 * @param {boolean} config.isFolded
	 * @param {boolean} config.isScreenSharing
	 * @param {boolean} [config.enableAutoPip]
	 */
	toggle(config = {})
	{
		const {
			isForceOpen,
			isForceClose,
			mediaReceived: isMediaReceived,
			hasActiveCall,
			isFolded,
			isScreenSharing,
			enableAutoPip,
		} = config;

		const shouldSkipPiPToggle = isMediaReceived && isScreenSharing;
		if (shouldSkipPiPToggle)
		{
			return;
		}

		const shouldOpenPiP = isFolded || isScreenSharing || isForceOpen || enableAutoPip;
		const canStayOpen = shouldOpenPiP && !isForceClose;

		const isActiveStatePictureInPictureCallWindow = hasActiveCall && canStayOpen;

		if (!this.viewPort)
		{
			return;
		}

		// todo: detach from viewport
		this.viewPort.talkingService?.refreshQueue();

		this.viewPort.isActivePiPFromController = isActiveStatePictureInPictureCallWindow;
		this.viewPort.toggleStatePictureInPictureCallWindow(isActiveStatePictureInPictureCallWindow);
	}

	/**
	 * Cancels any pending debounced open operation for the PiP window.
	 */
	clearDebounceForOpen()
	{
		if (this.pictureInPictureDebounceForOpen)
		{
			clearTimeout(this.pictureInPictureDebounceForOpen);
			this.pictureInPictureDebounceForOpen = null;
		}
	}

	/**
	 * Handles changes in the file input open state to coordinate PiP visibility.
	 *
	 * Accepts the full config so the service can schedule a debounced toggle
	 * without emitting an event and waiting for the controller to respond.
	 *
	 * @param {boolean} isActive
	 * @param {object} config - Same shape as {@link toggle} config (hasActiveCall, isFolded, isScreenSharing, enableAutoPip).
	 */
	onInputFileOpenedStateUpdate(isActive, config = {})
	{
		if (isActive)
		{
			this.clearDebounceForOpen();
			this.toggle({ isForceClose: true, ...config });
			this.isFileChooserActive = true;
		}

		if (!isActive && !this.pictureInPictureDebounceForOpen)
		{
			this.pictureInPictureDebounceForOpen = setTimeout(() => {
				this.toggle(config);
				this.isFileChooserActive = false;
				this.pictureInPictureDebounceForOpen = null;
			}, 1000);
		}
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.callStore = null;
		clearTimeout(this.pictureInPictureDebounceForOpen);
		this.pictureInPictureDebounceForOpen = null;
		this.viewPort = null;
		this.isFileChooserActive = false;
	}
}
