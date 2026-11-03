export class VideoFrameKeeper
{
	/** @type {HTMLCanvasElement|null} */
	#canvas = null;

	/** @type {CanvasRenderingContext2D|null} */
	#context = null;

	/** @type {string|null} */
	#lastFrameData = null;

	/** @type {HTMLDivElement|null} */
	#overlayElement = null;

	/** @type {HTMLVideoElement|null} */
	#videoElement = null;

	/** @type {boolean} */
	#isOverlayVisible = false;

	/** @type {(() => void)|null} */
	#onLoadedDataHandler = null;

	/** @type {number|null} */
	#captureIntervalId = null;

	/** @type {number} */
	#captureIntervalMs = 10000;

	/** @type {number|null} */
	#hideTimeoutId = null;

	/** @type {number} */
	#hideTimeoutMs = 3000;

	attach(videoElement, options = {})
	{
		this.detach();

		this.#videoElement = videoElement;
		this.#onLoadedDataHandler = this.#onLoadedData.bind(this);
		videoElement.addEventListener('loadeddata', this.#onLoadedDataHandler);

		if (options.captureInterval !== undefined)
		{
			this.#captureIntervalMs = options.captureInterval;
		}

		this.#startCaptureInterval();
	}

	detach()
	{
		this.#stopCaptureInterval();
		this.#stopHideTimeout();

		if (this.#videoElement && this.#onLoadedDataHandler)
		{
			this.#videoElement.removeEventListener('loadeddata', this.#onLoadedDataHandler);
			this.#onLoadedDataHandler = null;
		}
		this.#videoElement = null;
	}

	#startCaptureInterval()
	{
		this.#stopCaptureInterval();

		this.#captureIntervalId = setInterval(() => {
			this.#captureFrameInternal();
		}, this.#captureIntervalMs);
	}

	#stopCaptureInterval()
	{
		if (this.#captureIntervalId !== null)
		{
			clearInterval(this.#captureIntervalId);
			this.#captureIntervalId = null;
		}
	}

	#startHideTimeout()
	{
		this.#stopHideTimeout();

		this.#hideTimeoutId = setTimeout(() => {
			// The frozen frame is a bridge for a temporary video gap on reconnect.
			// If the video does not come back within this window (e.g. the camera
			// was turned off during the reconnect, so no 'loadeddata' arrives),
			// hide the overlay so the avatar and camera-off state become visible.
			this.hideLastFrame();
		}, this.#hideTimeoutMs);
	}

	#stopHideTimeout()
	{
		if (this.#hideTimeoutId !== null)
		{
			clearTimeout(this.#hideTimeoutId);
			this.#hideTimeoutId = null;
		}
	}

	#captureFrameInternal()
	{
		if (!this.#videoElement)
		{
			return;
		}

		const video = this.#videoElement;

		if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth < 30 || video.videoHeight < 30)
		{
			return;
		}

		try
		{
			if (!this.#canvas)
			{
				this.#canvas = document.createElement('canvas');
				this.#context = this.#canvas.getContext('2d');
			}

			if (!this.#context)
			{
				return;
			}

			this.#canvas.width = video.videoWidth;
			this.#canvas.height = video.videoHeight;

			this.#context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

			this.#lastFrameData = this.#canvas.toDataURL('image/jpeg', 0.95);
		}
		catch (error)
		{
			console.error('[VideoFrameKeeper] Error capturing frame:', error);
		}
	}

	showLastFrame(containerElement)
	{
		if (!this.#lastFrameData || !containerElement)
		{
			return;
		}

		if (!this.#overlayElement)
		{
			this.#overlayElement = document.createElement('div');
			this.#overlayElement.className = 'video-frame-keeper-overlay';
		}

		this.#overlayElement.style.backgroundImage = `url('${this.#lastFrameData}')`;
		this.#overlayElement.style.display = 'block';
		this.#isOverlayVisible = true;

		if (!this.#overlayElement.parentElement)
		{
			containerElement.appendChild(this.#overlayElement);
		}

		this.#startHideTimeout();
	}

	hideLastFrame()
	{
		this.#stopHideTimeout();

		if (this.#overlayElement)
		{
			this.#overlayElement.style.display = 'none';
			this.#isOverlayVisible = false;
		}
	}

	destroy()
	{
		this.detach();
		this.hideLastFrame();

		if (this.#overlayElement && this.#overlayElement.parentElement)
		{
			this.#overlayElement.parentElement.removeChild(this.#overlayElement);
		}

		this.#overlayElement = null;
		this.#canvas = null;
		this.#context = null;
		this.#lastFrameData = null;
	}

	#onLoadedData()
	{
		if (this.#videoElement && this.#videoElement.videoWidth > 0 && this.#videoElement.videoHeight > 0)
		{
			this.hideLastFrame();
		}
	}
}
