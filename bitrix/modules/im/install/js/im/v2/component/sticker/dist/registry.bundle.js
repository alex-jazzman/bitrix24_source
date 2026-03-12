/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_sidepanel,ui_sidepanel_layout,ui_system_input_vue,im_v2_lib_notifier,im_v2_provider_service_sticker,ui_vue3_components_button,ui_vue3_components_richLoc,ui_iconSet_api_core,im_v2_lib_helpdesk,ui_uploader_tileWidget,ui_uploader_core,im_v2_const,im_v2_lib_permission,im_v2_lib_sticker,ui_iconSet_api_vue,main_core,main_core_events,im_v2_application_core) {
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
	var _isValid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isValid");
	class UploaderFilter extends ui_uploader_core.Filter {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _isValid, {
	      value: _isValid2
	    });
	  }
	  apply(file) {
	    return new Promise((resolve, reject) => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _isValid)[_isValid](file)) {
	        resolve();
	      } else {
	        reject(new ui_uploader_core.UploaderError('UPLOADING_ERROR', main_core.Loc.getMessage('IM_STICKER_PACK_FORM_UPLOADING_LIMITS_WEBP')));
	      }
	    });
	  }
	}
	function _isValid2(file) {
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

	const CONTROLLER_ACTION = 'im.v2.controller.sticker.stickerUploader';
	const MAX_FILES_COUNT = 50;
	const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
	const FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
	var _fileIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fileIds");
	class Uploader extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    Object.defineProperty(this, _fileIds, {
	      writable: true,
	      value: new Set()
	    });
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
	            babelHelpers.classPrivateFieldLooseBase(this, _fileIds)[_fileIds].add(id);
	            this.emit(Uploader.UPLOAD_EVENT, [...babelHelpers.classPrivateFieldLooseBase(this, _fileIds)[_fileIds].values()]);
	          }
	        },
	        [ui_uploader_core.UploaderEvent.FILE_REMOVE]: event => {
	          const {
	            file
	          } = event.getData();
	          const id = file.getServerFileId();
	          if (id) {
	            babelHelpers.classPrivateFieldLooseBase(this, _fileIds)[_fileIds].delete(id);
	            this.emit(Uploader.UPLOAD_EVENT, [...babelHelpers.classPrivateFieldLooseBase(this, _fileIds)[_fileIds].values()]);
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
	Uploader.UPLOAD_EVENT = 'uploadedFiles';

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

	let _ = t => t,
	  _t,
	  _t2;
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
	    var _this$pack;
	    return {
	      uploadedFileIds: [],
	      packName: ((_this$pack = this.pack) == null ? void 0 : _this$pack.name) || ''
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
	      return main_core.Tag.render(_t || (_t = _`<div></div>`));
	    },
	    footerContainer() {
	      return main_core.Tag.render(_t2 || (_t2 = _`<div></div>`));
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
	var _isPreviewing = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isPreviewing");
	var _checkInterval = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkInterval");
	var _pressTimer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pressTimer");
	var _lastMoveEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastMoveEvent");
	var _currentSticker = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentSticker");
	var _onMouseUpHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onMouseUpHandler");
	var _onMouseMoveHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onMouseMoveHandler");
	var _checkUnderCursorHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkUnderCursorHandler");
	var _activatePreview = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("activatePreview");
	var _onMouseMove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onMouseMove");
	var _checkUnderCursor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkUnderCursor");
	var _onMouseUp = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onMouseUp");
	var _suppressNextClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("suppressNextClick");
	var _reset = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reset");
	var _getNewStickerFromMoveEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNewStickerFromMoveEvent");
	var _getStickerIdentifier = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStickerIdentifier");
	var _isSameSticker = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSameSticker");
	class StickerPreviewManager extends main_core_events.EventEmitter {
	  static getInstance() {
	    if (!this.instance) {
	      this.instance = new StickerPreviewManager();
	    }
	    return this.instance;
	  }
	  constructor() {
	    super();
	    Object.defineProperty(this, _isSameSticker, {
	      value: _isSameSticker2
	    });
	    Object.defineProperty(this, _getStickerIdentifier, {
	      value: _getStickerIdentifier2
	    });
	    Object.defineProperty(this, _getNewStickerFromMoveEvent, {
	      value: _getNewStickerFromMoveEvent2
	    });
	    Object.defineProperty(this, _reset, {
	      value: _reset2
	    });
	    Object.defineProperty(this, _suppressNextClick, {
	      value: _suppressNextClick2
	    });
	    Object.defineProperty(this, _onMouseUp, {
	      value: _onMouseUp2
	    });
	    Object.defineProperty(this, _checkUnderCursor, {
	      value: _checkUnderCursor2
	    });
	    Object.defineProperty(this, _onMouseMove, {
	      value: _onMouseMove2
	    });
	    Object.defineProperty(this, _activatePreview, {
	      value: _activatePreview2
	    });
	    Object.defineProperty(this, _isPreviewing, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _checkInterval, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _pressTimer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _lastMoveEvent, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _currentSticker, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onMouseUpHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onMouseMoveHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _checkUnderCursorHandler, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace('BX.Messenger.v2.StickerPreviewManager');
	    babelHelpers.classPrivateFieldLooseBase(this, _onMouseUpHandler)[_onMouseUpHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onMouseUp)[_onMouseUp].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onMouseMoveHandler)[_onMouseMoveHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onMouseMove)[_onMouseMove].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _checkUnderCursorHandler)[_checkUnderCursorHandler] = babelHelpers.classPrivateFieldLooseBase(this, _checkUnderCursor)[_checkUnderCursor].bind(this);
	  }
	  trackLongPress(event, sticker) {
	    if (event.button !== 0) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _reset)[_reset]();
	    babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker] = sticker;
	    babelHelpers.classPrivateFieldLooseBase(this, _lastMoveEvent)[_lastMoveEvent] = event;
	    babelHelpers.classPrivateFieldLooseBase(this, _pressTimer)[_pressTimer] = setTimeout(() => babelHelpers.classPrivateFieldLooseBase(this, _activatePreview)[_activatePreview](), LONG_PRESS_DELAY);
	    main_core.Event.bind(document, 'mouseup', babelHelpers.classPrivateFieldLooseBase(this, _onMouseUpHandler)[_onMouseUpHandler]);
	    main_core.Event.bind(document, 'mousemove', babelHelpers.classPrivateFieldLooseBase(this, _onMouseMoveHandler)[_onMouseMoveHandler]);
	  }
	  cancelLongPressTracking() {
	    babelHelpers.classPrivateFieldLooseBase(this, _reset)[_reset]();
	  }
	}
	function _activatePreview2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _isPreviewing)[_isPreviewing] = true;
	  this.emit(StickerPreviewManager.events.showPreview, {
	    sticker: babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker]
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _checkInterval)[_checkInterval] = setInterval(babelHelpers.classPrivateFieldLooseBase(this, _checkUnderCursorHandler)[_checkUnderCursorHandler], CHECK_INTERVAL);
	}
	function _onMouseMove2(event) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isPreviewing)[_isPreviewing]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _lastMoveEvent)[_lastMoveEvent] = event;
	}
	function _checkUnderCursor2() {
	  const newSticker = babelHelpers.classPrivateFieldLooseBase(this, _getNewStickerFromMoveEvent)[_getNewStickerFromMoveEvent]();
	  if (!newSticker) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker] = newSticker;
	  this.emit(StickerPreviewManager.events.showPreview, {
	    sticker: babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker]
	  });
	}
	function _onMouseUp2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isPreviewing)[_isPreviewing]) {
	    this.emit(StickerPreviewManager.events.hidePreview);
	    babelHelpers.classPrivateFieldLooseBase(this, _suppressNextClick)[_suppressNextClick]();
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _reset)[_reset]();
	}
	function _suppressNextClick2() {
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
	function _reset2() {
	  clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _pressTimer)[_pressTimer]);
	  clearInterval(babelHelpers.classPrivateFieldLooseBase(this, _checkInterval)[_checkInterval]);
	  babelHelpers.classPrivateFieldLooseBase(this, _pressTimer)[_pressTimer] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _checkInterval)[_checkInterval] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _isPreviewing)[_isPreviewing] = false;
	  babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _lastMoveEvent)[_lastMoveEvent] = null;
	  main_core.Event.unbind(document, 'mouseup', babelHelpers.classPrivateFieldLooseBase(this, _onMouseUpHandler)[_onMouseUpHandler]);
	  main_core.Event.unbind(document, 'mousemove', babelHelpers.classPrivateFieldLooseBase(this, _onMouseMoveHandler)[_onMouseMoveHandler]);
	}
	function _getNewStickerFromMoveEvent2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _lastMoveEvent)[_lastMoveEvent]) {
	    return null;
	  }
	  const {
	    clientX,
	    clientY
	  } = babelHelpers.classPrivateFieldLooseBase(this, _lastMoveEvent)[_lastMoveEvent];
	  const element = document.elementFromPoint(clientX, clientY);
	  const container = element == null ? void 0 : element.closest('[data-sticker-id]');
	  if (!container) {
	    return null;
	  }
	  const stickerIdentifier = babelHelpers.classPrivateFieldLooseBase(this, _getStickerIdentifier)[_getStickerIdentifier](container);
	  if (!stickerIdentifier || babelHelpers.classPrivateFieldLooseBase(this, _isSameSticker)[_isSameSticker](stickerIdentifier)) {
	    return null;
	  }
	  return im_v2_application_core.Core.getStore().getters['stickers/get'](stickerIdentifier);
	}
	function _getStickerIdentifier2(container) {
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
	function _isSameSticker2(newSticker) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker] || !newSticker) {
	    return false;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker].id === newSticker.id && babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker].packId === newSticker.packId && babelHelpers.classPrivateFieldLooseBase(this, _currentSticker)[_currentSticker].packType === newSticker.packType;
	}
	StickerPreviewManager.events = {
	  showPreview: 'showPreview',
	  hidePreview: 'hidePreview'
	};

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

	exports.StickerPackForm = StickerPackForm;
	exports.PackStickers = PackStickers;
	exports.StickerPreview = StickerPreview;

}((this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {}),BX.SidePanel,BX.UI.SidePanel,BX.UI.System.Input.Vue,BX.Messenger.v2.Lib,BX.Messenger.v2.Provider.Service,BX.Vue3.Components,BX.UI.Vue3.Components,BX.UI.IconSet,BX.Messenger.v2.Lib,BX.UI.Uploader,BX.UI.Uploader,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.UI.IconSet,BX,BX.Event,BX.Messenger.v2.Application));
//# sourceMappingURL=registry.bundle.js.map
