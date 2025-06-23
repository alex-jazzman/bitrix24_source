/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports,main_popup,ui_iconSet_api_vue,ui_hint,ui_entitySelector,ui_iconSet_actions,humanresources_companyStructure_utils,main_core) {
	'use strict';

	const POPUP_CONTAINER_PREFIX = '#popup-window-content-';
	const BasePopup = {
	  name: 'BasePopup',
	  emits: ['close'],
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    config: {
	      type: Object,
	      required: false,
	      default: {}
	    }
	  },
	  computed: {
	    popupContainer() {
	      return `${POPUP_CONTAINER_PREFIX}${this.id}`;
	    }
	  },
	  created() {
	    this.instance = this.getPopupInstance();
	    this.instance.show();
	  },
	  mounted() {
	    this.instance.adjustPosition({
	      forceBindPosition: true,
	      position: this.getPopupConfig().bindOptions.position
	    });
	  },
	  beforeUnmount() {
	    if (!this.instance) {
	      return;
	    }
	    this.closePopup();
	  },
	  methods: {
	    getPopupInstance() {
	      if (!this.instance) {
	        var _PopupManager$getPopu;
	        (_PopupManager$getPopu = main_popup.PopupManager.getPopupById(this.id)) == null ? void 0 : _PopupManager$getPopu.destroy();
	        const config = this.getPopupConfig();
	        this.instance = new main_popup.Popup(config);
	        if (this.config.angleOffset) {
	          this.instance.setAngle({
	            offset: this.config.angleOffset
	          });
	        }
	      }
	      return this.instance;
	    },
	    getDefaultConfig() {
	      return {
	        id: this.id,
	        className: 'hr-structure-components-base-popup',
	        autoHide: true,
	        animation: 'fading-slide',
	        bindOptions: {
	          position: 'bottom'
	        },
	        cacheable: false,
	        events: {
	          onPopupClose: () => this.closePopup(),
	          onPopupShow: async () => {
	            const container = this.instance.getPopupContainer();
	            await Promise.resolve();
	            const {
	              top
	            } = container.getBoundingClientRect();
	            const offset = top + container.offsetHeight - document.body.offsetHeight;
	            if (offset > 0) {
	              const margin = 5;
	              this.instance.setMaxHeight(container.offsetHeight - offset - margin);
	            }
	          }
	        }
	      };
	    },
	    getPopupConfig() {
	      var _this$config$offsetTo, _this$config$bindOpti;
	      const defaultConfig = this.getDefaultConfig();
	      const modifiedOptions = {};
	      const defaultClassName = defaultConfig.className;
	      if (this.config.className) {
	        modifiedOptions.className = `${defaultClassName} ${this.config.className}`;
	      }
	      const offsetTop = (_this$config$offsetTo = this.config.offsetTop) != null ? _this$config$offsetTo : defaultConfig.offsetTop;
	      if (((_this$config$bindOpti = this.config.bindOptions) == null ? void 0 : _this$config$bindOpti.position) === 'top' && main_core.Type.isNumber(this.config.offsetTop)) {
	        modifiedOptions.offsetTop = offsetTop - 10;
	      }
	      return {
	        ...defaultConfig,
	        ...this.config,
	        ...modifiedOptions
	      };
	    },
	    closePopup() {
	      this.$emit('close');
	      this.instance.destroy();
	      this.instance = null;
	    },
	    enableAutoHide() {
	      this.getPopupInstance().setAutoHide(true);
	    },
	    disableAutoHide() {
	      this.getPopupInstance().setAutoHide(false);
	    },
	    adjustPosition() {
	      this.getPopupInstance().adjustPosition({
	        forceBindPosition: true,
	        position: this.getPopupConfig().bindOptions.position
	      });
	    }
	  },
	  template: `
		<Teleport :to="popupContainer">
			<slot
				:adjustPosition="adjustPosition"
				:enableAutoHide="enableAutoHide"
				:disableAutoHide="disableAutoHide"
				:closePopup="closePopup"
			></slot>
		</Teleport>
	`
	};

	const BaseActionMenuPropsMixin = {
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    },
	    items: {
	      type: Array,
	      required: true,
	      default: []
	    },
	    titleBar: {
	      type: String,
	      required: false
	    },
	    containerDataTestId: {
	      type: String,
	      required: false
	    }
	  }
	};
	const BaseActionMenu = {
	  name: 'BaseActionMenu',
	  mixins: [BaseActionMenuPropsMixin],
	  props: {
	    width: {
	      type: Number,
	      required: false,
	      default: 260
	    },
	    delimiter: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    angleOffset: {
	      type: Number,
	      required: false,
	      default: 0
	    },
	    titleBar: {
	      type: String,
	      required: false
	    },
	    className: {
	      type: String,
	      required: false
	    }
	  },
	  emits: ['action', 'close'],
	  components: {
	    BasePopup
	  },
	  computed: {
	    popupConfig() {
	      const options = {
	        width: this.width,
	        bindElement: this.bindElement,
	        borderRadius: 12,
	        contentNoPaddings: true,
	        contentPadding: 0,
	        padding: 0,
	        offsetTop: 4
	      };
	      if (this.angleOffset >= 0) {
	        options.angleOffset = this.angleOffset;
	      }
	      if (this.titleBar) {
	        options.titleBar = this.titleBar;
	      }
	      if (this.className) {
	        options.className = this.className;
	      }
	      return options;
	    }
	  },
	  methods: {
	    onItemClick(event, item, closePopup) {
	      var _item$disabled;
	      event.stopPropagation();
	      if ((_item$disabled = item.disabled) != null ? _item$disabled : false) {
	        return;
	      }
	      this.$emit('action', item.id);
	      closePopup();
	    },
	    close() {
	      this.$emit('close');
	    }
	  },
	  template: `
		<BasePopup
			:config="popupConfig"
			v-slot="{closePopup}"
			:id="id"
			@close="close"
		>
			<div
				class="hr-structure-components-action-menu-container"
				:data-test-id="containerDataTestId"
			>
			<template v-for="(item, index) in items">
				<div
					class="hr-structure-components-action-menu-item-wrapper"
					:class="{ '--disabled': item.disabled ?? false }"
					@click="onItemClick($event, item, closePopup)"
				>
					<slot :item="item"></slot>
				</div>
				<span v-if="delimiter && index < items.length - 1"
					class="hr-structure-action-popup-menu-item-delimiter"
				></span>
			</template>
			</div>
		</BasePopup>
	`
	};

	const RouteActionMenuItem = {
	  name: 'RouteActionMenuItem',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    title: {
	      type: String,
	      required: true
	    },
	    description: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    imageClass: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    bIcon: {
	      type: Object,
	      required: false,
	      default: null
	    },
	    dataTestId: {
	      type: String,
	      required: false
	    }
	  },
	  methods: {
	    getColor(bIcon) {
	      var _bIcon$color;
	      if (bIcon.colorTokenName) {
	        return humanresources_companyStructure_utils.getColorCode(bIcon.colorTokenName);
	      }
	      return (_bIcon$color = bIcon.color) != null ? _bIcon$color : 'black';
	    }
	  },
	  template: `
		<div
			class="hr-structure-route-action-popup-menu-item"
			:data-test-id="dataTestId"
		>
			<div class="hr-structure-route-action-popup-menu-item__content">
				<BIcon
					v-if="bIcon"
					:name="bIcon.name"
					:size="bIcon.size || 20"
					:color="getColor(bIcon)"
				/>
				<div
					v-if="!bIcon && imageClass"
					class="hr-structure-route-action-popup-menu-item__content-icon-container"

				>
					<div
						class="hr-structure-route-action-popup-menu-item__content-icon"
						:class="imageClass"
					/>
				</div>
				<div class="hr-structure-route-action-popup-menu-item__content-text-container">
					<div
						class="hr-structure-route-action-popup-menu-item__content-title"
					>
						{{ this.title }}
					</div>
					<div class="hr-structure-route-action-popup-menu-item__content-description">{{ this.description }}</div>
				</div>
			</div>
		</div>
	`
	};

	const RouteActionMenu = {
	  name: 'RouteActionMenu',
	  mixins: [BaseActionMenuPropsMixin],
	  components: {
	    BaseActionMenu,
	    RouteActionMenuItem
	  },
	  template: `
		<BaseActionMenu
			:id="id"
			:items="items"
			:bindElement="bindElement"
			:containerDataTestId="containerDataTestId"
			:width="260"
			v-slot="{item}"
			@close="this.$emit('close')"
		>
			<RouteActionMenuItem
				:id="item.id"
				:title="item.title"
				:description="item.description"
				:imageClass="item.imageClass"
				:dataTestId="item.dataTestId"
				:bIcon="item.bIcon"
			/>
		</BaseActionMenu>
	`
	};

	const SupportedColors = new Set(['red']);
	const ActionMenuItem = {
	  name: 'ActionMenuItem',
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    title: {
	      type: String,
	      required: true
	    },
	    imageClass: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    color: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    dataTestId: {
	      type: String,
	      required: false
	    }
	  },
	  computed: {
	    colorClass() {
	      if (SupportedColors.has(this.color)) {
	        return `--${this.color}`;
	      }
	      return '';
	    }
	  },
	  template: `
		<div
			class="hr-structure-action-popup-menu-item"
			:data-test-id="dataTestId"
		>
			<div class="hr-structure-action-popup-menu-item__content">
				<div
					class="hr-structure-action-popup-menu-item__content-title"
					:class="[imageClass, colorClass]"
				>
					{{ title }}
				</div>
			</div>
		</div>
	`
	};

	const ActionMenu = {
	  name: 'ActionMenu',
	  mixins: [BaseActionMenuPropsMixin],
	  components: {
	    BaseActionMenu,
	    ActionMenuItem
	  },
	  template: `
		<BaseActionMenu
			:id="id"
			:items="items"
			:bindElement="bindElement"
			:containerDataTestId="containerDataTestId"
			:width="260"
			:delimiter="false"
			v-slot="{item}"
			@close="this.$emit('close')"
		>
			<ActionMenuItem
				:id="item.id"
				:title="item.title"
				:imageClass="item.imageClass"
				:color="item.color"
				:dataTestId="item.dataTestId"
				@click="this.$emit('action', item.id)"
			/>
		</BaseActionMenu>
	`
	};

	const UserActionMenuItem = {
	  name: 'UserActionMenuItem',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    id: {
	      type: Number,
	      required: true
	    },
	    name: {
	      type: String,
	      required: true
	    },
	    avatar: {
	      type: String,
	      required: false,
	      default: null
	    },
	    workPosition: {
	      type: String,
	      required: false,
	      default: null
	    },
	    dataTestId: {
	      type: String,
	      required: false
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<div
			class="hr-structure-route-action-popup-menu-item"
			:data-test-id="dataTestId"
		>
			<div class="hr-structure-route-action-popup-menu-item__content">
				<img
					:src="!this.avatar ? '/bitrix/js/humanresources/company-structure/org-chart/src/images/default-user.svg' : encodeURI(this.avatar)"
					class="humanresources-tree__node_avatar --head"
				 	alt=""
				/>
				<div class="hr-structure-route-action-popup-menu-item__content-text-container">
					<span
						class="humanresources-tree__node_head-name"
						:title="this.name"
					>
						{{ this.name }}
					</span>
					<span class="humanresources-tree__node_head-position">{{ this.workPosition }}</span>
				</div>
			</div>
		</div>
	`
	};

	const UserListActionMenu = {
	  name: 'UserListActionMenu',
	  mixins: [BaseActionMenuPropsMixin],
	  components: {
	    BaseActionMenu,
	    UserActionMenuItem
	  },
	  methods: {
	    openUserUrl(url) {
	      if (!url) {
	        return;
	      }
	      BX.SidePanel.Instance.open(url, {
	        cacheable: false
	      });
	    }
	  },
	  template: `
		<BaseActionMenu 
			:id="id"
			className="hr-user-list-action-menu"
			:items="items" 
			:bindElement="bindElement"
			:width="260"
			:delimiter="false"
			:titleBar="titleBar"
			:containerDataTestId="containerDataTestId"
			:angleOffset="35"
			v-slot="{item}"
			@close="this.$emit('close')"
		>
			<UserActionMenuItem
				:id="item.id" 
				:name="item.name"
				:avatar="item.avatar"
				:workPosition="item.workPosition"
				:color="item.color"
				:dataTestId="item.dataTestId"
				@click="this.openUserUrl(item.url)"
			/>
		</BaseActionMenu>
	`
	};

	const DefaultPopupLayout = {
	  name: 'DefaultPopupLayout',
	  template: `
		<div
			v-if="$slots.content"
			class="hr-default-popup-layout__content"
		>
			<slot name="content"></slot>
		</div>
	`
	};

	let _ = t => t,
	  _t;
	const ConfirmationPopup = {
	  name: 'ConfirmationPopup',
	  emits: ['close', 'action'],
	  components: {
	    BasePopup,
	    DefaultLayoutPopup: DefaultPopupLayout
	  },
	  props: {
	    title: {
	      type: String,
	      required: false,
	      default: null
	    },
	    withoutTitleBar: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    description: {
	      type: String,
	      required: false
	    },
	    onlyConfirmButtonMode: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    confirmBtnText: {
	      type: String,
	      required: false,
	      default: null
	    },
	    showActionButtonLoader: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    lockActionButton: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    cancelBtnText: {
	      type: String,
	      required: false,
	      default: null
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: false,
	      default: null
	    },
	    width: {
	      type: Number,
	      required: false,
	      default: 300
	    },
	    confirmButtonClass: {
	      type: String,
	      required: false,
	      default: 'ui-btn-primary'
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    closeAction() {
	      if (this.showActionButtonLoader) {
	        return;
	      }
	      this.$emit('close');
	    },
	    performAction() {
	      if (this.lockActionButton || this.showActionButtonLoader) {
	        return;
	      }
	      this.$emit('action');
	    },
	    getTitleBar() {
	      var _this$title;
	      const {
	        root,
	        closeButton
	      } = main_core.Tag.render(_t || (_t = _`
				<div class="hr-confirmation-popup__title-bar">
					<span class="hr-confirmation-popup__title-bar-text">
						${0}
					</span>
					<div
						class="ui-icon-set --cross-25 hr-confirmation-popup__title-bar-close-button"
						ref="closeButton"
					>
					</div>
				</div>
			`), (_this$title = this.title) != null ? _this$title : '');
	      main_core.Event.bind(closeButton, 'click', () => {
	        this.closeAction();
	      });
	      return {
	        content: root
	      };
	    }
	  },
	  computed: {
	    popupConfig() {
	      return {
	        width: this.width,
	        bindElement: this.bindElement,
	        borderRadius: 12,
	        overlay: this.bindElement === null ? {
	          opacity: 40
	        } : false,
	        contentNoPaddings: true,
	        contentPadding: 0,
	        padding: 0,
	        className: 'hr_structure_confirmation_popup',
	        autoHide: false,
	        draggable: true,
	        titleBar: this.withoutTitleBar ? null : this.getTitleBar()
	      };
	    }
	  },
	  template: `
		<BasePopup
			:id="'id'"
			:config="popupConfig"
		>
			<template v-slot="{ closePopup }">
				<DefaultLayoutPopup>
					<template v-slot:content>
						<div
							class="hr-confirmation-popup__content-container"
							:class="{ '--without-title-bar': withoutTitleBar }"
						>
							<div v-if="$slots.content">
								<slot name="content"></slot>
							</div>
							<div v-else class="hr-confirmation-popup__content-text">
								{{ description }}
							</div>
						</div>
						<div class="hr-confirmation-popup__buttons-container">
							<button
								class="ui-btn ui-btn-round"
								:class="{ 
									'ui-btn-wait': showActionButtonLoader, 
									'ui-btn-disabled': lockActionButton, 
									[confirmButtonClass]: true
								}"
								@click="performAction"
							>
								{{ confirmBtnText ?? '' }}
							</button>
							<button
								v-if="!onlyConfirmButtonMode"
								class="ui-btn ui-btn-light-border ui-btn-round"
								@click="closeAction"
							>
								{{ cancelBtnText ?? loc('HUMANRESOURCES_COMPANY_STRUCTURE_STRUCTURE_COMPONENTS_POPUP_CONFIRMATION_POPUP_CANCEL_BUTTON') }}
							</button>
						</div>
					</template>
				</DefaultLayoutPopup>
			</template>
		</BasePopup>
	`
	};

	const Hint = {
	  mounted(el) {
	    let hint = null;
	    main_core.Event.bind(el, 'mouseenter', () => {
	      if (el.scrollWidth === el.offsetWidth) {
	        return;
	      }
	      hint = main_core.Reflection.getClass('BX.UI.Hint').createInstance({
	        popupParameters: {
	          cacheable: false,
	          angle: {
	            offset: 0
	          },
	          offsetLeft: el.getBoundingClientRect().width / 2
	        }
	      });
	      hint.show(el, main_core.Text.encode(el.textContent));
	    });
	    main_core.Event.bind(el, 'mouseleave', () => {
	      var _hint;
	      (_hint = hint) == null ? void 0 : _hint.hide();
	    });
	  }
	};

	let _$1 = t => t,
	  _t$1;
	class BaseManagementDialogHeader extends ui_entitySelector.BaseHeader {
	  render() {
	    return main_core.Tag.render(_t$1 || (_t$1 = _$1``));
	  }
	}

	let _$2 = t => t,
	  _t$2;
	class BaseManagementDialogFooter extends ui_entitySelector.BaseFooter {
	  render() {
	    return main_core.Tag.render(_t$2 || (_t$2 = _$2``));
	  }
	}

	// eslint-disable-next-line no-unused-vars
	const ManagementDialog = {
	  name: 'ManagementDialog',
	  emits: ['managementDialogAction', 'close'],
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    title: {
	      type: String,
	      required: false
	    },
	    description: {
	      type: String,
	      required: false
	    },
	    entities: {
	      type: Array,
	      required: true
	    },
	    isActive: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    hiddenItemsIds: {
	      type: Array,
	      required: false,
	      default: []
	    },
	    confirmButtonText: {
	      type: String,
	      required: false
	    },
	    /** @var { ManagementDialogDataTestIds } dataTestIds */
	    dataTestIds: {
	      type: Object,
	      required: false,
	      default: {}
	    },
	    /** @var TabOptions */
	    recentTabOptions: {
	      type: Object,
	      required: false,
	      default: {}
	    }
	  },
	  data() {
	    return {
	      headerContainer: HTMLElement | null,
	      footerContainer: HTMLElement | null,
	      selectedItemsCount: 0
	    };
	  },
	  created() {
	    this.instance = this.getDialogInstance();
	    this.instance.show();
	  },
	  beforeUnmount() {
	    if (!this.instance || !this.instance.isOpen()) {
	      return;
	    }
	    this.instance.destroy();
	  },
	  methods: {
	    getDialogInstance() {
	      var _Dialog$getById;
	      if (this.instance) {
	        return this.instance;
	      }
	      (_Dialog$getById = ui_entitySelector.Dialog.getById(this.id)) == null ? void 0 : _Dialog$getById.destroy();
	      const config = this.getDialogConfig();
	      this.instance = new ui_entitySelector.Dialog(config);
	      this.headerContainer = this.instance.getHeader().getContainer();
	      this.footerContainer = this.instance.getFooter().getContainer();
	      if (this.dataTestIds.containerDataTestId) {
	        main_core.Dom.attr(this.instance.getContainer(), 'data-test-id', this.dataTestIds.containerDataTestId);
	      }
	      return this.instance;
	    },
	    getDialogConfig() {
	      return {
	        id: this.id,
	        width: 400,
	        height: 511,
	        multiple: true,
	        cacheable: false,
	        dropdownMode: true,
	        compactView: false,
	        enableSearch: true,
	        showAvatars: true,
	        autoHide: false,
	        popupOptions: {
	          overlay: {
	            opacity: 40
	          }
	        },
	        header: BaseManagementDialogHeader,
	        footer: BaseManagementDialogFooter,
	        recentTabOptions: this.recentTabOptions,
	        entities: this.entities,
	        events: {
	          'Item:onSelect': () => {
	            this.selectedItemsCount++;
	          },
	          'Item:onDeselect': () => {
	            this.selectedItemsCount--;
	          },
	          onLoad: event => {
	            const dialog = event.getTarget();
	            this.toggleItems(dialog);
	          },
	          'SearchTab:onLoad': event => {
	            const dialog = event.getTarget();
	            this.toggleItems(dialog);
	          },
	          onDestroy: () => {
	            this.instance = null;
	            this.$emit('close');
	          },
	          onHide: () => {
	            this.$emit('close');
	          }
	        }
	      };
	    },
	    onActionItemClick() {
	      var _this$instance$getSel;
	      if (this.isActive || !this.selectedItemsCount) {
	        return;
	      }
	      const selectedItems = (_this$instance$getSel = this.instance.getSelectedItems()) != null ? _this$instance$getSel : [];
	      this.$emit('managementDialogAction', selectedItems);
	    },
	    closeDialog() {
	      this.$emit('close');
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    toggleItems(dialog) {
	      if (this.hiddenItemsIds.length === 0) {
	        return;
	      }
	      const items = dialog.getItems();
	      items.forEach(item => {
	        const hidden = this.hiddenItemsIds.includes(item.id);
	        item.setHidden(hidden);
	      });
	    }
	  },
	  template: `
		<div>
			<teleport :to="headerContainer">
				<div class="hr-management-dialog__header_container">
					<div class="hr-management-dialog__header_content-container">
						<div class="hr-management-dialog__header_title">{{title}}</div>
						<div v-if="description" class="hr-management-dialog__header_subtitle">{{description}}</div>
					</div>
					<div
						class="ui-icon-set --cross-40 hr-management-dialog__header_close-button"
						@click="closeDialog"
						:data-test-id="dataTestIds.closeButtonDataTestId"
					/>
				</div>
			</teleport>
			<teleport :to="footerContainer">
				<div class="hr-management-dialog__footer_container">
					<button
						class="ui-btn ui-btn ui-btn-sm ui-btn-primary ui-btn-round"
						:class="{ 'ui-btn-wait': isActive, 'ui-btn-disabled': !selectedItemsCount, }"
						@click="onActionItemClick"
						:data-test-id="dataTestIds.confirmButtonDataTestId"
					>
						{{ confirmButtonText ?? loc('HUMANRESOURCES_STRUCTURE_COMPONENTS_MANAGEMENT_DIALOG_CONFIRM_BUTTON') }}
					</button>
					<button
						class="ui-btn ui-btn ui-btn-sm ui-btn-light-border ui-btn-round"
						@click="closeDialog"
						:data-test-id="dataTestIds.cancelButtonDataTestId"
					>
						{{ loc('HUMANRESOURCES_STRUCTURE_COMPONENTS_MANAGEMENT_DIALOG_CANCEL_BUTTON') }}
					</button>
				</div>
			</teleport>
		</div>
	`
	};

	const getChatDialogEntity = function () {
	  return {
	    id: 'im-chat-only',
	    dynamicLoad: true,
	    dynamicSearch: true,
	    filters: [{
	      id: 'im.chatOnlyDataFilter',
	      options: {
	        includeSubtitle: true
	      }
	    }],
	    tagOptions: {
	      default: {
	        textColor: '#11A9D9',
	        bgColor: '#D3F4FF',
	        avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-chat-tag.svg'
	      }
	    },
	    itemOptions: {
	      default: {
	        avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-chat-item.svg'
	      }
	    },
	    options: {
	      searchChatTypes: ['O', 'C']
	    }
	  };
	};
	const getChannelDialogEntity = function () {
	  return {
	    id: 'im-chat-only',
	    filters: [{
	      id: 'im.chatOnlyDataFilter',
	      options: {
	        includeSubtitle: true
	      }
	    }],
	    dynamicLoad: true,
	    dynamicSearch: true,
	    tagOptions: {
	      default: {
	        textColor: '#8DBB00',
	        bgColor: '#EAF6C3',
	        avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-channel-tag.svg',
	        avatarOptions: {
	          borderRadius: '50%'
	        }
	      }
	    },
	    itemOptions: {
	      default: {
	        avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-channel-item.svg',
	        avatarOptions: {
	          borderRadius: '6px'
	        }
	      }
	    },
	    options: {
	      searchChatTypes: ['N', 'J']
	    }
	  };
	};
	const ChatTypeDict = Object.freeze({
	  chat: 'chat',
	  channel: 'channel'
	});
	const getChatRecentTabOptions = function (entityType, chatType) {
	  let title = '';
	  if (chatType === ChatTypeDict.chat) {
	    title = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHAT_TEAM_STUB_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHAT_DEPARTMENT_STUB_TITLE');
	  } else {
	    title = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHANNEL_TEAM_STUB_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHANNEL_DEPARTMENT_STUB_TITLE');
	  }
	  return {
	    visible: false,
	    stub: true,
	    stubOptions: {
	      title
	    }
	  };
	};

	exports.BasePopup = BasePopup;
	exports.BaseActionMenu = BaseActionMenu;
	exports.RouteActionMenu = RouteActionMenu;
	exports.ActionMenu = ActionMenu;
	exports.UserListActionMenu = UserListActionMenu;
	exports.ConfirmationPopup = ConfirmationPopup;
	exports.Hint = Hint;
	exports.ManagementDialog = ManagementDialog;
	exports.getChatDialogEntity = getChatDialogEntity;
	exports.getChannelDialogEntity = getChannelDialogEntity;
	exports.getChatRecentTabOptions = getChatRecentTabOptions;
	exports.ChatTypeDict = ChatTypeDict;

}((this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}),BX.Main,BX.UI.IconSet,BX,BX.UI.EntitySelector,BX,BX.Humanresources.CompanyStructure,BX));
//# sourceMappingURL=structure-components.bundle.js.map
