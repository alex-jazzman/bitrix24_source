/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
this.BX.OpenLines.v2.Component = this.BX.OpenLines.v2.Component || {};
(function (exports,imopenlines_v2_css_tokens,im_v2_lib_logger,im_v2_component_dialog_chat,imopenlines_v2_lib_queue,main_popup,ui_entitySelector,im_v2_component_search,im_public,im_v2_component_elements_button,im_v2_lib_layout,im_v2_component_content_elements,im_v2_component_textarea,ui_vue3_vuex,ui_iconSet_api_vue,im_v2_component_elements_loader,im_v2_const,im_v2_component_elements_popup,ui_iconSet_api_core,main_core,im_v2_application_core,im_v2_lib_menu,imopenlines_v2_provider_service,imopenlines_v2_const,im_v2_lib_theme) {
	'use strict';

	const SEARCH_ENTITY_ID = 'user';
	const ChatTransferContent = {
	  name: 'ChatTransferContent',
	  components: {
	    ChatButton: im_v2_component_elements_button.ChatButton,
	    ChatSearch: im_v2_component_search.AddToChatSearch
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      searchQuery: '',
	      selectedItems: new Set()
	    };
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements_button.ButtonSize,
	    ButtonColor: () => im_v2_component_elements_button.ButtonColor
	  },
	  created() {
	    this.membersSelector = this.getTagSelector();
	  },
	  mounted() {
	    this.membersSelector.renderTo(this.$refs['tag-selector']);
	    this.membersSelector.focusTextBox();
	  },
	  methods: {
	    getTagSelector() {
	      return new ui_entitySelector.TagSelector({
	        maxHeight: 150,
	        showAddButton: false,
	        showTextBox: true,
	        showCreateButton: false,
	        events: {
	          onAfterTagAdd: event => {
	            const {
	              tag
	            } = event.getData();
	            this.selectedItems.add(tag.id);
	          },
	          onAfterTagRemove: event => {
	            const {
	              tag
	            } = event.getData();
	            this.selectedItems.delete(tag.id);
	          },
	          onInput: () => {
	            this.searchQuery = this.membersSelector.getTextBoxValue();
	          }
	        }
	      });
	    },
	    onSelectItem(event) {
	      const {
	        dialogId,
	        nativeEvent
	      } = event;
	      if (this.selectedItems.has(dialogId)) {
	        const tag = {
	          id: dialogId,
	          entityId: SEARCH_ENTITY_ID
	        };
	        this.membersSelector.removeTag(tag);
	      } else {
	        this.membersSelector.removeTags();
	        const newTag = this.getTagsByDialogId(dialogId);
	        this.membersSelector.addTag(newTag);
	      }
	      this.membersSelector.clearTextBox();
	      if (!nativeEvent.altKey) {
	        this.searchQuery = '';
	      }
	    },
	    getTagsByDialogId(dialogId) {
	      const user = this.$store.getters['users/get'](dialogId, true);
	      return {
	        id: dialogId,
	        entityId: SEARCH_ENTITY_ID,
	        title: user.name,
	        avatar: user.avatar.length > 0 ? user.avatar : null
	      };
	    },
	    onChatTransfer() {
	      const newOperatorId = [...this.selectedItems][0];
	      return this.getTransferService().chatTransfer(this.dialogId, newOperatorId);
	    },
	    getTransferService() {
	      if (!this.transferService) {
	        this.transferService = new imopenlines_v2_provider_service.TransferService();
	      }
	      return this.transferService;
	    },
	    loc(key) {
	      return this.$Bitrix.Loc.getMessage(key);
	    }
	  },
	  template: `
		<div class="bx-imol-entity-selector-chat-transfer__container">
			<div class="bx-imol-entity-selector-chat-transfer__input" ref="tag-selector"></div>
			<div class="bx-imol-entity-selector-chat-transfer__search-result-container">
				<ChatSearch
					:query="searchQuery"
					:dialogId="dialogId"
					:selectedItems="[...selectedItems]"
					@clickItem="onSelectItem"
				/>
			</div>
			<div class="bx-imol-entity-selector-chat-transfer__buttons">
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.Primary"
					:isRounded="true"
					:text="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
					:isDisabled="selectedItems.size === 0"
					@click="onChatTransfer"
				/>
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.LightBorder"
					:isRounded="true"
					:text="loc('IMOL_ENTITY_SELECTOR_CHAT_TRANSFER_CANCEL_BUTTON')"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID = 'imol-chat-transfer-popup';

	// @vue/component
	const ChatTransfer = {
	  name: 'ChatTransfer',
	  components: {
	    MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
	    ChatTransferContent
	  },
	  props: {
	    showPopup: {
	      type: Boolean,
	      required: true
	    },
	    bindElement: {
	      type: Object,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    },
	    popupConfig: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  computed: {
	    POPUP_ID: () => POPUP_ID,
	    config() {
	      return {
	        titleBar: this.$Bitrix.Loc.getMessage('IMOL_CONTENT_BUTTON_TRANSFER'),
	        closeIcon: true,
	        bindElement: this.bindElement,
	        offsetTop: this.popupConfig.offsetTop,
	        offsetLeft: this.popupConfig.offsetLeft,
	        padding: 0,
	        contentPadding: 0,
	        contentBackground: '#fff',
	        className: 'bx-imol-entity-selector-chat-transfer__container'
	      };
	    }
	  },
	  template: `
		<MessengerPopup
			v-if="showPopup"
			:config="config"
			@close="$emit('close')"
			:id="POPUP_ID"
		>
			<ChatTransferContent :dialogId="dialogId" @close="$emit('close')"/>
		</MessengerPopup>
	`
	};

	const BUTTON_COLOR = '#eef0f2';
	const BUTTON_COLOR_TEXT = '#535658';
	const BUTTON_COLOR_HOVER = '#dfe0e3';

	// @vue/component
	const ChatControlPanel = {
	  name: 'ChatControlPanel',
	  components: {
	    ChatButton: im_v2_component_elements_button.ChatButton,
	    ChatTransfer
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    isQueueTypeAll: {
	      type: Boolean,
	      required: true
	    }
	  },
	  data() {
	    return {
	      showChatTransferPopup: false
	    };
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements_button.ButtonSize,
	    ButtonColor: () => im_v2_component_elements_button.ButtonColor,
	    buttonColorScheme() {
	      return {
	        backgroundColor: BUTTON_COLOR,
	        borderColor: 'transparent',
	        iconColor: BUTTON_COLOR,
	        textColor: BUTTON_COLOR_TEXT,
	        hoverColor: BUTTON_COLOR_HOVER
	      };
	    }
	  },
	  methods: {
	    replyDialog() {
	      return this.getAnswerService().requestAnswer(this.dialogId);
	    },
	    skipDialog() {
	      return this.getSkipService().requestSkip(this.dialogId);
	    },
	    getAnswerService() {
	      if (!this.answerService) {
	        this.answerService = new imopenlines_v2_provider_service.AnswerService();
	      }
	      return this.answerService;
	    },
	    getSkipService() {
	      if (!this.skipService) {
	        this.skipService = new imopenlines_v2_provider_service.SkipService();
	      }
	      return this.skipService;
	    },
	    openChatTransferPopup() {
	      this.showChatTransferPopup = true;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<ul class="bx-imol-textarea_join-panel-list-button">
			<li class="bx-imol-textarea_join-panel-item-button">
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.Success"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_ANSWER')"
					@click="replyDialog"
				/>
			</li>
			<li v-if="!isQueueTypeAll" class="bx-imol-textarea_join-panel-item-button">
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.Danger"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_SKIP')"
					@click="skipDialog"
				/>
			</li>
			<li class="bx-imol-textarea_join-panel-item-button" ref="transfer-chat">
				<ChatButton
					:size="ButtonSize.L"
					:customColorScheme="buttonColorScheme"
					:text="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
					@click="openChatTransferPopup"
				/>
			</li>
		</ul>
		<ChatTransfer
			:bindElement="$refs['transfer-chat'] || {}"
			:dialogId="dialogId"
			:showPopup="showChatTransferPopup"
			:popupConfig="{offsetTop: -700, offsetLeft: 0}"
			@close="showChatTransferPopup = false"
		/>

	`
	};

	// @vue/component
	const JoinPanel = {
	  name: 'JoinPanel',
	  components: {
	    ChatButton: im_v2_component_elements_button.ChatButton
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    isNewSession: {
	      type: Boolean,
	      required: true
	    },
	    isClosed: {
	      type: Boolean,
	      required: true
	    }
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements_button.ButtonSize,
	    ButtonColor: () => im_v2_component_elements_button.ButtonColor,
	    textStartJoinButtons() {
	      return this.isClosed ? this.loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_START') : this.loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_JOIN_BUTTON');
	    }
	  },
	  methods: {
	    handleDialogAccess() {
	      if (this.isClosed) {
	        return this.getStartService().startDialog(this.dialogId);
	      }
	      return this.getJoinService().joinToDialog(this.dialogId);
	    },
	    closeDialog() {
	      void im_public.Messenger.openLines();
	      im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
	    },
	    getStartService() {
	      if (!this.startService) {
	        this.startService = new imopenlines_v2_provider_service.StartService();
	      }
	      return this.startService;
	    },
	    getJoinService() {
	      if (!this.joinService) {
	        this.joinService = new imopenlines_v2_provider_service.JoinService();
	      }
	      return this.joinService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<ul class="bx-imol-textarea_join-panel-list-button">
			<li v-if="!isNewSession" class="bx-imol-textarea_join-panel-item-button">
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.Success"
					:text=textStartJoinButtons
					@click="handleDialogAccess"
				/>
			</li>
			<li class="bx-imol-textarea_join-panel-item-button">
				<ChatButton
					:size="ButtonSize.L"
					:color="ButtonColor.Danger"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_CLOSE')"
					@click="closeDialog"
				/>
			</li>
		</ul>
	`
	};

	// @vue/component
	const JoinPanelContainer = {
	  name: 'JoinPanelContainer',
	  components: {
	    OpenLinesButton: im_v2_component_elements_button.ChatButton,
	    ChatControlPanel,
	    JoinPanel
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    isQueueTypeAll: {
	      type: Boolean,
	      required: true
	    }
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    session() {
	      return this.$store.getters['openLines/sessions/getByChatId'](this.dialog.chatId, true);
	    },
	    isNewSession() {
	      if (!this.session) {
	        return false;
	      }
	      return this.session.status === imopenlines_v2_const.StatusGroup.new;
	    },
	    isOperator() {
	      const userId = im_v2_application_core.Core.getUserId();
	      return userId === this.session.operatorId;
	    },
	    isClosed() {
	      return this.session ? this.session.isClosed : false;
	    }
	  },
	  template: `
		<div class="bx-imol-textarea_join-panel-container">
			<ChatControlPanel v-if="(isNewSession && isOperator) || isQueueTypeAll" :dialogId="dialogId" :isQueueTypeAll="isQueueTypeAll"/>
			<JoinPanel v-else :dialogId="dialogId" :isClosed="isClosed" :isNewSession="isNewSession"/>
		</div>
	`
	};

	// @vue/component
	const OpenLinesHeader = {
	  name: 'OpenLinesHeader',
	  components: {
	    ChatHeader: im_v2_component_content_elements.ChatHeader,
	    ChatTransfer
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    isQueueTypeAll: {
	      type: Boolean,
	      required: true
	    }
	  },
	  data() {
	    return {
	      showChatTransferPopup: false
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    session() {
	      return this.$store.getters['openLines/sessions/getByChatId'](this.dialog.chatId, true);
	    },
	    isPinned() {
	      return this.session ? this.session.pinned : false;
	    },
	    isClosed() {
	      return this.session ? this.session.isClosed : false;
	    },
	    isOwner() {
	      const ownerId = this.dialog.ownerId;
	      if (!ownerId) {
	        return false;
	      }
	      const userId = im_v2_application_core.Core.getUserId();
	      return ownerId === userId;
	    },
	    isNewSession() {
	      if (!this.session) {
	        return false;
	      }
	      return this.session.status === imopenlines_v2_const.StatusGroup.new;
	    },
	    isOperator() {
	      const userId = im_v2_application_core.Core.getUserId();
	      return userId === this.session.operatorId;
	    },
	    textForPinButton() {
	      return this.isPinned ? this.loc('IMOL_CONTENT_HEADER_BUTTON_UNPIN') : this.loc('IMOL_CONTENT_HEADER_BUTTON_PIN');
	    },
	    classIconButtonPin() {
	      return this.isPinned ? 'fa-link-slash' : 'fa-link';
	    }
	  },
	  methods: {
	    onMarkSpam() {
	      return this.getFinishService().markSpamChat(this.dialogId);
	    },
	    onFinish() {
	      return this.getFinishService().finishChat(this.dialogId);
	    },
	    onPin() {
	      if (this.isPinned) {
	        return this.getPinService().unpinChat(this.dialogId);
	      }
	      return this.getPinService().pinChat(this.dialogId);
	    },
	    onIntercept() {
	      return this.getInterceptService().interceptDialog(this.dialogId);
	    },
	    openChatTransferPopup() {
	      this.showChatTransferPopup = true;
	    },
	    getFinishService() {
	      if (!this.finishService) {
	        this.finishService = new imopenlines_v2_provider_service.FinishService();
	      }
	      return this.finishService;
	    },
	    getPinService() {
	      if (!this.pinService) {
	        this.pinService = new imopenlines_v2_provider_service.PinService();
	      }
	      return this.pinService;
	    },
	    getInterceptService() {
	      if (!this.interceptService) {
	        this.interceptService = new imopenlines_v2_provider_service.InterceptService();
	      }
	      return this.interceptService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-imol-header-button_container">
			<ChatHeader
				:dialogId="dialogId"
				:withCallButton="false"
				:withSearchButton="true"
			>
				<template v-if="!isClosed" #before-actions>
					<ul v-if="isOperator || isNewSession" class="bx-imol-header-button_container-list">
						<li v-if="isOperator || isQueueTypeAll" class="bx-imol-header-button_container-item">
							<button
								:title="loc('IMOL_CONTENT_HEADER_BUTTON_SPAM')"
								class="bx-imol-header-button__icon-container"
								@click="onMarkSpam"
							>
								<i class="bx-imol-header-button__icon fa-solid fa-triangle-exclamation fa-lg"></i>
							</button>
						</li>
						<template v-if="isOwner">
							<li class="bx-imol-header-button_container-item">
								<button
									:title="loc('IMOL_CONTENT_HEADER_BUTTON_FINISH')"
									class="bx-imol-header-button__icon-container"
									@click="onFinish"
								>
									<i class="bx-imol-header-button__icon fa-regular fa-circle-check fa-lg"></i>
								</button>
							</li>
							<li class="bx-imol-header-button_container-item">
								<button
									:title="textForPinButton"
									class="bx-imol-header-button__icon-container"
									@click="onPin"
								>
									<i class="bx-imol-header-button__icon fa-solid fa-lg" :class="classIconButtonPin"></i>
								</button>
							</li>
							<li class="bx-imol-header-button_container-item">
								<button
									:title="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
									:class="{'--active': showChatTransferPopup}"
									class="bx-imol-header-button__icon-container"
									@click="openChatTransferPopup"
									ref="transfer-chat"
								>
									<i class="bx-imol-header-button__icon fa-solid fa-arrows-turn-right fa-lg"></i>
								</button>
							</li>
						</template>
					</ul>
					<div v-else class="bx-imol-header-button_container-item">
						<button
							:title="loc('IMOL_CONTENT_HEADER_BUTTON_INTERCEPT')"
							class="bx-imol-header-button__icon-container"
							@click="onIntercept"
						>
							<i class="bx-imol-header-button__icon fa-solid fa-arrows-left-right fa-xl"></i>
						</button>
					</div>
				</template>
			</ChatHeader>
			<ChatTransfer
				:bindElement="$refs['transfer-chat'] || {}"
				:dialogId="dialogId"
				:showPopup="showChatTransferPopup"
				:popupConfig="{offsetTop: 15, offsetLeft: -300}"
				@close="showChatTransferPopup = false"
			/>
		</div>
	`
	};

	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _service = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("service");
	class SilentModeManager {
	  constructor(store, service) {
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _service, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = store;
	    babelHelpers.classPrivateFieldLooseBase(this, _service)[_service] = service;
	  }
	  getStatus(dialogId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['openLines/currentSession/getSilentModeByDialogId'](dialogId);
	  }
	  async toggle(dialogId) {
	    const currentStatus = this.getStatus(dialogId);
	    await babelHelpers.classPrivateFieldLooseBase(this, _service)[_service].set(dialogId, !currentStatus);
	  }
	}

	const POPUP_ID$1 = 'imol-silent-mode-popup';
	const POPUP_CLASSNAME = 'bx-imol-silent-mode-popup__container';

	// @vue/component
	const SilentModePopup = {
	  name: 'SilentModePopup',
	  components: {
	    MessengerPopup: im_v2_component_elements_popup.MessengerPopup
	  },
	  props: {
	    bindElement: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  computed: {
	    POPUP_ID: () => POPUP_ID$1,
	    popupConfig() {
	      return {
	        bindElement: this.bindElement,
	        className: POPUP_CLASSNAME,
	        offsetTop: -5,
	        width: 340,
	        overlay: false,
	        autoHide: true,
	        bindOptions: {
	          position: 'top'
	        },
	        angle: {
	          offset: 35,
	          position: 'bottom'
	        },
	        animation: 'fading'
	      };
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<MessengerPopup
			:config="popupConfig"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-imol-silent-mode-popup__title">
				{{ loc('IMOL_CONTENT_TEXTAREA_HIDDEN_MODE_POPUP_TITLE') }}
			</div>
			<div class="bx-imol-silent-mode-popup__description">
				{{ loc('IMOL_CONTENT_TEXTAREA_HIDDEN_MODE_POPUP_DESCRIPTION') }}
			</div>
		</MessengerPopup>
	`
	};

	const useDelay = delay => {
	  let timeoutId = null;
	  return {
	    start(callback) {
	      clearTimeout(timeoutId);
	      timeoutId = setTimeout(() => {
	        callback();
	      }, delay);
	    },
	    stop() {
	      clearTimeout(timeoutId);
	      timeoutId = null;
	    }
	  };
	};

	const ICON_SIZE = 24;
	const POPUP_SHOW_DELAY = 600;

	// @vue/component
	const SilentMode = {
	  name: 'SilentMode',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    SilentModePopup,
	    Spinner: im_v2_component_elements_loader.Spinner
	  },
	  props: {
	    isActive: {
	      type: Boolean,
	      required: true
	    },
	    isLoading: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['toggle'],
	  data() {
	    return {
	      selectorElement: null,
	      showPopup: false
	    };
	  },
	  computed: {
	    OutlineIcons: () => ui_iconSet_api_vue.Outline,
	    Color: () => im_v2_const.Color,
	    ICON_SIZE: () => ICON_SIZE,
	    SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
	    SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
	    iconColor() {
	      return this.isActive ? im_v2_const.Color.accentBlue : im_v2_const.Color.gray40;
	    }
	  },
	  created() {
	    this.delayedPopup = useDelay(POPUP_SHOW_DELAY);
	  },
	  mounted() {
	    this.selectorElement = this.$refs.silentModeButton;
	  },
	  beforeUnmount() {
	    this.delayedPopup.stop();
	  },
	  methods: {
	    onToggle() {
	      if (this.isLoading) {
	        return;
	      }
	      this.$emit('toggle');
	    },
	    onPopupOpen() {
	      const shouldShowPopup = this.isActive && !this.isLoading;
	      if (shouldShowPopup) {
	        this.delayedPopup.start(() => {
	          this.showPopup = true;
	        });
	      }
	    },
	    onPopupClose() {
	      this.delayedPopup.stop();
	      this.showPopup = false;
	    }
	  },
	  template: `
		<span
			ref="silentModeButton"
			@mouseenter="onPopupOpen"
			@mouseleave="onPopupClose"
		>
			<Spinner
				v-if="isLoading"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.blue"
			/>
			<BIcon
				v-else
				:name="OutlineIcons.CROSSED_EYE"
				:size="ICON_SIZE"
				:color="iconColor"
				class="bx-im-textarea__icon"
				@click="onToggle"
			/>
		</span>
		<SilentModePopup
			v-if="showPopup"
			:bindElement="selectorElement"
			@close="onPopupClose"
		/>
	`
	};

	// @vue/component
	const OpenLinesTextarea = {
	  name: 'OpenLinesTextarea',
	  components: {
	    ChatTextarea: im_v2_component_textarea.ChatTextarea,
	    SilentMode
	  },
	  props: {
	    dialogId: {
	      type: String,
	      default: ''
	    }
	  },
	  data() {
	    return {
	      isSilentModeLoading: false
	    };
	  },
	  computed: {
	    isSilentModeActive() {
	      return this.silentModeManager.getStatus(this.dialogId);
	    }
	  },
	  created() {
	    this.silentModeManager = new SilentModeManager(this.$store, new imopenlines_v2_provider_service.SilentModeService());
	  },
	  methods: {
	    async onSilentModeToggle() {
	      this.isSilentModeLoading = true;
	      await this.silentModeManager.toggle(this.dialogId);
	      this.isSilentModeLoading = false;
	    }
	  },
	  template: `
		<ChatTextarea
			:dialogId="dialogId"
			:key="dialogId"
		>
			<template #bottom-panel-buttons>
				<div class="bx-imol-textarea-buttons">
					<SilentMode
						:isActive="isSilentModeActive"
						:isLoading="isSilentModeLoading"
						@toggle="onSilentModeToggle"
					/>
				</div>
			</template>
		</ChatTextarea>
	`
	};

	const MenuSectionCode = {
	  main: 'first',
	  select: 'second',
	  third: 'third'
	};
	var _isMultiDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isMultiDialog");
	var _isNetworkConnector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isNetworkConnector");
	var _isSupport = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSupport24");
	var _canShowMultiDialogMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canShowMultiDialogMenu");
	class OpenLinesMessageMenu extends im_v2_lib_menu.MessageMenu {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _canShowMultiDialogMenu, {
	      value: _canShowMultiDialogMenu2
	    });
	    Object.defineProperty(this, _isSupport, {
	      value: _isSupport2
	    });
	    Object.defineProperty(this, _isNetworkConnector, {
	      value: _isNetworkConnector2
	    });
	    Object.defineProperty(this, _isMultiDialog, {
	      value: _isMultiDialog2
	    });
	  }
	  getMenuItems() {
	    const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getMarkItem(), this.getForwardItem(), this.getFavoriteItem(), this.getDownloadFileItem(), this.getEditItem(), this.getMultiDialogItem()];
	    const secondGroupItems = [this.getDeleteItem(), this.getSelectItem()];
	    return [...this.groupItems(firstGroupItems, MenuSectionCode.first), ...this.groupItems(secondGroupItems, MenuSectionCode.second)];
	  }
	  getMenuGroups() {
	    return [{
	      code: MenuSectionCode.first
	    }, {
	      code: MenuSectionCode.second
	    }];
	  }
	  getMultiDialogItem() {
	    const dialogId = this.context.dialogId;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _canShowMultiDialogMenu)[_canShowMultiDialogMenu](dialogId)) {
	      return null;
	    }
	    return {
	      icon: ui_iconSet_api_core.Outline.MESSAGES_MULTI,
	      title: main_core.Loc.getMessage('IMOL_DIALOG_CHAT_MENU_MULTI_DIALOG'),
	      onClick: () => {
	        const messageService = new imopenlines_v2_provider_service.MessageService();
	        void messageService.addSession(this.context.dialogId, this.context.id);
	      }
	    };
	  }
	}
	function _isMultiDialog2(dialogId) {
	  const currentSession = im_v2_application_core.Core.getStore().getters['openLines/currentSession/getByDialogId'](dialogId);
	  return Boolean(currentSession == null ? void 0 : currentSession.multidialog);
	}
	function _isNetworkConnector2(dialogId) {
	  const currentConnector = im_v2_application_core.Core.getStore().getters['openLines/connector/getByDialogId'](dialogId);
	  return (currentConnector == null ? void 0 : currentConnector.connectorId) === imopenlines_v2_const.Connector.network;
	}
	function _isSupport2(dialogId) {
	  return im_v2_application_core.Core.getStore().getters['users/bots/isSupport'](dialogId);
	}
	function _canShowMultiDialogMenu2(dialogId) {
	  return !this.isDeletedMessage() && babelHelpers.classPrivateFieldLooseBase(this, _isMultiDialog)[_isMultiDialog](dialogId) && babelHelpers.classPrivateFieldLooseBase(this, _isNetworkConnector)[_isNetworkConnector](dialogId) && babelHelpers.classPrivateFieldLooseBase(this, _isSupport)[_isSupport](dialogId);
	}

	// @vue/component
	const OpenLinesContent = {
	  name: 'OpenLinesContent',
	  components: {
	    BaseChatContent: im_v2_component_content_elements.BaseChatContent,
	    JoinPanelContainer,
	    OpenLinesHeader,
	    ChatDialog: im_v2_component_dialog_chat.ChatDialog,
	    OpenLinesTextarea
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    queueType() {
	      const session = this.getSessionByDialogId(this.dialogId);
	      const queueType = this.$store.getters['openLines/queue/getTypeById'](session == null ? void 0 : session.queueId, true);
	      return session ? queueType : null;
	    },
	    isQueueTypeAll() {
	      return this.queueType === imopenlines_v2_lib_queue.QueueType.all;
	    }
	  },
	  created() {
	    this.registerMessageMenu();
	  },
	  methods: {
	    registerMessageMenu() {
	      im_v2_lib_menu.MessageMenuManager.getInstance().registerMenuByCallback(context => {
	        const chat = this.$store.getters['chats/get'](context.dialogId);
	        return chat.type === im_v2_const.ChatType.lines;
	      }, OpenLinesMessageMenu);
	    },
	    getSessionByDialogId(dialogId) {
	      return this.$store.getters['openLines/recent/getSession'](dialogId, true);
	    }
	  },
	  template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<OpenLinesHeader :dialogId="dialogId" :key="dialogId" :isQueueTypeAll="isQueueTypeAll" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<OpenLinesTextarea :dialogId="dialogId" @mounted="onTextareaMount"/>
			</template>
			<template #join-panel>
				<JoinPanelContainer :dialogId="dialogId" :isQueueTypeAll="isQueueTypeAll"/>
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const EmptyState = {
	  computed: {
	    backgroundStyle() {
	      return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-imol-content-openlines-start__container" :style="backgroundStyle">
			<div class="bx-imol-content-openlines-start__content">
				<div class="bx-imol-content-openlines-start__icon --default"></div>
				<div class="bx-imol-content-openlines-start__title">
					{{ loc('IMOL_CONTENT_START_MESSAGE') }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const OpenLinesOpener = {
	  name: 'OpenLinesOpener',
	  components: {
	    EmptyState,
	    OpenLinesContent
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    }
	  },
	  watch: {
	    dialogId(newValue, oldValue) {
	      im_v2_lib_logger.Logger.warn(`OpenLinesContent: switching from ${oldValue || 'empty'} to ${newValue}`);
	      void this.loadChat();
	    }
	  },
	  created() {
	    if (!this.dialogId) {
	      return;
	    }
	    void this.loadChat();
	  },
	  methods: {
	    async loadChat() {
	      if (this.dialogId === '') {
	        return;
	      }
	      if (this.dialog.inited) {
	        im_v2_lib_logger.Logger.warn(`OpenLinesContent: openlines ${this.dialogId} is already loaded`);
	        return;
	      }
	      if (this.dialog.loading) {
	        im_v2_lib_logger.Logger.warn(`OpenLinesContent: openlines ${this.dialogId} is loading`);
	        return;
	      }
	      im_v2_lib_logger.Logger.warn(`OpenLinesContent: loading openlines ${this.dialogId}`);
	      await this.getChatService().loadChatWithMessages(this.dialogId).catch(() => {
	        im_public.Messenger.openLines();
	      });
	      im_v2_lib_logger.Logger.warn(`OpenLinesContent: openlines ${this.dialogId} is loaded`);
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new imopenlines_v2_provider_service.ChatServiceOl();
	      }
	      return this.chatService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-imol-content-default-openlines__container bx-imol-messenger__scope">
			<EmptyState v-if="!dialogId" />
			<OpenLinesContent
				v-else
				:dialogId="dialogId"
			/>
		</div>
	`
	};

	// @vue/component
	const OpenLinesContent$1 = {
	  name: 'OpenLinesContent',
	  components: {
	    OpenLinesOpener
	  },
	  props: {
	    entityId: {
	      type: String,
	      default: ''
	    }
	  },
	  template: `
		<OpenLinesOpener :dialogId="entityId" />
	`
	};

	exports.OpenLinesContent = OpenLinesContent$1;

}((this.BX.OpenLines.v2.Component.Content = this.BX.OpenLines.v2.Component.Content || {}),BX.OpenLines.v2.Css,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Dialog,BX.OpenLines.v2.Lib,BX.Main,BX.UI.EntitySelector,BX.Messenger.v2.Component,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component,BX.Vue3.Vuex,BX.UI.IconSet,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Const,BX.Messenger.v2.Component.Elements,BX.UI.IconSet,BX,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.OpenLines.v2.Provider.Service,BX.OpenLines.v2.Const,BX.Messenger.v2.Lib));
//# sourceMappingURL=openlines.bundle.js.map
