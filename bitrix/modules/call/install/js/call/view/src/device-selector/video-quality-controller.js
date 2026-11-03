import { Dom, Loc, Runtime } from 'main.core';
import { Hardware, STREAM_QUALITY } from 'call.core';

/**
 * Lazily loads the video quality slider extension and renders it inside a device menu column.
 * Everything it needs is passed explicitly by the owning DeviceMenu: whether the quality
 * control should be shown at all, the initial blocked state of the column, and a callback
 * invoked when the quality changes.
 */
export class VideoQualityController
{
	constructor({ isShowVideoQuality, menuBlocked, onChangeVideoQuality })
	{
		this.isShowVideoQuality = isShowVideoQuality;
		this.menuBlocked = menuBlocked;
		this.callbacks = { onChangeVideoQuality };

		this.instance = null;
		this.container = null;
		this.pendingDisabled = null;
		this.pendingDefaultHeight = null;

		// The height can change while the extension is still loading, so the controller listens
		// from the start and replays the last value onto the slider it builds
		this.handleDefaultHeightChange = this.handleDefaultHeightChange.bind(this);
		Hardware.subscribe(Hardware.Events.onChangeMaxLocalStreamQualityHeight, this.handleDefaultHeightChange);
	}

	handleDefaultHeightChange()
	{
		this.setDefaultHeight(Hardware.maxLocalStreamQualityHeight);
	}

	render()
	{
		if (!this.isShowVideoQuality)
		{
			return null;
		}

		if (this.container)
		{
			return this.container;
		}

		this.container = Dom.create('div', {
			props: { className: 'bx-call-view-device-selector-quality' },
			attrs: { 'data-testid': 'device-selector-quality' },
		});

		// The container is returned right away, so the load runs unawaited: the tail catch is
		// what keeps an escaped error a reported one instead of an unhandled rejection
		this.loadSlider().catch((error) => console.error(error));

		return this.container;
	}

	// The load and the build fail apart from each other, and each stage recovers on its own:
	// a missing extension leaves the column without a place for the slider, a broken build
	// drops the instance and keeps the place. Keep the try around the await alone - widening it
	// back over the build is what made a broken slider look like a missing extension
	async loadSlider()
	{
		let exports = null;

		try
		{
			exports = await Runtime.loadExtension('call.legacy.component.video-quality-range');
		}
		catch (error)
		{
			void console.error(error);
			this.container = null;

			return;
		}

		this.buildSlider(exports);
	}

	buildSlider(exports)
	{
		// A null container means the controller was released while the extension was loading
		if (this.container === null)
		{
			return;
		}

		try
		{
			const { VideoQualityRange } = exports;

			this.instance = new VideoQualityRange({
				container: this.container,
				title: Loc.getMessage('CALL_VIDEO_QUALITY_TITLE'),
				videoQualityList: [
					{
						label: Loc.getMessage('CALL_VIDEO_QUALITY_WITHOUT_VIDEO'),
						height: 0,
						value: STREAM_QUALITY.NO_VIDEO,
					},
					{ label: '180p', height: 180, value: STREAM_QUALITY.LOW },
					{ label: '360p', height: 360, value: STREAM_QUALITY.MEDIUM },
					{ label: '720p', height: 720, value: STREAM_QUALITY.HIGH },
				],
				disabled: this.menuBlocked,
				defaultHeight: Hardware.maxLocalStreamQualityHeight,
				onVideoQualityChanged: (videoQuality) => {
					this.callbacks?.onChangeVideoQuality?.(videoQuality);
				},
			});

			this.instance.init();

			if (this.pendingDisabled !== null)
			{
				this.instance.setDisabled(this.pendingDisabled);
				this.pendingDisabled = null;
			}

			if (this.pendingDefaultHeight !== null)
			{
				this.instance.setDefaultHeight(this.pendingDefaultHeight);
				this.pendingDefaultHeight = null;
			}
		}
		catch (error)
		{
			void console.error(error);
			this.releaseInstance();
		}
	}

	// A slider that threw midway still owns a mounted Vue app, and its own release may throw too:
	// dropping the reference without this leaves that app in the DOM until the page reloads
	releaseInstance()
	{
		try
		{
			this.instance?.destroy();
		}
		catch (error)
		{
			void console.error(error);
		}

		this.instance = null;
	}

	setDisabled(value)
	{
		this.menuBlocked = value;

		if (this.instance)
		{
			this.instance.setDisabled(value);
		}
		else
		{
			this.pendingDisabled = value;
		}
	}

	setDefaultHeight(value)
	{
		if (this.instance)
		{
			this.instance.setDefaultHeight(value);
		}
		else
		{
			this.pendingDefaultHeight = value;
		}
	}

	destroy()
	{
		Hardware.unsubscribe(Hardware.Events.onChangeMaxLocalStreamQualityHeight, this.handleDefaultHeightChange);
		this.releaseInstance();
		this.container = null;
		this.pendingDisabled = null;
		this.pendingDefaultHeight = null;
		this.callbacks = null;
	}
}
