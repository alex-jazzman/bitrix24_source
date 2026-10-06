;(function(){


BX.namespace("BX.Disk");
BX.Disk.FileTransformVideo = function (options)
{
	this.runGenerationPreviewData = options.runGenerationPreviewData;
	this.runGeneratePreviewLinkClass = options.runGeneratePreviewLinkClass;
	this.downloadLink = options.downloadLink;
	this.pullTag = options.pullTag;
	this.layout = options.layout;
	this.status = options.status;
	this.retryInterval = Math.max(Number(options.retryInterval) || 5000, 5000);
	this.waitTimeout = Math.min(
		Math.max(Number(options.waitTimeout) || 90000, this.retryInterval),
		90000
	);
	this.waitStartedAt = null;
	this.pollTimeoutId = null;
	this.deadlineTimeoutId = null;
	this.videoLoadPromise = null;
	this.waitGeneration = 0;
	this.isWaitExpired = false;
	this.isVideoShown = false;
	this.isVideoReady = false;
	this.isDestroyed = false;
	this.pullEventHandler = null;
	this.visibilityChangeHandler = null;
	this.viewerCloseHandler = null;
	this.viewerBeforeShowHandler = null;
	this.video = {
		width: null,
		height: null,
		sources: null
	};

	this.bindEvents();
	if (this.pullTag)
	{
		this.registerPullEvent(this.pullTag);
	}

	if (this.status === 'PROCESS')
	{
		this.startWaiting();
	}
};

BX.Disk.FileTransformVideo.prototype =
{
	bindEvents: function ()
	{
		BX.bindDelegate(
			BX(this.layout.containerId),
			'click',
			{className: this.runGeneratePreviewLinkClass},
			this.handleClickToRunTransformation.bind(this)
		);

		this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
		this.viewerCloseHandler = this.handleViewerClose.bind(this);
		this.viewerBeforeShowHandler = this.handleViewerBeforeShow.bind(this);

		BX.bind(document, 'visibilitychange', this.visibilityChangeHandler);
		BX.addCustomEvent('BX.UI.Viewer.Controller:onClose', this.viewerCloseHandler);
		BX.addCustomEvent('BX.UI.Viewer.Controller:onBeforeShow', this.viewerBeforeShowHandler);
	},

	handleVisibilityChange: function ()
	{
		if (document.visibilityState === 'hidden')
		{
			this.clearPollTimeout();

			return;
		}

		if (
			this.waitStartedAt === null
			|| this.isWaitExpired
			|| this.isVideoShown
			|| this.isDestroyed
		)
		{
			return;
		}

		if (this.getRemainingWaitTime() <= 0)
		{
			this.showWaitExpired();

			return;
		}

		if (this.isVideoReady)
		{
			this.showVideo();

			return;
		}

		this.checkVideo();
	},

	handleViewerClose: function (controller)
	{
		if (this.isInsideViewer(controller))
		{
			this.destroy();
		}
	},

	handleViewerBeforeShow: function (controller, index)
	{
		if (
			this.isInsideViewer(controller)
			&& controller.getCurrentItem() !== controller.getItemByIndex(index)
		)
		{
			this.destroy();
		}
	},

	isInsideViewer: function (controller)
	{
		var container = BX(this.layout.containerId);
		var viewerContainer = controller && controller.layout && controller.layout.container;

		return Boolean(container && viewerContainer && viewerContainer.contains(container));
	},

	handleClickToRunTransformation: function (event)
	{
		event.preventDefault();

		var data = {};
		if (this.runGenerationPreviewData.attachedObjectId)
		{
			data.attachedObjectId = this.runGenerationPreviewData.attachedObjectId;
		}
		else if (this.runGenerationPreviewData.fileId)
		{
			data.fileId = this.runGenerationPreviewData.fileId;
		}

		BX.ajax.runAction(this.runGenerationPreviewData.action, {data: data}).then(function (response) {
			var previewGeneration = response.data.previewGeneration;

			if (previewGeneration.status === 'success')
			{
				this.registerPullEvent(previewGeneration.data.pullTag);
				this.renderPreparingState();
				this.startWaiting();
			}
			else
			{
				this.showError(this.getErrorMessageByCode(previewGeneration.status));
			}
		}.bind(this), function () {
			this.showError(BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_DESC'));
		}.bind(this));
	},

	registerPullEvent: function(pullTag)
	{
		if (!this.pullEventHandler)
		{
			this.pullEventHandler = function (command) {
				if (
					command === 'transformationComplete'
					&& !this.isWaitExpired
					&& !this.isVideoShown
					&& !this.isDestroyed
				)
				{
					this.checkVideo();
				}
			}.bind(this);

			BX.addCustomEvent('onPullEvent-main', this.pullEventHandler);
		}

		BX.PULL.extendWatch(pullTag);
	},

	startWaiting: function ()
	{
		this.stopWaiting();
		this.waitGeneration++;
		this.videoLoadPromise = null;
		this.waitStartedAt = Date.now();
		this.isWaitExpired = false;
		this.isVideoShown = false;
		this.isVideoReady = false;

		var waitGeneration = this.waitGeneration;
		this.deadlineTimeoutId = setTimeout(function () {
			if (waitGeneration === this.waitGeneration)
			{
				this.showWaitExpired();
			}
		}.bind(this), this.waitTimeout);

		this.scheduleVideoCheck();
	},

	stopWaiting: function ()
	{
		this.clearPollTimeout();

		if (this.deadlineTimeoutId !== null)
		{
			clearTimeout(this.deadlineTimeoutId);
			this.deadlineTimeoutId = null;
		}
	},

	clearPollTimeout: function ()
	{
		if (this.pollTimeoutId !== null)
		{
			clearTimeout(this.pollTimeoutId);
			this.pollTimeoutId = null;
		}
	},

	destroy: function ()
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.isDestroyed = true;
		this.waitGeneration++;
		this.videoLoadPromise = null;
		this.stopWaiting();

		BX.unbind(document, 'visibilitychange', this.visibilityChangeHandler);
		BX.removeCustomEvent('BX.UI.Viewer.Controller:onClose', this.viewerCloseHandler);
		BX.removeCustomEvent('BX.UI.Viewer.Controller:onBeforeShow', this.viewerBeforeShowHandler);

		if (this.pullEventHandler)
		{
			BX.removeCustomEvent('onPullEvent-main', this.pullEventHandler);
			this.pullEventHandler = null;
		}
	},

	scheduleVideoCheck: function ()
	{
		if (this.isWaitExpired || this.isVideoShown || this.isDestroyed || !this.isPollingAllowed())
		{
			return;
		}

		var remaining = this.getRemainingWaitTime();
		if (remaining <= 0)
		{
			this.showWaitExpired();

			return;
		}

		this.pollTimeoutId = setTimeout(function () {
			this.pollTimeoutId = null;
			this.checkVideo();
		}.bind(this), Math.min(this.retryInterval, remaining));
	},

	isPollingAllowed: function ()
	{
		var container = BX(this.layout.containerId);

		return (
			document.visibilityState !== 'hidden'
			&& container
		);
	},

	getRemainingWaitTime: function ()
	{
		if (this.waitStartedAt === null)
		{
			return 0;
		}

		return this.waitTimeout - (Date.now() - this.waitStartedAt);
	},

	checkVideo: function ()
	{
		if (!BX(this.layout.containerId))
		{
			this.destroy();

			return;
		}

		if (this.getRemainingWaitTime() <= 0)
		{
			this.showWaitExpired();

			return;
		}

		if (!this.isPollingAllowed())
		{
			return;
		}

		if (this.videoLoadPromise !== null)
		{
			return;
		}

		this.clearPollTimeout();

		var waitGeneration = this.waitGeneration;
		var videoLoadPromise = this.loadVideo();
		this.videoLoadPromise = videoLoadPromise;
		videoLoadPromise.then(function () {
			if (waitGeneration !== this.waitGeneration)
			{
				return;
			}

			this.videoLoadPromise = null;
			this.isVideoReady = true;

			if (this.getRemainingWaitTime() <= 0)
			{
				this.showWaitExpired();

				return;
			}

			if (!this.isPollingAllowed())
			{
				return;
			}

			this.showVideo();
		}.bind(this), function () {
			if (waitGeneration !== this.waitGeneration)
			{
				return;
			}

			this.videoLoadPromise = null;
			this.scheduleVideoCheck();
		}.bind(this));
	},

	showVideo: function ()
	{
		var player = new BX.Fileman.Player('playerId_' + (Math.floor(Math.random() * Math.floor(100000))), {
			width: Math.min(this.width, 800),
			height: (Math.min(this.width, 800) * 9 / 16),
			sources: this.sources
		});

		var container = BX(this.layout.containerId);
		if (!container)
		{
			this.destroy();

			return;
		}

		this.isVideoShown = true;
		this.destroy();
		BX.replace(container, player.createElement());
		player.init();
	},

	loadVideo: function ()
	{
		var promise = new BX.Promise();

		BX.ajax.promise({
			url: BX.util.add_url_param(this.downloadLink, {ts: 'bxviewer'}),
			method: 'GET',
			dataType: 'json',
			headers: [
				{
					name: 'BX-Viewer-src',
					value: this.downloadLink
				},
				{
					name: 'BX-Viewer',
					value: 'video'
				}
			]
		}).then(function(response){
			var responseData = response && response.data;
			var videoData = responseData && responseData.data;

			if (!videoData || !BX.Type.isArrayFilled(videoData.sources))
			{
				promise.reject({status: 'preparing'});

				return;
			}

			this.width = videoData.width;
			this.height = videoData.height;
			this.sources = videoData.sources;

			if (responseData.html)
			{
				var html = BX.processHTML(responseData.html);

				BX.load(html.STYLE, function(){
					BX.ajax.processScripts(html.SCRIPT, undefined, function(){
						promise.fulfill(this);
					}.bind(this));
				}.bind(this));
			}
			else
			{
				promise.fulfill(this);
			}
		}.bind(this), function (error) {
			promise.reject(error || {});
		});

		return promise;
	},

	renderPreparingState: function ()
	{
		var container = BX(this.layout.containerId);
		if (!container)
		{
			return;
		}

		var title = container.querySelector('.disk-file-transform-file-loader-title');
		var desc = container.querySelector('.disk-file-transform-file-loader-desc');
		var inner = container.querySelector('.disk-file-transform-file-loader-inner');

		BX.removeClass(container, 'disk-file-transform-file-disable');
		BX.addClass(container, 'disk-file-transform-file-loader-video');
		container.setAttribute('role', 'status');
		container.setAttribute('aria-live', 'polite');
		container.removeAttribute('tabindex');

		if (title)
		{
			BX.adjust(title, {text: BX.message('DISK_FILE_TRANSFORM_VIDEO_IN_PROCESS_TITLE')});
		}
		if (desc)
		{
			BX.adjust(desc, {text: BX.message('DISK_FILE_TRANSFORM_VIDEO_IN_PROCESS_DESC')});
		}
		if (inner)
		{
			BX.adjust(inner, {html: this.getDummyLoaderHtml()});
			inner.appendChild(this.renderStateActions(false));
		}
	},

	showWaitExpired: function ()
	{
		this.logWaitExpired();
		this.showError(BX.message('DISK_FILE_TRANSFORM_VIDEO_WAIT_TIMEOUT_DESC'));
	},

	logWaitExpired: function ()
	{
		if (BX.Type && BX.Type.isFunction(BX.debug))
		{
			BX.debug({
				event: 'mkv_wait_expired',
				retryInterval: this.retryInterval,
				waitTimeout: this.waitTimeout
			});
		}
	},

	showError: function(message)
	{
		var container = BX(this.layout.containerId);
		if (!container)
		{
			this.destroy();

			return;
		}

		this.waitGeneration++;
		this.videoLoadPromise = null;
		this.isWaitExpired = true;
		this.stopWaiting();

		var title = container.querySelector('.disk-file-transform-file-loader-title');
		var desc = container.querySelector('.disk-file-transform-file-loader-desc');
		var inner = container.querySelector('.disk-file-transform-file-loader-inner');

		BX.removeClass(container, 'disk-file-transform-file-loader-video');
		BX.addClass(container, 'disk-file-transform-file-disable');
		container.setAttribute('role', 'alert');
		container.setAttribute('aria-live', 'assertive');
		container.setAttribute('tabindex', '-1');

		if (title)
		{
			BX.adjust(title, {text: BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_TITLE')});
		}
		if (desc)
		{
			BX.adjust(desc, {
				text: message || BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_DESC')
			});
		}
		if (inner)
		{
			BX.adjust(inner, {html: this.getDummyErrorHtml()});
			inner.appendChild(this.renderStateActions(true));
		}

		container.focus();
	},

	renderStateActions: function(showRetry)
	{
		var children = [
			BX.create('a', {
				props: {
					className: 'disk-file-transform-file-loader-link disk-file-transform-file-download-link'
				},
				attrs: {
					href: this.downloadLink,
					target: '_blank',
					download: '',
					'aria-label': BX.message('DISK_FILE_TRANSFORM_VIDEO_DOWNLOAD')
				},
				text: BX.message('DISK_FILE_TRANSFORM_VIDEO_DOWNLOAD')
			})
		];

		if (showRetry)
		{
			children.push(BX.create('button', {
				props: {
					className: 'disk-file-transform-file-loader-link ' + this.runGeneratePreviewLinkClass
				},
				attrs: {
					type: 'button'
				},
				text: BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_TRANSFORM')
			}));
		}

		return BX.create('div', {
			props: {
				className: 'disk-file-transform-file-loader-actions'
			},
			children: children
		});
	},

	getDummyLoaderHtml: function()
	{
		return '<div class="disk-file-transform-file-loader-visual" aria-hidden="true"><svg class="disk-file-transform-file-circular hidden" viewBox="25 25 50 50"><circle class="disk-file-transform-file-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/><circle class="disk-file-transform-file-inner-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/></svg><div class="disk-file-transform-file-loader-button"></div></div>';
	},

	getDummyErrorHtml: function()
	{
		return '<div class="disk-file-transform-file-loader-visual" aria-hidden="true"><div class="disk-file-transform-file-loader-button disk-file-transform-file-loader-button-sad"></div></div>';
	},

	getErrorMessageByCode: function(code)
	{
		switch (code)
		{
			case 'not allowed':
				return BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_TRANSFORM_NOT_ALLOWED');
			case 'no module':
				return BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_TRANSFORM_NOT_INSTALLED');
			case 'was transformed':
				return BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_TRANSFORM_TRANSFORMED');
		}

		return BX.message('DISK_FILE_TRANSFORM_VIDEO_ERROR_DESC');
	}
};
})(window);
