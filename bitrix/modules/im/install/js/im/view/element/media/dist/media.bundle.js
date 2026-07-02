/* eslint-disable */
(function (ui_icons, ui_progressbarjs_uploader, ui_vue, ui_vue_vuex, im_model, im_const, im_lib_utils, main_core_events) {
	'use strict';

	/**
	 * Bitrix Messenger
	 * File element Vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-im-view-element-file', {
		/*
		 * @emits EventType.dialog.clickOnUploadCancel {file: object, event: MouseEvent}
		 */

		mounted() {
			this.createProgressbar();
		},
		beforeDestroy() {
			this.removeProgressbar();
		},
		props: {
			userId: {
				default: 0
			},
			messageType: {
				default: im_const.MessageType.self
			},
			file: {
				type: Object,
				required: true
			}
		},
		methods: {
			download(file) {
				if (file.progress !== 100) {
					return false;
				}
				if (BX.UI && BX.UI.Viewer && Object.keys(file.viewerAttrs).length > 0) {
					return false;
				}
				if (file.type === im_const.FileType.image && file.urlShow) {
					if (im_lib_utils.Utils.platform.isBitrixMobile()) {
						BXMobileApp.UI.Photo.show({
							photos: this.files.collection[this.application.dialog.chatId].filter(file => file.type === 'image').map(file => {
								return {
									url: file.urlShow.replace('bxhttp', 'http')
								};
							}).reverse(),
							default_photo: file.urlShow.replace('bxhttp', 'http')
						});
					} else {
						window.open(file.urlShow, '_blank');
					}
				} else if (file.type === im_const.FileType.video && file.urlShow) {
					if (im_lib_utils.Utils.platform.isBitrixMobile()) {
						app.openDocument({
							url: file.urlShow,
							name: file.name
						});
					} else {
						window.open(file.urlShow, '_blank');
					}
				} else if (file.urlDownload) {
					if (im_lib_utils.Utils.platform.isBitrixMobile()) {
						app.openDocument({
							url: file.urlDownload,
							name: file.name
						});
					} else {
						window.open(file.urlDownload, '_blank');
					}
				} else {
					if (im_lib_utils.Utils.platform.isBitrixMobile()) {
						app.openDocument({
							url: file.urlShow,
							name: file.name
						});
					} else {
						window.open(file.urlShow, '_blank');
					}
				}
			},
			createProgressbar() {
				if (this.uploader) {
					return true;
				}
				if (this.file.progress === 100) {
					return false;
				}
				let blurElement = undefined;
				if (this.file.progress < 0 || this.file.type !== im_const.FileType.image && this.file.type !== im_const.FileType.video) {
					blurElement = false;
				}
				this.uploader = new ui_progressbarjs_uploader.Uploader({
					container: this.$refs.container,
					blurElement,
					direction: this.$refs.container.offsetHeight > 54 ? ui_progressbarjs_uploader.Uploader.direction.vertical : ui_progressbarjs_uploader.Uploader.direction.horizontal,
					icon: this.file.progress < 0 ? ui_progressbarjs_uploader.Uploader.icon.cloud : ui_progressbarjs_uploader.Uploader.icon.cancel,
					sizes: {
						circle: this.$refs.container.offsetHeight > 54 ? 54 : 38,
						progress: this.$refs.container.offsetHeight > 54 ? 4 : 8
					},
					labels: {
						loading: this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_LOADING'],
						completed: this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_COMPLETED'],
						canceled: this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_CANCELED'],
						cancelTitle: this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_CANCEL_TITLE'],
						megabyte: this.localize['IM_MESSENGER_ELEMENT_FILE_SIZE_MB']
					},
					cancelCallback: this.file.progress < 0 ? null : event => {
						main_core_events.EventEmitter.emit(im_const.EventType.dialog.clickOnUploadCancel, {
							file: this.file,
							event
						});
					},
					destroyCallback: () => {
						if (this.uploader) {
							this.uploader = null;
						}
					}
				});
				this.uploader.start();
				if (this.file.size && this.file.size / 1024 / 1024 <= 2 || this.$refs.container.offsetHeight <= 54 && this.$refs.container.offsetWidth < 240) {
					this.uploader.setProgressTitleVisibility(false);
				}
				this.updateProgressbar();
				return true;
			},
			updateProgressbar() {
				if (!this.uploader) {
					let result = this.createProgressbar();
					if (!result) {
						return false;
					}
				}
				if (this.file.status === im_const.FileStatus.error) {
					this.uploader.setProgress(0);
					this.uploader.setCancelDisable(false);
					this.uploader.setIcon(ui_progressbarjs_uploader.Uploader.icon.error);
					this.uploader.setProgressTitle(this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_ERROR']);
				} else if (this.file.status === im_const.FileStatus.wait) {
					this.uploader.setProgress(this.file.progress > 5 ? this.file.progress : 5);
					this.uploader.setCancelDisable(true);
					this.uploader.setIcon(ui_progressbarjs_uploader.Uploader.icon.cloud);
					this.uploader.setProgressTitle(this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_SAVING']);
				} else if (this.file.progress === 100) {
					this.uploader.setProgress(100);
				} else if (this.file.progress === -1) {
					this.uploader.setProgress(10);
					this.uploader.setProgressTitle(this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_WAITING']);
				} else {
					if (this.file.progress === 0) {
						this.uploader.setIcon(ui_progressbarjs_uploader.Uploader.icon.cancel);
					}
					let progress = this.file.progress > 5 ? this.file.progress : 5;
					this.uploader.setProgress(progress);
					if (this.file.size / 1024 / 1024 <= 2) {
						this.uploader.setProgressTitle(this.localize['IM_MESSENGER_ELEMENT_FILE_UPLOAD_LOADING']);
					} else {
						this.uploader.setByteSent(this.file.size / 100 * this.file.progress, this.file.size);
					}
				}
			},
			removeProgressbar() {
				if (!this.uploader) {
					return true;
				}
				this.uploader.destroy(false);
				return true;
			}
		},
		computed: {
			FileStatus: () => im_const.FileStatus,
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('IM_MESSENGER_ELEMENT_FILE_', this);
			},
			fileName() {
				let maxLength = 70;
				if (this.file.name.length < maxLength) {
					return this.file.name;
				}
				let endWordLength = 10;
				let secondPart = this.file.name.substring(this.file.name.length - 1 - (this.file.extension.length + 1 + endWordLength));
				let firstPart = this.file.name.substring(0, maxLength - secondPart.length - 3);
				return firstPart.trim() + '...' + secondPart.trim();
			},
			fileSize() {
				let size = this.file.size;
				if (size <= 0) {
					return '&nbsp;';
				}
				let sizes = ["BYTE", "KB", "MB", "GB", "TB"];
				let position = 0;
				while (size >= 1024 && position < 4) {
					size /= 1024;
					position++;
				}
				return Math.round(size) + " " + this.localize['IM_MESSENGER_ELEMENT_FILE_SIZE_' + sizes[position]];
			},
			uploadProgress() {
				return this.file.status + ' ' + this.file.progress;
			},
			...ui_vue_vuex.Vuex.mapState({
				application: state => state.application,
				files: state => state.files
			})
		},
		watch: {
			uploadProgress() {
				this.updateProgressbar();
			}
		},
		template: `
		<div class="bx-im-element-file" @click="download(file, $event)" ref="container">
			<div class="bx-im-element-file-icon">
				<div :class="['ui-icon', 'ui-icon-file-'+file.icon]"><i></i></div>
			</div>
			<div class="bx-im-element-file-block">
				<div class="bx-im-element-file-name" :title="file.name">
					{{fileName}}
				</div>
				<div class="bx-im-element-file-size" v-html="fileSize"></div>
			</div>
		</div>
	`
	});

	/**
	 * Bitrix Messenger
	 * File element Vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.Vue.cloneComponent('bx-im-view-element-file-audio', 'bx-im-view-element-file', {
		computed: {
			background() {
				return this.messageType === im_const.MessageType.self ? 'dark' : 'light';
			}
		},
		template: `
		<div :class="['bx-im-element-file-audio', 'bx-im-element-file-audio-'+messageType]" ref="container">
			<bx-audioplayer :id="file.id" :src="file.urlShow" :background="background"/>
		</div>	
	`
	});

	/**
	 * Bitrix Messenger
	 * File element Vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.Vue.cloneComponent('bx-im-view-element-file-image', 'bx-im-view-element-file', {
		methods: {
			getImageSize(width, height, maxWidth) {
				let aspectRatio;
				if (width > maxWidth) {
					aspectRatio = maxWidth / width;
				} else {
					aspectRatio = 1;
				}
				return {
					width: width * aspectRatio,
					height: height * aspectRatio
				};
			}
		},
		computed: {
			styleFileSizes() {
				let sizes = this.getImageSize(this.file.image.width, this.file.image.height, 280);
				return {
					width: sizes.width + 'px',
					height: sizes.height + 'px',
					backgroundSize: sizes.width < 100 || sizes.height < 100 ? 'contain' : 'initial'
				};
			},
			styleBoxSizes() {
				if (parseInt(this.styleFileSizes.height) <= 280) {
					return {};
				}
				return {
					height: '280px'
				};
			},
			fileSource() {
				return this.file.urlPreview;
			}
		},
		template: `
		<div class="bx-im-element-file-image" @click="download(file, $event)" :style="styleBoxSizes" ref="container">
			<img v-bx-lazyload
				class="bx-im-element-file-image-source"
				:data-lazyload-src="fileSource"
				:title="$Bitrix.Loc.getMessage('IM_MESSENGER_ELEMENT_FILE_SHOW_TITLE').replace('#NAME#', file.name).replace('#SIZE#', fileSize)"
				:style="styleFileSizes"
				:data-viewer="file.viewerAttrs.viewer === null"
				:data-viewer-type="file.viewerAttrs.viewerType? file.viewerAttrs.viewerType: false"
				:data-src="file.viewerAttrs.src? file.viewerAttrs.src: false"
				:data-viewer-group-by="file.viewerAttrs.viewerGroupBy? file.viewerAttrs.viewerGroupBy: false"
				:data-title="file.viewerAttrs.title? file.viewerAttrs.title: false"
				:data-actions="file.viewerAttrs.actions? file.viewerAttrs.actions: false"
			/>
		</div>
	`
	});

	/**
	 * Bitrix Messenger
	 * File element Vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.Vue.cloneComponent('bx-im-view-element-file-video', 'bx-im-view-element-file', {
		methods: {
			getImageSize(width, height, maxWidth) {
				let aspectRatio;
				if (width > maxWidth) {
					aspectRatio = maxWidth / width;
				} else {
					aspectRatio = 1;
				}
				return {
					width: width * aspectRatio,
					height: height * aspectRatio
				};
			}
		},
		computed: {
			isSafari() {
				return im_lib_utils.Utils.browser.isSafari() || im_lib_utils.Utils.platform.isBitrixMobile();
			},
			styleBoxSizes() {
				if (parseInt(this.styleVideoSizes.height) <= 280) {
					return {};
				}
				return {
					height: '280px'
				};
			},
			styleVideoSizes() {
				if (!this.file.image) {
					return {};
				}
				let sizes = this.getImageSize(this.file.image.width, this.file.image.height, 280);
				return {
					width: sizes.width + 'px',
					height: sizes.height + 'px',
					backgroundSize: sizes.width < 100 || sizes.height < 100 ? 'contain' : 'initial'
				};
			},
			autoplay() {
				return this.file.size < 5000000 && this.application.options.autoplayVideo;
			}
		},
		template: `
		<div :class="['bx-im-element-file-video', {'bx-im-element-file-video-safari': isSafari}]" :style="styleBoxSizes" ref="container">
			<bx-socialvideo 
				:id="file.id" 
				:src="file.urlShow" 
				:preview="file.urlPreview" 
				:containerStyle="styleBoxSizes"
				:elementStyle="styleVideoSizes"
				:autoplay="autoplay"
				:showControls="!file.viewerAttrs.viewerType"
				:data-viewer="file.viewerAttrs.viewer === null"
				:data-viewer-type="file.viewerAttrs.viewerType? file.viewerAttrs.viewerType: false"
				:data-src="file.viewerAttrs.src? file.viewerAttrs.src: false"
				:data-viewer-group-by="file.viewerAttrs.viewerGroupBy? file.viewerAttrs.viewerGroupBy: false"
				:data-title="file.viewerAttrs.title? file.viewerAttrs.title: false"
				:data-actions="file.viewerAttrs.action? file.viewerAttrs.actions: false"
				@click="download(file, $event)"
			/>
		</div>
	`
	});

})(BX, BX.ProgressBarJs, BX, BX, BX.Messenger.Model, BX.Messenger.Const, BX.Messenger.Lib, BX.Event);
//# sourceMappingURL=media.bundle.js.map
