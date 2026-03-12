/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,main_core,im_v2_component_message_base,im_v2_component_message_elements,im_v2_component_elements_popup,ui_vue3_components_button,im_v2_lib_menu,im_v2_provider_service_sticker,im_v2_component_sticker,im_v2_lib_notifier,im_v2_lib_analytics,im_v2_application_core,im_v2_component_elements_loader,im_v2_const,ui_iconSet_api_vue) {
	'use strict';

	const SHIMMER_WIDTH = 178;
	const SHIMMER_HEIGHT = 12;

	// @vue/component
	const PackPopupHeader = {
	  name: 'PackPopupHeader',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Shimmer: im_v2_component_elements_loader.Shimmer
	  },
	  inject: ['disableAutoHide', 'enableAutoHide'],
	  props: {
	    isLoading: {
	      type: Boolean,
	      required: true
	    },
	    packId: {
	      type: Number,
	      required: true
	    },
	    packType: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['close', 'showPackMenu'],
	  computed: {
	    SHIMMER_WIDTH: () => SHIMMER_WIDTH,
	    SHIMMER_HEIGHT: () => SHIMMER_HEIGHT,
	    OutlineIcons: () => ui_iconSet_api_vue.Outline,
	    pack() {
	      return this.$store.getters['stickers/packs/getByIdentifier']({
	        id: this.packId,
	        type: this.packType
	      });
	    },
	    isPackOwner() {
	      return this.pack.authorId === im_v2_application_core.Core.getUserId();
	    },
	    canShowContextMenu() {
	      if (this.isLoading) {
	        return false;
	      }
	      if (!this.isPackOwner) {
	        return false;
	      }
	      return this.pack.type === im_v2_const.StickerPackType.custom;
	    }
	  },
	  template: `
		<div class="bx-im-stickers-pack-popup__header">
			<Shimmer v-if="isLoading" :width="SHIMMER_WIDTH" :height="SHIMMER_HEIGHT"/>
			<div v-else class="bx-im-stickers-pack-popup__header-title --ellipsis">{{ pack.name }}</div>
			<div class="bx-im-stickers-pack-popup__header-controls">
				<BIcon
					v-if="canShowContextMenu"
					:name="OutlineIcons.MORE_M"
					:hoverable="true"
					class="bx-im-stickers-pack-popup__control-icon"
					@click="$emit('showPackMenu', $event)"
				/>
				<BIcon
					:name="OutlineIcons.CROSS_M"
					:hoverable="true"
					class="bx-im-stickers-pack-popup__control-icon"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const PackPopupContent = {
	  name: 'PackPopupContent',
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Spinner: im_v2_component_elements_loader.Spinner,
	    StickerPackForm: im_v2_component_sticker.StickerPackForm,
	    PackStickers: im_v2_component_sticker.PackStickers,
	    PackPopupHeader
	  },
	  inject: ['disableAutoHide', 'enableAutoHide'],
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    packId: {
	      type: Number,
	      required: true
	    },
	    packType: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {
	      isLoading: false,
	      isRequestSending: false,
	      showPackForm: false
	    };
	  },
	  computed: {
	    ButtonSize: () => ui_vue3_components_button.ButtonSize,
	    SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
	    SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
	    OutlineIcons: () => ui_iconSet_api_vue.Outline,
	    AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
	    pack() {
	      return this.$store.getters['stickers/packs/getByIdentifier']({
	        id: this.packId,
	        type: this.packType
	      });
	    },
	    buttonText() {
	      if (this.pack.isAdded) {
	        return this.loc('IM_MESSAGE_STICKER_PACK_ADDED');
	      }
	      return this.loc('IM_MESSAGE_STICKER_PACK_ADD');
	    },
	    buttonStyle() {
	      if (this.pack.isAdded) {
	        return ui_vue3_components_button.AirButtonStyle.PLAIN;
	      }
	      return ui_vue3_components_button.AirButtonStyle.FILLED;
	    }
	  },
	  async created() {
	    this.stickerService = im_v2_provider_service_sticker.StickerService.getInstance();
	    this.isLoading = true;
	    await this.stickerService.loadPack({
	      id: this.packId,
	      type: this.packType
	    });
	    this.isLoading = false;
	  },
	  methods: {
	    async linkStickerPack() {
	      var _this$pack;
	      if ((_this$pack = this.pack) != null && _this$pack.isAdded) {
	        return;
	      }
	      this.isRequestSending = true;
	      await this.stickerService.linkPack({
	        id: this.packId,
	        type: this.packType
	      });
	      this.isRequestSending = false;
	      im_v2_lib_notifier.Notifier.sticker.onLinkPackComplete();
	      im_v2_lib_analytics.Analytics.getInstance().stickers.onLinkPackFromPopup(this.dialogId);
	      this.$emit('close');
	    },
	    showPackMenu(event) {
	      if (!this.packMenu) {
	        this.packMenu = new im_v2_lib_menu.StickerPackMenu();
	        this.packMenu.subscribe(im_v2_lib_menu.StickerPackMenu.events.showPackForm, () => {
	          this.showPackForm = true;
	        });
	        this.packMenu.subscribe(im_v2_lib_menu.StickerPackMenu.events.closeParentPopup, () => {
	          this.$emit('close');
	        });
	      }
	      this.disableAutoHide();
	      this.packMenu.openMenu({
	        pack: this.pack,
	        dialogId: this.dialogId,
	        isRecent: false
	      }, event.target);
	    },
	    showStickerMenu({
	      event,
	      sticker
	    }) {
	      if (!this.stickerMenu) {
	        this.stickerMenu = new im_v2_lib_menu.StickerMenu();
	        this.stickerMenu.subscribe(im_v2_lib_menu.BaseMenu.events.close, () => {
	          this.enableAutoHide();
	        });
	        this.stickerMenu.subscribe(im_v2_lib_menu.StickerMenu.events.closeParentPopup, () => {
	          this.$emit('close');
	        });
	      }
	      this.disableAutoHide();
	      this.stickerMenu.openMenu({
	        sticker,
	        isRecent: false,
	        dialogId: this.dialogId
	      }, event.target);
	    },
	    onStickerPackFormClose() {
	      this.enableAutoHide();
	      this.showPackForm = false;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-stickers-pack-popup__container">
			<PackPopupHeader 
				:isLoading="isLoading" 
				:packId="packId" 
				:packType="packType" 
				@showPackMenu="showPackMenu" 
				@close="$emit('close')"
			/>
			<PackStickers
				v-if="!isLoading"
				:pack="pack"
				:withAddButton="false"
				class="bx-im-stickers-pack-popup__sticker-list"
				@clickSticker="showStickerMenu"
				@openContextMenuSticker="showStickerMenu"
			/>
			<div v-else class="bx-im-stickers-pack-popup__loader">
				<Spinner
					:size="SpinnerSize.M"
					:color="SpinnerColor.mainPrimary"
				/>
			</div>
			<div 
				v-if="!isLoading"
				:class="{'--pack-added': pack.isAdded}"
				class="bx-im-stickers-pack-popup__footer"
			>
				<UiButton
					:size="ButtonSize.LARGE"
					:text="buttonText"
					:loading="isRequestSending"
					:style="buttonStyle"
					:left-icon="OutlineIcons.CHECK_L"
					@click="linkStickerPack"
				/>
			</div>
			<StickerPackForm v-if="showPackForm" :pack="pack" @close="onStickerPackFormClose" />
		</div>
	`
	};

	// @vue/component
	const PackPopup = {
	  name: 'StickerPackPopup',
	  components: {
	    MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
	    PackPopupContent
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    packId: {
	      type: Number,
	      required: true
	    },
	    packType: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['close'],
	  computed: {
	    PopupType: () => im_v2_const.PopupType,
	    popupConfig() {
	      return {
	        width: 404,
	        targetContainer: document.body,
	        fixed: true,
	        overlay: true,
	        autoHide: true,
	        padding: 0,
	        contentPadding: 0,
	        borderRadius: '20px',
	        contentBorderRadius: '20px',
	        className: 'bx-im-messenger__scope',
	        background: 'transparent'
	      };
	    }
	  },
	  template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.stickerPack"
			@close="$emit('close')"
		>
			<PackPopupContent 
				:dialogId="dialogId"
				:packId="packId"
				:packType="packType"
				@close="$emit('close')"
			/>
		</MessengerPopup>
	`
	};

	// @vue/component
	const StickerFallback = {
	  name: 'StickerFallback',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  computed: {
	    OutlineIcons: () => ui_iconSet_api_vue.Outline
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-message-sticker-fallback__container">
			<div class="bx-im-message-sticker-fallback__content">
				<BIcon :name="OutlineIcons.ALERT" />
				{{ loc('IM_MESSAGE_STICKER_EMPTY') }}
			</div>
		</div>
	`
	};

	// @vue/component
	const StickerMessage = {
	  name: 'StickerMessage',
	  components: {
	    BaseMessage: im_v2_component_message_base.BaseMessage,
	    MessageStatus: im_v2_component_message_elements.MessageStatus,
	    ReactionList: im_v2_component_message_elements.ReactionList,
	    MessageHeader: im_v2_component_message_elements.MessageHeader,
	    StickerFallback,
	    PackPopup
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      showPackPopup: false
	    };
	  },
	  computed: {
	    message() {
	      return this.item;
	    },
	    sticker() {
	      const sticker = this.$store.getters['stickers/messages/getStickerByMessageId'](this.message.id);
	      return this.$store.getters['stickers/get'](sticker);
	    },
	    imageUri() {
	      var _this$sticker;
	      return (_this$sticker = this.sticker) == null ? void 0 : _this$sticker.uri;
	    },
	    hasStickerUri() {
	      return main_core.Type.isStringFilled(this.imageUri);
	    },
	    imageHeightStyles() {
	      if (!this.sticker.width || !this.sticker.height) {
	        return {};
	      }
	      const STICKER_MAX_SIZE = 166;
	      const currentRatio = this.sticker.width / this.sticker.height;
	      const reducedHeight = Math.round(STICKER_MAX_SIZE / currentRatio);
	      const finalHeight = Math.min(reducedHeight, STICKER_MAX_SIZE);
	      return {
	        height: `${finalHeight}px`
	      };
	    }
	  },
	  methods: {
	    onStickerClick() {
	      if (!this.hasStickerUri) {
	        return;
	      }
	      this.showPackPopup = true;
	    },
	    onClosePopup() {
	      this.showPackPopup = false;
	    }
	  },
	  template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withBackground="false"
			:afterMessageWidthLimit="false"
		>
			<template #before-message>
				<div class="bx-im-message-sticker__header-container">
					<MessageHeader :item="item" :isOverlay="true" />
				</div>
			</template>
			<div class="bx-im-message-sticker__container">
				<div
					v-if="hasStickerUri"
					class="bx-im-message-sticker__image"
					:style="imageHeightStyles"
					@click="onStickerClick"
				>
					<img :src="imageUri" alt="" loading="lazy"/>
				</div>
				<StickerFallback v-else />
				<div class="bx-im-message-sticker__message-status-container">
					<MessageStatus :item="message" :isOverlay="true" />
				</div>
			</div>
			<template #after-message>
				<div class="bx-im-message-sticker__reactions-container">
					<ReactionList 
						:messageId="message.id"
						:contextDialogId="dialogId"
						class="bx-im-message-sticker__reactions"
					/>
				</div>
			</template>
			<PackPopup
				v-if="showPackPopup"
				:dialogId="dialogId"
				:packId="sticker.packId"
				:packType="sticker.packType"
				@close="onClosePopup"
			/>
		</BaseMessage>
	`
	};

	exports.StickerMessage = StickerMessage;

}((this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}),BX,BX.Messenger.v2.Component.Message,BX.Messenger.v2.Component.Message,BX.Messenger.v2.Component.Elements,BX.Vue3.Components,BX.Messenger.v2.Lib,BX.Messenger.v2.Provider.Service,BX.Messenger.v2.Component,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Const,BX.UI.IconSet));
//# sourceMappingURL=sticker.bundle.js.map
