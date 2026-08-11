/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, ui_buttons, ui_fonts_opensans, call_adapter_desktopApi, call_adapter_utils, call_adapter_logger, im_v2_lib_progressbar, main_core, call_adapter_imConst, ui_infoHelper, call_adapter_helpdesk, rest_client, main_core_events, call_adapter_uploader, call_adapter_notifier) {
	'use strict';

	class Background {
		id = '';
		title = '';
		background = '';
		preview = '';
		isVideo = false;
		isSupported = true;
		isCustom = false;
		canRemove = false;
		isLoading = false;
		uploadState = null;
		constructor(params) {
			Object.assign(this, params);
		}
		static createDefaultFromRest(restItem) {
			return new Background({
				...restItem,
				isVideo: restItem.id.includes(':video'),
				isCustom: false,
				canRemove: false,
				isSupported: true
			});
		}
		static createCustomFromRest(restItem) {
			let title = main_core.Loc.getMessage('BX_IM_CALL_BG_CUSTOM');
			if (!restItem.isSupported) {
				title = main_core.Loc.getMessage('BX_IM_CALL_BG_UNSUPPORTED');
			}
			return new Background({
				...restItem,
				title,
				isCustom: true,
				canRemove: true
			});
		}
		static createCustomFromUploaderEvent(uploaderData) {
			const {
				id,
				filePreview,
				file
			} = uploaderData;
			return new Background({
				id: id,
				background: filePreview,
				preview: filePreview,
				title: main_core.Loc.getMessage('BX_IM_CALL_BG_CUSTOM'),
				isVideo: file.type.startsWith('video'),
				isCustom: true,
				canRemove: false,
				isSupported: true,
				isLoading: true,
				uploadState: {
					progress: 0,
					status: call_adapter_imConst.FileStatus.upload,
					size: file.size
				}
			});
		}
		setUploadProgress(progress) {
			this.uploadState.progress = progress;
		}
		setUploadError() {
			this.uploadState.status = call_adapter_imConst.FileStatus.error;
			this.uploadState.progress = 0;
		}
		onUploadComplete(fileResult) {
			this.id = fileResult.id;
			if (this.isVideo) {
				this.background = fileResult.links.download;
			}
			this.isLoading = false;
			this.canRemove = true;
		}
	}

	// @vue/component
	const BackgroundComponent = {
		props: {
			element: {
				type: Object,
				required: true
			},
			isSelected: {
				type: Boolean,
				required: true
			}
		},
		emits: ['click', 'remove', 'cancel'],
		data() {
			return {};
		},
		computed: {
			background() {
				return this.element;
			},
			containerClasses() {
				const classes = [];
				if (this.isSelected) {
					classes.push('--selected');
				}
				if (!this.background.isSupported) {
					classes.push('--unsupported');
				}
				if (this.background.isLoading) {
					classes.push('--loading');
				}
				return classes;
			},
			imageStyle() {
				let backgroundImage = '';
				if (this.background.preview) {
					backgroundImage = `url('${this.background.preview}')`;
				}
				return {
					backgroundImage
				};
			}
		},
		watch: {
			'background.uploadState.status'() {
				this.getProgressBarManager().update();
			},
			'background.uploadState.progress'() {
				this.getProgressBarManager().update();
			}
		},
		mounted() {
			this.initProgressBar();
		},
		beforeUnmount() {
			this.removeProgressBar();
		},
		methods: {
			initProgressBar() {
				if (!this.background.uploadState || this.background.uploadState.progress === 100) {
					return;
				}
				this.progressBarManager = new im_v2_lib_progressbar.ProgressBarManager({
					container: this.$refs['container'],
					uploadState: this.background.uploadState
				});
				this.progressBarManager.subscribe(im_v2_lib_progressbar.ProgressBarManager.event.cancel, () => {
					this.$emit('cancel', this.background);
				});
				this.progressBarManager.subscribe(im_v2_lib_progressbar.ProgressBarManager.event.destroy, () => {
					if (this.progressBar) {
						this.progressBar = null;
					}
				});
				this.progressBarManager.start();
			},
			removeProgressBar() {
				if (!this.progressBarManager) {
					return;
				}
				this.progressBarManager.destroy();
			},
			getProgressBarManager() {
				return this.progressBarManager;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div @click="$emit('click')" :class="containerClasses" class="bx-im-call-background__item" ref="container">
			<div :style="imageStyle" class="bx-im-call-background__item_image"></div>
			<div v-if="background.isSupported && background.isVideo" class="bx-im-call-background__item_video"></div>
			<div v-if="!background.isLoading" class="bx-im-call-background__item_title_container">
				<span class="bx-im-call-background__item_title">{{background.title}}</span>
				<div
					v-if="background.canRemove"
					:title="loc('BX_IM_CALL_BG_REMOVE')"
					@click.stop="$emit('remove')"
					class="bx-im-call-background__item_remove"
				></div>
			</div>
		</div>
	`
	};

	class Action {
		static type = {
			none: 'none',
			upload: 'upload',
			blur: 'blur',
			gaussianBlur: 'gaussianBlur'
		};
		constructor(type) {
			let id = Action.type.none;
			let background = Action.type.none;
			let title = main_core.Loc.getMessage('BX_IM_CALL_BG_ACTION_NONE');
			if (type === Action.type.upload) {
				id = type;
				background = type;
				title = main_core.Loc.getMessage('BX_IM_CALL_BG_ACTION_UPLOAD');
			} else if (type === Action.type.gaussianBlur) {
				id = type;
				background = type;
				title = main_core.Loc.getMessage('BX_IM_CALL_BG_ACTION_BLUR');
			} else if (type === Action.type.blur) {
				id = type;
				background = type;
				title = main_core.Loc.getMessage('BX_IM_CALL_BG_ACTION_BLUR_MAX');
			}
			this.id = id;
			this.background = background;
			this.title = title;
		}
		isEmpty() {
			return this.id === Action.type.none;
		}
		isBlur() {
			return this.id === Action.type.gaussianBlur || this.id === Action.type.blur;
		}
		isUpload() {
			return this.id === Action.type.upload;
		}
	}

	// @vue/component
	const ActionComponent = {
		props: {
			element: {
				type: Object,
				required: true
			},
			isSelected: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			action() {
				return this.element;
			},
			containerClasses() {
				const classes = [`--${this.action.id}`];
				if (this.isSelected) {
					classes.push('--selected');
				}
				return classes;
			}
		},
		template: `
		<div :class="containerClasses" class="bx-im-call-background__item --action">
			<div class="bx-im-call-background__action_icon"></div>
			<div class="bx-im-call-background__action_title">
				{{ action.title }}
			</div>
		</div>
	`
	};

	class Mask {
		id = '';
		active = true;
		mask = '';
		background = '';
		preview = '';
		title = '';
		isLoading = false;
		constructor(params) {
			Object.assign(this, params);
		}
		isEmpty() {
			return this.id === '';
		}
		static createEmpty() {
			return new Mask({
				active: true,
				id: '',
				mask: '',
				preview: '',
				background: '',
				title: main_core.Loc.getMessage('BX_IM_CALL_BG_NO_MASK_TITLE')
			});
		}
		static createFromRest(rawMask) {
			const {
				active,
				id,
				mask,
				background,
				preview,
				title
			} = rawMask;
			return new Mask({
				active,
				id,
				mask,
				preview,
				background,
				title
			});
		}
	}

	// @vue/component
	const MaskComponent = {
		props: {
			element: {
				type: Object,
				required: true
			},
			isSelected: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			mask() {
				return this.element;
			},
			containerClasses() {
				const classes = [`--${this.mask.id}`];
				if (this.isSelected) {
					classes.push('--selected');
				}
				if (!this.mask.active) {
					classes.push('--inactive');
				}
				return classes;
			},
			imageStyle() {
				let backgroundImage = '';
				if (this.mask.preview) {
					backgroundImage = `url('${this.mask.preview}')`;
				}
				return {
					backgroundImage
				};
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div :class="containerClasses" class="bx-im-call-background__item --mask">
			<div v-if="!mask.active" class="bx-im-call-background__mask_fade"></div>
			<div class="bx-im-call-background__mask_background"></div>
			<div :style="imageStyle" class="bx-im-call-background__item_image"></div>
			<div v-if="mask.isLoading" class="bx-im-call-background__mask_loading-container">
				<div class="bx-im-call-background__mask_loading-icon"></div>
				<div class="bx-im-call-background__mask_loading-text">{{ loc('BX_IM_CALL_BG_MASK_LOADING') }}</div>
			</div>
			<div v-else-if="!mask.active" class="bx-im-call-background__mask_soon-container">
				<div class="bx-im-call-background__mask_soon-text">{{ loc('BX_IM_CALL_BG_MASK_COMING_SOON') }}</div>
			</div>
			<div v-else class="bx-im-call-background__mask_title">{{ mask.title }}</div>
		</div>
	`
	};

	// @vue/component
	const Loader = {
		name: 'CallBackgroundLoader',
		data() {
			return {};
		},
		template: `
		<div class="bx-im-call-background__loader">
			<svg class="bx-desktop-loader-circular" viewBox="25 25 50 50">
				<circle class="bx-desktop-loader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
			</svg>
		</div>
	`
	};

	class LimitManager {
		static limitCode = {
			blur: 'call_blur_background',
			image: 'call_background'
		};
		limits = {};
		constructor(params) {
			const {
				limits,
				infoHelperUrlTemplate
			} = params;
			this.#initLimits(limits);
			this.#initInfoHelper(infoHelperUrlTemplate);
		}
		isLimitedAction(action) {
			if (action.isEmpty() || action.isUpload()) {
				return false;
			}
			return action.isBlur() && this.#limitIsActive(LimitManager.limitCode.blur);
		}
		isLimitedBackground() {
			return this.#limitIsActive(LimitManager.limitCode.image);
		}
		showLimitSlider(limitCode) {
			window.BX.UI.InfoHelper.show(this.limits[limitCode].articleCode);
		}

		// region Mask feature
		static isMaskFeatureAvailable() {
			if (!call_adapter_utils.Utils.platform.isBitrixDesktop()) {
				return true;
			}
			return call_adapter_desktopApi.DesktopApi.isFeatureEnabled(call_adapter_desktopApi.DesktopFeature.mask.id);
		}
		static isMaskFeatureSupportedByDesktopVersion() {
			if (!call_adapter_utils.Utils.platform.isBitrixDesktop()) {
				return true;
			}
			return call_adapter_desktopApi.DesktopApi.isFeatureSupported(call_adapter_desktopApi.DesktopFeature.mask.id);
		}
		// endregion Mask feature

		static showHelpArticle(articleCode) {
			call_adapter_helpdesk.openHelpdeskArticle(articleCode);
		}
		#initLimits(limits) {
			limits.forEach(limit => {
				this.limits[limit.id] = limit;
			});
		}
		#initInfoHelper(infoHelperUrlTemplate) {
			if (window.BX.UI.InfoHelper.isInited()) {
				return;
			}
			window.BX.UI.InfoHelper.init({
				frameUrlTemplate: infoHelperUrlTemplate
			});
		}
		#limitIsActive(limitCode) {
			const limitIsActive = !!this.limits[limitCode]?.active;
			const articleIsActive = !!this.limits[limitCode]?.articleCode;
			return limitIsActive && articleIsActive;
		}
	}

	const TabId = {
		mask: 'mask',
		background: 'background'
	};
	const MASK_HELP_ARTICLE_CODE = 12398124;

	// @vue/component
	const TabPanel = {
		props: {
			selectedTab: {
				type: String,
				required: true
			}
		},
		emits: ['tabChange'],
		data() {
			return {};
		},
		computed: {
			tabs() {
				const tabs = [];
				if (LimitManager.isMaskFeatureAvailable()) {
					tabs.push({
						id: TabId.mask,
						loc: 'BX_IM_CALL_BG_TAB_MASK',
						isNew: false
					});
				}
				tabs.push({
					id: TabId.background,
					loc: 'BX_IM_CALL_BG_TAB_BG',
					isNew: false
				});
				return tabs;
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-call-background__tab-panel">
			<div
				v-for="tab in tabs"
				:key="tab.id"
				@click="$emit('tabChange', tab.id)"
				:class="{'--active': selectedTab === tab.id, '--new': tab.isNew}"
				class="bx-im-call-background__tab"
			>
				<div v-if="tab.isNew" class="bx-im-call-background__tab_new">{{ loc('BX_IM_CALL_BG_TAB_NEW') }}</div>
				<div class="bx-im-call-background__tab_text">{{ loc(tab.loc) }}</div>
			</div>
		</div>
	`
	};

	const VIDEO_CONSTRAINT_WIDTH = 1280;
	const VIDEO_CONSTRAINT_HEIGHT = 720;

	// @vue/component
	const VideoPreview = {
		data() {
			return {
				noVideo: false
			};
		},
		computed: {
			videoClasses() {
				return {
					'--flipped': BX.Call.Hardware.enableMirroring
				};
			}
		},
		created() {
			this.initHardware().then(() => {
				this.getDefaultDevices();
			}).catch(error => {
				console.error('VideoPreview: error initing hardware', error);
			});
		},
		beforeUnmount() {
			this.videoStream.getTracks().forEach(tr => tr.stop());
			this.videoStream = null;
		},
		methods: {
			getDefaultDevices() {
				const constraints = {
					audio: false,
					video: true
				};
				constraints.video = {};
				constraints.video.width = {
					ideal: VIDEO_CONSTRAINT_WIDTH
				};
				constraints.video.height = {
					ideal: VIDEO_CONSTRAINT_HEIGHT
				};
				if (BX.Call.Hardware.defaultCamera) {
					this.selectedCamera = BX.Call.Hardware.defaultCamera;
					constraints.video = {
						...constraints.video,
						...{
							deviceId: {
								exact: this.selectedCamera
							}
						}
					};
				} else if (Object.keys(BX.Call.Hardware.cameraList).length === 0) {
					console.error('VideoPreview: no camera');
					return;
				}
				navigator.mediaDevices.getUserMedia(constraints).then(stream => {
					this.videoStream = stream;
					if (stream.getVideoTracks().length === 0) {
						this.noVideo = true;
						console.error('VideoPreview: no video tracks');
						return;
					}
					if (!this.selectedCamera) {
						this.selectedCamera = stream.getVideoTracks()[0].getSettings().deviceId;
					}
					this.playLocalVideo();
				});
			},
			playLocalVideo() {
				call_adapter_logger.Logger.warn('VideoPreview: playing local video');
				this.$refs['video'].volume = 0;
				this.$refs['video'].srcObject = this.videoStream;
				this.$refs['video'].play();
			},
			initHardware() {
				return BX.Call.Hardware.init();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-call-background__video">
			<div v-if="noVideo" class="bx-im-call-background__no-cam_container">
				<div class="bx-im-call-background__no-cam_icon"></div>
				<div class="bx-im-call-background__no-cam_title">{{ loc('BX_IM_CALL_BG_NO_CAM') }}</div>
			</div>
			<video v-else :class="videoClasses" ref="video" muted autoplay playsinline></video>
		</div>
	`
	};

	class BackgroundService {
		getElementsList() {
			const query = {
				[call_adapter_imConst.RestMethod.imCallBackgroundGet]: [call_adapter_imConst.RestMethod.imCallBackgroundGet],
				[call_adapter_imConst.RestMethod.imCallMaskGet]: [call_adapter_imConst.RestMethod.imCallMaskGet]
			};
			return new Promise((resolve, reject) => {
				rest_client.rest.callBatch(query, response => {
					call_adapter_logger.Logger.warn('BackgroundService: getElementsList result', response);
					const backgroundResult = response[call_adapter_imConst.RestMethod.imCallBackgroundGet];
					const maskResult = response[call_adapter_imConst.RestMethod.imCallMaskGet];
					if (backgroundResult.error()) {
						console.error('BackgroundService: error getting background list', backgroundResult.error());
						return reject(backgroundResult.error());
					}
					if (maskResult.error()) {
						console.error('BackgroundService: error getting mask list', maskResult.error());
						return reject(maskResult.error());
					}
					return resolve({
						backgroundResult: backgroundResult.data(),
						maskResult: maskResult.data()
					});
				});
			});
		}
		commitBackground(fileId) {
			rest_client.rest.callMethod(call_adapter_imConst.RestMethod.imCallBackgroundCommit, {
				fileId
			}).catch(result => {
				console.error('BackgroundService: commitBackground error', result.error());
			});
		}
		deleteFile(fileId) {
			rest_client.rest.callMethod(call_adapter_imConst.RestMethod.imCallBackgroundDelete, {
				fileId
			}).catch(result => {
				console.error('BackgroundService: deleteFile error', result.error());
			});
		}
	}

	const FILE_MAX_SIZE = 100 * 1024 * 1024;
	const FILE_MAX_SIZE_PHRASE_NUMBER = 100;
	const UPLOAD_CHUNK_SIZE = 1024 * 1024;
	const CUSTOM_BG_TASK_PREFIX = 'custom';
	const EVENT_NAMESPACE = 'BX.Call.Component.v2.CallBackground.UploadManager';
	class UploadManager extends main_core_events.EventEmitter {
		static allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'video/avi', 'video/mp4', 'video/quicktime'];
		static event = {
			uploadStart: 'uploadStart',
			uploadProgress: 'uploadProgress',
			uploadComplete: 'uploadComplete',
			uploadError: 'uploadError'
		};
		constructor(params) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			const {
				inputNode
			} = params;
			this.uploader = new call_adapter_uploader.Uploader({
				inputNode,
				generatePreview: true,
				fileMaxSize: FILE_MAX_SIZE
			});
			this.#bindEvents();
		}
		setDiskFolderId(diskFolderId) {
			this.diskFolderId = diskFolderId;
		}
		cancelUpload(fileId) {
			this.uploader.deleteTask(fileId);
		}

		// region events
		#bindEvents() {
			this.uploader.subscribe('onFileMaxSizeExceeded', this.#onFileMaxSizeExceeded.bind(this));
			this.uploader.subscribe('onSelectFile', this.#onSelectFile.bind(this));
			this.uploader.subscribe('onStartUpload', this.#onStartUpload.bind(this));
			this.uploader.subscribe('onProgress', this.#onProgress.bind(this));
			this.uploader.subscribe('onComplete', this.#onComplete.bind(this));
			this.uploader.subscribe('onUploadFileError', this.#onUploadError.bind(this));
			this.uploader.subscribe('onCreateFileError', this.#onUploadError.bind(this));
		}
		#onFileMaxSizeExceeded(event) {
			call_adapter_logger.Logger.warn('UploadManager: onFileMaxSizeExceeded', event);
			const eventData = event.getData();
			const {
				file
			} = eventData;
			call_adapter_notifier.Notifier.call.onBackgroundFileSizeError({
				fileName: file.name,
				fileSizeLimit: FILE_MAX_SIZE_PHRASE_NUMBER
			});
		}
		#onSelectFile(event) {
			call_adapter_logger.Logger.warn('UploadManager: onSelectFile', event);
			const {
				file,
				previewData
			} = event.getData();
			if (!this.#isAllowedType(file.type) || !previewData) {
				call_adapter_notifier.Notifier.call.onBackgroundUnsupportedError(file.name);
				return;
			}
			this.#addUploadTask(file, previewData);
		}
		#onStartUpload(event) {
			call_adapter_logger.Logger.warn('UploadManager: onStartUpload', event);
			const {
				previewData,
				id,
				file
			} = event.getData();
			const filePreview = URL.createObjectURL(previewData);
			this.emit(UploadManager.event.uploadStart, {
				id,
				filePreview,
				file
			});
		}
		#onProgress(event) {
			call_adapter_logger.Logger.warn('UploadManager: onProgress', event);
			const {
				id,
				progress
			} = event.getData();
			this.emit(UploadManager.event.uploadProgress, {
				id,
				progress
			});
		}
		#onComplete(event) {
			call_adapter_logger.Logger.warn('UploadManager: onComplete', event);
			const {
				id,
				result
			} = event.getData();
			this.emit(UploadManager.event.uploadComplete, {
				id,
				fileResult: result.data.file
			});
		}
		#onUploadError(event) {
			call_adapter_logger.Logger.warn('UploadManager: onUploadError', event);
			const eventData = event.getData();
			this.emit(UploadManager.event.uploadError, {
				id: eventData.id
			});
		}
		// endregion events

		#addUploadTask(file, previewData) {
			this.uploader.addTask({
				taskId: `${CUSTOM_BG_TASK_PREFIX}:${Date.now()}`,
				chunkSize: UPLOAD_CHUNK_SIZE,
				fileData: file,
				fileName: file.name,
				diskFolderId: this.diskFolderId,
				generateUniqueName: true,
				previewBlob: previewData
			});
		}
		#isAllowedType(fileType) {
			return UploadManager.allowedFileTypes.includes(fileType);
		}
	}

	// @vue/component
	const CallBackground = {
		name: 'CallBackground',
		components: {
			BackgroundComponent,
			ActionComponent,
			MaskComponent,
			Loader,
			TabPanel,
			VideoPreview
		},
		props: {
			tab: {
				type: String,
				default: TabId.background
			}
		},
		data() {
			return {
				selectedTab: '',
				selectedBackgroundId: '',
				selectedMaskId: '',
				loadingItems: true,
				actions: [],
				defaultBackgrounds: [],
				customBackgrounds: [],
				masks: [],
				listIsScrolled: false
			};
		},
		computed: {
			TabId: () => TabId,
			backgrounds() {
				return [...this.customBackgrounds, ...this.defaultBackgrounds];
			},
			containerClasses() {
				const classes = [];
				if (this.isDesktop) {
					classes.push('--desktop');
				}
				return classes;
			},
			uploadTypes() {
				return UploadManager.allowedFileTypes.join(', ');
			},
			descriptionText() {
				const replaces = {
					'#HIGHLIGHT_START#': '<span class="bx-im-call-background__description_highlight">',
					'#HIGHLIGHT_END#': '</span>',
					'#BR#': '</br></br>'
				};
				if (this.selectedTab === TabId.mask) {
					return this.loc('BX_IM_CALL_BG_DESCRIPTION_MASK_2', replaces);
				}
				return this.loc('BX_IM_CALL_BG_DESCRIPTION_BG', replaces);
			},
			isDesktop() {
				return call_adapter_utils.Utils.platform.isBitrixDesktop();
			}
		},
		created() {
			this.initSelectedTab();
			this.getBackgroundService().getElementsList().then(result => {
				const {
					backgroundResult,
					maskResult
				} = result;
				this.initLimitManager(backgroundResult);
				this.initBackgroundList(backgroundResult);
				this.uploadManager.setDiskFolderId(backgroundResult.upload.folderId);
				const uploadActionIsAvailable = !!backgroundResult.upload.folderId;
				this.initActions(uploadActionIsAvailable);
				this.initMasks(maskResult);
				this.initMaskLoadEventHandler();
				this.initPreviouslySelectedItem();
				this.loadingItems = false;
				this.hideLoader();
			}).catch(() => {
				this.loadingItems = false;
			});
		},
		mounted() {
			this.initUploader();
		},
		methods: {
			// region init
			initSelectedTab() {
				if (this.tab === TabId.mask && !LimitManager.isMaskFeatureAvailable()) {
					this.selectedTab = TabId.background;
					return;
				}
				if (this.tab === TabId.mask && !LimitManager.isMaskFeatureSupportedByDesktopVersion()) {
					this.selectedTab = TabId.background;
					LimitManager.showHelpArticle(MASK_HELP_ARTICLE_CODE);
					return;
				}
				this.selectedTab = this.tab;
			},
			initPreviouslySelectedItem() {
				this.initPreviouslySelectedMask();
				this.initPreviouslySelectedBackground();
			},
			initPreviouslySelectedMask() {
				if (this.isDesktop) {
					const {
						id: maskId
					} = call_adapter_desktopApi.DesktopApi.getCallMask();
					let foundMask = this.masks.find(mask => mask.id === maskId);
					if (!foundMask) {
						foundMask = Mask.createEmpty();
					}
					this.previouslySelectedMask = foundMask;
					call_adapter_logger.Logger.warn('CallBackground: previously selected mask', this.previouslySelectedMask);
				} else {
					this.previouslySelectedMask = Mask.createEmpty();
				}
				this.selectedMaskId = this.previouslySelectedMask.id;
			},
			initPreviouslySelectedBackground() {
				if (this.isDesktop) {
					const {
						id: backgroundId
					} = call_adapter_desktopApi.DesktopApi.getBackgroundImage();
					const itemsToSearch = [...this.actions, ...this.backgrounds];
					let foundBackground = itemsToSearch.find(item => item.id === backgroundId);
					if (!foundBackground) {
						foundBackground = new Action(Action.type.none);
					}
					this.previouslySelectedBackground = foundBackground;
					call_adapter_logger.Logger.warn('CallBackground: previously selected background', this.previouslySelectedBackground);
				} else {
					this.previouslySelectedBackground = new Action(Action.type.none);
				}
				this.selectedBackgroundId = this.previouslySelectedBackground.id;
			},
			initActions(uploadActionIsAvailable) {
				this.actions = [new Action(Action.type.none), ...(uploadActionIsAvailable ? [new Action(Action.type.upload)] : []), new Action(Action.type.gaussianBlur), new Action(Action.type.blur)];
			},
			initBackgroundList(restResult) {
				this.defaultBackgrounds = [];
				restResult.backgrounds.default.forEach(background => {
					this.defaultBackgrounds.push(Background.createDefaultFromRest(background));
				});
				this.customBackgrounds = [];
				restResult.backgrounds.custom.forEach(background => {
					this.customBackgrounds.push(Background.createCustomFromRest(background));
				});
			},
			initLimitManager(result) {
				const {
					limits,
					infoHelperParams
				} = result;
				this.limitManager = new LimitManager({
					limits,
					infoHelperUrlTemplate: infoHelperParams.frameUrlTemplate
				});
			},
			initUploader() {
				this.uploadManager = new UploadManager({
					inputNode: this.$refs['uploadInput']
				});
				this.uploadManager.subscribe(UploadManager.event.uploadStart, event => {
					const backgroundsInstance = Background.createCustomFromUploaderEvent(event.getData());
					this.customBackgrounds.unshift(backgroundsInstance);
				});
				this.uploadManager.subscribe(UploadManager.event.uploadProgress, event => {
					const {
						id,
						progress
					} = event.getData();
					const background = this.findCustomBackgroundById(id);
					if (!background) {
						return;
					}
					background.setUploadProgress(progress);
				});
				this.uploadManager.subscribe(UploadManager.event.uploadComplete, event => {
					const {
						id,
						fileResult
					} = event.getData();
					const background = this.findCustomBackgroundById(id);
					if (!background) {
						return;
					}
					background.onUploadComplete(fileResult);
					this.onBackgroundClick(background);
					this.getBackgroundService().commitBackground(background.id);
				});
				this.uploadManager.subscribe(UploadManager.event.uploadError, event => {
					const {
						id
					} = event.getData();
					const background = this.findCustomBackgroundById(id);
					if (!background) {
						return;
					}
					background.setUploadError();
				});
			},
			initMasks(result) {
				const {
					masks
				} = result;
				this.masks.push(Mask.createEmpty());
				masks.forEach(mask => {
					this.masks.push(Mask.createFromRest(mask));
				});
			},
			initMaskLoadEventHandler() {
				if (!this.isDesktop) {
					return;
				}
				this.maskLoadTimeouts = {};
				call_adapter_desktopApi.DesktopApi.setCallMaskLoadHandlers(this.onMaskLoad.bind(this));
			},
			// endregion init
			// region component events
			onActionClick(action) {
				if (this.getLimitManager().isLimitedAction(action)) {
					this.getLimitManager().showLimitSlider(LimitManager.limitCode.blur);
					return;
				}
				if (action.isUpload()) {
					this.$refs['uploadInput'].click();
					return;
				}
				this.selectedBackgroundId = action.id;
				if (action.isEmpty()) {
					this.removeCallBackground();
					return;
				}
				this.selectedMaskId = '';
				this.setCallBlur(action);
			},
			onBackgroundClick(background) {
				if (this.getLimitManager().isLimitedBackground()) {
					this.getLimitManager().showLimitSlider(LimitManager.limitCode.image);
					return;
				}
				if (!background.isSupported || background.isLoading) {
					return;
				}
				this.selectedBackgroundId = background.id;
				this.selectedMaskId = '';
				this.setCallBackground(background);
			},
			onBackgroundRemove(background) {
				if (background.id === this.selectedBackgroundId) {
					this.selectedBackgroundId = Action.type.none;
					this.removeCallBackground();
				}
				if (background.isLoading) {
					this.uploadManager.cancelUpload(background.id);
				} else {
					this.getBackgroundService().deleteFile(background.id);
				}
				this.customBackgrounds = this.customBackgrounds.filter(element => element.id !== background.id);
			},
			onMaskClick(mask) {
				if (!mask.active) {
					return;
				}
				if (mask.isEmpty()) {
					this.selectedMaskId = mask.id;
					this.removeCallMask();
				}
				this.setCallMask(mask);
			},
			onSaveButtonClick() {
				window.close();
			},
			onCancelButtonClick() {
				const backgroundWasChanged = this.previouslySelectedBackground.id !== this.selectedBackgroundId;
				const maskWasChanged = this.previouslySelectedMask.id !== this.selectedMaskId;
				if (!backgroundWasChanged && !maskWasChanged) {
					window.close();
					return;
				}
				let backgroundPromise = Promise.resolve();
				if (backgroundWasChanged) {
					backgroundPromise = this.setCallBackground(this.previouslySelectedBackground);
				}
				backgroundPromise.then(() => {
					if (maskWasChanged && !this.previouslySelectedMask.isEmpty()) {
						this.setCallMask(this.previouslySelectedMask);
						this.isWaitingForMaskToCancel = true;
					} else if (this.previouslySelectedMask.isEmpty()) {
						this.removeCallMask();
						window.close();
					} else {
						window.close();
					}
				});
			},
			onListScroll(event) {
				if (event.target.scrollTop === 0) {
					this.listIsScrolled = false;
					return;
				}
				this.listIsScrolled = true;
			},
			onTabChange(newTabId) {
				if (newTabId === TabId.mask && !LimitManager.isMaskFeatureSupportedByDesktopVersion()) {
					LimitManager.showHelpArticle(MASK_HELP_ARTICLE_CODE);
					return;
				}
				this.selectedTab = newTabId;
			},
			onMaskLoad(url) {
				call_adapter_logger.Logger.warn('CallBackground: onMaskLoad', url);
				if (this.isWaitingForMaskToCancel) {
					window.close();
					return;
				}
				const masksWithoutEmpty = this.masks.filter(mask => !mask.isEmpty());
				const loadedMask = masksWithoutEmpty.find(mask => url.includes(mask.mask));
				call_adapter_logger.Logger.warn('CallBackground: loaded mask', loadedMask);
				if (!loadedMask) {
					return;
				}
				clearTimeout(this.maskLoadTimeouts[loadedMask.id]);
				loadedMask.isLoading = false;
				if (this.lastRequestedMaskId === loadedMask.id) {
					this.selectedMaskId = loadedMask.id;
				}
			},
			// endregion component events
			// region desktop interactions
			onSetCallBackgroundHandle(id, source) {
				return call_adapter_desktopApi.DesktopApi.setCallBackground(id, source).then(id => {
					if (id === 'none' && this.selectedBackgroundId !== 'none') {
						call_adapter_logger.Logger.warn('CallBackground: background settings limit exceeded');
						this.selectedBackgroundId = Action.type.none;
					}
				});
			},
			setCallBackground(backgroundInstance) {
				call_adapter_logger.Logger.warn('CallBackground: trying set background', backgroundInstance);
				if (!this.isDesktop) {
					return;
				}
				return this.onSetCallBackgroundHandle(backgroundInstance.id, backgroundInstance.background);
			},
			setCallBlur(action) {
				call_adapter_logger.Logger.warn('CallBackground: trying set blur', action);
				if (!this.isDesktop) {
					return;
				}
				return this.onSetCallBackgroundHandle(action.id, action.background);
			},
			removeCallBackground() {
				if (!this.isDesktop) {
					return;
				}
				return this.onSetCallBackgroundHandle(Action.type.none, Action.type.none);
			},
			setCallMask(mask) {
				call_adapter_logger.Logger.warn('CallBackground: set mask', mask);
				if (!this.isDesktop) {
					return;
				}
				if (mask.isEmpty()) {
					call_adapter_logger.Logger.warn('CallBackground: empty mask - removing it');
					call_adapter_desktopApi.DesktopApi.setCallMask();
					return;
				}
				this.lastRequestedMaskId = mask.id;
				const MASK_LOAD_STATUS_DELAY = 500;
				this.maskLoadTimeouts[mask.id] = setTimeout(() => {
					mask.isLoading = true;
				}, MASK_LOAD_STATUS_DELAY);
				call_adapter_desktopApi.DesktopApi.setCallMask(mask.id, mask.mask, mask.background);
			},
			removeCallMask() {
				if (!this.isDesktop) {
					return;
				}
				call_adapter_desktopApi.DesktopApi.setCallMask();
			},
			hideLoader() {
				if (!this.isDesktop) {
					return;
				}
				call_adapter_desktopApi.DesktopApi.hideLoader();
			},
			// endregion desktop interactions
			findCustomBackgroundById(id) {
				return this.customBackgrounds.find(element => element.id === id);
			},
			getBackgroundService() {
				if (!this.backgroundService) {
					this.backgroundService = new BackgroundService();
				}
				return this.backgroundService;
			},
			getLimitManager() {
				return this.limitManager;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div :class="{'--desktop': isDesktop}" class="bx-im-call-background__scope bx-im-call-background__container">
			<div v-if="loadingItems" class="bx-im-call-background__loader_container">
				<Loader />
			</div>
			<div v-else class="bx-im-call-background__content">
				<div class="bx-im-call-background__left">
					<VideoPreview />
					<div v-html="descriptionText" class="bx-im-call-background__description"></div>
				</div>
				<div :class="{'--scrolled': listIsScrolled}" class="bx-im-call-background__right">
					<TabPanel :selectedTab="selectedTab" @tabChange="onTabChange" />
					<div v-if="selectedTab === TabId.background" @scroll="onListScroll" class="bx-im-call-background__list">
						<ActionComponent
							v-for="action in actions"
							:element="action"
							:key="action.id"
							:isSelected="selectedBackgroundId === action.id"
							@click="onActionClick(action)"
						/>
						<BackgroundComponent
							v-for="background in backgrounds"
							:element="background"
							:key="background.id"
							:isSelected="selectedBackgroundId === background.id"
							@click="onBackgroundClick(background)"
							@cancel="onBackgroundRemove(background)"
							@remove="onBackgroundRemove(background)"
						/>
					</div>
					<div v-else-if="selectedTab === TabId.mask" @scroll="onListScroll" class="bx-im-call-background__list">
						<MaskComponent
							v-for="mask in masks"
							:element="mask"
							:key="mask.id"
							:isSelected="selectedMaskId === mask.id"
							@click="onMaskClick(mask)"
						/>
					</div>
				</div>	
			</div>
			<div class="bx-im-call-background__button-panel">
				<button @click="onSaveButtonClick" :class="{'ui-btn-wait ui-btn-disabled': loadingItems}" class="ui-btn ui-btn-success">
					{{ loc('BX_IM_CALL_BG_SAVE') }}
				</button>
				<button @click="onCancelButtonClick" class="ui-btn ui-btn-link">
					{{ loc('BX_IM_CALL_BG_CANCEL') }}
				</button>
			</div>
		</div>
		<div class="bx-im-call-background__upload-input">
			<input type="file" :accept="uploadTypes" ref="uploadInput"/>
		</div>
	`
	};

	exports.CallBackground = CallBackground;

})(this.BX.Call.Component.v2 = this.BX.Call.Component.v2 || {}, BX.Vue3, BX.UI, BX, BX.Call.Adapter, BX.Call.Adapter, BX.Call.Adapter, BX.Messenger.v2.Lib, BX, BX.Call.Adapter, BX.UI, BX.Call.Adapter, BX, BX.Event, BX.Call.Adapter, BX.Call.Adapter);
//# sourceMappingURL=call-background.bundle.js.map
