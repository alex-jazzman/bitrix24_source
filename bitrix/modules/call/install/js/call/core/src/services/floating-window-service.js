import { EventEmitter } from 'main.core.events';
import { FloatingVideo } from '../floating_video';
import { FloatingScreenShare } from '../floating_screenshare';

/**
 * Manages floating video and screen-share windows shown outside the main call container.
 * Desktop-only: the controller guards instantiation with DesktopApi.isDesktop().
 */
export class FloatingWindowService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {boolean} config.floatingVideo - Whether to instantiate the floating video window (currently disabled)
	 * @param {boolean} config.floatingScreenShare - Whether to instantiate the floating screen-share window
	 * @param {boolean} config.darkMode
	 * @param {*} [config.callStore]
	 */
	constructor({ floatingVideo, floatingScreenShare, darkMode, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.FloatingWindowService');

		this.floatingWindow = null;
		this.floatingScreenShareWindow = null;
		this.floatingWindowUser = 0;
		this.showFloatingWindowTimeout = 0;
		this.showFloatingScreenShareWindowTimeout = 0;
		this.darkMode = darkMode ?? false;
		this.callStore = callStore ?? null;

		if (floatingVideo)
		{
			this.floatingWindow = new FloatingVideo({
				onMainAreaClick: () => {
					this.emit('FloatingWindowService::onMainAreaClick');
				},
				onButtonClick: (data) => {
					this.emit('FloatingWindowService::onButtonClick', data);
				},
			});
		}

		if (floatingScreenShare)
		{
			this.floatingScreenShareWindow = new FloatingScreenShare({
				darkMode: this.darkMode,
				onBackToCallClick: () => {
					this.emit('FloatingWindowService::onBackToCall');
				},
				onStopSharingClick: () => {
					this.emit('FloatingWindowService::onStopSharing');
				},
				onChangeScreenClick: () => {
					this.emit('FloatingWindowService::onChangeScreen');
				},
			});
		}
	}

	/**
	 * Shows the floating video window with the given configuration (debounced).
	 *
	 * @param {object} config
	 * @param {string} [config.title]
	 * @param {number} [config.userId]
	 * @param {object} [config.avatars]
	 * @param {MediaStream} [config.stream]
	 */
	show(config)
	{
		clearTimeout(this.showFloatingWindowTimeout);

		if (!this.floatingWindow)
		{
			return;
		}

		this.floatingWindowUser = config.userId ?? 0;
		this.floatingWindow.setTitle(config.title ?? '');

		this.showFloatingWindowTimeout = setTimeout(() => {
			if (!this.floatingWindow)
			{
				return;
			}

			if (config.stream !== undefined)
			{
				this.floatingWindow.setStream(config.stream);
			}

			if (config.avatars)
			{
				this.floatingWindow.setAvatars(config.avatars);
			}

			this.floatingWindow.show();
		}, 300);
	}

	/**
	 * Hides the floating video window.
	 */
	hide()
	{
		clearTimeout(this.showFloatingWindowTimeout);

		if (this.floatingWindow)
		{
			this.floatingWindow.hide();
		}
	}

	/**
	 * Returns whether the floating video window is currently active.
	 *
	 * @returns {boolean}
	 */
	hasFloatingVideo(): boolean
	{
		return Boolean(this.floatingWindow);
	}

	/**
	 * Updates the content (stream/avatars) of the floating video window
	 * if the provided userId matches the currently shown user.
	 *
	 * @param {object} data
	 * @param {number} [data.userId]
	 * @param {MediaStream} [data.stream]
	 * @param {object} [data.avatars]
	 * @param {string} [data.title]
	 */
	updateContent(data)
	{
		if (!this.floatingWindow || data.userId !== this.floatingWindowUser)
		{
			return;
		}

		if (data.stream !== undefined)
		{
			this.floatingWindow.setStream(data.stream);
		}

		if (data.avatars)
		{
			this.floatingWindow.setAvatars(data.avatars);
		}

		if (data.title)
		{
			this.floatingWindow.setTitle(data.title);
		}
	}

	/**
	 * Shows or updates the floating screen-share window.
	 * If data is provided, closes the current window, applies new sharing data, then shows.
	 * If data is null, shows the existing window with a debounce.
	 *
	 * @param {object|null} data - Sharing info: { title, x, y, width, height, app }
	 */
	showScreenShareWindow(data)
	{
		clearTimeout(this.showFloatingScreenShareWindowTimeout);

		if (!this.floatingScreenShareWindow)
		{
			return;
		}

		if (data)
		{
			this.floatingScreenShareWindow.close();

			this.floatingScreenShareWindow.setSharingData(data).then(() => {
				if (this.floatingScreenShareWindow)
				{
					this.floatingScreenShareWindow.show();
				}
			}).catch((error) => {
				console.error('setSharingData error', error);
			});
		}
		else
		{
			this.showFloatingScreenShareWindowTimeout = setTimeout(() => {
				if (this.floatingScreenShareWindow)
				{
					this.floatingScreenShareWindow.show();
				}
			}, 300);
		}
	}

	/**
	 * Hides the floating screen-share window.
	 */
	hideScreenShareWindow()
	{
		clearTimeout(this.showFloatingScreenShareWindowTimeout);

		if (this.floatingScreenShareWindow)
		{
			this.floatingScreenShareWindow.hide();
		}
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.callStore = null;

		clearTimeout(this.showFloatingWindowTimeout);
		clearTimeout(this.showFloatingScreenShareWindowTimeout);

		if (this.floatingWindow)
		{
			this.floatingWindow.hide();
			this.floatingWindow.destroy();
			this.floatingWindow = null;
		}

		if (this.floatingScreenShareWindow)
		{
			this.floatingScreenShareWindow.hide();
			this.floatingScreenShareWindow.destroy();
			this.floatingScreenShareWindow = null;
		}
	}
}
