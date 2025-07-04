/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports,biconnector_datasetImport_fileExport,ui_pinner,ui_section,ui_alerts,ui_hint,ui_sidepanel_layout,ui_iconSet_crm,ui_switcher,ui_uploader_stackWidget,main_loader,ui_ears,main_popup,ui_analytics,ui_buttons,ui_vue3,ui_entitySelector,ui_iconSet_api_vue,ui_vue3_directives_hint,main_core_events,ui_vue3_vuex,main_core,ui_sidepanel) {
	'use strict';

	const AppLayout = {
	  props: {
	    saveLocked: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    isEditMode: {
	      type: Boolean,
	      required: false,
	      default: false
	    }
	  },
	  computed: {
	    saveButtonClass() {
	      return {
	        'ui-btn-base-light': this.saveLocked,
	        'app-root__button--blocked': this.saveLocked,
	        'ui-btn-success': !this.saveLocked
	      };
	    },
	    saveButtonText() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SAVE') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CREATE');
	    }
	  },
	  mounted() {
	    main_core.Dom.addClass(document.querySelector('body'), 'app-body');
	    const buttonsPanel = this.$refs.buttonsPanel;
	    if (buttonsPanel) {
	      this.$root.$el.parentNode.appendChild(buttonsPanel);
	      new BX.UI.Pinner(buttonsPanel, {
	        fixBottom: true,
	        fullWidth: true
	      });
	    }
	  },
	  methods: {
	    onCreateButtonClick() {
	      this.$Bitrix.eventEmitter.emit('biconnector:dataset-import:createButtonClick', {});
	    },
	    onCancelButtonClick() {
	      this.$Bitrix.eventEmitter.emit('biconnector:dataset-import:cancelButtonClick', {});
	    }
	  },
	  // language=Vue
	  template: `
		<div class="app">
			<div class="app__block app__block--narrow">
				<slot name="left-panel"></slot>
			</div>
			<div class="app__block">
				<slot name="right-panel"></slot>
			</div>
	
			<div class="ui-button-panel-wrapper" ref="buttonsPanel">
				<div class="ui-button-panel">
					<div class="app-root__button-wrapper" :class="saveLocked ? 'app-root__button-wrapper--blocked' : ''">
						<button class="ui-btn ui-btn-md app-root__button" :class="saveButtonClass" @click="onCreateButtonClick" ref="saveButton">
							{{ saveButtonText }}
						</button>
					</div>
					<button class="ui-btn ui-btn-md ui-btn-link app-root__button" @click="onCancelButtonClick">
						{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CANCEL') }}
					</button>
				</div>
			</div>
		</div>
	`
	};

	const ImportConfig = {
	  // language=Vue
	  template: `
		<div class="import-config">
			<slot></slot>
		</div>
	`
	};

	const Popup = {
	  emits: ['close'],
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    options: {
	      type: Object,
	      required: false,
	      default: {}
	    },
	    wrapperClass: {
	      type: String,
	      required: false,
	      default: ''
	    }
	  },
	  data() {
	    return {
	      popupInstance: null
	    };
	  },
	  computed: {
	    popupOptions() {
	      return {
	        id: this.id,
	        content: this.$refs.content,
	        autoHide: true,
	        events: {
	          onPopupClose: this.closePopup,
	          onPopupDestroy: this.closePopup
	        },
	        fixed: true,
	        ...this.options
	      };
	    }
	  },
	  methods: {
	    closePopup() {
	      var _PopupManager$getPopu;
	      (_PopupManager$getPopu = main_popup.PopupManager.getPopupById(this.id)) == null ? void 0 : _PopupManager$getPopu.destroy();
	      this.popupInstance = null;
	      this.$emit('close');
	    }
	  },
	  mounted() {
	    if (!this.popupInstance) {
	      this.popupInstance = new main_popup.Popup(this.popupOptions);
	    }
	    this.popupInstance.show();
	  },
	  beforeUnmount() {
	    this.closePopup();
	  },
	  template: `
		<div ref="content" :class="wrapperClass">
			<slot></slot>
		</div>
	`
	};

	// noinspection JSUnusedGlobalSymbols
	const FileErrorsPopup = {
	  emits: ['close', 'saveIgnoringErrors'],
	  props: {
	    errors: {
	      type: Array,
	      required: true
	    },
	    isEditMode: {
	      type: Boolean,
	      required: true
	    },
	    isSavingMode: {
	      type: Boolean,
	      required: true
	    }
	  },
	  data() {
	    return {
	      reportDownloadLink: null
	    };
	  },
	  computed: {
	    popupOptions() {
	      return {
	        width: 830,
	        closeIcon: false,
	        noAllPaddings: true,
	        overlay: true
	      };
	    },
	    title() {
	      if (!this.isSavingMode) {
	        if (this.errors.length >= 200) {
	          return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TITLE_MANY');
	        }
	        return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TITLE');
	      }
	      if (this.errors.length <= 200) {
	        return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TITLE');
	      }
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TITLE_STOPPED_UPDATING') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TITLE_STOPPED_CREATING');
	    },
	    hintContent() {
	      if (this.errors.length > 200) {
	        if (this.isEditMode) {
	          return this.prepareHintContent('DATASET_IMPORT_CSV_ERROR_POPUP_HINT_UPDATING_MANY_ERRORS');
	        }
	        return this.prepareHintContent('DATASET_IMPORT_CSV_ERROR_POPUP_HINT_CREATION_MANY_ERRORS');
	      }
	      if (this.isSavingMode) {
	        if (this.isEditMode) {
	          return this.prepareHintContent('DATASET_IMPORT_CSV_ERROR_POPUP_HINT_UPDATING');
	        }
	        return this.prepareHintContent('DATASET_IMPORT_CSV_ERROR_POPUP_HINT_CREATION');
	      }
	      return this.prepareHintContent('DATASET_IMPORT_CSV_ERROR_POPUP_HINT_CHECKING');
	    },
	    errorsCountText() {
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_SUMMARY').replace('[wrapper]', '<span class="errors-counter">').replace('#COUNT#', this.errors.length > 200 ? '200+' : this.errors.length).replace('[/wrapper]', '</span>');
	    }
	  },
	  methods: {
	    onClose() {
	      this.$emit('close');
	    },
	    onIgnoreErrorsClick() {
	      this.$emit('saveIgnoringErrors');
	    },
	    onDownloadLogButtonClick() {
	      this.downloadLogButton.setState(ui_buttons.ButtonState.WAITING);
	      if (this.reportDownloadLink) {
	        this.downloadLogButton.setState(null);
	        this.downloadLog();
	        return;
	      }
	      main_core.ajax.runAction('biconnector.externalsource.dataset.logErrorsIntoFile', {
	        data: {
	          fields: this.$store.state.config,
	          type: 'csv'
	        }
	      }).then(response => {
	        this.downloadLogButton.setState(null);
	        const blob = new Blob([response.data], {
	          type: 'text/html'
	        });
	        this.reportDownloadLink = window.URL.createObjectURL(blob);
	        this.downloadLog();
	      }).catch(() => {
	        this.downloadLogButton.setState(null);
	      });
	    },
	    downloadLog() {
	      var _this$$store$state$co;
	      const link = document.createElement('a');
	      link.href = this.reportDownloadLink;
	      link.download = `${(_this$$store$state$co = this.$store.state.config.datasetProperties.name) != null ? _this$$store$state$co : 'csv_dataset'}_errors.html`;
	      main_core.Dom.append(link, document.body);
	      link.click();
	      main_core.Dom.remove(link);
	    },
	    prepareHintContent(phraseCode) {
	      const message = this.$Bitrix.Loc.getMessage(phraseCode);
	      return message.replace('[link]', '<a onclick="top.BX.Helper.show(`redirect=detail&code=23779844`)">').replace('[/link]', '</a>');
	    }
	  },
	  mounted() {
	    this.downloadLogButton = new ui_buttons.Button({
	      size: ui_buttons.ButtonSize.EXTRA_SMALL,
	      color: ui_buttons.ButtonColor.LIGHT,
	      noCaps: true,
	      onclick: this.onDownloadLogButtonClick,
	      text: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_DOWNLOAD_LOG'),
	      className: 'popup-errors-log-button'
	    });
	    this.downloadLogButton.renderTo(this.$refs.summaryBlock);
	  },
	  beforeUnmount() {
	    window.URL.revokeObjectURL(this.reportDownloadLink);
	    this.reportDownloadLink = null;
	  },
	  components: {
	    Popup
	  },
	  // language=Vue
	  template: `
		<Popup id="generic" @close="this.onClose" :options="popupOptions" wrapper-class="errors-popup">
			<h3 class="popup-header">{{ title }}</h3>
			<div class="ui-alert ui-alert-primary popup-hint">
				<span v-html="hintContent"></span>
			</div>

			<div class="popup-errors-summary" ref="summaryBlock">
				<div
					class="popup-errors-count"
					v-html="errorsCountText"
				></div>
			</div>

			<div 
				class="popup-error-header-wrapper"
				:style="errors.length >= 6 ? {'padding-right': '13px'} : {}"
			>
				<table class="popup-error-header">
					<tbody>
					<tr>
					<td class="popup-error-header-cell cell-error-number">
						{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TABLE_HEADER_ERROR_NUMBER') }}
					</td>
					<td class="popup-error-header-cell cell-error-message">
						{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TABLE_HEADER_ERROR_MESSAGE') }}
					</td>
					<td class="popup-error-header-cell cell-error-line">
						{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TABLE_HEADER_LINE') }}
					</td>
					<td class="popup-error-header-cell cell-error-column-name">
						{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_TABLE_HEADER_COL_NAME') }}
					</td>
					</tr>
					</tbody>
				</table>
			</div>

			<div 
				class="popup-error-table-wrapper"
				:style="errors.length >= 6 ? {'padding-right': '3px'} : {}"
			>
				<div class="popup-error-table-scroll">
					<table class="popup-error-table">
						<tr v-for="(error, index) in errors">
							<template v-if="index < 200">
								<td class="popup-error-table-row-cell cell-error-number">{{ index + 1 }}</td>
								<td class="popup-error-table-row-cell cell-error-message">{{ error.errorMessage }}</td>
								<td class="popup-error-table-row-cell cell-error-line">{{ error.lineNumber }}</td>
								<td class="popup-error-table-row-cell cell-error-column-name" :title="error.columnName">{{ error.columnName }}</td>
							</template>
						</tr>
					</table>
				</div>
			</div>

			<div class="popup-buttons-wrapper">
				<template v-if="isSavingMode">
					<template v-if="errors.length > 200">
						<button @click="this.onClose" class="ui-btn ui-btn-md ui-btn-primary">
							{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_BUTTON_CLOSE') }}
						</button>
					</template>
					<template v-else>
						<button v-if="isEditMode" @click="this.onClose" class="ui-btn ui-btn-md ui-btn-primary">
							{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_BUTTON_STOP_UPDATE') }}
						</button>
						<button v-else @click="this.onClose" class="ui-btn ui-btn-md ui-btn-primary">
							{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_BUTTON_STOP') }}
						</button>

						<button @click="this.onIgnoreErrorsClick" class="ui-btn ui-btn-md ui-btn-light-border">
							{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_BUTTON_IGNORE') }}
						</button>
					</template>
				</template>
				<template v-else>
					<button @click="this.onClose" class="ui-btn ui-btn-md ui-btn-primary">
						{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_BUTTON_CLOSE') }}
					</button>
				</template>
			</div>
		</Popup>
	`
	};

	const CheckingProgressPopup = {
	  emits: ['close'],
	  props: {},
	  computed: {
	    popupOptions() {
	      return {
	        width: 440,
	        closeIcon: false,
	        noAllPaddings: true,
	        overlay: true,
	        background: 'transparent'
	      };
	    }
	  },
	  mounted() {
	    const loader = new main_loader.Loader({
	      target: this.$refs.loader,
	      size: 65,
	      color: 'var(--ui-color-primary)',
	      strokeWidth: 4,
	      mode: 'inline'
	    });
	    loader.show();
	  },
	  methods: {
	    onClose() {
	      this.$emit('close');
	    }
	  },
	  components: {
	    Popup
	  },
	  // language=Vue
	  template: `
		<Popup
			id="file-check-progress"
			@close="this.onClose"
			:options="popupOptions"
		>
			<div class="file-check file-check-progress">
				<div ref="loader" class="file-check-loader"></div>
			</div>
		</Popup>
	`
	};

	const CheckingSuccessPopup = {
	  emits: ['close'],
	  props: {},
	  computed: {
	    popupOptions() {
	      return {
	        width: 440,
	        closeIcon: true,
	        noAllPaddings: true,
	        overlay: true
	      };
	    }
	  },
	  methods: {
	    onClose() {
	      this.$emit('close');
	    }
	  },
	  components: {
	    Popup
	  },
	  // language=Vue
	  template: `
		<Popup 
			id="file-check-success"
			@close="this.onClose" 
			:options="popupOptions" 
		>
			<div class="file-check file-check-success">
				<div class="biconnector-save-progress-popup__success-logo file-check-icon-success"></div>
				<div class="file-check-title">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_CHECK_OK_TITLE') }}</div>
				<div class="file-check-subtitle">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_CHECK_OK_SUBTITLE') }}</div>
				<button @click="this.onClose" class="ui-btn ui-btn-md ui-btn-primary file-check-button">
					{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_CHECK_OK_BUTTON') }}
				</button>
			</div>
		</Popup>
	`
	};

	const CheckingFailedPopup = {
	  emits: ['close'],
	  props: {},
	  computed: {
	    popupOptions() {
	      return {
	        width: 440,
	        closeIcon: true,
	        noAllPaddings: true,
	        overlay: true
	      };
	    }
	  },
	  methods: {
	    onClose() {
	      this.$emit('close');
	    }
	  },
	  components: {
	    Popup
	  },
	  // language=Vue
	  template: `
		<Popup 
			id="file-check-failed"
			@close="this.onClose" 
			:options="popupOptions" 
		>
			<div class="file-check file-check-failed">
				<div class="biconnector-save-progress-popup__failure-logo file-check-icon-failed"></div>
				<div class="file-check-title">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_CHECK_FAILED_TITLE') }}</div>
				<div class="file-check-subtitle">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_CHECK_FAILED_SUBTITLE') }}</div>
				<button @click="this.onClose" class="ui-btn ui-btn-md ui-btn-primary file-check-button">
					{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_CSV_ERROR_POPUP_CHECK_FAILED_BUTTON') }}
				</button>
			</div>
		</Popup>
	`
	};

	const GenericPopup = {
	  emits: ['close'],
	  props: {
	    title: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    popupOptions() {
	      return {
	        width: 440,
	        closeIcon: true,
	        noAllPaddings: true,
	        overlay: true
	      };
	    }
	  },
	  methods: {
	    onClose() {
	      this.$emit('close');
	    }
	  },
	  components: {
	    Popup
	  },
	  // language=Vue
	  template: `
		<Popup id="generic" @close="this.onClose" :options="popupOptions" wrapper-class="generic-popup">
			<h3 class="generic-popup__header">{{ title }}</h3>
			<div class="generic-popup__content">
				<slot name="content"></slot>
			</div>
			<div class="generic-popup__buttons-wrapper">
				<slot name="buttons"></slot>
			</div>
		</Popup>
	`
	};

	const SavingPopup = {
	  emits: ['close'],
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    description: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    options: {
	      type: Object,
	      required: false,
	      default: {}
	    }
	  },
	  computed: {
	    popupOptions() {
	      return {
	        width: 500,
	        minHeight: 299,
	        closeIcon: true,
	        noAllPaddings: true,
	        overlay: true,
	        ...this.options
	      };
	    }
	  },
	  methods: {
	    onClose() {
	      this.$emit('close');
	    }
	  },
	  components: {
	    Popup
	  },
	  // language=Vue
	  template: `
		<Popup id="saveProgress" @close="this.onClose" :options="popupOptions" wrapper-class="biconnector-popup--full-height">
			<div class="biconnector-save-progress-popup">
				<div class="biconnector-save-progress-popup__content">
					<slot name="icon"></slot>
					<div class="biconnector-save-progress-popup__texts">
						<h3 class="biconnector-save-progress-popup__header">{{ title }}</h3>
						<p class="biconnector-save-progress-popup__description" v-if="description">{{ description }}</p>
					</div>
					<div class="biconnector-save-progress-popup__buttons"><slot name="buttons"></slot></div>
				</div>
			</div>
		</Popup>
	`
	};

	const ImportFailurePopup = {
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    description: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['click'],
	  computed: {},
	  methods: {
	    onClick() {
	      this.$emit('click');
	    }
	  },
	  components: {
	    SaveProgressPopup: SavingPopup
	  },
	  // language=Vue
	  template: `
		<SaveProgressPopup
			:title="title"
			:description="description"
		>
			<template v-slot:icon>
				<div class="biconnector-save-progress-popup__failure-logo"></div>
			</template>
			<template v-slot:buttons>
				<button @click="onClick" class="ui-btn ui-btn-md ui-btn-primary">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_FAILURE_POPUP_BUTTON') }}</button>
			</template>
		</SaveProgressPopup>
	`
	};

	const ImportProgressPopup = {
	  props: {
	    description: {
	      type: String,
	      required: false,
	      default: ''
	    }
	  },
	  mounted() {
	    const loader = new main_loader.Loader({
	      target: this.$refs.loader,
	      size: 65,
	      color: 'var(--ui-color-primary)',
	      strokeWidth: 4,
	      mode: 'inline'
	    });
	    loader.show();
	  },
	  computed: {
	    popupOptions() {
	      return {
	        autoHide: false,
	        closeIcon: false
	      };
	    }
	  },
	  components: {
	    SaveProgressPopup: SavingPopup
	  },
	  // language=Vue
	  template: `
		<SaveProgressPopup
			:title="$Bitrix.Loc.getMessage('DATASET_IMPORT_PROGRESS_POPUP_HEADER')"
			:description="description"
			:options="popupOptions"
		>
			<template v-slot:icon>
				<div ref="loader" class="biconnector-save-progress-loader"></div>
			</template>
		</SaveProgressPopup>
	`
	};

	const ImportSuccessPopup = {
	  emits: ['click', 'oneMoreClick'],
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    description: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    datasetId: {
	      type: Number,
	      required: true
	    },
	    showMoreButton: {
	      type: Boolean,
	      required: false,
	      default: false
	    }
	  },
	  computed: {},
	  methods: {
	    onButtonClick() {
	      main_core.Dom.addClass(this.$refs.openDatasetButton, 'ui-btn-wait');
	      main_core.ajax.runAction('biconnector.externalsource.dataset.getEditUrl', {
	        data: {
	          id: this.datasetId
	        }
	      }).then(response => {
	        const link = response.data;
	        if (link) {
	          window.open(link, '_blank').focus();
	          main_core.Dom.removeClass(this.$refs.openDatasetButton, 'ui-btn-wait');
	          this.$emit('click');
	        }
	      }).catch(response => {
	        main_core.Dom.removeClass(this.$refs.openDatasetButton, 'ui-btn-wait');
	        this.$emit('click');
	      });
	    },
	    onOneMoreButtonClick() {
	      main_core.Dom.addClass(this.$refs.oneMoreButton, 'ui-btn-wait');
	      this.$emit('oneMoreClick');
	    }
	  },
	  components: {
	    SaveProgressPopup: SavingPopup
	  },
	  // language=Vue
	  template: `
		<SaveProgressPopup
			:title="title"
			:description="description"
		>
			<template v-slot:icon>
				<div class="biconnector-save-progress-popup__success-logo"></div>
			</template>
			<template v-slot:buttons>
				<a class="ui-btn ui-btn-md ui-btn-primary" @click="onButtonClick" ref="openDatasetButton">
					{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_SUCCESS_POPUP_BUTTON_MSGVER_1') }}
				</a>
				<a class="ui-btn ui-btn-md ui-btn-light-border" @click="onOneMoreButtonClick" ref="oneMoreButton" v-if="showMoreButton">
					{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_SUCCESS_POPUP_ONE_MORE_BUTTON') }}
				</a>
			</template>
		</SaveProgressPopup>
	`
	};

	const StepHint = {
	  props: {
	    hintClass: {
	      type: String,
	      required: false,
	      default: 'ui-alert-primary'
	    }
	  },
	  template: `
		<div class="ui-alert dataset-import-step__hint" :class="hintClass">
			<span class="ui-alert-message">
				<slot></slot>
			</span>
		</div>
	`
	};

	const StepBlock = {
	  data() {
	    return {
	      section: null
	    };
	  },
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    hint: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    isOpenInitially: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    canCollapse: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    disabled: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    customClasses: {
	      type: Array,
	      default: []
	    },
	    hintClass: {
	      type: String,
	      required: false
	    }
	  },
	  computed: {
	    additionalClasses() {
	      const custom = this.customClasses.reduce((acc, key) => {
	        acc[key] = true;
	        return acc;
	      }, {});
	      return {
	        'dataset-import-step__disabled': this.disabled,
	        ...custom
	      };
	    }
	  },
	  methods: {
	    toggleCollapse(open) {
	      this.section.toggle(open);
	    }
	  },
	  mounted() {
	    const contentContainer = this.$refs.contentContainer;
	    const section = new ui_section.Section({
	      title: this.title,
	      isOpen: this.isOpenInitially,
	      canCollapse: this.canCollapse
	    });
	    section.append(this.$refs.content);
	    section.renderTo(contentContainer);
	    this.section = section;
	  },
	  watch: {
	    title(newValue) {
	      if (!this.section) {
	        return;
	      }
	      this.section.getContent().querySelector('.ui-section__title').innerHTML = main_core.Text.encode(newValue);
	    }
	  },
	  components: {
	    StepHint
	  },
	  // language=Vue
	  template: `
		<div class="dataset-import-step" :class="additionalClasses" ref="contentContainer">
		</div>
		<div ref="content" class="dataset-import-step__content">
			<StepHint v-if="hint" :hint-class="hintClass">
				<span v-html="hint"></span>
			</StepHint>
			<slot></slot>
		</div>
	`
	};

	const BaseStep = {
	  emits: ['validation'],
	  props: {
	    title: {
	      type: String,
	      required: false
	    },
	    hint: {
	      type: String,
	      required: false
	    },
	    isOpenInitially: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    disabled: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    disabledElements: {
	      type: Object,
	      required: false,
	      default: null
	    },
	    sourceType: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    displayedTitle() {
	      var _this$title;
	      return (_this$title = this.title) != null ? _this$title : this.defaultTitle;
	    },
	    displayedHint() {
	      var _this$hint;
	      return (_this$hint = this.hint) != null ? _this$hint : this.defaultHint;
	    },
	    defaultTitle() {
	      return '';
	    },
	    defaultHint() {
	      return '';
	    },
	    sourceTypeCsv() {
	      return this.sourceType === 'csv';
	    },
	    sourceTypeExternal() {
	      return this.sourceType === 'external';
	    }
	  },
	  methods: {
	    open() {
	      if (this.$refs.stepBlock) {
	        this.$refs.stepBlock.toggleCollapse(true);
	      }
	    },
	    close() {
	      if (this.$refs.stepBlock) {
	        this.$refs.stepBlock.toggleCollapse(false);
	      }
	    },
	    validate() {
	      return true;
	    },
	    showValidationErrors() {}
	  },
	  components: {
	    Step: StepBlock
	  }
	};

	let _ = t => t,
	  _t;
	class ErrorPopup {
	  static create(message, element) {
	    const content = main_core.Tag.render(_t || (_t = _`<span class='ui-hint-content'></span>`));
	    content.innerHTML = message;
	    const popupOptions = {
	      bindElement: element,
	      darkMode: true,
	      content,
	      autoHide: false,
	      bindOptions: {
	        position: 'top'
	      },
	      angle: {
	        position: 'bottom'
	      },
	      cacheable: false
	    };
	    main_popup.Popup.setOptions({
	      angleMinBottom: 43
	    });
	    return new main_popup.Popup(popupOptions);
	  }
	}

	const BaseField = {
	  props: {
	    defaultValue: {
	      required: false,
	      default: ''
	    },
	    name: {
	      type: String,
	      required: true
	    },
	    title: {
	      type: String,
	      required: true
	    },
	    placeholder: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    isValid: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    errorMessage: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    isDisabled: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    hintText: {
	      type: String,
	      required: false
	    }
	  },
	  emits: ['valueChange'],
	  data() {
	    return {
	      value: this.defaultValue,
	      areValidationErrorsShown: false
	    };
	  },
	  methods: {
	    showValidationErrors() {
	      this.areValidationErrorsShown = true;
	    },
	    onInputChange(newValue) {
	      this.$emit('valueChange', {
	        newValue,
	        fieldName: this.name
	      });
	    }
	  },
	  watch: {
	    defaultValue(newValue) {
	      this.value = newValue;
	    }
	  }
	};

	const StringField = {
	  extends: BaseField,
	  data() {
	    return {
	      errorPopup: null,
	      errorPopupTimeout: null
	    };
	  },
	  methods: {
	    onInput(event) {
	      this.areValidationErrorsShown = false;
	      this.onInputChange(event.target.value);
	    },
	    onBlur() {
	      this.areValidationErrorsShown = true;
	      if (!this.isValid) {
	        this.showErrorHint();
	        this.errorPopupTimeout = setTimeout(() => {
	          this.hideErrorHint();
	          this.errorPopupTimeout = null;
	        }, 3000);
	      }
	    },
	    showErrorHint() {
	      if (this.errorPopupTimeout) {
	        clearTimeout(this.errorPopupTimeout);
	        this.errorPopupTimeout = null;
	      } else if (!this.errorPopup || this.errorPopup.isDestroyed()) {
	        this.errorPopup = this.createErrorPopup();
	        this.errorPopup.show();
	      }
	    },
	    hideErrorHint() {
	      if (this.errorPopup) {
	        this.errorPopup.close();
	      }
	      clearTimeout(this.errorPopupTimeout);
	      this.errorPopupTimeout = null;
	    },
	    createErrorPopup() {
	      return ErrorPopup.create(this.errorMessage, this.$refs.errorIconWrapper);
	    }
	  },
	  mounted() {
	    if (this.hintText) {
	      main_core.Dom.append(BX.UI.Hint.createNode(this.hintText), this.$refs.title);
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text" ref="title">
					{{ title }}
				</div>
			</div>
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-textbox ui-ctl-w100 dataset-import-control">
				<input
					class="ui-ctl-element dataset-import-field"
					type="text"
					:class="{ 'data-import-field--invalid': !isValid && areValidationErrorsShown }"
					:disabled="isDisabled"
					:placeholder="placeholder"
					v-model="value"
					@input="onInput"
					@blur="onBlur"
				>
				<div class="ui-ctl-after" ref="errorIconWrapper">
					<div
						class="ui-icon-set --warning format-table__error-icon"
						@mouseenter="showErrorHint"
						@mouseleave="hideErrorHint"
						v-if="!isValid && areValidationErrorsShown"
					></div>
				</div>
			</div>
		</div>
	`
	};

	const TextField = {
	  extends: BaseField,
	  // language=Vue
	  template: `
		<div class="ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">{{ title }}</div>
			</div>
			<div class="ui-ctl ui-ctl-textarea dataset-import-textarea ui-ctl-w100 ui-ctl-no-resize">
				<textarea 
					class="ui-ctl-element dataset-import-textarea-element" 
					:placeholder="placeholder" 
					@input="onInputChange($event.target.value)"
					v-model="value"
				></textarea>
			</div>
		</div>
	`
	};

	const DatasetProperties = {
	  props: {
	    defaultName: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    defaultDescription: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    unvalidatedFields: {
	      type: Object,
	      required: false,
	      default: {}
	    },
	    disabledFields: {
	      type: Object,
	      required: false,
	      default: {}
	    },
	    datasetSourceCode: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['valueChange', 'validationNeeded'],
	  methods: {
	    onValueChange(event) {
	      this.$emit('valueChange', event);
	    },
	    showValidationErrors() {
	      this.$refs.nameField.showValidationErrors();
	    }
	  },
	  components: {
	    StringField,
	    TextField
	  },
	  // language=Vue
	  template: `
		<div class="ui-form dataset-properties">
			<StringField
				ref="nameField"
				name="name"
				:defaultValue="defaultName"
				@value-change="onValueChange"
				:title="this.$Bitrix.Loc.getMessage('DATASET_IMPORT_DATASET_PROPERTIES_CODE')"
				:placeholder="this.$Bitrix.Loc.getMessage('DATASET_IMPORT_DATASET_PROPERTIES_CODE_PLACEHOLDER', { '#CODE#': this.datasetSourceCode })"
				:is-valid="unvalidatedFields.name?.result ?? true"
				:is-disabled="disabledFields.name ?? false"
				:error-message="unvalidatedFields.name?.message ?? ''"
			/>
			<TextField
				name="description"
				:defaultValue="defaultDescription"
				@value-change="onValueChange"
				:title="this.$Bitrix.Loc.getMessage('DATASET_IMPORT_DATASET_PROPERTIES_DESCRIPTION')"
			/>
		</div>
	`
	};

	const DatasetPropertiesStep = {
	  extends: BaseStep,
	  props: {
	    datasetSourceCode: {
	      type: String,
	      required: true
	    },
	    reservedNames: {
	      type: Array,
	      required: false,
	      default: []
	    },
	    nameMaxLength: {
	      type: Number,
	      required: false,
	      default: 30
	    }
	  },
	  emits: ['propertiesChanged'],
	  computed: {
	    datasetProperties() {
	      return this.$store.state.config.datasetProperties;
	    },
	    defaultTitle() {
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PROPERTIES_HEADER');
	    },
	    defaultHint() {
	      if (this.isEditMode) {
	        return '';
	      }
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PROPERTIES_HINT');
	    },
	    disabledFields() {
	      return {
	        name: this.$store.getters.isEditMode
	      };
	    },
	    unvalidatedFields() {
	      const result = {};
	      const nameValidationResult = this.validateName();
	      if (!nameValidationResult.result) {
	        result.name = nameValidationResult;
	      }
	      return result;
	    },
	    isEditMode() {
	      return this.$store.getters.isEditMode;
	    }
	  },
	  components: {
	    Step: StepBlock,
	    DatasetProperties
	  },
	  methods: {
	    onDatasetPropertiesFieldsChange(event) {
	      const datasetProperties = this.datasetProperties;
	      datasetProperties[event.fieldName] = event.newValue;
	      this.$store.commit('setDatasetProperties', datasetProperties);
	      this.validate();
	      this.$emit('propertiesChanged');
	    },
	    validate() {
	      let result = true;
	      if (!this.isEditMode) {
	        result = Object.keys(this.unvalidatedFields).length === 0;
	      }
	      this.$emit('validation', result);
	      return result;
	    },
	    validateName() {
	      const name = this.$store.state.config.datasetProperties.name;
	      if (!name) {
	        return {
	          result: true
	        };
	      }
	      const isReserved = this.reservedNames.includes(name);
	      if (isReserved) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_VALIDATION_DATASET_EXISTS')
	        };
	      }
	      if (name.length > this.nameMaxLength) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_VALIDATION_DATASET_TOO_LONG_MSGVER_1', {
	            '#MAX_LENGHT#': this.nameMaxLength
	          })
	        };
	      }
	      if (!/^[a-z][\d_a-z]*$/.test(name)) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_VALIDATION_DATASET_INVALID_CHARS')
	        };
	      }
	      return {
	        result: true
	      };
	    },
	    showValidationErrors() {
	      this.$refs.datasetProperties.showValidationErrors();
	    }
	  },
	  template: `
		<Step
			:title="displayedTitle"
			:hint="displayedHint"
			:is-open-initially="isOpenInitially"
			:disabled="disabled"
			ref="stepBlock"
		>
			<slot name="additional-properties"></slot>
			<DatasetProperties
				@value-change="onDatasetPropertiesFieldsChange"
				:default-name="datasetProperties.name"
				:default-description="datasetProperties.description"
				ref="datasetProperties"
				:disabled-fields="disabledFields"
				:unvalidated-fields="unvalidatedFields"
				:dataset-source-code="datasetSourceCode"
			/>
		</Step>
	`
	};

	const TableHeader = {
	  props: {
	    enabled: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    indeterminate: {
	      type: Boolean,
	      required: false,
	      default: false
	    }
	  },
	  emits: ['checkboxClick'],
	  computed: {
	    isNeedShowOriginalNameHint() {
	      var _this$$store$state$co, _this$$store$state$co2;
	      return (_this$$store$state$co = (_this$$store$state$co2 = this.$store.state.config.fileProperties) == null ? void 0 : _this$$store$state$co2.firstLineHeader) != null ? _this$$store$state$co : true;
	    }
	  },
	  methods: {
	    onCheckboxClick(event) {
	      event.preventDefault();
	      this.$emit('checkboxClick');
	    }
	  },
	  // language=Vue
	  template: `
		<tr>
			<th class="format-table__header format-table__checkbox-header">
				<input class="format-table__checkbox" type="checkbox" @change="onCheckboxClick" :checked="enabled" :indeterminate.prop="indeterminate">
			</th>
			<th class="format-table__header format-table__type-header format-table__type-subfield-header">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_TYPE_HEADER') }}</th>
			<th class="format-table__header format-table__header format-table__title-header">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_CODE_HEADER') }}</th>
			<th class="format-table__header format-table__header format-table__title-header" v-if="isNeedShowOriginalNameHint"></th>
		</tr>
	`
	};

	const DataType = {
	  string: 'string',
	  money: 'money',
	  int: 'int',
	  double: 'double',
	  date: 'date',
	  datetime: 'datetime'
	};
	const DataTypeDescriptions = {
	  [DataType.string]: {
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_TYPE_TEXT'),
	    icon: '--formatting'
	  },
	  [DataType.money]: {
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_TYPE_MONEY'),
	    icon: '--money'
	  },
	  [DataType.int]: {
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_TYPE_NUMBER'),
	    icon: '--numbers-123'
	  },
	  [DataType.double]: {
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_TYPE_DECIMAL'),
	    icon: '--numbers-05'
	  },
	  [DataType.date]: {
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_TYPE_DATE'),
	    icon: '--calendar-1'
	  },
	  [DataType.datetime]: {
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_TYPE_DATETIME'),
	    icon: '--planning-2'
	  }
	};

	var _selectedType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectedType");
	var _bindElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _onSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSelect");
	var _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose");
	class DataTypeMenu {
	  constructor(options) {
	    Object.defineProperty(this, _selectedType, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _bindElement, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onSelect, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onClose, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _selectedType)[_selectedType] = options.selectedType;
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement] = options.bindElement;
	    babelHelpers.classPrivateFieldLooseBase(this, _onSelect)[_onSelect] = options.onSelect;
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose] = options.onClose;
	  }
	  getMenu() {
	    const items = [];
	    Object.entries(DataTypeDescriptions).forEach(([key, value]) => {
	      items.push({
	        html: `
					<div class="ui-icon-set ${value.icon}"></div>
					<span class="format-table__dropdown-item-text">${value.title}</span>
					${key === babelHelpers.classPrivateFieldLooseBase(this, _selectedType)[_selectedType] ? '<div class="format-table__dropdown-item-selected ui-icon-set --check"></div>' : ''}
				`,
	        onclick: (event, item) => {
	          babelHelpers.classPrivateFieldLooseBase(this, _onSelect)[_onSelect](key);
	          item.getMenuWindow().close();
	        },
	        className: `format-table__dropdown-item${key === babelHelpers.classPrivateFieldLooseBase(this, _selectedType)[_selectedType] ? ' format-table__dropdown-item--active' : ''}`
	      });
	    });
	    return new main_popup.Menu({
	      className: 'format-table__dropdown-popup',
	      bindElement: babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement],
	      items,
	      events: {
	        onClose: babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose]
	      }
	    });
	  }
	}

	const DataTypeSelector = {
	  props: {
	    selectedType: {
	      type: String,
	      required: false,
	      default: 'text'
	    },
	    canEdit: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    disabled: {
	      type: Boolean,
	      required: false,
	      default: false
	    }
	  },
	  emits: ['valueChange'],
	  data() {
	    return {
	      typeMenu: null,
	      isFocused: false
	    };
	  },
	  computed: {
	    iconClass() {
	      return DataTypeDescriptions[this.selectedType].icon;
	    },
	    typeTitle() {
	      return DataTypeDescriptions[this.selectedType].title;
	    },
	    isEditable() {
	      return this.canEdit;
	    }
	  },
	  methods: {
	    onClick(event) {
	      if (!this.isEditable) {
	        return;
	      }
	      this.isFocused = true;
	      if (!this.typeMenu) {
	        return;
	      }
	      this.typeMenu.getPopupWindow().setWidth(this.$refs.formatButton.offsetWidth);
	      this.typeMenu.show();
	    },
	    createMenu() {
	      if (this.isEditable) {
	        this.typeMenu = new DataTypeMenu({
	          selectedType: this.selectedType,
	          bindElement: this.$refs.formatButton,
	          onSelect: selectedType => {
	            this.$emit('valueChange', selectedType);
	          },
	          onClose: () => {
	            this.isFocused = false;
	          }
	        }).getMenu();
	      }
	    },
	    destroyMenu() {
	      var _this$typeMenu;
	      (_this$typeMenu = this.typeMenu) == null ? void 0 : _this$typeMenu.destroy();
	    }
	  },
	  mounted() {
	    this.createMenu();
	  },
	  beforeUnmount() {
	    this.destroyMenu();
	  },
	  watch: {
	    selectedType(newValue) {
	      this.destroyMenu();
	      this.createMenu();
	    },
	    isEditable(newValue) {
	      if (newValue && !this.typeMenu) {
	        this.createMenu();
	      }
	      if (!newValue) {
	        this.destroyMenu();
	      }
	    }
	  },
	  // language=Vue
	  template: `
		<div
			class="ui-ctl ui-ctl-before-icon ui-ctl-after-icon ui-ctl-w100 format-table__type-control ui-ctl-dropdown"
			ref="formatButton"
			@click="onClick"
			:class="{
				'format-table__type-control--disabled': !isEditable,
				'ui-ctl-hover': isFocused,
			}"
		>
			<div class="ui-ctl-after ui-ctl-icon-angle" v-if="isEditable"></div>
			<div class="ui-ctl-before">
				<div class="format-table__type-button" :class="{ 'format-table__type-button--disabled': !isEditable }">
					<div class="ui-icon-set" :class="iconClass"></div>
				</div>
			</div>
			<div class="ui-ctl-element format-table__text-input">
				<span>{{ typeTitle }}</span>
			</div>
		</div>
	`
	};

	const TableRow = {
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    enabled: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    index: {
	      type: Number,
	      required: true
	    },
	    fieldSettings: {
	      type: Object,
	      required: false,
	      default: null
	    },
	    invalidFields: {
	      type: Object,
	      required: false,
	      default: {}
	    },
	    disabledElements: {
	      type: Object,
	      required: false,
	      default: null
	    },
	    isEditMode: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    sourceType: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      displayedValidationErrors: {
	        name: true
	      },
	      errorPopup: {
	        name: null
	      },
	      errorPopupTimeout: null
	    };
	  },
	  computed: {
	    isNameValid() {
	      return !('name' in this.invalidFields);
	    },
	    displayedErrorForName() {
	      return this.invalidFields.name.message;
	    },
	    set() {
	      return ui_iconSet_api_vue.Set;
	    },
	    originalsHintText() {
	      const originalType = this.fieldSettings.originalType;
	      const originalName = this.fieldSettings.originalName;
	      let typeText = '';
	      if (originalType) {
	        typeText = this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_ORIG_TYPE', {
	          '#CLASS#': '<span class="format-table__orig_info_title">',
	          '#/CLASS#': '</span>',
	          '#TYPENAME#': DataTypeDescriptions[originalType].title
	        });
	      }
	      const nameText = this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_ORIG_NAME', {
	        '#CLASS#': '<span class="format-table__orig_info_title">',
	        '#/CLASS#': '</span>',
	        '#FIELDNAME#': originalName
	      });
	      if (!originalType) {
	        return nameText;
	      }
	      return `${typeText}<br>${nameText}`;
	    },
	    isNeedShowOriginalNameHint() {
	      var _this$$store$state$co, _this$$store$state$co2, _this$$store$state$co3, _this$$store$state$co4;
	      return ((_this$$store$state$co = (_this$$store$state$co2 = this.$store.state.config.fileProperties) == null ? void 0 : _this$$store$state$co2.firstLineHeader) != null ? _this$$store$state$co : true) && ((_this$$store$state$co3 = this.$store.state.config.connectionProperties) == null ? void 0 : _this$$store$state$co3.connectionType) && ((_this$$store$state$co4 = this.$store.state.config.connectionProperties) == null ? void 0 : _this$$store$state$co4.connectionType) !== 'rest';
	    },
	    hintOptions() {
	      return {
	        html: this.originalsHintText,
	        popupOptions: {
	          angle: {
	            position: 'left'
	          },
	          offsetLeft: 30,
	          offsetTop: -46,
	          autoHide: false
	        }
	      };
	    },
	    sourceTypeCsv() {
	      return this.sourceType === 'csv';
	    },
	    sourceTypeExternal() {
	      return this.sourceType === 'external';
	    },
	    canEditType() {
	      return !this.isEditMode && this.sourceTypeCsv;
	    },
	    canEditName() {
	      var _this$fieldSettings, _this$fieldSettings2;
	      const isNew = !Boolean(((_this$fieldSettings = this.fieldSettings) == null ? void 0 : _this$fieldSettings.id) > 0);
	      return isNew || ((_this$fieldSettings2 = this.fieldSettings) == null ? void 0 : _this$fieldSettings2.visible) && this.sourceTypeExternal;
	    }
	  },
	  emits: ['checkboxClick', 'fieldChange'],
	  methods: {
	    onCheckboxClick(event) {
	      event.preventDefault();
	      this.$emit('checkboxClick', {
	        index: this.index
	      });
	    },
	    onTypeSelected(type) {
	      this.$emit('fieldChange', {
	        fieldName: 'type',
	        value: type,
	        index: this.index
	      });
	    },
	    onFieldInput(event) {
	      var _this$disabledElement;
	      if (!this.canEditName || (_this$disabledElement = this.disabledElements) != null && _this$disabledElement.name) {
	        const input = event.target;
	        input.value = this.fieldSettings.name;
	        return;
	      }
	      this.displayedValidationErrors[event.target.name] = false;
	      this.$emit('fieldChange', {
	        fieldName: event.target.name,
	        value: event.target.value,
	        index: this.index
	      });
	    },
	    onFieldBlur(event) {
	      this.displayedValidationErrors[event.target.name] = true;
	      if ('name' in this.invalidFields) {
	        this.showErrorHint();
	        this.errorPopupTimeout = setTimeout(() => {
	          this.hideErrorHint();
	          this.errorPopupTimeout = null;
	        }, 3000);
	      }
	    },
	    showValidationErrors() {
	      Object.keys(this.displayedValidationErrors).forEach(field => {
	        this.displayedValidationErrors[field] = true;
	      });
	    },
	    showErrorHint() {
	      if (this.errorPopupTimeout) {
	        clearTimeout(this.errorPopupTimeout);
	        this.errorPopupTimeout = null;
	      } else {
	        this.errorPopup.name = this.createErrorPopup();
	        this.errorPopup.name.show();
	      }
	    },
	    hideErrorHint() {
	      if (this.errorPopup.name) {
	        this.errorPopup.name.close();
	      }
	    },
	    createErrorPopup() {
	      return ErrorPopup.create(this.displayedErrorForName, this.$refs.errorIconWrapper);
	    }
	  },
	  watch: {
	    isNeedShowOriginalNameHint() {
	      if (this.$refs.originalsHint) {
	        this.$refs.originalsHint.remove();
	      }
	    }
	  },
	  components: {
	    DataTypeButton: DataTypeSelector,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  // language=Vue
	  template: `
		<tr class="format-table__row">
			<td class="format-table__checkbox-cell">
				<input class="format-table__checkbox" ref="visibilityCheckbox" type="checkbox" @change="onCheckboxClick" :checked="enabled">
			</td>
			<td class="format-table__cell">
				<DataTypeButton :selected-type="fieldSettings.type" @value-change="onTypeSelected" :can-edit="canEditType && !disabledElements?.type" :disabled="!canEditType || disabledElements?.type"/>
			</td>
			<td class="format-table__cell">
				<div
					class="ui-ctl ui-ctl-textbox ui-ctl-w100 format-table__name-control"
					:class="{
						'format-table__text-input--invalid': displayedValidationErrors.name && !isNameValid,
						'format-table__text-input--disabled': !canEditName || disabledElements?.name,
						'ui-ctl-after-icon': canEditName && !isNameValid,
					}"
				>
					<input
						class="ui-ctl-element format-table__text-input format-table__name-input"
						:disabled="!canEditName || disabledElements?.name"
						type="text"
						:placeholder="$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_PLACEHOLDER')"
						name="name"
						@input="onFieldInput"
						@blur="onFieldBlur"
						:value="fieldSettings.name"
					>
					<div class="ui-ctl-after" ref="errorIconWrapper">
						<div
							class="ui-icon-set --warning format-table__error-icon"
							@mouseenter="showErrorHint"
							@mouseleave="hideErrorHint"
							v-if="displayedValidationErrors.name && !isNameValid"
						></div>
					</div>
				</div>
			</td>
			<td class="format-table__cell" v-if="isNeedShowOriginalNameHint">
				<div class="format-table__orig-type-hint-wrapper" v-hint="hintOptions" ref="originalsHint">
					<div class="format-table__orig-type-hint">
						<BIcon
							:name="set.INFO_1"
							:size="20"
							color="#B5BABE"
						></BIcon>
					</div>
				</div>
			</td>
		</tr>
	`
	};

	const FormatTable = {
	  props: {
	    fieldsSettings: {
	      type: Array,
	      required: false
	    },
	    unvalidatedRows: {
	      type: Object,
	      required: false
	    },
	    disabledElements: {
	      type: Object,
	      required: false,
	      default: null
	    },
	    isEditMode: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    sourceType: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['rowToggle', 'headerToggle', 'rowFieldChanged'],
	  computed: {
	    areAllRowsVisible() {
	      return this.$store.getters.areAllRowsVisible;
	    },
	    areNoRowsVisible() {
	      return this.$store.getters.areNoRowsVisible;
	    },
	    areSomeRowsVisible() {
	      return this.$store.getters.areSomeRowsVisible;
	    }
	  },
	  methods: {
	    onRowCheckboxClicked(event) {
	      this.$emit('rowToggle', event);
	    },
	    onHeaderCheckboxClicked() {
	      this.$emit('headerToggle');
	    },
	    onRowFieldChanged(event) {
	      this.$emit('rowFieldChanged', event);
	    },
	    showValidationErrors() {
	      const rowIndices = Object.keys(this.unvalidatedRows);
	      rowIndices.forEach(index => {
	        if (this.$refs.row[index]) {
	          this.$refs.row[index].showValidationErrors();
	        }
	      });
	    }
	  },
	  components: {
	    TableHeader,
	    TableRow
	  },
	  // language=Vue
	  template: `
		<table class="format-table">
			<thead>
				<TableHeader :enabled="areAllRowsVisible" :indeterminate="areSomeRowsVisible" @checkbox-click="onHeaderCheckboxClicked" />
			</thead>
			<tbody>
				<template v-for="(field, index) in fieldsSettings" :key="index">
					<TableRow
						ref="row"
						:index="index"
						:enabled="field.visible"
						:field-settings="field"
						@checkbox-click="onRowCheckboxClicked"
						@field-change="onRowFieldChanged"
						:invalid-fields="unvalidatedRows[index] ?? []"
						:disabled-elements="disabledElements"
						:is-edit-mode="isEditMode"
						:source-type="sourceType"
					/>
				</template>
			</tbody>
		</table>
	`
	};

	const SyncFieldsButton = {
	  emits: ['buttonClick'],
	  props: {
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    isDisabled() {
	      return this.disabled;
	    }
	  },
	  methods: {
	    onButtonClick() {
	      this.$emit('buttonClick');
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-form-row">
			<button :disabled="isDisabled" class="ui-btn ui-btn-sm ui-btn-primary ui-btn-no-caps" @click="onButtonClick">
				{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_SYNC_FIELDS_BUTTON') }}
			</button>
		</div>
	`
	};

	const FieldsSettingsStep = {
	  emits: ['parsingOptionsChanged', 'settingsChanged', 'syncFields'],
	  extends: BaseStep,
	  props: {
	    syncFieldsProps: {
	      type: Object,
	      default: {
	        supported: false,
	        disabled: true
	      }
	    }
	  },
	  computed: {
	    fieldsSettings() {
	      return this.$store.state.config.fieldsSettings;
	    },
	    defaultTitle() {
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELDS_SETTINGS_HEADER');
	    },
	    defaultHint() {
	      if (this.isEditMode) {
	        return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELDS_SETTINGS_HINT_EDIT').replace('[link]', '<a onclick="top.BX.Helper.show(`redirect=detail&code=23378698`)">').replace('[/link]', '</a>');
	      }
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELDS_SETTINGS_HINT').replace('[link]', '<a onclick="top.BX.Helper.show(`redirect=detail&code=23378698`)">').replace('[/link]', '</a>');
	    },
	    unvalidatedRows() {
	      const rows = {};
	      this.$store.state.config.fieldsSettings.forEach((field, index) => {
	        const invalidFields = {};
	        if (field.visible || this.sourceTypeCsv || !field.name) {
	          const nameValidationResult = this.validateName(field.name);
	          if (!nameValidationResult.result) {
	            invalidFields.name = nameValidationResult;
	          }
	        }
	        if (Object.keys(invalidFields).length > 0) {
	          rows[index] = invalidFields;
	        }
	      });
	      return rows;
	    },
	    isEditMode() {
	      return this.$store.getters.isEditMode;
	    },
	    isSyncSupported() {
	      return this.syncFieldsProps.supported;
	    },
	    isSyncDisabled() {
	      return this.syncFieldsProps.disabled;
	    }
	  },
	  methods: {
	    validateName(name) {
	      const isNotEmpty = name.length > 0;
	      if (!isNotEmpty) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_VALIDATION_EMPTY_ERROR')
	        };
	      }
	      const isTooLong = name.length > 32;
	      if (isTooLong) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_VALIDATION_FIELD_TOO_LONG')
	        };
	      }

	      // only numbers, uppercase letters and underscores; starts with a letter
	      const areCharactersValid = /^[A-Z](?=.*[A-Z_])[A-Z0-9_]*$/.test(name);
	      if (!areCharactersValid) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_VALIDATION_FIELD_INVALID_CHARS')
	        };
	      }
	      const isAlreadyUsed = this.$store.getters.previewHeaders.reduce((count, value) => name === value ? count + 1 : count, 0) > 1;
	      if (isAlreadyUsed) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_VALIDATION_FIELD_ALREADY_USED')
	        };
	      }
	      return {
	        result: true
	      };
	    },
	    onRowToggled(event) {
	      this.$store.commit('toggleRowVisibility', event.index);
	      this.$emit('settingsChanged');
	      this.validate();
	    },
	    onHeaderToggled(event) {
	      if (this.$store.getters.areAllRowsVisible) {
	        this.$store.commit('setAllRowsInvisible');
	      } else {
	        this.$store.commit('setAllRowsVisible');
	      }
	      this.$emit('settingsChanged');
	      this.validate();
	    },
	    onRowFieldChanged(event) {
	      this.fieldsSettings[event.index][event.fieldName] = event.value;
	      this.$store.commit('setFieldRowSettings', {
	        index: event.index,
	        settings: this.fieldsSettings[event.index]
	      });
	      if (event.fieldName === 'type') {
	        this.$emit('parsingOptionsChanged');
	      }
	      this.$emit('settingsChanged');
	      this.validate();
	    },
	    validate() {
	      const result = Object.keys(this.unvalidatedRows).length === 0;
	      this.$emit('validation', result);
	    },
	    showValidationErrors() {
	      this.$refs.formatTable.showValidationErrors();
	    }
	  },
	  components: {
	    Step: StepBlock,
	    FormatTable,
	    SyncFieldsButton
	  },
	  // language=Vue
	  template: `
		<Step
			:title="displayedTitle"
			:hint="displayedHint"
			:is-open-initially="isOpenInitially"
			:disabled="disabled"
			ref="stepBlock"
		>
			<SyncFieldsButton v-if="isSyncSupported" :disabled="isSyncDisabled" @button-click="this.$emit('syncFields')"/>
			<div class="ui-form-row fields-settings">
				<FormatTable
					:fields-settings="fieldsSettings"
					:disabled-elements="disabledElements"
					@row-toggle="onRowToggled"
					@header-toggle="onHeaderToggled"
					@row-field-changed="onRowFieldChanged"
					:unvalidated-rows="unvalidatedRows"
					ref="formatTable"
					:is-edit-mode="isEditMode"
					:source-type="sourceType"
				/>
			</div>
		</Step>
	`
	};

	let _$1 = t => t,
	  _t$1,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7;
	const OptionType = {
	  CUSTOM: 'custom',
	  VALUE: 'value'
	};
	var _extractValues = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("extractValues");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	var _getDropdownControl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDropdownControl");
	class FormatSelector {
	  static openSlider(selected, dataFormatTemplates, onClose) {
	    BX.SidePanel.Instance.open('biconnector:import-field-formats', {
	      width: 584,
	      contentCallback: () => {
	        return ui_sidepanel_layout.Layout.createContent({
	          extensions: ['ui.forms', 'ui.layout-form', 'ui.alerts', 'biconnector.dataset-import'],
	          title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_TITLE'),
	          content() {
	            return babelHelpers.classPrivateFieldLooseBase(FormatSelector, _getContent)[_getContent](selected, dataFormatTemplates);
	          },
	          buttons({
	            cancelButton,
	            SaveButton
	          }) {
	            return [new SaveButton({
	              onclick: () => {
	                // hack: using a singleton instance to store the form didn't work
	                const form = BX.SidePanel.Instance.getTopSlider().getContainer().querySelector('#formatSelectorForm');
	                onClose(babelHelpers.classPrivateFieldLooseBase(FormatSelector, _extractValues)[_extractValues](form));
	                BX.SidePanel.Instance.close();
	              }
	            }), cancelButton];
	          }
	        });
	      },
	      cacheable: false
	    });
	  }
	}
	function _extractValues2(form) {
	  const formData = new FormData(form);
	  const result = Object.fromEntries(formData);
	  const customFieldsToExtract = ['date', 'datetime'];
	  customFieldsToExtract.forEach(field => {
	    if (result[field] === 'custom') {
	      result[field] = result[`${field}CustomValue`];
	    }
	    delete result[`${field}CustomValue`];
	  });
	  return result;
	}
	function _getContent2(selected, dataFormatTemplates) {
	  const formRoot = main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<form class="ui-form" id="formatSelectorForm">
			</form>
		`));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(FormatSelector, _getDropdownControl)[_getDropdownControl]({
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_DATE'),
	    subtitle: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_DATE_HINT'),
	    options: dataFormatTemplates[DataType.date],
	    fieldType: DataType.date,
	    selected: selected[DataType.date]
	  }), formRoot);
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(FormatSelector, _getDropdownControl)[_getDropdownControl]({
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_DATETIME'),
	    subtitle: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_DATETIME_HINT'),
	    options: dataFormatTemplates[DataType.datetime],
	    fieldType: DataType.datetime,
	    selected: selected[DataType.datetime]
	  }), formRoot);
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(FormatSelector, _getDropdownControl)[_getDropdownControl]({
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_MONEY'),
	    subtitle: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_MONEY_HINT'),
	    options: dataFormatTemplates[DataType.money],
	    fieldType: DataType.money,
	    selected: selected[DataType.money]
	  }), formRoot);
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(FormatSelector, _getDropdownControl)[_getDropdownControl]({
	    title: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_DOUBLE'),
	    subtitle: main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_DOUBLE_HINT'),
	    options: dataFormatTemplates[DataType.double],
	    fieldType: DataType.double,
	    selected: selected[DataType.double]
	  }), formRoot);
	  return main_core.Tag.render(_t2 || (_t2 = _$1`
			<div class="format-selector">
				<div class="ui-alert ui-alert-primary format-selector__hint">
					<span class="ui-alert-message">
						${0}
					</span>
				</div>
				${0}
			</div>
		`), main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_HINT', {
	    '[link]': '<a onclick="top.BX.Helper.show(`redirect=detail&code=23378698`)">',
	    '[/link]': '</a>'
	  }), formRoot);
	}
	function _getDropdownControl2(options) {
	  const selectRoot = main_core.Tag.render(_t3 || (_t3 = _$1`
			<select class="ui-ctl-element" name="${0}">
			</select>
		`), options.fieldType);
	  let isCustomSelected = true;
	  let customElement = null;
	  let customOptionInput = null;
	  options.options.forEach(option => {
	    let optionElement = '';
	    const isSelected = option.value === options.selected;
	    if (isSelected) {
	      isCustomSelected = false;
	    }
	    if (option.type === OptionType.VALUE) {
	      optionElement = main_core.Tag.render(_t4 || (_t4 = _$1`
					<option ${0} value="${0}">${0}</option>
				`), option.value === options.selected ? 'selected' : '', option.value, option.title);
	    } else if (option.type === OptionType.CUSTOM) {
	      var _option$value;
	      customElement = main_core.Tag.render(_t5 || (_t5 = _$1`
					<option value="custom">${0}</option>
				`), main_core.Loc.getMessage('DATASET_IMPORT_FIELD_FORMAT_SELECTOR_CUSTOM_FORMAT'));
	      optionElement = customElement;
	      customOptionInput = main_core.Tag.render(_t6 || (_t6 = _$1`
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100 format-selector__custom-value-input format-selector__custom-value-input--hidden">
						<input class="ui-ctl-element" name="${0}CustomValue" type="text" placeholder="..." value="${0}">
					</div>
				`), options.fieldType, (_option$value = option.value) != null ? _option$value : '');
	      main_core.Event.bind(selectRoot, 'change', event => {
	        const value = event.target.value;
	        if (value === 'custom') {
	          main_core.Dom.removeClass(customOptionInput, 'format-selector__custom-value-input--hidden');
	        } else {
	          main_core.Dom.addClass(customOptionInput, 'format-selector__custom-value-input--hidden');
	        }
	      });
	    }
	    main_core.Dom.append(optionElement, selectRoot);
	  });
	  if (isCustomSelected) {
	    if (customElement) {
	      customElement.setAttribute('selected', true);
	    }
	    if (customOptionInput) {
	      customOptionInput.querySelector('input').value = options.selected;
	      main_core.Dom.removeClass(customOptionInput, 'format-selector__custom-value-input--hidden');
	    }
	  }
	  return main_core.Tag.render(_t7 || (_t7 = _$1`
			<div class="ui-form-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${0}
					</div>
					<div class="format-selector__type-subtitle">
						${0}
					</div>
				</div>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					${0}
				</div>
				${0}
			</div>
		`), options.title, options.subtitle, selectRoot, customOptionInput);
	}
	Object.defineProperty(FormatSelector, _getDropdownControl, {
	  value: _getDropdownControl2
	});
	Object.defineProperty(FormatSelector, _getContent, {
	  value: _getContent2
	});
	Object.defineProperty(FormatSelector, _extractValues, {
	  value: _extractValues2
	});

	const SliderButton = {
	  // language=Vue
	  template: `
		<div class="ui-form-row">
			<div class="ui-ctl ui-ctl-before-icon ui-ctl-after-icon ui-ctl-w100 fields-settings__slider-button">
				<div class="ui-ctl-before">
					<div class="ui-icon-set --form-settings fields-settings__slider-icon"></div>
				</div>
				<div class="ui-ctl-after ui-ctl-icon-angle fields-settings__slider-chevron">
				</div>
				<div class="ui-ctl-element">
					{{ this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELD_SETTINGS_FORMAT_BUTTON') }}
				</div>
			</div>
		</div>
	`
	};

	const SwitcherField = {
	  extends: BaseField,
	  mounted() {
	    new ui_switcher.Switcher({
	      node: this.$refs.switcher,
	      size: ui_switcher.SwitcherSize.small,
	      checked: this.defaultValue,
	      handlers: {
	        toggled: () => {
	          this.value = !this.value;
	          this.onInputChange(this.value);
	        }
	      }
	    });
	  },
	  // language=Vue
	  template: `
		<div class="ui-form-row">
			<div class="switcher-field">
				<div ref="switcher"></div>
				<div class="switcher-field__label">
					<span>{{ title }}</span>
				</div>
			</div>
		</div>
	`
	};

	const CustomField = {
	  extends: BaseField,
	  // language=Vue
	  template: `
		<div class="ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">{{ title }}</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<slot name="field-content"></slot>
			</div>
		</div>
	`
	};

	const DropdownField = {
	  extends: BaseField,
	  props: {
	    options: {
	      type: Array,
	      required: true
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">{{ title }}</div>
			</div>
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select class="ui-ctl-element" v-model="value" @change="onInputChange($event.target.value)">
					<option v-for="option in options" :value="option.value" :selected="option.value === defaultValue">{{ option.title }}</option>
				</select>
			</div>
		</div>
	`
	};

	const FileUploader = {
	  components: {
	    FileUploadWidget: ui_uploader_stackWidget.StackWidgetComponent,
	    CustomField,
	    DropdownField,
	    SwitcherField,
	    SliderButton
	  },
	  props: {
	    defaultEncoding: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    defaultSeparator: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    defaultFirstLineHeader: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    encodings: {
	      type: Array,
	      required: true
	    },
	    separators: {
	      type: Array,
	      required: true
	    },
	    isEditMode: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    unvalidatedFields: {
	      type: Object,
	      required: false,
	      default: {}
	    },
	    dataFormatTemplates: {
	      type: Object
	    }
	  },
	  data() {
	    return {
	      inputElement: null,
	      areValidationErrorsShown: false
	    };
	  },
	  emits: ['valueChange', 'uploadError', 'parsingOptionsChanged'],
	  computed: {
	    uploaderOptions() {
	      return {
	        controller: 'biconnector.integration.ui.fileUploaderController.datasetUploaderController',
	        controllerOptions: {},
	        multiple: false,
	        acceptOnlyImages: false,
	        maxFileSize: 1024 * 1024 * 60,
	        autoUpload: true,
	        acceptedFileTypes: ['.csv'],
	        events: {
	          onUploadComplete: () => {
	            this.onUploadComplete();
	          },
	          'File:onRemove': () => {
	            this.onFileRemoved();
	          },
	          onError: () => {
	            this.onUploadError();
	          },
	          'File:onError': () => {
	            this.onUploadError();
	          }
	        }
	      };
	    },
	    widgetOptions() {
	      return {
	        size: 'large'
	      };
	    }
	  },
	  methods: {
	    onValueChange(event) {
	      this.$emit('valueChange', event);
	    },
	    onUploadComplete() {
	      const file = this.$refs.uploader.uploader.getFiles()[0];
	      if (file && file.isComplete()) {
	        this.areValidationErrorsShown = false;
	        this.$emit('valueChange', {
	          newValue: file.getServerFileId(),
	          fieldName: 'fileToken'
	        });
	        this.$emit('valueChange', {
	          newValue: file.getName(),
	          fieldName: 'fileName'
	        });
	      }
	    },
	    onFileRemoved() {
	      this.$emit('valueChange', {
	        newValue: null,
	        fieldName: 'fileToken'
	      });
	    },
	    onUploadError() {
	      this.$emit('uploadError');
	    },
	    showValidationErrors() {
	      this.areValidationErrorsShown = true;
	    },
	    openDataFormatSlider() {
	      FormatSelector.openSlider(this.$store.state.config.dataFormats, this.dataFormatTemplates, selectedFormats => {
	        this.$store.commit('setDataFormats', selectedFormats);
	        this.$emit('parsingOptionsChanged');
	      });
	    }
	  },
	  template: `
		<div class="ui-form">
			<CustomField :title="$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_FIELD')" name="file">
				<template #field-content>
					<div class="dataset-file-upload">
						<FileUploadWidget
							:uploaderOptions="uploaderOptions"
							:widgetOptions="widgetOptions"
							ref="uploader"
						/>
						<p class="dataset-import-field__error-text" v-if="areValidationErrorsShown && !unvalidatedFields.file?.result">
							{{ unvalidatedFields.file?.message }}
						</p>
					</div>
				</template>
			</CustomField>
			<div class="ui-form-row-inline">
				<DropdownField
					:title="$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_ENCODING')"
					name="encoding"
					:options="encodings"
					:default-value="defaultEncoding"
					@value-change="onValueChange"
				/>
				<DropdownField
					:title="$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_SEPARATOR')"
					name="separator"
					:options="separators"
					:default-value="defaultSeparator"
					@value-change="onValueChange"
				/>
			</div>
			<SliderButton @click="openDataFormatSlider" />
			<SwitcherField
				:title="$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_FIRST_ROW_HEADER')"
				name="firstLineHeader"
				:default-value="defaultFirstLineHeader"
				@value-change="onValueChange"
			/>
		</div>
	`
	};

	const FileStep = {
	  extends: BaseStep,
	  props: {
	    encodings: {
	      type: Array,
	      required: true
	    },
	    separators: {
	      type: Array,
	      required: true
	    },
	    dataFormatTemplates: {
	      type: Object
	    }
	  },
	  data() {
	    return {
	      fileProperties: this.$store.state.config.fileProperties,
	      isErrorDisplayed: false
	    };
	  },
	  emits: ['filePropertiesChange', 'parsingOptionsChanged'],
	  computed: {
	    defaultTitle() {
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_HEADER');
	    },
	    defaultHint() {
	      if (this.isErrorDisplayed) {
	        return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_HINT_ERROR');
	      }
	      if (this.isEditMode) {
	        return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_HINT_EDIT').replace('[link]', '<a onclick="top.BX.Helper.show(`redirect=detail&code=23378680`)">').replace('[/link]', '</a>');
	      }
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_HINT').replace('[link]', '<a onclick="top.BX.Helper.show(`redirect=detail&code=23378680`)">').replace('[/link]', '</a>');
	    },
	    hintClass() {
	      return this.isErrorDisplayed ? 'ui-alert-danger' : 'ui-alert-primary';
	    },
	    isEditMode() {
	      return this.$store.getters.isEditMode;
	    },
	    unvalidatedFields() {
	      const result = {};
	      const fileValidationResult = this.validateFile();
	      if (!fileValidationResult.result) {
	        result.file = fileValidationResult;
	      }
	      return result;
	    }
	  },
	  methods: {
	    onFilePropertiesChange(event) {
	      if (event.fieldName === 'fileToken') {
	        this.isErrorDisplayed = false;
	      }
	      this.fileProperties[event.fieldName] = event.newValue;
	      this.$store.commit('setFileProperties', this.fileProperties);
	      if (event.fieldName !== 'fileName') {
	        this.$emit('filePropertiesChange');
	      }
	      this.validate();
	    },
	    onUploadError() {
	      this.isErrorDisplayed = true;
	    },
	    onParsingOptionsChanged() {
	      this.$emit('parsingOptionsChanged');
	    },
	    validate() {
	      let result = true;
	      if (!this.isEditMode) {
	        result = Object.keys(this.unvalidatedFields).length === 0;
	      }
	      this.$emit('validation', result);
	      return result;
	    },
	    validateFile() {
	      if (!this.isEditMode && !this.$store.state.config.fileProperties.fileToken) {
	        return {
	          result: false,
	          message: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_NOT_SELECTED')
	        };
	      }
	      return {
	        result: true
	      };
	    },
	    showValidationErrors() {
	      this.$refs.fileUploader.showValidationErrors();
	    }
	  },
	  components: {
	    Step: StepBlock,
	    FileUploader
	  },
	  template: `
		<Step
			:title="displayedTitle"
			:hint="displayedHint"
			:is-open-initially="isOpenInitially"
			:disabled="disabled"
			:hint-class="hintClass"
			ref="stepBlock"
		>
			<FileUploader
				@value-change="onFilePropertiesChange"
				@upload-error="onUploadError"
				@parsing-options-changed="onParsingOptionsChanged"
				ref="fileUploader"
				:encodings="encodings"
				:separators="separators"
				:default-encoding="fileProperties.encoding"
				:default-first-line-header="fileProperties.firstLineHeader"
				:default-separator="fileProperties.separator"
				:is-edit-mode="isEditMode"
				:unvalidated-fields="unvalidatedFields"
				:data-format-templates="dataFormatTemplates"
			/>
		</Step>
	`
	};

	const AppSection = {
	  props: {
	    title: {
	      type: String,
	      required: false
	    },
	    customClasses: {
	      type: Array,
	      required: false
	    }
	  },
	  components: {
	    Step: StepBlock
	  },
	  // language=Vue
	  template: `
		<Step
			:title="title"
			:can-collapse="false"
			:custom-classes="customClasses"
		>
			<slot></slot>
		</Step>
	`
	};

	const TableHeader$1 = {
	  props: {
	    headers: {
	      type: Array,
	      required: false,
	      default: []
	    },
	    columnVisibility: {
	      type: Array,
	      required: false,
	      default: []
	    }
	  },
	  computed: {
	    visibleHeaders() {
	      return this.headers.filter((_, index) => this.columnVisibility[index]);
	    }
	  },
	  // language=Vue
	  template: `
		<thead>
			<tr class="dataset-preview-table__header-row">
				<th class="dataset-preview-table__header" v-for="header in visibleHeaders" :title="header">{{ header }}</th>
			</tr>
		</thead>
	`
	};

	const TableRow$1 = {
	  props: {
	    row: {
	      type: Array,
	      required: true
	    },
	    columnVisibility: {
	      type: Array,
	      required: false,
	      default: []
	    }
	  },
	  computed: {
	    visibleValues() {
	      return this.row.filter((_, index) => this.columnVisibility[index]);
	    }
	  },
	  // language=Vue
	  template: `
		<tr>
			<td class="dataset-preview-table__cell" v-for="value in visibleValues" :title="value">{{ value }}</td>
		</tr>
	`
	};

	const PreviewTable = {
	  props: {
	    headers: {
	      type: Array,
	      required: false,
	      default: []
	    },
	    rows: {
	      type: Array,
	      required: false,
	      default: []
	    },
	    columnVisibility: {
	      type: Array,
	      required: false,
	      default: []
	    }
	  },
	  data() {
	    return {
	      displayedColumnVisibility: this.columnVisibility,
	      debouncedRefresh: main_core.debounce(this.refreshColumns, 1000)
	    };
	  },
	  mounted() {
	    const ears = new ui_ears.Ears({
	      container: document.querySelector('.dataset-preview-table'),
	      smallSize: true,
	      noScrollbar: false
	    });
	    ears.init();
	  },
	  methods: {
	    refreshColumns(newVisibility) {
	      this.displayedColumnVisibility = newVisibility;
	      main_core.Dom.removeClass(this.$refs.table, 'dataset-preview-table--fade');
	    }
	  },
	  watch: {
	    columnVisibility(newValue, oldValue) {
	      main_core.Dom.addClass(this.$refs.table, 'dataset-preview-table--fade');
	      this.debouncedRefresh(newValue);
	    }
	  },
	  components: {
	    TableHeader: TableHeader$1,
	    TableRow: TableRow$1
	  },
	  // language=Vue
	  template: `
		<div class="dataset-preview-table" ref="table">
			<table class="dataset-preview-table__table">
				<TableHeader v-if="headers.length > 0" :headers="headers" :column-visibility="displayedColumnVisibility" />
				<tbody>
					<TableRow v-for="row in rows" :row="row" :column-visibility="displayedColumnVisibility" />
				</tbody>
			</table>
		</div>
	`
	};

	const ImportPreview = {
	  components: {
	    AppSection,
	    PreviewTable
	  },
	  props: {
	    emptyStateText: {
	      type: String,
	      required: false,
	      default: null
	    },
	    error: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    isLoading: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    needShowHeadersWithEmptyRows: {
	      type: Boolean,
	      required: false,
	      default: false
	    }
	  },
	  computed: {
	    isEditMode() {
	      return this.$store.getters.isEditMode;
	    },
	    headers() {
	      return this.$store.getters.previewHeaders;
	    },
	    rows() {
	      return this.$store.state.previewData.rows;
	    },
	    isEverythingHidden() {
	      return this.headers.length > 0 && this.$store.getters.areNoRowsVisible;
	    },
	    hasData() {
	      return this.$store.getters.hasData;
	    },
	    hasHeaders() {
	      return this.headers.length > 0;
	    },
	    displayedEmptyStateText() {
	      var _this$emptyStateText;
	      return (_this$emptyStateText = this.emptyStateText) != null ? _this$emptyStateText : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_EMPTY_STATE');
	    },
	    displayedEverythingHiddenText() {
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_EVERYTHING_HIDDEN');
	    },
	    columnVisibility() {
	      return this.$store.getters.columnVisibilityMap;
	    },
	    isErrorInEditMode() {
	      return this.hasData && this.error && this.isEditMode;
	    },
	    isEditModeInitialDataDisplayed() {
	      return this.isEditMode && !this.$store.state.config.fileProperties.fileToken;
	    },
	    displayedTitle() {
	      return this.isEditModeInitialDataDisplayed ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_INITIAL_DATA_PREVIEW_TITLE') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_TITLE');
	    },
	    hasDataDisplayedHint() {
	      return this.isEditModeInitialDataDisplayed ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_INITIAL_DATA_PREVIEW_HINT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_HINT');
	    }
	  },
	  watch: {
	    isLoading(newValue) {
	      if (this.loader) {
	        this.loader.destroy();
	      }
	      if (newValue) {
	        this.loader = new main_loader.Loader({
	          target: this.$refs.loadingAnchor,
	          size: 77,
	          color: 'var(--ui-color-primary)',
	          strokeWidth: 4
	        });
	        this.loader.show();
	      }
	    }
	  },
	  // language=Vue
	  template: `
		<AppSection
			:title="displayedTitle"
			:custom-classes="['dataset-import-step--full-height', 'dataset-import-step--sticky', 'import-preview']"
		>
			<div class="import-preview__loading" ref="loadingAnchor"></div>
			<template v-if="!isLoading">
				<template v-if="error">
					<div class="import-preview__no-data" v-if="isEverythingHidden">
						<div class="import-preview__no-data-logo"></div>
						<p class="import-preview__no-data-text">{{ displayedEverythingHiddenText }}</p>
					</div>
					<template v-else>
						<div class="import-preview__has-data import-preview__has-data--edit-mode-error" v-if="isEditMode">
							<span class="import-preview__hint">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_HINT') }}</span>
							<PreviewTable
								:headers="headers"
								:column-visibility="columnVisibility"
							/>
							<div class="import-preview__edit-mode-error">
								<div class="import-preview__error-logo"></div>
								<p class="import-preview__no-data-text">{{ error }}</p>
							</div>
						</div>
						<div class="import-preview__has-data" v-else>
							<PreviewTable
								:headers="headers"
								:column-visibility="columnVisibility"
							/>
							<div class="import-preview__edit-mode-error">
								<div class="import-preview__error-logo"></div>
								<p class="import-preview__no-data-text">{{ error }}</p>
							</div>
						</div>
					</template>
				</template>
				<template v-else>
					<div class="import-preview__no-data" v-if="isEverythingHidden">
						<div class="import-preview__no-data-logo"></div>
						<p class="import-preview__no-data-text">{{ displayedEverythingHiddenText }}</p>
					</div>
					<div class="import-preview__has-data" v-else-if="hasData">
						<span class="import-preview__hint">{{ hasDataDisplayedHint }}</span>
						<PreviewTable
							:headers="headers"
							:rows="rows"
							:column-visibility="columnVisibility"
						/>
					</div>
					<div class="import-preview__has-data" v-else-if="hasHeaders && needShowHeadersWithEmptyRows">
						<PreviewTable
							:headers="headers"
							:column-visibility="columnVisibility"
						/>
						<div class="import-preview__edit-mode-error">
							<div class="import-preview__no-data-logo"></div>
							<p class="import-preview__no-data-text">{{ displayedEmptyStateText }}</p>
						</div>
					</div>
					<div class="import-preview__no-data" v-else>
						<div class="import-preview__no-data-logo"></div>
						<p class="import-preview__no-data-text">{{ displayedEmptyStateText }}</p>
					</div>
				</template>
			</template>
		</AppSection>
	`
	};

	let _$2 = t => t,
	  _t$2;

	// language=Vue
	const BaseApp = {
	  props: {
	    appParams: {
	      type: Object,
	      required: false,
	      default: {}
	    }
	  },
	  data() {
	    return {
	      steps: {},
	      shownPopups: {},
	      isChanged: false,
	      isSaveComplete: false,
	      lastChangedStep: null
	    };
	  },
	  computed: {
	    sourceCode() {
	      return '';
	    },
	    loadParams() {
	      return {};
	    },
	    saveParams() {
	      return {};
	    },
	    isEditMode() {
	      return false;
	    },
	    datasetId() {
	      return this.$store.state.config.datasetProperties.id;
	    },
	    isSaveEnabled() {
	      return !this.$store.getters.areNoRowsVisible && this.isValidatedForSave && !this.previewError;
	    },
	    isValidatedForSave() {
	      return true;
	    },
	    unsavedChangesPopupTitle() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TITLE_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TITLE');
	    },
	    unsavedChangesPopupText() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TEXT_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TEXT');
	    },
	    sourceType() {
	      return '';
	    }
	  },
	  mounted() {
	    this.$Bitrix.eventEmitter.subscribe('biconnector:dataset-import:createButtonClick', this.onSaveButtonClick);
	    this.$Bitrix.eventEmitter.subscribe('biconnector:dataset-import:cancelButtonClick', this.onCancelButtonClick);
	    const slider = ui_sidepanel.SidePanel.Instance.getTopSlider();
	    if (slider) {
	      top.BX.addCustomEvent(slider, 'SidePanel.Slider:onClose', this.onSliderClose);
	      addEventListener('beforeunload', event => {
	        top.BX.removeCustomEvent(slider, 'SidePanel.Slider:onClose', this.onSliderClose);
	      });
	    }
	  },
	  beforeUnmount() {
	    this.$Bitrix.eventEmitter.unsubscribe('biconnector:dataset-import:createButtonClick', this.onSaveButtonClick);
	    this.$Bitrix.eventEmitter.unsubscribe('biconnector:dataset-import:cancelButtonClick', this.onCancelButtonClick);
	  },
	  methods: {
	    markAsChanged() {
	      this.isChanged = true;
	    },
	    onSliderClose(event) {
	      if (!this.isChanged) {
	        if (!this.isSaveComplete) {
	          this.sendAnalytics({
	            event: this.isEditMode ? 'edit_end' : 'creation_end',
	            status: 'error'
	          });
	        }
	        return;
	      }
	      event.denyAction();
	      if (main_popup.PopupManager.getPopupById('unsaved')) {
	        return;
	      }
	      const continueButton = new ui_buttons.Button({
	        color: ui_buttons.ButtonColor.PRIMARY,
	        text: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONTINUE_IMPORT'),
	        events: {
	          click() {
	            popup.destroy();
	          }
	        }
	      });
	      const closeButton = new ui_buttons.Button({
	        color: ui_buttons.ButtonColor.LINK,
	        text: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONFIRM_CANCEL_IMPORT'),
	        events: {
	          click: () => {
	            this.isChanged = false;
	            this.closeApp();
	          }
	        }
	      });
	      const popupHeader = this.unsavedChangesPopupTitle;
	      const popupText = this.unsavedChangesPopupText;
	      const popup = new main_popup.Popup({
	        id: 'unsaved',
	        content: main_core.Tag.render(_t$2 || (_t$2 = _$2`
					<div class="generic-popup">
						<h3 class="generic-popup__header">${0}</h3>
						<div class="generic-popup__content">
							${0}
						</div>
						<div class="generic-popup__buttons-wrapper">
							${0}
							${0}
						</div>
					</div>
				`), popupHeader, popupText, continueButton.render(), closeButton.render()),
	        width: 440,
	        noAllPaddings: true,
	        autoHide: false,
	        fixed: true,
	        overlay: true
	      });
	      popup.show();
	    },
	    closeApp() {
	      ui_sidepanel.SidePanel.Instance.getTopSlider().close();
	    },
	    toggleStepState(step, disabled = null) {
	      if (!this.steps[step]) {
	        return;
	      }
	      if (main_core.Type.isNull(disabled)) {
	        this.steps[step].disabled = !Boolean(this.steps[step].disabled);
	      } else {
	        this.steps[step].disabled = disabled;
	      }
	    },
	    togglePopup(step, shown = null) {
	      if (main_core.Type.isNull(shown)) {
	        this.shownPopups[step] = !Boolean(this.shownPopups[step]);
	      } else {
	        this.shownPopups[step] = shown;
	      }
	    },
	    loadDataset() {
	      main_core.ajax.runAction('biconnector.externalsource.dataset.view', {
	        data: {
	          type: this.sourceCode,
	          fields: this.loadParams
	        }
	      }).then(response => {
	        this.onLoadSuccess(response);
	      }).catch(error => {
	        this.onLoadError(error);
	      });
	    },
	    onStepValidation(step, validationResult) {
	      if (!this.steps[step]) {
	        return;
	      }
	      this.steps[step].valid = validationResult;
	    },
	    onSaveButtonClick() {
	      this.onSaveStart().then(() => {
	        this.handleSaveAction();
	      }).catch(() => {});
	    },
	    onCancelButtonClick() {
	      this.closeApp();
	    },
	    handleSaveAction() {
	      if (this.isEditMode) {
	        this.updateDataset();
	      } else {
	        this.saveDataset();
	      }
	    },
	    saveDataset() {
	      main_core.ajax.runAction('biconnector.externalsource.dataset.add', {
	        data: {
	          type: this.sourceCode,
	          fields: this.saveParams
	        }
	      }).then(response => {
	        this.onSaveEnd(response);
	      }).catch(error => {
	        this.onSaveError();
	      });
	    },
	    updateDataset() {
	      main_core.ajax.runAction('biconnector.externalsource.dataset.update', {
	        data: {
	          id: this.datasetId,
	          type: this.sourceCode,
	          fields: this.saveParams
	        }
	      }).then(response => {
	        this.onSaveEnd(response);
	      }).catch(error => {
	        this.onSaveError();
	      });
	    },
	    onSaveStart() {
	      return Promise.resolve();
	    },
	    onSaveEnd() {},
	    onSaveError() {},
	    onLoadStart() {},
	    onLoadSuccess(response) {},
	    onLoadError(response) {},
	    reload() {
	      window.location.reload();
	    },
	    sendAnalytics(params) {
	      if (this.sourceCode) {
	        ui_analytics.sendData({
	          ...this.getBaseAnalyticsParams(),
	          ...params
	        });
	      }
	    },
	    getBaseAnalyticsParams() {
	      return {
	        tool: 'BI_Builder',
	        c_section: 'BI_Builder',
	        category: this.sourceCode.toUpperCase()
	      };
	    }
	  }
	};

	const CsvApp = {
	  extends: BaseApp,
	  data() {
	    return {
	      steps: {
	        file: {
	          disabled: false,
	          valid: this.$store.getters.isEditMode
	        },
	        properties: {
	          disabled: !this.$store.getters.isEditMode,
	          valid: true
	        },
	        fields: {
	          disabled: !this.$store.getters.isEditMode,
	          valid: true
	        }
	      },
	      shownPopups: {
	        savingProgress: false,
	        savingSuccess: false,
	        savingFailure: false,
	        editModeFileReplacement: false,
	        checkFileProgress: false,
	        checkFileSuccess: false,
	        checkFileFailure: false,
	        fileErrors: false
	      },
	      isValidationComplete: true,
	      popupParams: {
	        savingSuccess: {},
	        fileErrors: {
	          isSavingMode: false
	        }
	      },
	      lastReloadSource: null,
	      initialPreviewData: {},
	      initialFieldsSettings: [],
	      previewError: '',
	      isEditModeSaveConfirmed: false,
	      isDataLoadingAnimationDisplayed: false,
	      hasMinimalLoadingAnimationTimePassed: true,
	      checkFileErrors: [],
	      isErrorsChecked: false,
	      exportDownloadLink: null
	    };
	  },
	  computed: {
	    sourceCode() {
	      return 'csv';
	    },
	    isEditMode() {
	      return this.$store.getters.isEditMode;
	    },
	    loadParams() {
	      return {
	        fileProperties: this.$store.state.config.fileProperties,
	        datasetProperties: this.$store.state.config.datasetProperties,
	        fieldsSettings: this.$store.state.config.fieldsSettings,
	        dataFormats: this.$store.state.config.dataFormats
	      };
	    },
	    saveParams() {
	      return {
	        fileProperties: this.$store.state.config.fileProperties,
	        datasetProperties: this.$store.state.config.datasetProperties,
	        fieldsSettings: this.$store.state.config.fieldsSettings,
	        dataFormats: this.$store.state.config.dataFormats
	      };
	    },
	    datasetId() {
	      return this.$store.state.config.datasetProperties.id;
	    },
	    isValidatedForSave() {
	      return this.steps.fields.valid && this.steps.properties.valid && this.steps.file.valid;
	    },
	    importFailurePopupTitle() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FAILURE_POPUP_HEADER_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FAILURE_POPUP_HEADER');
	    },
	    importSuccessPopupTitle() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SUCCESS_POPUP_HEADER_EDIT').replace('#DATASET_TITLE#', this.popupParams.savingSuccess.title) : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SUCCESS_POPUP_HEADER').replace('#DATASET_TITLE#', this.popupParams.savingSuccess.title);
	    },
	    importSuccessPopupDescription() {
	      return this.$store.state.config.fileProperties.fileName ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SUCCESS_POPUP_DESCRIPTION').replace('#FILE_NAME#', this.popupParams.savingSuccess.fileName) : '';
	    },
	    importProgressPopupDescription() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PROGRESS_POPUP_DESCRIPTION_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PROGRESS_POPUP_DESCRIPTION');
	    },
	    sourceType() {
	      return 'csv';
	    }
	  },
	  methods: {
	    markAsChanged() {
	      this.isChanged = true;
	    },
	    onDatasetPropertiesChanged() {
	      this.markAsChanged();
	      if (this.lastChangedStep !== 'properties') {
	        this.sendAnalytics({
	          event: this.isEditMode ? 'edit_start' : 'creation_start',
	          c_element: 'step_2',
	          ...(this.isEditMode && {
	            p1: `datasetName_${this.$store.state.config.datasetProperties.name.replaceAll('_', '')}`
	          })
	        });
	      }
	      this.lastChangedStep = 'properties';
	    },
	    onFieldsSettingsChanged() {
	      this.markAsChanged();
	      if (this.lastChangedStep !== 'fields') {
	        this.sendAnalytics({
	          event: this.isEditMode ? 'edit_start' : 'creation_start',
	          c_element: 'step_3',
	          ...(this.isEditMode && {
	            p1: `datasetName_${this.$store.state.config.datasetProperties.name.replaceAll('_', '')}`
	          })
	        });
	      }
	      this.lastChangedStep = 'fields';
	      this.isErrorsChecked = false;
	    },
	    onDatasetReloadNeeded(reloadSource) {
	      this.markAsChanged();
	      this.previewError = '';
	      this.lastReloadSource = reloadSource;
	      this.isErrorsChecked = false;
	      if (this.$store.state.config.fileProperties.fileToken) {
	        if (reloadSource === 'file') {
	          this.lastChangedStep = 'file';
	          this.sendAnalytics({
	            event: this.isEditMode ? 'edit_start' : 'creation_start',
	            c_element: 'step_1',
	            ...(this.isEditMode && {
	              p1: `datasetName_${this.$store.state.config.datasetProperties.name.replaceAll('_', '')}`
	            })
	          });
	          this.startPreviewLoadingAnimation();
	        }
	        this.loadDataset();
	      } else if (this.isEditMode) {
	        this.$store.commit('setPreviewData', this.initialPreviewData);
	        this.$store.commit('setFieldsSettings', this.initialFieldsSettings);
	      } else {
	        this.$store.commit('setPreviewData', []);
	        this.$refs.propertiesStep.close();
	        this.$refs.fieldsStep.close();
	        this.toggleStepState('properties', true);
	        this.toggleStepState('fields', true);
	        this.toggleCheckFileButton(true);
	      }
	    },
	    processLoadResponse(response) {
	      const responseData = response.data;
	      if (!responseData || responseData.data.length === 0) {
	        return;
	      }
	      if (this.lastReloadSource === 'file' && !this.isEditMode) {
	        const headers = [];
	        responseData.headers.forEach((header, index) => {
	          headers.push(this.prepareHeader(header, index));
	        });
	        this.$store.commit('setFieldsSettings', headers);
	      }
	      this.$store.commit('setPreviewData', responseData.data);
	    },
	    prepareHeader(header, index) {
	      return {
	        visible: true,
	        type: header.type,
	        name: header.name && header.name.length > 0 ? header.name : `FIELD_${index}`,
	        originalType: null,
	        originalName: header.externalCode,
	        externalCode: header.externalCode
	      };
	    },
	    onLoadSuccess(response) {
	      this.stopPreviewLoadingAnimation();
	      this.processLoadResponse(response);
	      this.$refs.propertiesStep.open();
	      this.$refs.fieldsStep.open();
	      this.toggleStepState('properties', false);
	      this.toggleStepState('fields', false);
	      this.$refs.fieldsStep.validate();
	      this.toggleCheckFileButton(false);
	    },
	    onLoadError(response) {
	      var _response$errors$0$me, _response$errors$;
	      this.stopPreviewLoadingAnimation();
	      this.previewError = (_response$errors$0$me = (_response$errors$ = response.errors[0]) == null ? void 0 : _response$errors$.message) != null ? _response$errors$0$me : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_ERROR_FILE');
	    },
	    onSaveStart() {
	      if (!this.isValidatedForSave) {
	        this.$refs.fileStep.showValidationErrors();
	        this.$refs.fieldsStep.showValidationErrors();
	        this.$refs.propertiesStep.showValidationErrors();
	        return Promise.reject();
	      }
	      if (this.isEditMode && !this.isEditModeSaveConfirmed && this.$store.state.config.fileProperties.fileToken) {
	        this.togglePopup('editModeFileReplacement', true);
	        return Promise.reject();
	      }
	      this.togglePopup('savingProgress', true);
	      if (this.isEditMode && !this.$store.state.config.fileProperties.fileToken) {
	        return Promise.resolve();
	      }
	      this.popupParams.fileErrors.isSavingMode = true;
	      return new Promise((resolve, reject) => {
	        this.checkFile().then(() => {
	          resolve();
	        }).catch(() => {
	          this.togglePopup('savingProgress', false);
	          this.togglePopup('fileErrors', true);
	          reject();
	        });
	      });
	    },
	    onSaveEnd(response) {
	      var _response$data$name, _response$data$id;
	      const datasetName = (_response$data$name = response.data.name) != null ? _response$data$name : this.$store.state.config.datasetProperties.name;
	      const datasetId = (_response$data$id = response.data.id) != null ? _response$data$id : this.$store.state.config.datasetProperties.id;
	      this.popupParams.savingSuccess = {
	        title: datasetName,
	        datasetId,
	        fileName: this.$store.state.config.fileProperties.fileName
	      };
	      this.togglePopup('savingProgress', false);
	      this.togglePopup('savingSuccess', true);
	      this.isChanged = false;
	      this.isSaveComplete = true;
	      BX.SidePanel.Instance.postMessage(window, 'BIConnector.dataset-import:onDatasetCreated', {});
	      this.sendAnalytics({
	        event: this.isEditMode ? 'edit_end' : 'creation_end',
	        status: 'success',
	        p1: `datasetName_${datasetName.replaceAll('_', '')}`
	      });
	    },
	    onSaveError() {
	      this.togglePopup('savingProgress', false);
	      this.togglePopup('savingFailure', true);
	      BX.SidePanel.Instance.postMessage(window, 'BIConnector.dataset-import:onDatasetCreated', {});
	      this.sendAnalytics({
	        event: this.isEditMode ? 'edit_end' : 'creation_end',
	        status: 'error'
	      });
	    },
	    onSuccessPopupClose() {
	      this.togglePopup('savingSuccess', false);
	      this.closeApp();
	    },
	    closeFailurePopup() {
	      this.togglePopup('savingFailure', false);
	    },
	    onReplacementButtonClick() {
	      this.isEditModeSaveConfirmed = true;
	      this.togglePopup('editModeFileReplacement', false);
	      this.onSaveButtonClick();
	    },
	    startPreviewLoadingAnimation() {
	      this.isDataLoadingAnimationDisplayed = true;
	      this.hasMinimalLoadingAnimationTimePassed = false;
	      setTimeout(() => {
	        this.hasMinimalLoadingAnimationTimePassed = true;
	      }, 1500);
	    },
	    stopPreviewLoadingAnimation() {
	      this.isDataLoadingAnimationDisplayed = false;
	    },
	    onCheckFileClick() {
	      this.popupParams.fileErrors.isSavingMode = false;
	      if (this.previewError) {
	        return;
	      }
	      this.togglePopup('checkFileProgress', true);
	      this.checkFile().then(() => {
	        this.togglePopup('checkFileProgress', false);
	        this.togglePopup('checkFileSuccess', true);
	      }).catch(() => {
	        this.togglePopup('checkFileProgress', false);
	        this.togglePopup('fileErrors', true);
	      });
	    },
	    onExportFileClick() {
	      var _this$$store$state$co;
	      const button = document.querySelector('.biconnector-export-file-button');
	      if (!button) {
	        return;
	      }
	      main_core.Dom.addClass(button, 'ui-btn-wait');
	      main_core.Dom.attr(button, {
	        disabled: true
	      });
	      biconnector_datasetImport_fileExport.FileExport.getInstance().download({
	        id: this.datasetId,
	        title: (_this$$store$state$co = this.$store.state.config.datasetProperties.name) != null ? _this$$store$state$co : 'dataset'
	      }).then(() => {
	        main_core.Dom.removeClass(button, 'ui-btn-wait');
	        main_core.Dom.attr(button, {
	          disabled: null
	        });
	      }).catch(() => {
	        main_core.Dom.removeClass(button, 'ui-btn-wait');
	        main_core.Dom.attr(button, {
	          disabled: null
	        });
	      });
	    },
	    saveIgnoringErrors() {
	      this.togglePopup('fileErrors', false);
	      this.togglePopup('savingProgress', true);
	      this.handleSaveAction();
	    },
	    checkFile() {
	      if (this.isErrorsChecked) {
	        if (this.checkFileErrors.length > 0) {
	          return Promise.reject();
	        }
	        return Promise.resolve();
	      }
	      return new Promise((resolve, reject) => {
	        main_core.ajax.runAction('biconnector.externalsource.dataset.checkFile', {
	          data: {
	            type: this.sourceCode,
	            fields: this.loadParams
	          }
	        }).then(response => {
	          this.checkFileErrors = this.prepareCheckFileErrors(response.data.checkFileErrors);
	          this.isErrorsChecked = true;
	          if (this.checkFileErrors.length > 0) {
	            reject();
	          } else {
	            resolve();
	          }
	        }).catch(response => {
	          console.error(response);
	          this.togglePopup('checkFileProgress', false);
	          this.togglePopup('savingProgress', false);
	          this.togglePopup('checkFileFailure', true);
	        });
	      });
	    },
	    prepareCheckFileErrors(errors) {
	      const result = [];
	      Object.keys(errors).forEach(lineNumber => {
	        errors[lineNumber].forEach(error => {
	          result.push({
	            lineNumber,
	            errorMessage: error.message,
	            columnName: this.$store.state.config.fieldsSettings[error.customData.field].name
	          });
	        });
	      });
	      return result;
	    },
	    toggleCheckFileButton(disabled) {
	      const button = document.querySelector('.biconnector-check-file-button');
	      if (button) {
	        if (disabled) {
	          main_core.Dom.addClass(button, 'ui-btn-disabled');
	          main_core.Dom.attr(button, 'disabled', true);
	        } else {
	          main_core.Dom.removeClass(button, 'ui-btn-disabled');
	          main_core.Dom.attr(button, 'disabled', null);
	        }
	      }
	    }
	  },
	  mounted() {
	    if (this.isEditMode) {
	      this.initialPreviewData = this.$store.state.previewData.rows;
	      this.initialFieldsSettings = this.$store.state.config.fieldsSettings;
	    }
	    main_core_events.EventEmitter.subscribe('biconnector:dataset-import:onCheckFileClick', this.onCheckFileClick);
	    main_core_events.EventEmitter.subscribe('biconnector:dataset-import:onExportFileClick', this.onExportFileClick);
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', () => {
	      URL.revokeObjectURL(this.exportDownloadLink);
	    });
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe('biconnector:dataset-import:onCheckFileClick', this.onCheckFileClick);
	    main_core_events.EventEmitter.unsubscribe('biconnector:dataset-import:onExportFileClick', this.onExportFileClick);
	    URL.revokeObjectURL(this.exportDownloadLink);
	  },
	  components: {
	    AppLayout,
	    ImportConfig,
	    ImportPreview,
	    FileStep,
	    DatasetPropertiesStep,
	    FieldsSettingsStep,
	    ImportProgressPopup,
	    ImportSuccessPopup,
	    ImportFailurePopup,
	    GenericPopup,
	    FileErrorsPopup,
	    CheckingProgressPopup,
	    CheckingSuccessPopup,
	    CheckingFailedPopup
	  },
	  // language=Vue
	  template: `
		<AppLayout :save-locked="!isSaveEnabled" ref="appLayout" :is-edit-mode="isEditMode">
			<template v-slot:left-panel>
				<ImportConfig>
					<FileStep
						:separators="appParams.separators"
						:encodings="appParams.encodings"
						:disabled="steps.file.disabled"
						:data-format-templates="appParams.dataFormatTemplates"
						ref="fileStep"
						@validation="onStepValidation('file', $event)"
						@file-properties-change="onDatasetReloadNeeded('file')"
						@parsing-options-changed="onDatasetReloadNeeded('fields')"
					/>
					<DatasetPropertiesStep
						:is-open-initially="isEditMode"
						:disabled="steps.properties.disabled"
						:reserved-names="appParams.reservedNames"
						:name-max-length=30
						ref="propertiesStep"
						@validation="onStepValidation('properties', $event)"
						@properties-changed="onDatasetPropertiesChanged"
						:dataset-source-code="sourceCode"
					/>
					<FieldsSettingsStep
						:is-open-initially="isEditMode"
						:disabled="steps.fields.disabled"
						:source-type="sourceType"
						ref="fieldsStep"
						@validation="onStepValidation('fields', $event)"
						@parsing-options-changed="onDatasetReloadNeeded('fields')"
						@settings-changed="onFieldsSettingsChanged"
					/>
				</ImportConfig>
			</template>
			<template v-slot:right-panel>
				<ImportPreview 
					:error="previewError"
					:is-loading="isDataLoadingAnimationDisplayed || !hasMinimalLoadingAnimationTimePassed"
				/>
			</template>
		</AppLayout>

		<ImportProgressPopup
			v-if="shownPopups.savingProgress"
			:description="importProgressPopupDescription"
		/>

		<ImportSuccessPopup
			v-if="shownPopups.savingSuccess"
			@close="onSuccessPopupClose"
			@click="closeApp"
			@one-more-click="reload"
			:title="importSuccessPopupTitle"
			:description="importSuccessPopupDescription"
			:dataset-id="popupParams.savingSuccess.datasetId"
			:show-more-button="!isEditMode"
		/>

		<ImportFailurePopup
			v-if="shownPopups.savingFailure"
			@close="closeFailurePopup"
			@click="closeFailurePopup"
			:title="importFailurePopupTitle"
			:description="$Bitrix.Loc.getMessage('DATASET_IMPORT_FAILURE_POPUP_DESCRIPTION').replace('[link]', '<a>').replace('[/link]', '</a>')"
		/>

		<GenericPopup
			v-if="shownPopups.editModeFileReplacement"
			:title="$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_REPLACEMENT_TITLE')"
			@close="togglePopup('editModeFileReplacement', false)"
		>
			<template v-slot:content>
				{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_REPLACEMENT_TEXT') }}
			</template>
			<template v-slot:buttons>
				<button @click="onReplacementButtonClick" class="ui-btn ui-btn-md ui-btn-primary">{{
					$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_REPLACEMENT_LOAD') }}
				</button>
				<button @click="togglePopup('editModeFileReplacement', false)"
						class="ui-btn ui-btn-md ui-btn-light-border">{{
					$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_REPLACEMENT_CANCEL') }}
				</button>
			</template>
		</GenericPopup>

		<FileErrorsPopup
			v-if="shownPopups.fileErrors"
			@close="togglePopup('fileErrors', false);"
			@save-ignoring-errors="saveIgnoringErrors()"
			:errors="checkFileErrors"
			:is-edit-mode="this.isEditMode"
			:is-saving-mode="popupParams.fileErrors.isSavingMode"
		/>
		<CheckingProgressPopup
			v-if="shownPopups.checkFileProgress"
			@close="togglePopup('checkFileProgress', false)"
		/>
		<CheckingSuccessPopup
			v-if="shownPopups.checkFileSuccess"
			@close="togglePopup('checkFileSuccess', false)"
		/>
		<CheckingFailedPopup
			v-if="shownPopups.checkFileFailure"
			@close="togglePopup('checkFileFailure', false)"
		/>
	`
	};

	const SyncFieldsPopup = {
	  emits: ['close'],
	  props: {
	    isChange: {
	      type: Boolean,
	      required: true
	    }
	  },
	  computed: {
	    popupOptions() {
	      return {
	        width: 440,
	        closeIcon: true,
	        noAllPaddings: true,
	        overlay: true
	      };
	    }
	  },
	  methods: {
	    getDescription() {
	      return this.isChange ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SYNC_FIELDS_POPUP_DESCRIPTION_CHANGED') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SYNC_FIELDS_POPUP_DESCRIPTION_NOT_CHANGED');
	    },
	    onClose() {
	      this.$emit('close');
	    }
	  },
	  components: {
	    Popup
	  },
	  // language=Vue
	  template: `
		<Popup id="syncFields" @close="this.onClose" :options="popupOptions" wrapper-class="generic-popup">
			<h3 class="generic-popup__header">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_SYNC_FIELDS_POPUP_HEADER') }}</h3>
			<div class="generic-popup__content">
				{{ getDescription() }}
			</div>
			<div class="generic-popup__buttons-wrapper">
				<button @click="onClose" class="ui-btn ui-btn-md ui-btn-primary">
					{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_SYNC_FIELDS_POPUP_BUTTON') }}
				</button>
			</div>
		</Popup>
	`
	};

	let _$3 = t => t,
	  _t$3;
	const ConnectionSelectorField = {
	  extends: BaseField,
	  props: {
	    options: {
	      type: Object,
	      required: true
	    },
	    items: {
	      type: Array,
	      required: true
	    },
	    connectionId: {
	      type: Number,
	      required: false
	    }
	  },
	  mounted() {
	    const node = this.$refs['entity-selector'];
	    const selector = new ui_entitySelector.TagSelector({
	      id: this.options.selectorId,
	      multiple: false,
	      addButtonCaption: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_SELECT'),
	      addButtonCaptionMore: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_CHANGE'),
	      dialogOptions: {
	        id: this.options.selectorId,
	        items: this.preparedItems,
	        enableSearch: true,
	        dropdownMode: true,
	        showAvatars: true,
	        compactView: false,
	        multiple: false,
	        width: 460,
	        height: 420,
	        tabs: [{
	          id: 'connections',
	          stubOptions: {
	            title: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_NO_CONNECTIONS_TITLE'),
	            subtitle: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_NO_CONNECTIONS_SUBTITLE'),
	            arrow: true,
	            icon: '/bitrix/images/biconnector/database-connections/connections-empty-state.png',
	            iconOpacity: 100
	          }
	        }],
	        entities: [{
	          id: 'biconnector-external-connection'
	        }]
	      },
	      events: {
	        onTagAdd: event => {
	          this.$emit('valueChange', event);
	        },
	        onTagRemove: event => {
	          this.$emit('valueClear', event);
	        }
	      }
	    });
	    main_core.Dom.addClass(selector.getDialog().getContainer(), 'biconnector-dataset-entity-selector');
	    selector.renderTo(node);
	    const footer = main_core.Tag.render(_t$3 || (_t$3 = _$3`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">
				${0}
			</span>
		`), this.$Bitrix.Loc.getMessage('DATASET_IMPORT_NO_CONNECTIONS_FOOTER'));
	    main_core.Event.bind(footer, 'click', () => {
	      const link = '/bitrix/components/bitrix/biconnector.externalconnection/slider.php?closeAfterCreate=Y';
	      BX.SidePanel.Instance.open(link, {
	        width: 564,
	        allowChangeHistory: false,
	        cacheable: false
	      });
	    });
	    selector.getDialog().getTab(this.name).setFooter(footer);
	    this.selector = selector;
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
	      const [messageEvent] = event.getData();
	      if (messageEvent.getEventId() === 'BIConnector:ExternalConnection:onConnectionSave') {
	        this.onConnectionSave(messageEvent);
	      }
	    });
	  },
	  computed: {
	    preparedItems() {
	      const selectorItems = [];
	      this.items.forEach(item => {
	        const itemOptions = {
	          id: item.ID,
	          title: item.TITLE,
	          entityId: this.options.selectorId,
	          tabs: this.name,
	          link: `/bitrix/components/bitrix/biconnector.externalconnection/slider.php?sourceId=${item.ID}&closeAfterCreate=Y`,
	          linkTitle: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_ABOUT'),
	          customData: {
	            connectionType: item.TYPE
	          }
	        };
	        if (item.AVATAR) {
	          itemOptions.avatar = item.AVATAR;
	        }
	        if (this.connectionId) {
	          itemOptions.selected = item.ID === this.connectionId.toString();
	        }
	        selectorItems.push(itemOptions);
	      });
	      return selectorItems;
	    }
	  },
	  methods: {
	    onConnectionSave(event) {
	      const itemOptions = event.getData().connection;
	      if (!main_core.Type.isStringFilled(itemOptions == null ? void 0 : itemOptions.avatar)) {
	        itemOptions.avatar = `/bitrix/images/biconnector/database-connections/${itemOptions.type}.svg`;
	      }
	      const selector = this.selector;
	      const dialog = selector.getDialog();
	      let item = dialog.getItem({
	        id: itemOptions.id,
	        entityId: this.options.selectorId
	      });
	      if (item) {
	        item.setTitle({
	          text: main_core.Text.decode(itemOptions.name),
	          type: 'text'
	        });
	        if (item.isSelected()) {
	          selector.removeTags();
	          item.deselect();
	          item.select();
	        }
	      } else {
	        item = dialog.addItem({
	          id: itemOptions.id,
	          title: itemOptions.name,
	          entityId: this.options.selectorId,
	          tabs: this.name,
	          link: `/bitrix/components/bitrix/biconnector.externalconnection/slider.php?sourceId=${itemOptions.id}&closeAfterCreate=Y`,
	          linkTitle: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_ABOUT'),
	          avatar: `/bitrix/images/biconnector/database-connections/${itemOptions.type}.svg`,
	          customData: {
	            connectionType: itemOptions.type
	          }
	        });
	        item.select();
	      }
	      dialog.hide();
	    }
	  },
	  // language=Vue
	  template: `
		<div>
			<div class="ui-ctl-title">
				<div class="ui-ctl-label-text">{{ this.title }}</div>
			</div>
			<div ref="entity-selector"></div>
			<div 
				v-if="!isValid"
				class="connection-error"
			>
				{{ this.errorMessage }}
			</div>
		</div>
	`
	};

	const TableSelectorField = {
	  extends: BaseField,
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    options: {
	      type: Object,
	      required: true
	    },
	    connectionId: {
	      type: Number,
	      required: true
	    },
	    selectedConnectionType: {
	      type: String,
	      required: false
	    }
	  },
	  data() {
	    return {
	      hasErrors: false
	    };
	  },
	  mounted() {
	    const node = this.$refs['entity-selector'];
	    const selector = new ui_entitySelector.TagSelector({
	      id: this.options.selectorId,
	      multiple: false,
	      addButtonCaption: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_SELECT'),
	      addButtonCaptionMore: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_CHANGE'),
	      dialogOptions: {
	        id: this.options.selectorId,
	        enableSearch: true,
	        dropdownMode: true,
	        showAvatars: false,
	        compactView: true,
	        multiple: false,
	        dynamicLoad: true,
	        width: 460,
	        height: 420,
	        tabs: [{
	          id: 'tables',
	          stub: true,
	          stubOptions: {
	            title: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_TABLES_STUB_TITLE'),
	            subtitle: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_TABLES_STUB_SUBTITLE')
	          }
	        }],
	        entities: [{
	          id: 'biconnector-external-table',
	          dynamicLoad: false,
	          dynamicSearch: true,
	          options: {
	            ...(this.connectionId && {
	              connectionId: this.connectionId
	            })
	          }
	        }],
	        events: {
	          'Entity:onError': event => {
	            this.onError(event);
	          },
	          onSearch: event => {
	            this.onSearch(event);
	          }
	        }
	      },
	      events: {
	        onTagAdd: event => {
	          this.$emit('valueChange', event);
	        },
	        onTagRemove: event => {
	          this.$emit('valueClear', event);
	        }
	      }
	    });
	    main_core.Dom.addClass(selector.getDialog().getContainer(), 'biconnector-dataset-entity-selector');
	    selector.setLocked(!(this.connectionId > 0 && !this.isDisabled));
	    selector.renderTo(node);
	    this.selector = selector;
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
	      const [messageEvent] = event.getData();
	      if (messageEvent.getEventId() === 'BIConnector:ExternalConnection:onConnectionSave') {
	        this.selector.removeTags();
	      }
	    });
	  },
	  computed: {
	    set() {
	      return ui_iconSet_api_vue.Set;
	    },
	    hintOptions() {
	      const hintCode = this.selectedConnectionType === 'rest' ? 'DATASET_IMPORT_REST_TABLES_HINT' : 'DATASET_IMPORT_TABLES_HINT';
	      return {
	        text: this.$Bitrix.Loc.getMessage(hintCode),
	        popupOptions: {
	          bindOptions: {
	            position: 'top'
	          },
	          offsetTop: -10,
	          angle: {
	            position: 'top',
	            offset: 34
	          }
	        }
	      };
	    }
	  },
	  watch: {
	    connectionId(newConnectionId) {
	      const selector = this.selector;
	      selector.removeTags();
	      selector.getDialog().removeItems();
	      if (!newConnectionId) {
	        selector.setLocked(true);
	        return;
	      }
	      selector.getDialog().getEntity('biconnector-external-table').options.connectionId = newConnectionId;
	      selector.setLocked(this.isDisabled);
	    }
	  },
	  methods: {
	    onError(event) {
	      const errors = event.getData().errors;
	      const dialog = event.getTarget();
	      const tableTab = dialog.getTab('tables');
	      tableTab.getStub().hide();
	      dialog.selectTab('tables');
	      tableTab.setStub(true, {
	        title: errors[0].message,
	        icon: '/bitrix/js/biconnector/dataset-import/dist/images/table-error-state.svg',
	        iconOpacity: 100
	      });
	      tableTab.getStub().show();
	      this.hasErrors = true;
	    },
	    onSearch(event) {
	      if (!this.hasErrors) {
	        return;
	      }
	      const dialog = event.getTarget();
	      const tableTab = dialog.getTab('tables');
	      tableTab.getStub().hide();
	      tableTab.setStub(true, {
	        title: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_TABLES_STUB_TITLE'),
	        subtitle: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_TABLES_STUB_SUBTITLE')
	      });
	      this.hasErrors = false;
	    }
	  },
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  // language=Vue
	  template: `
		<div>
			<div class="ui-ctl-title">
				<div class="ui-ctl-label-text table-title">
					<span>{{ this.title }}</span>
					<div v-if='selectedConnectionType' class="table-hint" v-hint="hintOptions">
						<BIcon
							:name="set.HELP"
							:size="20"
							color="#D5D7DB"
						></BIcon>
					</div>
				</div>
			</div>
			<div ref="entity-selector"></div>
		</div>
	`
	};

	const ConnectionStep = {
	  extends: BaseStep,
	  props: {
	    connections: {
	      type: Array,
	      required: true
	    }
	  },
	  data() {
	    return {
	      tableId: this.$store.state.config.table,
	      connectionSelectorId: 'biconnector-external-connection',
	      tableSelectorId: 'biconnector-external-table',
	      unvalidatedFields: {}
	    };
	  },
	  components: {
	    ConnectionSelectorField,
	    CustomField,
	    TableSelectorField,
	    StringField
	  },
	  computed: {
	    defaultTitle() {
	      return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_HEADER');
	    },
	    connectionSelectorOptions() {
	      return {
	        selectorId: this.connectionSelectorId
	      };
	    },
	    tableSelectorOptions() {
	      return {
	        selectorId: this.tableSelectorId
	      };
	    },
	    selectedConnectionType() {
	      var _this$$store$getters$;
	      return (_this$$store$getters$ = this.$store.getters.connectionProperties) == null ? void 0 : _this$$store$getters$.connectionType;
	    },
	    selectedConnectionAvatar() {
	      const id = this.selectedConnectionId;
	      if (id > 0) {
	        const connection = this.connections.find(item => parseFloat(item.ID) === id);
	        if (connection) {
	          return connection.AVATAR;
	        }
	      }
	      return `/bitrix/images/biconnector/database-connections/${this.selectedConnectionType}.svg`;
	    },
	    selectedConnectionId() {
	      var _this$$store$getters$2, _this$$store$getters$3;
	      return (_this$$store$getters$2 = (_this$$store$getters$3 = this.$store.getters.connectionProperties) == null ? void 0 : _this$$store$getters$3.connectionId) != null ? _this$$store$getters$2 : 0;
	    },
	    selectedConnectionName() {
	      var _this$$store$getters$4;
	      return (_this$$store$getters$4 = this.$store.getters.connectionProperties) == null ? void 0 : _this$$store$getters$4.connectionName;
	    },
	    selectedTableName() {
	      var _this$$store$getters$5;
	      return (_this$$store$getters$5 = this.$store.getters.connectionProperties) == null ? void 0 : _this$$store$getters$5.tableName;
	    },
	    isEditMode() {
	      return this.$store.getters.isEditMode;
	    }
	  },
	  methods: {
	    onConnectionSelected(event) {
	      const tag = event.data.tag;
	      const dialogItems = event.target.getDialog().getItems();
	      dialogItems.forEach(item => {
	        if (item.getId() === tag.getId()) {
	          tag.customData = item.getCustomData();
	        }
	      });
	      const sourceId = parseInt(event.data.tag.getId(), 10);
	      this.$store.commit('setConnectionProperties', {
	        connectionType: event.data.tag.getCustomData().get('connectionType'),
	        connectionId: sourceId,
	        tableName: null
	      });
	      main_core.ajax.runAction('biconnector.externalsource.source.checkExistingConnection', {
	        data: {
	          sourceId
	        }
	      }).then(() => {
	        this.unvalidatedFields = {};
	      }).catch(response => {
	        this.unvalidatedFields = {
	          connection: {
	            result: false,
	            message: response.errors[0].message
	          }
	        };
	      });
	      this.$emit('validation', false);
	    },
	    onConnectionDeselected() {
	      this.$store.commit('setConnectionProperties', {
	        connectionType: null,
	        connectionId: null,
	        tableName: null
	      });
	      this.$emit('validation', false);
	      this.unvalidatedFields = {};
	    },
	    onTableSelected(event) {
	      this.$store.commit('setConnectionProperties', {
	        connectionType: this.selectedConnectionType,
	        connectionId: this.selectedConnectionId,
	        tableName: event.data.tag.getTitle()
	      });
	      const tag = event.data.tag;
	      const dialogItems = event.target.getDialog().getItems();
	      dialogItems.forEach(item => {
	        if (item.getId() === tag.getId()) {
	          tag.customData = item.getCustomData();
	        }
	      });
	      this.$store.commit('setDatasetProperties', {
	        id: null,
	        name: event.data.tag.getCustomData().get('datasetName'),
	        code: event.data.tag.getId(),
	        description: event.data.tag.getTitle(),
	        externalCode: event.data.tag.getId(),
	        externalName: event.data.tag.getTitle()
	      });
	      this.$emit('tableSelected', event);
	      this.$emit('validation', true);
	      this.unvalidatedFields = {};
	    },
	    onTableDeselected(event) {
	      this.$store.commit('setConnectionProperties', {
	        connectionType: this.selectedConnectionType,
	        connectionId: this.selectedConnectionId,
	        tableName: null
	      });
	      this.$store.commit('setDatasetProperties', {
	        id: null,
	        name: null,
	        code: null,
	        description: null,
	        externalCode: null,
	        externalName: null
	      });
	      this.$emit('tableDeselected', event);
	      this.$emit('validation', false);
	      this.unvalidatedFields = {};
	    },
	    openConnectionSlider() {
	      const link = `/bitrix/components/bitrix/biconnector.externalconnection/slider.php?sourceId=${this.selectedConnectionId}&closeAfterCreate=Y`;
	      BX.SidePanel.Instance.open(link, {
	        width: 564,
	        allowChangeHistory: false,
	        cacheable: false
	      });
	    },
	    handleSliderMessage(event) {
	      const [messageEvent] = event.getData();
	      if (messageEvent.getEventId() === 'BIConnector:ExternalConnection:onConnectionSave') {
	        const connectionProperties = this.$store.getters.connectionProperties;
	        connectionProperties.connectionName = main_core.Text.decode(messageEvent.data.connection.name);
	        this.$store.commit('setConnectionProperties', connectionProperties);
	      }
	    }
	  },
	  mounted() {
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.handleSliderMessage);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onMessage', this.handleSliderMessage);
	  },
	  emits: ['tableSelected', 'tableDeselected'],
	  template: `
		<Step
			:title="displayedTitle"
			:hint="displayedHint"
			:is-open-initially="isOpenInitially"
			:disabled="disabled"
			ref="stepBlock"
		>
			<ConnectionSelectorField
				v-if="!this.isEditMode"
				:options="this.connectionSelectorOptions"
				name="connections"
				:title="this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_FIELD_TITLE')"
				:items="this.connections"
				:is-disabled="disabled"
				:connection-id="this.selectedConnectionId"
				@value-change="onConnectionSelected"
				@value-clear="onConnectionDeselected"
				ref="connectionField"
				:is-valid="unvalidatedFields.connection?.result ?? true"
				:error-message="unvalidatedFields.connection?.message ?? ''"
			/>
			<TableSelectorField
				v-if="!this.isEditMode"
				:options="this.tableSelectorOptions"
				name="tables"
				:title="this.$Bitrix.Loc.getMessage('DATASET_IMPORT_TABLES_FIELD_TITLE')"
				:connection-id="this.selectedConnectionId"
				:is-disabled="disabled"
				:selected-connection-type="selectedConnectionType"
				@value-change="onTableSelected"
				@value-clear="onTableDeselected"
				ref="tableField"
			/>

			<div
				v-if="this.isEditMode"
			>
				<CustomField
					name="connections"
					:title="this.$Bitrix.Loc.getMessage('DATASET_IMPORT_CONNECTIONS_FIELD_TITLE')"
				>
					<template #field-content>
						<div class="connection-preview">
							<div
								class="connection-icon"
								:style="'background-image: url(\\'' + selectedConnectionAvatar + '\\');'"
							></div>
							<div class="connection-name" @click="openConnectionSlider">
								{{ this.selectedConnectionName }}
							</div>
						</div>
					</template>
				</CustomField>

				<StringField
					name="tables"
					:title="this.$Bitrix.Loc.getMessage('DATASET_IMPORT_TABLES_FIELD_TITLE')"
					:is-disabled="true"
					:defaultValue="this.selectedTableName"
				/>
			</div>
		</Step>
	`
	};

	const ExternalConnectionApp = {
	  extends: BaseApp,
	  data() {
	    return {
	      steps: {
	        connection: {
	          disabled: false,
	          valid: this.$store.getters.isEditMode
	        },
	        properties: {
	          disabled: !this.$store.getters.isEditMode,
	          valid: true
	        },
	        fields: {
	          disabled: !this.$store.getters.isEditMode,
	          valid: true,
	          disabledElements: null
	        }
	      },
	      shownPopups: {
	        savingProgress: false,
	        savingSuccess: false,
	        savingFailure: false,
	        loadFailure: false,
	        syncFields: false,
	        fieldsSettingsChanges: false
	      },
	      isValidationComplete: true,
	      popupParams: {
	        savingSuccess: {},
	        loadFailure: {
	          messages: []
	        },
	        syncFields: {
	          isChange: false
	        }
	      },
	      isLoading: false,
	      previewError: '',
	      previewDataLoaded: false,
	      pendingSavePromise: null,
	      initialFieldsSettings: null
	    };
	  },
	  created() {
	    this.initialFieldsSettings = structuredClone(ui_vue3.toRaw(this.$store.state.config.fieldsSettings));
	  },
	  computed: {
	    isRestEntity() {
	      return this.sourceCode === 'rest';
	    },
	    sourceCode() {
	      var _this$$store$state$co, _this$$store$state$co2;
	      return (_this$$store$state$co = (_this$$store$state$co2 = this.$store.state.config.connectionProperties) == null ? void 0 : _this$$store$state$co2.connectionType) != null ? _this$$store$state$co : '';
	    },
	    isEditMode() {
	      return this.$store.getters.isEditMode;
	    },
	    loadParams() {
	      return {
	        datasetProperties: this.$store.state.config.datasetProperties,
	        fieldsSettings: this.$store.state.config.fieldsSettings,
	        dataFormats: this.$store.state.config.dataFormats,
	        tableName: this.$store.state.config.connectionProperties.tableName,
	        connectionType: this.$store.state.config.connectionProperties.connectionType
	      };
	    },
	    saveParams() {
	      return {
	        datasetProperties: this.$store.state.config.datasetProperties,
	        fieldsSettings: this.$store.state.config.fieldsSettings,
	        dataFormats: this.$store.state.config.dataFormats,
	        connectionSettings: this.$store.state.config.connectionProperties
	      };
	    },
	    isValidatedForSave() {
	      return this.steps.fields.valid && this.steps.properties.valid && this.steps.connection.valid;
	    },
	    importFailurePopupTitle() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FAILURE_POPUP_HEADER_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FAILURE_POPUP_HEADER');
	    },
	    importSuccessPopupTitle() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SUCCESS_POPUP_HEADER_EDIT').replace('#DATASET_TITLE#', this.popupParams.savingSuccess.title) : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_SUCCESS_POPUP_HEADER').replace('#DATASET_TITLE#', this.popupParams.savingSuccess.title);
	    },
	    importProgressPopupDescription() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PROGRESS_POPUP_DESCRIPTION_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PROGRESS_POPUP_DESCRIPTION');
	    },
	    loadFailurePopupTitle() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_ERROR_EDIT_TITLE') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_ERROR_TITLE');
	    },
	    fieldsSettingsStepHint() {
	      if (this.isEditMode) {
	        if (this.isRestEntity) {
	          return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_FIELDS_SETTINGS_HINT_EDIT');
	        }
	        return '';
	      }
	      let articleCode = '23508958';
	      let hintCode = 'DATASET_IMPORT_FIELDS_SETTINGS_HINT_EXTERNAL_MSGVER_1';
	      if (this.isRestEntity) {
	        articleCode = '24486426';
	        hintCode = 'DATASET_IMPORT_FIELDS_SETTINGS_HINT_EXTERNAL_REST';
	      }
	      return this.$Bitrix.Loc.getMessage(hintCode).replace('[link]', '<a onclick="top.BX.Helper.show(`redirect=detail&code=' + articleCode + '`)">').replace('[/link]', '</a>');
	    },
	    unsavedChangesPopupTitle() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TITLE_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TITLE_EXTERNAL');
	    },
	    unsavedChangesPopupText() {
	      return this.isEditMode ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TEXT_EDIT') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_UNSAVED_CHANGES_TEXT_EXTERNAL');
	    },
	    emptyStateText() {
	      return this.previewDataLoaded ? this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_ERROR_EMPTY_TABLE') : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_EMPTY_STATE_EXTERNAL');
	    },
	    syncFieldsProps() {
	      return {
	        supported: this.isEditMode,
	        disabled: this.isLoading
	      };
	    },
	    sourceType() {
	      return 'external';
	    }
	  },
	  mounted() {
	    var _this$$store$state$co3, _this$$store$state$co4;
	    if (!this.$store.getters.hasData && (_this$$store$state$co3 = this.$store.state.config.connectionProperties) != null && _this$$store$state$co3.connectionId && (_this$$store$state$co4 = this.$store.state.config.connectionProperties) != null && _this$$store$state$co4.tableName) {
	      this.loadDataset();
	    }
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onSliderEvent);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onSliderEvent);
	  },
	  methods: {
	    onSliderEvent(event) {
	      const [messageEvent] = event.getData();
	      if (messageEvent.getEventId() === 'BIConnector:ExternalConnection:onConnectionSave') {
	        this.onConnectionCreated();
	      } else if (messageEvent.getEventId() === 'BIConnector:ExternalConnection:onConnectionCreationError') {
	        this.onConnectionCreationError();
	      }
	    },
	    onConnectionCreated() {
	      this.sendAnalytics({
	        event: 'connection',
	        status: 'success'
	      });
	    },
	    onConnectionCreationError() {
	      this.sendAnalytics({
	        event: 'connection',
	        status: 'error'
	      });
	    },
	    onTableSelected() {
	      this.sendConnectionSelectorAnalytics();
	      this.markAsChanged();
	      this.loadDataset();
	      this.$refs.propertiesStep.showValidationErrors();
	    },
	    onTableDeselected() {
	      this.sendConnectionSelectorAnalytics();
	      this.$refs.propertiesStep.close();
	      this.$refs.fieldsStep.close();
	      this.toggleStepState('properties', true);
	      this.toggleStepState('fields', true);
	      this.$store.commit('setPreviewData', []);
	      this.$store.commit('setFieldsSettings', []);
	      this.$refs.propertiesStep.validate();
	      this.previewError = '';
	      this.previewDataLoaded = false;
	    },
	    sendConnectionSelectorAnalytics() {
	      if (this.lastChangedStep !== 'connection' && !this.isEditMode) {
	        this.sendAnalytics({
	          event: 'creation_start',
	          c_element: 'step_1'
	        });
	      }
	      this.lastChangedStep = 'connection';
	    },
	    onDatasetPropertiesChanged() {
	      this.markAsChanged();
	      if (this.lastChangedStep !== 'properties' && !this.isEditMode) {
	        this.sendAnalytics({
	          event: 'creation_start',
	          c_element: 'step_2'
	        });
	      }
	      this.lastChangedStep = 'properties';
	    },
	    onParsingOptionsChanged() {
	      this.markAsChanged();
	      this.loadDataset();
	    },
	    onFieldsChanged() {
	      this.markAsChanged();
	      if (this.lastChangedStep !== 'fields' && !this.isEditMode) {
	        this.sendAnalytics({
	          event: 'creation_start',
	          c_element: 'step_3'
	        });
	      }
	      this.lastChangedStep = 'fields';
	    },
	    loadDataset() {
	      this.isLoading = true;
	      main_core.ajax.runAction('biconnector.externalsource.dataset.view', {
	        data: {
	          type: this.sourceCode,
	          fields: this.loadParams,
	          sourceId: this.$store.state.config.connectionProperties.connectionId
	        }
	      }).then(response => {
	        this.isLoading = false;
	        this.onLoadSuccess(response);
	      }).catch(response => {
	        var _response$errors$0$me, _response$errors$;
	        this.processLoadResponse(response);
	        this.isLoading = false;
	        this.previewError = (_response$errors$0$me = (_response$errors$ = response.errors[0]) == null ? void 0 : _response$errors$.message) != null ? _response$errors$0$me : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_ERROR_EXTERNAL');
	      });
	    },
	    onLoadSuccess(response) {
	      this.processLoadResponse(response);
	      this.$refs.propertiesStep.open();
	      this.$refs.fieldsStep.open();
	      this.toggleStepState('properties', false);
	      if (this.isRestEntity) {
	        this.steps.fields.disabledElements = {
	          name: true,
	          type: true
	        };
	      }
	      this.toggleStepState('fields', false);
	      this.$refs.propertiesStep.validate();
	      this.$refs.fieldsStep.validate();
	    },
	    processLoadResponse(response) {
	      const responseData = response.data;
	      if (!responseData) {
	        return;
	      }
	      this.previewDataLoaded = true;
	      if (this.lastChangedStep === 'connection') {
	        const headers = [];
	        responseData.headers.forEach((header, index) => {
	          headers.push(this.prepareHeader(header, index));
	        });
	        this.$store.commit('setFieldsSettings', headers);
	      }
	      this.$store.commit('setPreviewData', responseData.data);
	    },
	    onSyncSuccess(response) {
	      this.processSyncResponse(response);
	      this.$refs.propertiesStep.open();
	      this.$refs.fieldsStep.open();
	      this.toggleStepState('properties', false);
	      this.toggleStepState('fields', false);
	      this.$refs.propertiesStep.validate();
	      this.$refs.fieldsStep.validate();
	    },
	    processSyncResponse(response) {
	      const responseData = response.data;
	      if (responseData) {
	        this.previewDataLoaded = true;
	        const headers = [];
	        responseData.headers.forEach((header, index) => {
	          headers.push(this.prepareHeader(header, index));
	        });
	        this.$store.commit('setFieldsSettings', headers);
	        this.$store.commit('setPreviewData', responseData.data);
	      }
	      this.sendAnalytics({
	        event: 'sync_fields',
	        status: response.status
	      });
	    },
	    prepareHeader(header, index) {
	      const result = {
	        visible: header.visible,
	        type: header.type,
	        name: header.name && header.name.length > 0 ? header.name : `FIELD_${index}`,
	        originalType: header.type,
	        originalName: header.externalCode,
	        externalCode: header.externalCode
	      };
	      if (header.id) {
	        result.id = header.id;
	      }
	      return result;
	    },
	    onSaveStart() {
	      if (!this.isValidatedForSave) {
	        this.$refs.fieldsStep.showValidationErrors();
	        this.$refs.propertiesStep.showValidationErrors();
	        return Promise.reject();
	      }
	      if (this.isEditMode && this.hasFieldsSettingsChanges()) {
	        this.togglePopup('fieldsSettingsChanges', true);
	        return new Promise((resolve, reject) => {
	          this.pendingSavePromise = {
	            resolve,
	            reject
	          };
	        });
	      }
	      this.togglePopup('savingProgress', true);
	      return Promise.resolve();
	    },
	    onSaveEnd(response) {
	      var _response$data$name, _response$data$id;
	      const datasetName = (_response$data$name = response.data.name) != null ? _response$data$name : this.$store.state.config.datasetProperties.name;
	      const datasetId = (_response$data$id = response.data.id) != null ? _response$data$id : this.$store.state.config.datasetProperties.id;
	      this.popupParams.savingSuccess = {
	        title: datasetName,
	        datasetId,
	        link: response.data.url
	      };
	      this.togglePopup('savingProgress', false);
	      this.togglePopup('savingSuccess', true);
	      this.isChanged = false;
	      this.sendAnalytics({
	        event: this.isEditMode ? 'dataset_editing' : 'creation_end',
	        status: 'success',
	        p1: `datasetName_${datasetName.replaceAll('_', '')}`
	      });
	      BX.SidePanel.Instance.postMessage(window, 'BIConnector.dataset-import:onDatasetCreated', {});
	    },
	    onSaveError() {
	      this.togglePopup('savingProgress', false);
	      this.togglePopup('savingFailure', true);
	      this.sendAnalytics({
	        event: this.isEditMode ? 'dataset_editing' : 'creation_end',
	        status: 'error'
	      });
	      BX.SidePanel.Instance.postMessage(window, 'BIConnector.dataset-import:onDatasetCreated', {});
	    },
	    onSuccessPopupClose() {
	      this.togglePopup('savingSuccess', false);
	      this.closeApp();
	    },
	    closeFailurePopup() {
	      this.togglePopup('savingFailure', false);
	    },
	    onSyncFields() {
	      this.isLoading = true;
	      main_core.ajax.runAction('biconnector.externalsource.dataset.syncField', {
	        data: {
	          id: this.datasetId
	        }
	      }).then(response => {
	        this.isLoading = false;
	        this.onSyncSuccess(response);
	        this.popupParams.syncFields.isChange = response.data.isChanged;
	        this.togglePopup('syncFields', true);
	      }).catch(response => {
	        var _response$errors$0$me2, _response$errors$2;
	        this.isLoading = false;
	        this.processSyncResponse(response);
	        this.previewError = (_response$errors$0$me2 = (_response$errors$2 = response.errors[0]) == null ? void 0 : _response$errors$2.message) != null ? _response$errors$0$me2 : this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_ERROR_EXTERNAL');
	      });
	    },
	    hasFieldsSettingsChanges() {
	      const fieldsToCompare = ['id', 'visible', 'type', 'name'];
	      let currentFields = ui_vue3.toRaw(this.$store.state.config.fieldsSettings);
	      let initialFields = ui_vue3.toRaw(this.initialFieldsSettings);

	      // eslint-disable-next-line max-len
	      currentFields = currentFields.map(obj => fieldsToCompare.reduce((result, field) => Object.prototype.hasOwnProperty.call(obj, field) ? {
	        ...result,
	        [field]: obj[field]
	      } : result, {}));
	      // eslint-disable-next-line max-len
	      initialFields = initialFields.map(obj => fieldsToCompare.reduce((result, field) => Object.prototype.hasOwnProperty.call(obj, field) ? {
	        ...result,
	        [field]: obj[field]
	      } : result, {}));
	      return JSON.stringify(currentFields) !== JSON.stringify(initialFields);
	    },
	    onConfirmFieldsSettingsChangesPopup() {
	      this.togglePopup('fieldsSettingsChanges', false);
	      this.togglePopup('savingProgress', true);
	      if (this.pendingSavePromise) {
	        this.pendingSavePromise.resolve();
	        this.pendingSavePromise = null;
	      }
	    },
	    onCancelFieldsSettingsChangesPopup() {
	      this.togglePopup('fieldsSettingsChanges', false);
	      if (this.pendingSavePromise) {
	        this.pendingSavePromise.reject();
	        this.pendingSavePromise = null;
	      }
	    }
	  },
	  components: {
	    AppLayout,
	    ImportConfig,
	    ImportPreview,
	    ConnectionStep,
	    DatasetPropertiesStep,
	    FieldsSettingsStep,
	    ImportProgressPopup,
	    ImportSuccessPopup,
	    ImportFailurePopup,
	    SyncFieldsPopup,
	    GenericPopup
	  },
	  // language=Vue
	  template: `
		<AppLayout
			ref="appLayout"
			:save-locked="!isSaveEnabled"
			:is-edit-mode="isEditMode"
		>
			<template v-slot:left-panel>
				<ImportConfig>
					<ConnectionStep
						:disabled="steps.connection.disabled"
						:connections="appParams.connections"
						ref="connectionsStep"
						@table-selected="onTableSelected"
						@table-deselected="onTableDeselected"
						@validation="onStepValidation('connection', $event)"
					/>
					<DatasetPropertiesStep
						:is-open-initially="isEditMode"
						:disabled="steps.properties.disabled"
						:reserved-names="appParams.reservedNames"
						:name-max-length=230
						ref="propertiesStep"
						@validation="onStepValidation('properties', $event)"
						@properties-changed="onDatasetPropertiesChanged"
						:dataset-source-code="'external_' + sourceCode"
					/>
					<FieldsSettingsStep
						:is-open-initially="isEditMode"
						:disabled="steps.fields.disabled"
						:disabled-elements="steps.fields.disabledElements"
						:source-type="sourceType"
						ref="fieldsStep"
						@validation="onStepValidation('fields', $event)"
						@parsing-options-changed="onParsingOptionsChanged"
						@settings-changed="onFieldsChanged"
						:hint="fieldsSettingsStepHint"
						:sync-fields-props="syncFieldsProps"
						@sync-fields="onSyncFields"
					/>
				</ImportConfig>
			</template>
			<template v-slot:right-panel>
				<ImportPreview 
					:empty-state-text="emptyStateText"
					:is-loading="isLoading"
					:error="previewError"
					:needShowHeadersWithEmptyRows="true"
				/>
			</template>
		</AppLayout>

		<ImportProgressPopup
			v-if="shownPopups.savingProgress"
			:description="importProgressPopupDescription"
		/>

		<ImportSuccessPopup
			v-if="shownPopups.savingSuccess"
			@close="onSuccessPopupClose"
			@click="closeApp"
			:title="importSuccessPopupTitle"
			:description="''"
			:dataset-id="popupParams.savingSuccess.datasetId"
			:dataset-link="popupParams.savingSuccess.link"
			:show-more-button="!isEditMode"
			@one-more-click="reload"
		/>

		<ImportFailurePopup
			v-if="shownPopups.savingFailure"
			@close="closeFailurePopup"
			@click="closeFailurePopup"
			:title="importFailurePopupTitle"
			:description="$Bitrix.Loc.getMessage('DATASET_IMPORT_EXTERNAL_FAILURE_POPUP_DESCRIPTION').replace('[link]', '<a>').replace('[/link]', '</a>')"
		/>

		<GenericPopup
			v-if="shownPopups.loadFailure"
			:title="loadFailurePopupTitle"
			@close="togglePopup('loadFailure')"
		>
			<template v-slot:content>
				<p v-for="message in popupParams.loadFailure.messages">
					{{ message }}
				</p>
			</template>
			<template v-slot:buttons>
				<button @click="togglePopup('loadFailure')" class="ui-btn ui-btn-md ui-btn-primary">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_FILE_ERROR_POPUP_CLOSE') }}</button>
			</template>
		</GenericPopup>

		<SyncFieldsPopup
			v-if="shownPopups.syncFields"
			:is-change="popupParams.syncFields.isChange"
			@close="togglePopup('syncFields', false)"
		>
		</SyncFieldsPopup>

		<GenericPopup
			v-if="shownPopups.fieldsSettingsChanges"
			:title="$Bitrix.Loc.getMessage('DATASET_IMPORT_HAS_CHANGES_POPUP_HEADER')"
			@close="togglePopup('fieldsSettingsChanges', false)"
		>
			<template v-slot:content>
				<p>{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_HAS_CHANGES_POPUP_MESSAGE_MSGVER_1') }}</p>
			</template>
			<template v-slot:buttons>
				<button @click="onConfirmFieldsSettingsChangesPopup" class="ui-btn ui-btn-md ui-btn-success">
					{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_HAS_CHANGES_POPUP_BUTTON_SAVE') }}
				</button>
				<button @click="onCancelFieldsSettingsChangesPopup" class="ui-btn ui-btn-md ui-btn-link">
					{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_HAS_CHANGES_POPUP_BUTTON_CANCEL') }}
				</button>
			</template>
		</GenericPopup>
	`
	};

	/* eslint-disable no-param-reassign */
	class Store {
	  static buildStore(defaultValues) {
	    return ui_vue3_vuex.createStore({
	      state() {
	        return defaultValues;
	      },
	      mutations: {
	        setFileProperties(state, fileProperties) {
	          state.config.fileProperties = fileProperties;
	        },
	        setConnectionProperties(state, connectionProperties) {
	          state.config.connectionProperties = connectionProperties;
	        },
	        setDatasetProperties(state, datasetProperties) {
	          state.config.datasetProperties = datasetProperties;
	        },
	        toggleRowVisibility(state, rowIndex) {
	          state.config.fieldsSettings[rowIndex].visible = !state.config.fieldsSettings[rowIndex].visible;
	        },
	        setAllRowsVisible(state) {
	          state.config.fieldsSettings = state.config.fieldsSettings.map(field => {
	            field.visible = true;
	            return field;
	          });
	        },
	        setAllRowsInvisible(state) {
	          state.config.fieldsSettings = state.config.fieldsSettings.map(field => {
	            field.visible = false;
	            return field;
	          });
	        },
	        setFieldRowSettings(state, payload) {
	          state.config.fieldsSettings[payload.index] = payload.settings;
	        },
	        setDataFormats(state, formats) {
	          state.config.dataFormats = formats;
	        },
	        setPreviewData(state, data) {
	          state.previewData.rows = data;
	        },
	        setFieldsSettings(state, settings) {
	          state.config.fieldsSettings = settings;
	        }
	      },
	      getters: {
	        isEditMode(state) {
	          return state.config.datasetProperties.id > 0;
	        },
	        areAllRowsVisible(state) {
	          return state.config.fieldsSettings.filter(field => !field.visible).length === 0;
	        },
	        areNoRowsVisible(state) {
	          return state.config.fieldsSettings.filter(field => field.visible).length === 0;
	        },
	        areSomeRowsVisible(state, getters) {
	          return !getters.areAllRowsVisible && !getters.areNoRowsVisible;
	        },
	        columnVisibilityMap(state) {
	          const map = [];
	          state.config.fieldsSettings.forEach(field => {
	            map.push(Boolean(field.visible));
	          });
	          return map;
	        },
	        previewHeaders(state) {
	          return state.config.fieldsSettings.map(item => item.name);
	        },
	        hasData(state) {
	          var _state$previewData, _state$previewData$ro;
	          return ((_state$previewData = state.previewData) == null ? void 0 : (_state$previewData$ro = _state$previewData.rows) == null ? void 0 : _state$previewData$ro.length) > 0;
	        },
	        connectionProperties(state) {
	          var _state$config;
	          return (_state$config = state.config) == null ? void 0 : _state$config.connectionProperties;
	        },
	        datasetProperties(state) {
	          var _state$config2;
	          return (_state$config2 = state.config) == null ? void 0 : _state$config2.datasetProperties;
	        }
	      }
	    });
	  }
	}

	const codeMap = {
	  csv: CsvApp,
	  '1c': ExternalConnectionApp,
	  rest: ExternalConnectionApp
	};
	class AppFactory {
	  static getApp(code, stateOptions = {}, appParams = {}) {
	    const defaultStructure = {
	      previewData: {},
	      config: {
	        fileProperties: {},
	        dataFormats: {},
	        datasetProperties: {},
	        fieldsSettings: []
	      }
	    };
	    const state = BX.util.objectMerge(defaultStructure, stateOptions);
	    let app = null;
	    const appComponent = codeMap[code];
	    if (appComponent) {
	      app = ui_vue3.BitrixVue.createApp({
	        name: 'DatasetImport',
	        data() {
	          return {
	            appParams
	          };
	        },
	        components: {
	          appComponent
	        },
	        computed: {
	          componentName() {
	            return appComponent;
	          }
	        },
	        // language=Vue
	        template: `
					<component :is="componentName" :app-params="appParams" />
				`
	      });
	    }
	    if (app) {
	      const store = Store.buildStore(state);
	      app.use(store);
	    }
	    return app;
	  }
	}

	class Slider {
	  static open(sourceId, datasetId = 0, connection = {}) {
	    const componentLink = '/bitrix/components/bitrix/biconnector.dataset.import/slider.php';
	    const sliderLink = new main_core.Uri(componentLink);
	    sliderLink.setQueryParam('sourceId', sourceId);
	    if (datasetId) {
	      sliderLink.setQueryParam('datasetId', datasetId);
	    }
	    if (Object.keys(connection).length > 0) {
	      sliderLink.setQueryParam('connection', connection);
	    }
	    const options = {
	      allowChangeHistory: false,
	      cacheable: false,
	      customLeftBoundary: 0
	    };
	    ui_sidepanel.SidePanel.Instance.open(sliderLink.toString(), options);
	  }
	}

	exports.AppFactory = AppFactory;
	exports.Slider = Slider;

}((this.BX.BIConnector.DatasetImport = this.BX.BIConnector.DatasetImport || {}),BX.BIConnector.DatasetImport,BX,BX.UI,BX.UI,BX,BX.UI.SidePanel,BX,BX.UI,BX.UI.Uploader,BX,BX.UI,BX.Main,BX.UI.Analytics,BX.UI,BX.Vue3,BX.UI.EntitySelector,BX.UI.IconSet,BX.Vue3.Directives,BX.Event,BX.Vue3.Vuex,BX,BX));
//# sourceMappingURL=dataset-import.bundle.js.map
