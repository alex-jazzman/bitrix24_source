/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core_events, main_core, ui_progressbarjs_uploader, im_v2_const) {
	'use strict';

	const EVENT_NAMESPACE = 'BX.Call.Component.v2.ProgressBar';
	const SIZE_LOWER_THRESHOLD = 1024 * 1024 * 2;
	const CONTAINER_WIDTH_LOWER_THRESHOLD = 240;
	const CONTAINER_HEIGHT_LOWER_THRESHOLD = 54;
	const STARTING_PROGRESS = 5;
	class ProgressBarManager extends main_core_events.EventEmitter {
		static event = {
			cancel: 'cancel',
			destroy: 'destroy'
		};
		constructor(params) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			const {
				container,
				uploadState,
				customConfig = {}
			} = params;
			this.container = container;
			this.uploadState = uploadState;
			this.progressBar = new ui_progressbarjs_uploader.Uploader({
				...this.#getProgressBarParams(customConfig),
				container
			});
			this.#adjustProgressBarTitleVisibility();
		}
		start() {
			this.progressBar.start();
			this.update();
		}
		update() {
			if (this.uploadState.status === im_v2_const.FileStatus.error) {
				this.progressBar.setProgress(0);
				this.progressBar.setCancelDisable(false);
				this.progressBar.setIcon(ui_progressbarjs_uploader.Uploader.icon.error);
				this.progressBar.setProgressTitle(main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_ERROR'));
			} else if (this.uploadState.status === im_v2_const.FileStatus.wait) {
				this.progressBar.setProgress(this.uploadState.progress > STARTING_PROGRESS ? this.uploadState.progress : STARTING_PROGRESS);
				this.progressBar.setCancelDisable(true);
				this.progressBar.setIcon(ui_progressbarjs_uploader.Uploader.icon.cloud);
				this.progressBar.setProgressTitle(main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_SAVING'));
			} else if (this.uploadState.status === im_v2_const.FileStatus.preparing) {
				this.progressBar.setProgress(this.uploadState.progress > STARTING_PROGRESS ? this.uploadState.progress : STARTING_PROGRESS);
				this.progressBar.setCancelDisable(false);
				this.progressBar.setIcon(ui_progressbarjs_uploader.Uploader.icon.cancel);
				this.progressBar.setProgressTitle(main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_SAVING'));
			} else if (this.uploadState.progress === 100) {
				this.progressBar.setProgress(100);
			} else if (this.uploadState.progress === -1) {
				this.progressBar.setProgress(10);
				this.progressBar.setProgressTitle(main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_WAITING'));
			} else {
				if (this.uploadState.progress === 0) {
					this.progressBar.setIcon(ui_progressbarjs_uploader.Uploader.icon.cancel);
				}
				const progress = this.uploadState.progress > STARTING_PROGRESS ? this.uploadState.progress : STARTING_PROGRESS;
				this.progressBar.setProgress(progress);
				if (this.#isSmallSizeFile()) {
					this.progressBar.setProgressTitle(main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_LOADING'));
				} else {
					const byteSent = this.uploadState.size / 100 * this.uploadState.progress;
					this.progressBar.setByteSent(byteSent, this.uploadState.size);
				}
			}
		}
		destroy() {
			this.progressBar.destroy(false);
		}
		#getProgressBarParams(customConfig) {
			const defaultConfig = {
				// direction: this.container.offsetHeight > CONTAINER_HEIGHT_LOWER_THRESHOLD? ProgressBar.direction.vertical: ProgressBar.direction.horizontal,
				sizes: {
					circle: this.container.offsetHeight > CONTAINER_HEIGHT_LOWER_THRESHOLD ? 54 : 38,
					progress: this.container.offsetHeight > CONTAINER_HEIGHT_LOWER_THRESHOLD ? 4 : 8
				},
				labels: {
					loading: main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_LOADING'),
					completed: main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_COMPLETED'),
					canceled: main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_CANCELED'),
					cancelTitle: main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_UPLOAD_CANCEL_TITLE'),
					megabyte: main_core.Loc.getMessage('IM_LIB_PROGRESSBAR_FILE_SIZE_MB')
				},
				cancelCallback: () => {
					this.emit(ProgressBarManager.event.cancel);
				},
				destroyCallback: () => {
					this.emit(ProgressBarManager.event.destroy);
				}
			};
			return {
				...defaultConfig,
				...customConfig
			};
		}
		#adjustProgressBarTitleVisibility() {
			if (this.#isSmallSizeFile() || this.#isSmallContainer()) {
				this.progressBar.setProgressTitleVisibility(false);
			}
		}
		#isSmallSizeFile() {
			return this.uploadState.size < SIZE_LOWER_THRESHOLD;
		}
		#isSmallContainer() {
			return this.container.offsetHeight <= CONTAINER_HEIGHT_LOWER_THRESHOLD && this.container.offsetWidth < CONTAINER_WIDTH_LOWER_THRESHOLD;
		}
	}

	exports.ProgressBarManager = ProgressBarManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Event, BX, BX.ProgressBarJs, BX.Messenger.v2.Const);
//# sourceMappingURL=progressbar.bundle.js.map
