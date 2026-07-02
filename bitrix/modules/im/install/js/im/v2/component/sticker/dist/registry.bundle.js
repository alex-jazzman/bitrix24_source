/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_sidepanel, ui_sidepanel_layout, ui_system_input_vue, ui_vue3_components_button, im_v2_const, im_v2_lib_notifier, im_v2_provider_service_sticker, ui_vue3_components_richLoc, ui_iconSet_api_core, im_v2_lib_helpdesk, ui_uploader_tileWidget, main_core_events, ui_uploader_core, im_v2_application_core, im_v2_lib_permission, im_v2_lib_sticker, ui_iconSet_api_vue) {
	'use strict';

	const StickerPackFormHeader = {
		name: 'StickerPackFormHeader',
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-sticker-pack-form-header__container">
			<div class="bx-im-sticker-pack-form-header__image"></div>
			<div class="bx-im-sticker-pack-form-header__content">
				<div class="bx-im-sticker-pack-form-header__title">
					{{ loc('IM_STICKER_PACK_FORM_WELCOME_TITLE') }}
				</div>
				<div class="bx-im-sticker-pack-form-header__description">
					{{ loc('IM_STICKER_PACK_FORM_WELCOME_BODY') }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const UploadButton = {
		name: 'UploadButton',
		components: {
			UiButton: ui_vue3_components_button.Button,
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		inject: ['uploader'],
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			description() {
				return main_core.Loc.getMessage('IM_STICKER_PACK_FORM_DESCRIPTION');
			}
		},
		mounted() {
			this.uploader.assignBrowse(this.$refs.upload);
		},
		methods: {
			onHelpdeskLinkClick() {
				im_v2_lib_helpdesk.openHelpdeskArticle('26987270');
			},
			loc(phraseCode) {
				return main_core.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-sticker-pack-form-upload-button__container">
			<div class="bx-im-sticker-pack-form-upload-button__button" ref="upload">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:leftIcon="OutlineIcons.PLUS_L"
					:text="loc('IM_STICKER_PACK_FORM_ADD_FILES_BUTTON')"
				/>
			</div>
			<div class="bx-im-sticker-pack-form-upload-button__description">
				<RichLoc
					:text="description"
					placeholder="[url]"
				>
					<template #url="{ text }">
						<span 
							class="bx-im-sticker-pack-form-upload-button__description-link" 
							@click="onHelpdeskLinkClick"
						>
							{{ text }}
						</span>
					</template>
				</RichLoc>
			</div>
		</div>
	`
	};

	const WEBP_MIME_TYPE = 'image/webp';
	const WEBP_MAX_SIZE = 1024 * 500; // 500 KB
	const WEBP_MAX_RESOLUTION = 512; // 512 px

	class UploaderFilter extends ui_uploader_core.Filter {
		apply(file) {
			return new Promise((resolve, reject) => {
				if (this.#isValid(file)) {
					resolve();
				} else {
					reject(new ui_uploader_core.UploaderError('UPLOADING_ERROR', main_core.Loc.getMessage('IM_STICKER_PACK_FORM_UPLOADING_LIMITS_WEBP')));
				}
			});
		}
		#isValid(file) {
			if (file.getType() !== WEBP_MIME_TYPE) {
				return true;
			}
			if (file.isAnimated()) {
				return false;
			}
			const isAllowedSize = file.getSize() <= WEBP_MAX_SIZE;
			const isAllowedResolution = file.getWidth() <= WEBP_MAX_RESOLUTION && file.getHeight() <= WEBP_MAX_RESOLUTION;
			return isAllowedSize && isAllowedResolution;
		}
	}

	const CONTROLLER_ACTION = 'im.v2.controller.sticker.stickerUploader';
	const MAX_FILES_COUNT = 50;
	const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
	const FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
	class Uploader extends main_core_events.EventEmitter {
		#fileIds = new Set();
		static UPLOAD_EVENT = 'uploadedFiles';
		constructor() {
			super();
			this.setEventNamespace('BX.Messenger.v2.Textarea.StickersUploader');
		}
		getOptions() {
			return {
				controller: CONTROLLER_ACTION,
				multiple: true,
				maxFileCount: MAX_FILES_COUNT,
				autoUpload: true,
				maxFileSize: MAX_FILE_SIZE,
				acceptedFileTypes: FILE_TYPES,
				events: {
					[ui_uploader_core.UploaderEvent.FILE_COMPLETE]: event => {
						const {
							file
						} = event.getData();
						const id = file.getServerFileId();
						if (id) {
							this.#fileIds.add(id);
							this.emit(Uploader.UPLOAD_EVENT, [...this.#fileIds.values()]);
						}
					},
					[ui_uploader_core.UploaderEvent.FILE_REMOVE]: event => {
						const {
							file
						} = event.getData();
						const id = file.getServerFileId();
						if (id) {
							this.#fileIds.delete(id);
							this.emit(Uploader.UPLOAD_EVENT, [...this.#fileIds.values()]);
						}
					}
				},
				filters: [{
					type: ui_uploader_core.FilterType.PREPARATION,
					filter: UploaderFilter
				}]
			};
		}
	}

	const UploaderWidgetOptions = {
		readonly: false,
		hideDropArea: false,
		slots: {
			[ui_uploader_tileWidget.TileWidgetSlot.BEFORE_DROP_AREA]: UploadButton
		}
	};
	const UploaderWidget = {
		name: 'UploaderWidget',
		components: {
			TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent
		},
		emits: ['uploadedFiles'],
		computed: {
			UploaderWidgetOptions: () => UploaderWidgetOptions,
			uploaderOptions() {
				return this.uploader.getOptions();
			}
		},
		created() {
			this.uploader = new Uploader();
			this.uploader.subscribe(Uploader.UPLOAD_EVENT, event => {
				const fileIds = event.getData();
				this.$emit('uploadedFiles', fileIds);
			});
		},
		template: `
		<TileWidgetComponent
			:uploaderOptions="uploaderOptions"
			:widgetOptions="UploaderWidgetOptions"
		/>
	`
	};

	const SLIDER_ID = 'im:sticker-pack-form';
	const SLIDER_WIDTH = 700;

	// @vue/component
	const StickerPackForm = {
		name: 'StickerPackForm',
		components: {
			BInput: ui_system_input_vue.BInput,
			UiButton: ui_vue3_components_button.Button,
			StickerPackFormHeader,
			UploaderWidget,
			UploadButton
		},
		props: {
			pack: {
				type: Object,
				default: () => {}
			}
		},
		emits: ['close'],
		data() {
			return {
				uploadedFileIds: [],
				packName: this.pack?.name || ''
			};
		},
		computed: {
			InputDesign: () => ui_system_input_vue.InputDesign,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			hasUploadedFiles() {
				return this.uploadedFileIds.length > 0;
			},
			isUpdateMode() {
				return Boolean(this.pack);
			},
			saveButtonName() {
				if (this.isUpdateMode) {
					return this.loc('IM_STICKER_PACK_FORM_BUTTON_SAVE');
				}
				return this.loc('IM_STICKER_PACK_FORM_BUTTON_CREATE');
			},
			contentContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			footerContainer() {
				return main_core.Tag.render`<div></div>`;
			},
			title() {
				if (this.isUpdateMode) {
					return main_core.Loc.getMessage('IM_STICKER_PACK_FORM_UPDATE_TITLE');
				}
				return main_core.Loc.getMessage('IM_STICKER_PACK_FORM_CREATE_TITLE');
			},
			description() {
				return main_core.Loc.getMessage('IM_STICKER_PACK_FORM_DESCRIPTION');
			}
		},
		created() {
			this.openSlider();
		},
		beforeUnmount() {
			this.closeSlider();
		},
		methods: {
			openSlider() {
				main_sidepanel.SidePanel.Instance.open(SLIDER_ID, {
					cacheable: false,
					width: SLIDER_WIDTH,
					contentCallback: () => {
						return this.createLayoutContent();
					},
					events: {
						onCloseComplete: () => {
							this.$emit('close');
						}
					}
				});
			},
			closeSlider() {
				const slider = main_sidepanel.SidePanel.Instance.getSlider(SLIDER_ID);
				if (!slider) {
					return;
				}
				slider.close();
			},
			createLayoutContent() {
				return ui_sidepanel_layout.Layout.createContent({
					title: this.title,
					design: {
						section: false,
						alignButtonsLeft: true
					},
					content: () => this.contentContainer,
					buttons: () => [this.footerContainer]
				});
			},
			onUploadedFiles(ids) {
				this.uploadedFileIds = ids;
			},
			onSave() {
				if (this.isUpdateMode) {
					void this.updatePack();
					return;
				}
				void this.createPack();
			},
			async createPack() {
				await im_v2_provider_service_sticker.StickerService.getInstance().createPack({
					uuids: this.uploadedFileIds,
					type: im_v2_const.StickerPackType.custom,
					name: this.packName
				});
				im_v2_lib_notifier.Notifier.sticker.onCreatePackComplete();
				this.$emit('close');
			},
			async updatePack() {
				await im_v2_provider_service_sticker.StickerService.getInstance().updatePack({
					uuids: this.uploadedFileIds,
					id: this.pack.id,
					type: this.pack.type,
					name: this.packName
				});
				im_v2_lib_notifier.Notifier.sticker.onUpdatePackComplete();
				this.$emit('close');
			},
			loc(phraseCode) {
				return main_core.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<Teleport :to="contentContainer">
			<div class="bx-im-sticker-pack-form__section">
				<StickerPackFormHeader />
				<UploaderWidget @uploadedFiles="onUploadedFiles" />
			</div>
			<div
				v-if="hasUploadedFiles || isUpdateMode"
				class="bx-im-sticker-pack-form__section"
			>
				<div class="bx-im-sticker-pack-form__pack-title">
					{{ loc('IM_STICKER_PACK_FORM_PACK_NAME') }}
				</div>
				<BInput v-model.trim="packName" :design="InputDesign.Primary" />
			</div>
		</Teleport>
		<Teleport :to="footerContainer">
			<div class="bx-im-sticker-pack-form__buttons">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:text="saveButtonName"
					@click="onSave"
				/>
				<UiButton
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:text="loc('IM_STICKER_PACK_FORM_BUTTON_CANCEL')"
					@click="$emit('close');"
				/>
			</div>
		</Teleport>
	`
	};

	// @vue/component
	const AddStickerButton = {
		name: 'AddStickerButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			StickerPackForm
		},
		inject: ['disableAutoHide', 'enableAutoHide'],
		props: {
			pack: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				showPackForm: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		methods: {
			onUpdatePackClick() {
				this.disableAutoHide();
				this.showPackForm = true;
			},
			onPackFormClose() {
				this.enableAutoHide();
				this.showPackForm = false;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-stickers-add-sticker-button__container" @click="onUpdatePackClick">
			<div class="bx-im-stickers-add-sticker-button__button">
				<BIcon
					:name="OutlineIcons.PLUS_L"
					:title="loc('IM_TEXTAREA_STICKER_SELECTOR_STICKERS_RECENT')"
				/>
			</div>
			<StickerPackForm v-if="showPackForm" :pack="pack" @close="onPackFormClose" />
		</div>
	`
	};

	// @vue/component
	const StickerItem = {
		name: 'StickerItem',
		props: {
			sticker: {
				type: Object,
				required: true
			}
		},
		computed: {
			stickerItem() {
				return this.sticker;
			}
		},
		template: `
		<div
			:data-sticker-id="stickerItem.id"
			:data-sticker-pack-id="stickerItem.packId"
			:data-sticker-pack-type="stickerItem.packType"
			class="bx-im-sticker-item__container"
		>
			<img :src="stickerItem.uri" alt="" loading="lazy" draggable="false" />
		</div>
	`
	};

	// @vue/component
	const StickerPreview = {
		name: 'StickerPreview',
		props: {
			sticker: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			stickerItem() {
				return this.sticker;
			}
		},
		mounted() {
			main_core.Event.bind(document, 'mouseup', this.onMouseUp);
			main_core.ZIndexManager.register(this.$refs['preview-overlay']);
			main_core.ZIndexManager.bringToFront(this.$refs['preview-overlay']);
		},
		beforeUnmount() {
			main_core.ZIndexManager.unregister(this.$refs['preview-overlay']);
			main_core.Event.unbind(document, 'mouseup', this.onMouseUp);
		},
		methods: {
			onMouseUp() {
				this.$emit('close');
			}
		},
		template: `
		<Teleport to="body">
			<div class="bx-im-sticker-preview__overlay" ref="preview-overlay">
				<div class="bx-im-sticker-preview__container">
					<img :src="stickerItem.uri" alt="" draggable="false" class="bx-im-sticker-preview__image" />
				</div>
			</div>
		</Teleport>
	`
	};

	const LONG_PRESS_DELAY = 300;
	const CHECK_INTERVAL = 50;
	const CLICK_SUPPRESSION_UNBIND_DELAY = 500;
	class StickerPreviewManager extends main_core_events.EventEmitter {
		static events = {
			showPreview: 'showPreview',
			hidePreview: 'hidePreview'
		};
		#isPreviewing = false;
		#checkInterval = null;
		#pressTimer = null;
		#lastMoveEvent = null;
		#currentSticker = null;
		#onMouseUpHandler;
		#onMouseMoveHandler;
		#checkUnderCursorHandler;
		static getInstance() {
			if (!this.instance) {
				this.instance = new StickerPreviewManager();
			}
			return this.instance;
		}
		constructor() {
			super();
			this.setEventNamespace('BX.Messenger.v2.StickerPreviewManager');
			this.#onMouseUpHandler = this.#onMouseUp.bind(this);
			this.#onMouseMoveHandler = this.#onMouseMove.bind(this);
			this.#checkUnderCursorHandler = this.#checkUnderCursor.bind(this);
		}
		trackLongPress(event, sticker) {
			if (event.button !== 0) {
				return;
			}
			this.#reset();
			this.#currentSticker = sticker;
			this.#lastMoveEvent = event;
			this.#pressTimer = setTimeout(() => this.#activatePreview(), LONG_PRESS_DELAY);
			main_core.Event.bind(document, 'mouseup', this.#onMouseUpHandler);
			main_core.Event.bind(document, 'mousemove', this.#onMouseMoveHandler);
		}
		cancelLongPressTracking() {
			this.#reset();
		}
		#activatePreview() {
			this.#isPreviewing = true;
			this.emit(StickerPreviewManager.events.showPreview, {
				sticker: this.#currentSticker
			});
			this.#checkInterval = setInterval(this.#checkUnderCursorHandler, CHECK_INTERVAL);
		}
		#onMouseMove(event) {
			if (!this.#isPreviewing) {
				return;
			}
			this.#lastMoveEvent = event;
		}
		#checkUnderCursor() {
			const newSticker = this.#getNewStickerFromMoveEvent();
			if (!newSticker) {
				return;
			}
			this.#currentSticker = newSticker;
			this.emit(StickerPreviewManager.events.showPreview, {
				sticker: this.#currentSticker
			});
		}
		#onMouseUp() {
			if (this.#isPreviewing) {
				this.emit(StickerPreviewManager.events.hidePreview);
				this.#suppressNextClick();
			}
			this.#reset();
		}
		#suppressNextClick() {
			const blockClick = event => {
				event.stopPropagation();
				event.preventDefault();
				event.stopImmediatePropagation();
			};
			main_core.Event.bind(window, 'click', blockClick, {
				capture: true,
				once: true
			});
			// we need to unbind the click listener after some time in case the click event doesn't happen (bug #238345)
			setTimeout(() => {
				main_core.Event.unbind(window, 'click', blockClick, {
					capture: true
				});
			}, CLICK_SUPPRESSION_UNBIND_DELAY);
		}
		#reset() {
			clearTimeout(this.#pressTimer);
			clearInterval(this.#checkInterval);
			this.#pressTimer = null;
			this.#checkInterval = null;
			this.#isPreviewing = false;
			this.#currentSticker = null;
			this.#lastMoveEvent = null;
			main_core.Event.unbind(document, 'mouseup', this.#onMouseUpHandler);
			main_core.Event.unbind(document, 'mousemove', this.#onMouseMoveHandler);
		}
		#getNewStickerFromMoveEvent() {
			if (!this.#lastMoveEvent) {
				return null;
			}
			const {
				clientX,
				clientY
			} = this.#lastMoveEvent;
			const element = document.elementFromPoint(clientX, clientY);
			const container = element?.closest('[data-sticker-id]');
			if (!container) {
				return null;
			}
			const stickerIdentifier = this.#getStickerIdentifier(container);
			if (!stickerIdentifier || this.#isSameSticker(stickerIdentifier)) {
				return null;
			}
			return im_v2_application_core.Core.getStore().getters['stickers/get'](stickerIdentifier);
		}
		#getStickerIdentifier(container) {
			const {
				stickerId,
				stickerPackId,
				stickerPackType
			} = container.dataset;
			if (!stickerId || !stickerPackId || !stickerPackType) {
				return null;
			}
			return {
				id: Number.parseInt(stickerId, 10),
				packId: Number.parseInt(stickerPackId, 10),
				packType: stickerPackType
			};
		}
		#isSameSticker(newSticker) {
			if (!this.#currentSticker || !newSticker) {
				return false;
			}
			return this.#currentSticker.id === newSticker.id && this.#currentSticker.packId === newSticker.packId && this.#currentSticker.packType === newSticker.packType;
		}
	}

	// @vue/component
	const PackStickers = {
		name: 'PackStickers',
		components: {
			StickerItem,
			AddStickerButton,
			StickerPreview
		},
		inject: ['disableAutoHide', 'enableAutoHide'],
		props: {
			pack: {
				type: Object,
				required: true
			},
			withAddButton: {
				type: Boolean,
				default: true
			}
		},
		emits: ['clickSticker', 'openContextMenuSticker'],
		data() {
			return {
				previewSticker: null
			};
		},
		computed: {
			isRecentPack() {
				return im_v2_lib_sticker.StickerManager.isRecentPack(this.pack);
			},
			recentStickers() {
				return this.$store.getters['stickers/recent/get'];
			},
			stickers() {
				if (this.isRecentPack) {
					return this.recentStickers;
				}
				return this.$store.getters['stickers/getByPack']({
					id: this.pack.id,
					type: this.pack.type
				});
			},
			canAddStickers() {
				if (!im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.changeStickerPack)) {
					return false;
				}
				if (!this.withAddButton) {
					return false;
				}
				return this.pack.type === im_v2_const.StickerPackType.custom && this.pack.authorId === im_v2_application_core.Core.getUserId();
			}
		},
		beforeUnmount() {
			this.unsubscribeFromPreviewManager();
		},
		methods: {
			getStickerUniqueKey(sticker) {
				return `${sticker.packId}:${sticker.packType}:${sticker.id}`;
			},
			onMouseDown(event, sticker) {
				this.subscribeToPreviewManager();
				StickerPreviewManager.getInstance().trackLongPress(event, sticker);
			},
			subscribeToPreviewManager() {
				this.unsubscribeFromPreviewManager();
				const previewManager = StickerPreviewManager.getInstance();
				previewManager.subscribe(StickerPreviewManager.events.showPreview, this.onPreviewShow);
				previewManager.subscribe(StickerPreviewManager.events.hidePreview, this.onPreviewHide);
			},
			unsubscribeFromPreviewManager() {
				const previewManager = StickerPreviewManager.getInstance();
				previewManager.unsubscribe(StickerPreviewManager.events.showPreview, this.onPreviewShow);
				previewManager.unsubscribe(StickerPreviewManager.events.hidePreview, this.onPreviewHide);
			},
			onPreviewShow(event) {
				const {
					sticker
				} = event.getData();
				this.previewSticker = sticker;
				this.disableAutoHide();
			},
			onPreviewHide() {
				this.previewSticker = null;
				this.enableAutoHide();
				this.unsubscribeFromPreviewManager();
			},
			onClickSticker(event, sticker) {
				this.$emit('clickSticker', {
					event,
					sticker
				});
			},
			cancelLongPressTracking() {
				StickerPreviewManager.getInstance().cancelLongPressTracking();
			}
		},
		template: `
		<div class="bx-im-pack-stickers__container">
			<StickerItem
				v-for="sticker in stickers"
				:key="getStickerUniqueKey(sticker)"
				:sticker="sticker"
				@click="onClickSticker($event, sticker)"
				@mousedown="onMouseDown($event, sticker)"
				@contextmenu.prevent="$emit('openContextMenuSticker', { event: $event, sticker })"
			/>
			<AddStickerButton v-if="canAddStickers" :pack="pack" />
			<StickerPreview
				v-if="previewSticker"
				:sticker="previewSticker"
				@close="cancelLongPressTracking"
			/>
		</div>
	`
	};

	exports.PackStickers = PackStickers;
	exports.StickerPackForm = StickerPackForm;
	exports.StickerPreview = StickerPreview;

})(this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}, BX, BX.SidePanel, BX.UI.SidePanel, BX.UI.System.Input.Vue, BX.Vue3.Components, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Provider.Service, BX.UI.Vue3.Components, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.UI.Uploader, BX.Event, BX.UI.Uploader, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.IconSet);
//# sourceMappingURL=registry.bundle.js.map
