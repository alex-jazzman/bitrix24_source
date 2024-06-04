/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,ui_fonts_opensans,im_v2_lib_copilot,ui_icons_disk,im_v2_lib_parser,rest_client,ui_vue3_directives_lazyload,ui_loader,im_v2_model,main_core_events,ui_notification,im_public,im_v2_provider_service,im_v2_lib_phone,main_popup,ui_forms,ui_vue3_components_audioplayer,ui_vue3,im_v2_lib_textHighlighter,im_v2_lib_utils,im_v2_lib_permission,main_core,im_v2_lib_dateFormatter,im_v2_application_core,im_v2_lib_user,im_v2_lib_logger,im_v2_const,ui_lottie,ai_rolesDialog) {
	'use strict';

	const AvatarSize = Object.freeze({
	  XXS: 'XXS',
	  XS: 'XS',
	  S: 'S',
	  M: 'M',
	  L: 'L',
	  XL: 'XL',
	  XXL: 'XXL',
	  XXXL: 'XXXL'
	});

	// @vue/component
	const Avatar = {
	  name: 'MessengerAvatar',
	  props: {
	    dialogId: {
	      type: [String, Number],
	      default: 0
	    },
	    customSource: {
	      type: String,
	      default: ''
	    },
	    size: {
	      type: String,
	      default: AvatarSize.M
	    },
	    withAvatarLetters: {
	      type: Boolean,
	      default: true
	    },
	    withSpecialTypes: {
	      type: Boolean,
	      default: true
	    },
	    withSpecialTypeIcon: {
	      type: Boolean,
	      default: true
	    },
	    withTooltip: {
	      type: Boolean,
	      default: true
	    }
	  },
	  data() {
	    return {
	      imageLoadError: false
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    user() {
	      return this.$store.getters['users/get'](this.dialogId, true);
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isBot() {
	      if (this.isUser) {
	        return this.user.bot;
	      }
	      return false;
	    },
	    isChannel() {
	      return [im_v2_const.ChatType.channel, im_v2_const.ChatType.openChannel].includes(this.dialog.type);
	    },
	    isSpecialType() {
	      const commonTypes = [im_v2_const.ChatType.user, im_v2_const.ChatType.chat, im_v2_const.ChatType.open];
	      return !commonTypes.includes(this.dialog.type);
	    },
	    containerTitle() {
	      if (!this.withTooltip) {
	        return '';
	      }
	      return this.dialog.name;
	    },
	    containerClasses() {
	      const classes = [`--size-${this.size.toLowerCase()}`];
	      if (this.withSpecialTypes && this.isSpecialType) {
	        classes.push('--special');
	      }
	      const typeClass = im_v2_const.ChatType[this.dialog.type] ? `--${this.dialog.type}` : '--default';
	      classes.push(typeClass);
	      return classes;
	    },
	    backgroundColorStyle() {
	      return {
	        backgroundColor: this.dialog.color
	      };
	    },
	    avatarText() {
	      if (!this.showAvatarLetters || !this.isEnoughSizeForText) {
	        return '';
	      }
	      return im_v2_lib_utils.Utils.text.getFirstLetters(this.dialog.name);
	    },
	    showAvatarLetters() {
	      if (this.isChannel) {
	        return true;
	      }
	      return !this.isSpecialType;
	    },
	    showSpecialTypeIcon() {
	      if (!this.withSpecialTypes || !this.withSpecialTypeIcon || this.isChannel) {
	        return false;
	      }
	      return this.isSpecialType;
	    },
	    isEnoughSizeForText() {
	      const avatarSizesWithText = [AvatarSize.M, AvatarSize.L, AvatarSize.XL, AvatarSize.XXL, AvatarSize.XXXL];
	      return avatarSizesWithText.includes(this.size.toUpperCase());
	    },
	    avatarUrl() {
	      return this.customSource.length > 0 ? this.customSource : this.dialog.avatar;
	    },
	    hasImage() {
	      return this.avatarUrl && !this.imageLoadError;
	    }
	  },
	  watch: {
	    avatarUrl() {
	      this.imageLoadError = false;
	    }
	  },
	  methods: {
	    onImageLoadError() {
	      this.imageLoadError = true;
	    }
	  },
	  template: `
		<div :title="containerTitle" :class="containerClasses" class="bx-im-avatar__scope bx-im-avatar__container">
			<!-- Avatar -->
			<template v-if="hasImage">
				<img :src="avatarUrl" :alt="dialog.name" class="bx-im-avatar__content --image" @error="onImageLoadError" draggable="false"/>
				<div v-if="showSpecialTypeIcon" :style="backgroundColorStyle" class="bx-im-avatar__special-type_icon"></div>
			</template>
			<div v-else-if="withAvatarLetters && avatarText" :style="backgroundColorStyle" class="bx-im-avatar__content --text">
				{{ avatarText }}
			</div>
			<div v-else :style="backgroundColorStyle" class="bx-im-avatar__content bx-im-avatar__icon"></div>
		</div>
	`
	};

	// @vue/component
	const ChatAvatar = {
	  name: 'ChatAvatar',
	  components: {
	    Avatar
	  },
	  props: {
	    avatarDialogId: {
	      type: [String, Number],
	      default: 0
	    },
	    contextDialogId: {
	      type: String,
	      required: true
	    },
	    size: {
	      type: String,
	      default: AvatarSize.M
	    },
	    withAvatarLetters: {
	      type: Boolean,
	      default: true
	    },
	    withSpecialTypes: {
	      type: Boolean,
	      default: true
	    },
	    withSpecialTypeIcon: {
	      type: Boolean,
	      default: true
	    },
	    withTooltip: {
	      type: Boolean,
	      default: true
	    }
	  },
	  computed: {
	    customAvatarUrl() {
	      const copilotManager = new im_v2_lib_copilot.CopilotManager();
	      if (!copilotManager.isCopilotChatOrBot(this.avatarDialogId)) {
	        return '';
	      }
	      return copilotManager.getRoleAvatarUrl({
	        avatarDialogId: this.avatarDialogId,
	        contextDialogId: this.contextDialogId
	      });
	    }
	  },
	  template: `
		<Avatar
			:dialogId="avatarDialogId"
			:customSource="customAvatarUrl"
			:size="size"
			:withAvatarLetters="withAvatarLetters"
			:withSpecialTypes="withSpecialTypes"
			:withSpecialTypeIcon="withSpecialTypeIcon"
			:withTooltip="withTooltip"
		/>
	`
	};

	// @vue/component
	const MessageAvatar = {
	  name: 'MessageAvatar',
	  components: {
	    Avatar
	  },
	  props: {
	    messageId: {
	      type: [String, Number],
	      default: 0
	    },
	    authorId: {
	      type: [String, Number],
	      default: 0
	    },
	    size: {
	      type: String,
	      default: AvatarSize.M
	    },
	    withAvatarLetters: {
	      type: Boolean,
	      default: true
	    },
	    withSpecialTypes: {
	      type: Boolean,
	      default: true
	    },
	    withSpecialTypeIcon: {
	      type: Boolean,
	      default: true
	    },
	    withTooltip: {
	      type: Boolean,
	      default: true
	    }
	  },
	  computed: {
	    isCopilotBot() {
	      return this.$store.getters['users/bots/isCopilot'](this.authorId);
	    },
	    customAvatarUrl() {
	      const copilotManager = new im_v2_lib_copilot.CopilotManager();
	      if (!this.isCopilotBot) {
	        return '';
	      }
	      return copilotManager.getMessageRoleAvatar(this.messageId);
	    }
	  },
	  template: `
		<Avatar
			:dialogId="authorId"
			:customSource="customAvatarUrl"
			:size="size"
			:withAvatarLetters="withAvatarLetters"
			:withSpecialTypes="withSpecialTypes"
			:withSpecialTypeIcon="withSpecialTypeIcon"
			:withTooltip="withTooltip"
		/>
	`
	};

	const DialogSpecialType = {
	  bot: 'bot',
	  extranet: 'extranet',
	  network: 'network',
	  support24: 'support24'
	};
	const TitleIcons = {
	  absent: 'absent',
	  birthday: 'birthday'
	};
	const ChatTitle = {
	  name: 'ChatTitle',
	  props: {
	    dialogId: {
	      type: [Number, String],
	      default: 0
	    },
	    text: {
	      type: String,
	      default: ''
	    },
	    showItsYou: {
	      type: Boolean,
	      default: true
	    },
	    withLeftIcon: {
	      type: Boolean,
	      default: true
	    },
	    withColor: {
	      type: Boolean,
	      default: false
	    },
	    withMute: {
	      type: Boolean,
	      default: false
	    },
	    onlyFirstName: {
	      type: Boolean,
	      default: false
	    },
	    twoLine: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    user() {
	      return this.$store.getters['users/get'](this.dialogId, true);
	    },
	    botType() {
	      if (!this.isUser) {
	        return '';
	      }
	      const {
	        type
	      } = this.$store.getters['users/bots/getByUserId'](this.dialogId);
	      return type;
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isSelfChat() {
	      return this.isUser && this.user.id === im_v2_application_core.Core.getUserId();
	    },
	    containerClasses() {
	      const classes = [];
	      if (this.twoLine) {
	        classes.push('--twoline');
	      }
	      return classes;
	    },
	    dialogName() {
	      if (this.text) {
	        return main_core.Text.encode(this.text);
	      }
	      let resultText = this.dialog.name;
	      if (this.isUser) {
	        if (this.onlyFirstName) {
	          resultText = this.user.firstName;
	        }
	        resultText = this.user.name;
	      }
	      return main_core.Text.encode(resultText);
	    },
	    dialogSpecialType() {
	      if (!this.isUser) {
	        if (this.isExtranet) {
	          return DialogSpecialType.extranet;
	        }
	        if ([im_v2_const.ChatType.support24Notifier, im_v2_const.ChatType.support24Question].includes(this.dialog.type)) {
	          return DialogSpecialType.support24;
	        }
	        return '';
	      }
	      if (this.isBot) {
	        return this.botType;
	      }
	      if (this.isExtranet) {
	        return DialogSpecialType.extranet;
	      }
	      if (this.isNetwork) {
	        return DialogSpecialType.network;
	      }
	      return '';
	    },
	    leftIcon() {
	      if (!this.withLeftIcon) {
	        return '';
	      }
	      if (this.dialogSpecialType) {
	        return this.dialogSpecialType;
	      }
	      if (!this.isUser) {
	        return '';
	      }
	      if (this.showBirthdays && this.user.isBirthday) {
	        return TitleIcons.birthday;
	      }
	      if (this.user.isAbsent) {
	        return TitleIcons.absent;
	      }
	      return '';
	    },
	    color() {
	      if (!this.withColor || this.specialColor) {
	        return '';
	      }
	      return this.dialog.color;
	    },
	    specialColor() {
	      return this.dialogSpecialType;
	    },
	    isBot() {
	      if (!this.isUser) {
	        return false;
	      }
	      return this.user.bot === true;
	    },
	    isExtranet() {
	      if (this.isUser) {
	        return this.user.extranet;
	      }
	      return this.dialog.extranet;
	    },
	    isNetwork() {
	      if (this.isUser) {
	        return this.user.network;
	      }
	      return false;
	    },
	    isChatMuted() {
	      if (this.isUser) {
	        return false;
	      }
	      const isMuted = this.dialog.muteList.find(element => {
	        return element === im_v2_application_core.Core.getUserId();
	      });
	      return Boolean(isMuted);
	    },
	    tooltipText() {
	      if (this.isSelfChat && this.showItsYou) {
	        return `${this.dialog.name} (${this.$Bitrix.Loc.getMessage('IM_LIST_RECENT_CHAT_SELF')})`;
	      }
	      return this.dialog.name;
	    },
	    showBirthdays() {
	      return this.$store.getters['application/settings/get'](im_v2_const.Settings.recent.showBirthday);
	    }
	  },
	  template: `
		<div :class="containerClasses" class="bx-im-chat-title__scope bx-im-chat-title__container">
			<span class="bx-im-chat-title__content">
				<span v-if="leftIcon" :class="'--' + leftIcon" class="bx-im-chat-title__icon"></span>
				<span
					:class="[specialColor? '--' + specialColor : '']"
					:style="{color: color}"
					:title="tooltipText"
					class="bx-im-chat-title__text"
					v-html="dialogName"
				></span>
				<strong v-if="isSelfChat && showItsYou">
					<span class="bx-im-chat-title__text --self">({{ $Bitrix.Loc.getMessage('IM_LIST_RECENT_CHAT_SELF') }})</span>
				</strong>
				<span v-if="withMute && isChatMuted" class="bx-im-chat-title__muted-icon"></span>
			</span>
		</div>
	`
	};

	// @vue/component
	const MessageAuthorTitle = {
	  name: 'MessageAuthorTitle',
	  components: {
	    ChatTitle
	  },
	  props: {
	    dialogId: {
	      type: [Number, String],
	      default: 0
	    },
	    messageId: {
	      type: [Number, String],
	      default: 0
	    },
	    text: {
	      type: String,
	      default: ''
	    },
	    showItsYou: {
	      type: Boolean,
	      default: true
	    },
	    withLeftIcon: {
	      type: Boolean,
	      default: true
	    },
	    withColor: {
	      type: Boolean,
	      default: false
	    },
	    withMute: {
	      type: Boolean,
	      default: false
	    },
	    onlyFirstName: {
	      type: Boolean,
	      default: false
	    },
	    twoLine: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    message() {
	      return this.$store.getters['messages/getById'](this.messageId);
	    },
	    authorId() {
	      return this.message.authorId;
	    },
	    customAuthorName() {
	      const copilotManager = new im_v2_lib_copilot.CopilotManager();
	      if (!copilotManager.isCopilotBot(this.dialogId)) {
	        return '';
	      }
	      return copilotManager.getNameWithRole({
	        dialogId: this.dialogId,
	        messageId: this.messageId
	      });
	    }
	  },
	  template: `
		<ChatTitle 
			:dialogId="dialogId"
			:text="customAuthorName"
			:showItsYou="showItsYou"
			:withLeftIcon="withLeftIcon"
			:withColor="withColor"
			:withMute="withMute"
			:onlyFirstName="onlyFirstName"
			:twoLine="twoLine"
		/>
	`
	};

	const ButtonSize = {
	  S: 'S',
	  // 18
	  M: 'M',
	  // 26
	  L: 'L',
	  // 31
	  XL: 'XL',
	  // 39
	  XXL: 'XXL' // 47
	};

	const ButtonColor = {
	  Primary: 'primary',
	  PrimaryLight: 'primary-light',
	  Copilot: 'copilot',
	  Success: 'success',
	  Danger: 'danger',
	  LightBorder: 'light-border',
	  DangerBorder: 'danger-border',
	  PrimaryBorder: 'primary-border',
	  Link: 'link'
	};
	const ButtonIcon = {
	  Plus: 'plus',
	  Link: 'link',
	  Call: 'call',
	  EndCall: 'end-call',
	  AddUser: 'add-user',
	  Camera: 'camera'
	};
	// @vue/component
	const Button = {
	  name: 'MessengerButton',
	  props: {
	    size: {
	      type: String,
	      required: true
	    },
	    text: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    icon: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    color: {
	      type: String,
	      required: false,
	      default: ButtonColor.Primary
	    },
	    customColorScheme: {
	      type: Object,
	      required: false,
	      default: () => {
	        return {
	          borderColor: '',
	          backgroundColor: '',
	          iconColor: '',
	          textColor: '',
	          hoverColor: ''
	        };
	      }
	    },
	    isRounded: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    isDisabled: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    isLoading: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    isUppercase: {
	      type: Boolean,
	      required: false,
	      default: true
	    }
	  },
	  emits: ['click'],
	  computed: {
	    buttonStyles() {
	      const result = {};
	      if (this.hasCustomColorScheme) {
	        result['borderColor'] = this.customColorScheme.borderColor;
	        result['backgroundColor'] = this.customColorScheme.backgroundColor;
	        result['color'] = this.customColorScheme.textColor;
	        result['--im-button__background-color_hover'] = this.customColorScheme.hoverColor;
	      }
	      return result;
	    },
	    buttonClasses() {
	      const classes = [`--size-${this.size.toLowerCase()}`];
	      if (!this.hasCustomColorScheme) {
	        classes.push(`--color-${this.color.toLowerCase()}`);
	      }
	      if (this.isRounded) {
	        classes.push('--rounded');
	      }
	      if (this.isDisabled) {
	        classes.push('--disabled');
	      }
	      if (this.isLoading) {
	        classes.push('--loading');
	      }
	      if (this.isUppercase && this.size !== ButtonSize.S) {
	        classes.push('--uppercase');
	      }
	      if (this.text === '') {
	        classes.push('--no-text');
	      }
	      return classes;
	    },
	    iconStyles() {
	      const result = {};
	      if (this.hasCustomColorScheme) {
	        result['backgroundColor'] = this.customColorScheme.iconColor;
	      }
	      return result;
	    },
	    iconClasses() {
	      const classes = [`--${this.icon}`];
	      if (this.hasCustomColorScheme) {
	        classes.push('--custom-color');
	      }
	      return classes;
	    },
	    hasCustomColorScheme() {
	      return main_core.Type.isStringFilled(this.customColorScheme.borderColor) && main_core.Type.isStringFilled(this.customColorScheme.iconColor) && main_core.Type.isStringFilled(this.customColorScheme.textColor) && main_core.Type.isStringFilled(this.customColorScheme.hoverColor);
	    }
	  },
	  methods: {
	    onClick(event) {
	      if (this.isDisabled || this.isLoading) {
	        return;
	      }
	      this.$emit('click', event);
	    }
	  },
	  template: `
		<button
			:class="buttonClasses"
			:style="buttonStyles"
			@click.stop="onClick"
			class="bx-im-button__scope bx-im-button__container"
		>
			<span v-if="icon" :style="iconStyles" :class="iconClasses" class="bx-im-button__icon"></span>
			<span class="bx-im-button__text">{{ text }}</span>
		</button>
	`
	};

	const POPUP_CONTAINER_PREFIX = '#popup-window-content-';
	const POPUP_BORDER_RADIUS = '10px';

	// @vue/component
	const MessengerPopup = {
	  name: 'MessengerPopup',
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    config: {
	      type: Object,
	      required: false,
	      default() {
	        return {};
	      }
	    }
	  },
	  emits: ['close'],
	  computed: {
	    popupContainer() {
	      return `${POPUP_CONTAINER_PREFIX}${this.id}`;
	    }
	  },
	  created() {
	    im_v2_lib_logger.Logger.warn(`Popup: ${this.id} created`);
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
	        this.instance = new main_popup.Popup(this.getPopupConfig());
	      }
	      return this.instance;
	    },
	    getDefaultConfig() {
	      return {
	        id: this.id,
	        bindOptions: {
	          position: 'bottom'
	        },
	        offsetTop: 0,
	        offsetLeft: 0,
	        className: 'bx-im-messenger__scope',
	        cacheable: false,
	        closeIcon: false,
	        autoHide: true,
	        closeByEsc: true,
	        animation: 'fading',
	        events: {
	          onPopupClose: this.closePopup.bind(this),
	          onPopupDestroy: this.closePopup.bind(this)
	        },
	        contentBorderRadius: POPUP_BORDER_RADIUS
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
	      // adjust for default popup margin for shadow
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
	      im_v2_lib_logger.Logger.warn(`Popup: ${this.id} closing`);
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
			></slot>
		</Teleport>
	`
	};

	const MenuItemIcon = {
	  chat: 'chat',
	  channel: 'channel',
	  conference: 'conference',
	  disk: 'disk',
	  upload: 'upload',
	  file: 'file',
	  task: 'task',
	  meeting: 'meeting',
	  summary: 'summary',
	  vote: 'vote',
	  aiText: 'ai-text',
	  aiImage: 'ai-image'
	};

	// @vue/component
	const MenuItem = {
	  name: 'MenuItem',
	  props: {
	    icon: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    title: {
	      type: String,
	      required: true
	    },
	    subtitle: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    disabled: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    counter: {
	      type: Number,
	      required: false,
	      default: 0
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    formattedCounter() {
	      if (this.counter === 0) {
	        return '';
	      }
	      return this.counter > 99 ? '99+' : `${this.counter}`;
	    }
	  },
	  template: `
		<div class="bx-im-menu-item__container" :class="{'--disabled': disabled}">
			<div class="bx-im-menu-item__content" :class="{'--with-icon': !!icon}">
				<div v-if="icon" class="bx-im-menu_item__icon" :class="'--' + icon"></div>
				<div class="bx-im-menu-item__text-content" :class="{'--with-subtitle': !!subtitle}">
					<div class="bx-im-menu-item__title">
						<div class="bx-im-menu-item__title_text">{{ title }}</div>
						<div v-if="counter" class="bx-im-menu-item__title_counter">{{ formattedCounter }}</div>
					</div>
					<div v-if="subtitle" :title="subtitle" class="bx-im-menu-item__subtitle">{{ subtitle }}</div>
				</div>
			</div>
		</div>
	`
	};

	const ID_PREFIX = 'im-v2-menu';

	// @vue/component
	const MessengerMenu = {
	  name: 'MessengerMenu',
	  components: {
	    MessengerPopup
	  },
	  props: {
	    config: {
	      type: Object,
	      required: true
	    },
	    className: {
	      type: String,
	      required: false,
	      default: ''
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {
	      id: ''
	    };
	  },
	  created() {
	    var _this$config$id;
	    this.id = (_this$config$id = this.config.id) != null ? _this$config$id : `${ID_PREFIX}-${im_v2_lib_utils.Utils.text.getUuidV4()}`;
	  },
	  template: `
		<MessengerPopup
			:config="config"
			@close="$emit('close')"
			:id="id"
		>
			<div class="bx-im-menu__container" :class="className">
				<slot name="header"></slot>
				<slot></slot>
				<slot name="footer"></slot>
			</div>
		</MessengerPopup>
	`
	};

	// @vue/component
	const AttachDelimiter = {
	  name: 'AttachDelimiter',
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    styles() {
	      var _this$internalConfig$;
	      const result = {
	        backgroundColor: (_this$internalConfig$ = this.internalConfig.delimiter.color) != null ? _this$internalConfig$ : this.color
	      };
	      if (this.internalConfig.delimiter.size) {
	        result.width = `${this.internalConfig.delimiter.size}px`;
	      }
	      return result;
	    }
	  },
	  template: `
		<div class="bx-im-attach-delimiter__container" :style="styles"></div>
	`
	};

	const AttachFileItem = {
	  name: 'AttachFileItem',
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    fileName() {
	      return this.internalConfig.name;
	    },
	    fileSize() {
	      return this.internalConfig.size;
	    },
	    link() {
	      return this.internalConfig.link;
	    },
	    fileShortName() {
	      const NAME_MAX_LENGTH = 70;
	      const fileName = main_core.Type.isStringFilled(this.fileName) ? this.fileName : this.$Bitrix.Loc.getMessage('IM_ELEMENTS_ATTACH_RICH_FILE_NO_NAME');
	      return im_v2_lib_utils.Utils.file.getShortFileName(fileName, NAME_MAX_LENGTH);
	    },
	    formattedFileSize() {
	      if (!this.fileSize) {
	        return '';
	      }
	      return im_v2_lib_utils.Utils.file.formatFileSize(this.fileSize);
	    },
	    iconClasses() {
	      return ['ui-icon', `ui-icon-file-${this.fileIcon}`];
	    },
	    fileIcon() {
	      return im_v2_lib_utils.Utils.file.getIconTypeByFilename(this.fileName);
	    }
	  },
	  methods: {
	    openLink() {
	      if (!this.link) {
	        return;
	      }
	      window.open(this.link, '_blank');
	    }
	  },
	  template: `
		<div @click="openLink" class="bx-im-attach-file__container">
			<div class="bx-im-attach-file__item">
				<div class="bx-im-attach-file__icon">
					<div :class="iconClasses"><i></i></div>
				</div>
				<div class="bx-im-attach-file__block">
					<div class="bx-im-attach-file__name" :title="fileName">
						{{ fileShortName }}
					</div>
					<div class="bx-im-attach-file__size">
						{{ formattedFileSize }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const AttachFile = {
	  name: 'AttachFile',
	  components: {
	    AttachFileItem
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    }
	  },
	  template: `
		<div class="bx-im-attach-file__container">
			<AttachFileItem
				v-for="(fileItem, index) in internalConfig.file"
				:config="fileItem"
				:key="index"
			/>
		</div>
	`
	};

	const AttachGridItemDisplayType = {
	  block: 'block',
	  line: 'line',
	  row: 'row'
	};
	const DisplayType = AttachGridItemDisplayType;

	// @vue/component
	const AttachGridItem = {
	  name: 'AttachGridItem',
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    }
	  },
	  computed: {
	    DisplayType: () => DisplayType,
	    internalConfig() {
	      return this.config;
	    },
	    display() {
	      return this.internalConfig.display.toLowerCase();
	    },
	    width() {
	      if (!this.value || !this.internalConfig.width) {
	        return '';
	      }
	      return `${this.internalConfig.width}px`;
	    },
	    value() {
	      if (!this.internalConfig.value) {
	        return '';
	      }
	      return im_v2_lib_parser.Parser.decodeText(this.internalConfig.value);
	    },
	    color() {
	      return this.internalConfig.color || '';
	    },
	    name() {
	      return this.internalConfig.name;
	    },
	    link() {
	      return this.internalConfig.link;
	    }
	  },
	  template: `
		<div v-if="display === DisplayType.block" :style="{width}" class="bx-im-attach-grid__item --block">
			<div class="bx-im-attach-grid__name">{{ name }}</div>
			<div v-if="link" class="bx-im-attach-grid__value --link">
				<a :href="link" target="_blank" :style="{color}" v-html="value"></a>
			</div>
			<div v-else v-html="value" :style="{color}" class="bx-im-attach-grid__value"></div>
		</div>
		<div v-if="display === DisplayType.line" :style="{width}" class="bx-im-attach-grid__item --line">
			<div class="bx-im-attach-grid__name">{{ name }}</div>
			<div v-if="link" :style="{color}" class="bx-im-attach-grid__value --link">
				<a :href="link" target="_blank" v-html="value"></a>
			</div>
			<div v-else class="bx-im-attach-grid__value" :style="{color}" v-html="value"></div>
		</div>
		<div v-if="display === DisplayType.row" class="bx-im-attach-grid__item --row">
			<table>
				<tbody>
					<tr>
						<td v-if="name" :colspan="value? 1: 2" :style="{width}" class="bx-im-attach-grid__name">
							{{ name }}
						</td>
						<td
							v-if="value && link"
							:colspan="name? 1: 2"
							:style="{color}"
							class="bx-im-attach-grid__value --link"
						>
							<a :href="link" target="_blank" v-html="value"></a>
						</td>
						<td
							v-if="value && !link"
							:colspan="name? 1: 2"
							:style="{color}"
							v-html="value"
							class="bx-im-attach-grid__value"
						>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	`
	};

	// @vue/component
	const AttachGrid = {
	  name: 'AttachGrid',
	  components: {
	    AttachGridItem
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    }
	  },
	  template: `
		<div class="bx-im-attach-grid__container">
			<AttachGridItem
				v-for="(gridItem, index) in internalConfig.grid"
				:config="gridItem"
				:key="index"
			/>
		</div>
	`
	};

	const AttachHtml = {
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    html() {
	      return im_v2_lib_parser.Parser.decodeHtml(this.internalConfig.html);
	    }
	  },
	  template: `
		<div class="bx-im-element-attach-type-html" v-html="html"></div>
	`
	};

	const MAX_IMAGE_SIZE = 272;

	// @vue/component
	const AttachImageItem = {
	  name: 'AttachImageItem',
	  directives: {
	    lazyload: ui_vue3_directives_lazyload.lazyload
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    width() {
	      return this.internalConfig.width || 0;
	    },
	    height() {
	      return this.internalConfig.height || 0;
	    },
	    link() {
	      return this.internalConfig.link;
	    },
	    name() {
	      return this.internalConfig.name;
	    },
	    preview() {
	      return this.internalConfig.preview;
	    },
	    source() {
	      var _this$preview;
	      return (_this$preview = this.preview) != null ? _this$preview : this.link;
	    },
	    imageSize() {
	      if (this.width === 0 || this.height === 0) {
	        return {};
	      }
	      const sizes = im_v2_lib_utils.Utils.file.resizeToFitMaxSize(this.width, this.height, MAX_IMAGE_SIZE);
	      return {
	        width: `${sizes.width}px`,
	        height: `${sizes.height}px`,
	        'object-fit': sizes.width < 100 || sizes.height < 100 ? 'cover' : 'contain'
	      };
	    },
	    hasWidth() {
	      return Boolean(this.imageSize.width);
	    }
	  },
	  methods: {
	    open() {
	      if (!this.link) {
	        return;
	      }
	      window.open(this.link, '_blank');
	    },
	    lazyLoadCallback(event) {
	      const {
	        element
	      } = event;
	      if (!main_core.Dom.style(element, 'width')) {
	        main_core.Dom.style(element, 'width', `${element.offsetWidth}px`);
	      }
	      if (!main_core.Dom.style(element, 'height')) {
	        main_core.Dom.style(element, 'height', `${element.offsetHeight}px`);
	      }
	    }
	  },
	  template: `
		<div class="bx-im-attach-image__item" :class="{'--with-width': hasWidth }" @click="open">
			<img
				v-lazyload="{callback: lazyLoadCallback}"
				:data-lazyload-src="source"
				:style="imageSize"
				:title="name"
				:alt="name"
				class="bx-im-attach-image__source"
			/>
		</div>
	`
	};

	const AttachImage = {
	  name: 'AttachImage',
	  components: {
	    AttachImageItem
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    }
	  },
	  template: `
		<div class="bx-im-attach-image__container bx-im-attach-image__scope">
			<AttachImageItem v-for="(image, index) in internalConfig.image" :config="image" :key="index" />
		</div>
	`
	};

	// @vue/component
	const AttachLinkItem = {
	  name: 'AttachLinkItem',
	  components: {
	    AttachImage
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    link() {
	      return this.internalConfig.link;
	    },
	    name() {
	      var _this$internalConfig$;
	      return (_this$internalConfig$ = this.internalConfig.name) != null ? _this$internalConfig$ : this.link;
	    },
	    description() {
	      return this.internalConfig.desc;
	    },
	    html() {
	      const content = this.internalConfig.html || this.description;
	      return im_v2_lib_parser.Parser.decodeText(content);
	    },
	    preview() {
	      return this.internalConfig.preview;
	    },
	    imageConfig() {
	      return {
	        image: [{
	          name: this.internalConfig.name,
	          preview: this.internalConfig.preview,
	          width: this.internalConfig.width,
	          height: this.internalConfig.height
	        }]
	      };
	    }
	  },
	  template: `
		<div class="bx-im-attach-link__item">
			<a v-if="link" :href="link" target="_blank" class="bx-im-attach-link__link">
				{{ name }}
			</a>
			<span v-else class="bx-im-attach-link__name">
				{{ name }}
			</span>
			<div v-if="internalConfig.html || description" class="bx-im-attach-link__desc" v-html="html"></div>
			<div v-if="preview" class="bx-im-attach-link__image">
				<AttachImage :config="imageConfig" :color="color" />
			</div>
		</div>
	`
	};

	// @vue/component
	const AttachLink = {
	  name: 'AttachLink',
	  components: {
	    AttachLinkItem
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    }
	  },
	  template: `
		<div class="bx-im-attach-link__container">
			<AttachLinkItem v-for="(link, index) in internalConfig.link" :config="link" :key="index" />
		</div>
	`
	};

	// @vue/component
	const AttachMessage = {
	  name: 'AttachMessage',
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    message() {
	      return im_v2_lib_parser.Parser.decodeText(this.internalConfig.message);
	    }
	  },
	  template: `
		<div class="bx-im-attach-message__container" v-html="message"></div>
	`
	};

	var _restClient = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restClient");
	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _message = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("message");
	class RichService {
	  constructor(message) {
	    Object.defineProperty(this, _restClient, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _message, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient] = im_v2_application_core.Core.getRestClient();
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = im_v2_application_core.Core.getStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _message)[_message] = message;
	  }
	  deleteRichLink(attachId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('messages/deleteAttach', {
	      messageId: babelHelpers.classPrivateFieldLooseBase(this, _message)[_message].id,
	      attachId
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient].callMethod(im_v2_const.RestMethod.imV2ChatMessageDeleteRichUrl, {
	      messageId: babelHelpers.classPrivateFieldLooseBase(this, _message)[_message].id
	    }).catch(error => {
	      console.error('RichService: error deleting rich link', error);
	    });
	  }
	}

	// @vue/component
	const AttachRichItem = {
	  name: 'AttachRichItem',
	  components: {
	    AttachImage
	  },
	  inject: ['message'],
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    },
	    attachId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    link() {
	      return this.internalConfig.link;
	    },
	    name() {
	      return im_v2_lib_utils.Utils.text.convertHtmlEntities(this.internalConfig.name);
	    },
	    description() {
	      return im_v2_lib_utils.Utils.text.convertHtmlEntities(this.internalConfig.desc);
	    },
	    html() {
	      return this.internalConfig.html;
	    },
	    preview() {
	      return this.internalConfig.preview;
	    },
	    previewSize() {
	      var _this$internalConfig$, _this$internalConfig$2, _this$internalConfig$3, _this$internalConfig$4;
	      return {
	        width: (_this$internalConfig$ = (_this$internalConfig$2 = this.internalConfig.previewSize) == null ? void 0 : _this$internalConfig$2.width) != null ? _this$internalConfig$ : 0,
	        height: (_this$internalConfig$3 = (_this$internalConfig$4 = this.internalConfig.previewSize) == null ? void 0 : _this$internalConfig$4.height) != null ? _this$internalConfig$3 : 0
	      };
	    },
	    imageConfig() {
	      return {
	        image: [{
	          name: this.name,
	          preview: this.preview,
	          width: this.previewSize.width,
	          height: this.previewSize.height
	        }]
	      };
	    },
	    canShowDeleteIcon() {
	      if (!this.message) {
	        return false;
	      }
	      return this.message.authorId === im_v2_application_core.Core.getUserId();
	    },
	    deleteRichLinkTitle() {
	      return this.$Bitrix.Loc.getMessage('IM_ELEMENTS_ATTACH_RICH_LINK_DELETE');
	    },
	    imageStyles() {
	      if (this.previewSize.width === 0 || this.previewSize.height === 0) {
	        return {
	          width: '272px',
	          height: '272px'
	        };
	      }
	      return {};
	    }
	  },
	  methods: {
	    openLink() {
	      if (!this.link) {
	        return;
	      }
	      window.open(this.link, '_blank');
	    },
	    deleteRichLink() {
	      if (!this.message) {
	        return;
	      }
	      new RichService(this.message).deleteRichLink(this.attachId);
	    }
	  },
	  template: `
		<div class="bx-im-attach-rich__scope bx-im-attach-rich__container">
			<div class="bx-im-attach-rich__block">
				<div class="bx-im-attach-rich__name" @click="openLink">{{ name }}</div>
				<div v-if="html || description" class="bx-im-attach-rich__desc">{{ html || description }}</div>
				<button 
					v-if="canShowDeleteIcon" 
					class="bx-im-attach-rich__hide-icon"
					@click="deleteRichLink"
					:title="deleteRichLinkTitle"
				></button>
			</div>
			<div v-if="preview" class="bx-im-attach-rich__image" @click="openLink" :style="imageStyles">
				<AttachImage :config="imageConfig" :color="color" />
			</div>
		</div>
	`
	};

	// @vue/component
	const AttachRich = {
	  components: {
	    AttachRichItem
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    },
	    attachId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    }
	  },
	  template: `
		<div class="bx-im-attach-rich__container">
			<AttachRichItem 
				v-for="(rich, index) in internalConfig.richLink" 
				:config="rich" 
				:color="color" 
				:key="index" 
				:attachId="attachId" 
			/>
		</div>
	`
	};

	const AVATAR_TYPE = {
	  user: 'user',
	  chat: 'chat',
	  bot: 'bot'
	};

	// @vue/component
	const AttachUserItem = {
	  name: 'AttachUserItem',
	  directives: {
	    lazyload: ui_vue3_directives_lazyload.lazyload
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    name() {
	      return this.internalConfig.name;
	    },
	    avatar() {
	      return this.internalConfig.avatar;
	    },
	    avatarType() {
	      return this.internalConfig.avatarType;
	    },
	    link() {
	      return this.internalConfig.link;
	    },
	    avatarTypeClass() {
	      if (this.avatar) {
	        return '';
	      }
	      let avatarType = AVATAR_TYPE.user;
	      if (this.avatarType === AVATAR_TYPE.chat) {
	        avatarType = AVATAR_TYPE.chat;
	      } else if (this.avatarType === AVATAR_TYPE.bot) {
	        avatarType = AVATAR_TYPE.bot;
	      }
	      return `--${avatarType}`;
	    },
	    avatarTypeStyle() {
	      return {
	        backgroundColor: !this.avatar ? this.color : ''
	      };
	    }
	  },
	  template: `
		<div class="bx-im-attach-user__item">
			<div class="bx-im-attach-user__avatar" :class="avatarTypeClass" :style="avatarTypeStyle">
				<img v-if="avatar" v-lazyload :data-lazyload-src="avatar" class="bx-im-attach-user__source" alt="name" />
			</div>
			<a v-if="link" :href="link" class="bx-im-attach-user__name" target="_blank">
				{{ name }}
			</a>
			<span class="bx-im-attach-user__name" v-else>
				{{ name }}
			</span>
		</div>
	`
	};

	// @vue/component
	const AttachUser = {
	  name: 'AttachUser',
	  components: {
	    AttachUserItem
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    color: {
	      type: String,
	      default: im_v2_const.Color.transparent
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    }
	  },
	  template: `
		<div class="bx-im-attach-user__container">
			<AttachUserItem v-for="(user, index) in internalConfig.user" :config="user" :color="color" :key="index" />
		</div>
	`
	};

	const PropertyToComponentMap = {
	  [im_v2_const.AttachType.Delimiter]: AttachDelimiter,
	  [im_v2_const.AttachType.File]: AttachFile,
	  [im_v2_const.AttachType.Grid]: AttachGrid,
	  [im_v2_const.AttachType.Html]: AttachHtml,
	  [im_v2_const.AttachType.Image]: AttachImage,
	  [im_v2_const.AttachType.Link]: AttachLink,
	  [im_v2_const.AttachType.Message]: AttachMessage,
	  [im_v2_const.AttachType.Rich]: AttachRich,
	  [im_v2_const.AttachType.User]: AttachUser
	};

	// @vue/component
	const Attach = {
	  name: 'MessengerAttach',
	  components: {
	    AttachDelimiter,
	    AttachFile,
	    AttachGrid,
	    AttachHtml,
	    AttachImage,
	    AttachLink,
	    AttachMessage,
	    AttachRich,
	    AttachUser
	  },
	  props: {
	    config: {
	      type: Object,
	      default: () => {}
	    },
	    baseColor: {
	      type: String,
	      default: im_v2_const.Color.base
	    }
	  },
	  computed: {
	    internalConfig() {
	      return this.config;
	    },
	    blocks() {
	      return this.internalConfig.blocks;
	    },
	    color() {
	      if (!this.internalConfig.color) {
	        return this.baseColor;
	      }

	      // todo: in future we should set color for rich link on the backend. Remove after we delete the old chat.
	      if (this.internalConfig.color === im_v2_const.Color.transparent && this.hasRichLink) {
	        return '#2FC6F6';
	      }
	      if (this.internalConfig.color === im_v2_const.Color.transparent) {
	        return '';
	      }
	      return this.internalConfig.color;
	    },
	    hasRichLink() {
	      return this.blocks.some(block => block[im_v2_const.AttachType.Rich]);
	    }
	  },
	  methods: {
	    getComponentForBlock(block) {
	      const [blockType] = Object.keys(block);
	      if (!PropertyToComponentMap[blockType]) {
	        return '';
	      }
	      return PropertyToComponentMap[blockType];
	    }
	  },
	  template: `
		<div class="bx-im-attach__container bx-im-attach__scope">
			<div v-if="color" class="bx-im-attach__border" :style="{borderColor: color}"></div>
			<div class="bx-im-attach__content">
				<component
					v-for="(block, index) in blocks"
					:is="getComponentForBlock(block)"
					:config="block"
					:color="color"
					:key="index"
					:attachId="internalConfig.id.toString()"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ChatInfoContent = {
	  components: {
	    ChatAvatar,
	    ChatTitle,
	    Button
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      hasError: false,
	      isLoading: false
	    };
	  },
	  computed: {
	    ButtonColor: () => ButtonColor,
	    ButtonSize: () => ButtonSize,
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId);
	    },
	    user() {
	      return this.$store.getters['users/get'](this.dialogId, true);
	    },
	    isUser() {
	      var _this$dialog;
	      return ((_this$dialog = this.dialog) == null ? void 0 : _this$dialog.type) === im_v2_const.ChatType.user;
	    },
	    isBot() {
	      if (this.isUser) {
	        return this.user.bot;
	      }
	      return false;
	    },
	    isChat() {
	      return !this.isUser;
	    },
	    chatType() {
	      if (this.isUser) {
	        return this.$store.getters['users/getPosition'](this.dialogId);
	      }
	      return this.$Bitrix.Loc.getMessage('IM_LIST_RECENT_CHAT_TYPE_GROUP_V2');
	    },
	    openChatButtonText() {
	      if (this.isChat) {
	        return this.$Bitrix.Loc.getMessage('IM_ELEMENTS_CHAT_INFO_POPUP_OPEN_CHAT');
	      }
	      return this.$Bitrix.Loc.getMessage('IM_ELEMENTS_CHAT_INFO_POPUP_WRITE_A_MESSAGE');
	    },
	    userProfileLink() {
	      return im_v2_lib_utils.Utils.user.getProfileLink(this.dialogId);
	    }
	  },
	  created() {
	    this.chatService = new im_v2_provider_service.ChatService();
	    if (!this.dialog) {
	      this.loadChat();
	    }
	  },
	  methods: {
	    loadChat() {
	      this.isLoading = true;
	      this.chatService.loadChat(this.dialogId).then(() => {
	        this.isLoading = false;
	      }).catch(error => {
	        this.isLoading = false;
	        this.hasError = true;
	        console.error(error);
	      });
	    },
	    onOpenChat() {
	      im_public.Messenger.openChat(this.dialogId);
	    },
	    onClickVideoCall() {
	      im_public.Messenger.startVideoCall(this.dialogId);
	    }
	  },
	  template: `
		<div class="bx-im-chat-info-content__container">
			<template v-if="!isLoading && !hasError">
				<div class="bx-im-chat-info-content__detail-info-container">
					<div class="bx-im-chat-info-content__avatar-container">
						<ChatAvatar :avatarDialogId="dialogId" :contextDialogId="dialogId" size="XL"/>
					</div>
					<div class="bx-im-chat-info-content__title-container">
						<ChatTitle v-if="isChat" :dialogId="dialogId" />
						<a v-else :href="userProfileLink" target="_blank">
							<ChatTitle :dialogId="dialogId" />
						</a>
						<div class="bx-im-chat-info-content__chat-description_text">
							{{ chatType }}
						</div>
					</div>
				</div>
				<div class="bx-im-chat-info-content__buttons-container">
					<Button
						:size="ButtonSize.M"
						:color="ButtonColor.PrimaryBorder"
						:isRounded="true"
						:text="openChatButtonText"
						:isUppercase="false"
						@click="onOpenChat"
					/>
					<Button
						v-if="isUser && !isBot"
						:size="ButtonSize.M"
						:color="ButtonColor.PrimaryBorder"
						:isRounded="true"
						:isUppercase="false"
						:text="$Bitrix.Loc.getMessage('IM_ELEMENTS_CHAT_INFO_POPUP_VIDEOCALL')"
						@click="onClickVideoCall"
					/>
				</div>
			</template>
			<template v-else-if="isLoading">
				<div class="bx-im-chat-info-content__loader-container">
					<div class="bx-im-chat-info-content__loader_icon"></div>
				</div>
			</template>
			<template v-else-if="hasError">
				<div class="bx-im-chat-info-content__error-container">
					{{ $Bitrix.Loc.getMessage('IM_ELEMENTS_CHAT_INFO_POPUP_NO_ACCESS') }}
				</div>
			</template>
		</div>
	`
	};

	const POPUP_ID = 'im-chat-info-popup';

	// @vue/component
	const ChatInfoPopup = {
	  name: 'ChatInfoPopup',
	  components: {
	    MessengerPopup,
	    ChatInfoContent
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
	    }
	  },
	  emits: ['close'],
	  computed: {
	    POPUP_ID: () => POPUP_ID,
	    config() {
	      return {
	        minWidth: 313,
	        height: 134,
	        bindElement: this.bindElement,
	        targetContainer: document.body,
	        offsetTop: 0,
	        padding: 16,
	        angle: true
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
			<ChatInfoContent :dialogId="dialogId"/>
		</MessengerPopup>
	`
	};

	var _store$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _restClient$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restClient");
	var _userManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userManager");
	class UserListService {
	  constructor() {
	    Object.defineProperty(this, _store$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _restClient$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _userManager, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1] = im_v2_application_core.Core.getStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _restClient$1)[_restClient$1] = im_v2_application_core.Core.getRestClient();
	    babelHelpers.classPrivateFieldLooseBase(this, _userManager)[_userManager] = new im_v2_lib_user.UserManager();
	  }
	  loadUsers(userIds) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _restClient$1)[_restClient$1].callMethod(im_v2_const.RestMethod.imUserListGet, {
	      ID: userIds
	    }).then(response => {
	      return babelHelpers.classPrivateFieldLooseBase(this, _userManager)[_userManager].setUsersToModel(Object.values(response.data()));
	    });
	  }
	}

	const LOADER_SIZE = 'xs';
	const LOADER_TYPE = 'BULLET';

	// @vue/component
	const Loader = {
	  name: 'MessengerLoader',
	  mounted() {
	    this.loader = new ui_loader.Loader({
	      target: this.$refs['messenger-loader'],
	      type: LOADER_TYPE,
	      size: LOADER_SIZE
	    });
	    this.loader.render();
	    this.loader.show();
	  },
	  beforeUnmount() {
	    this.loader.hide();
	    this.loader = null;
	  },
	  template: `
		<div class="bx-im-elements-loader__container" ref="messenger-loader"></div>
	`
	};

	// @vue/component
	const UserItem = {
	  name: 'UserItem',
	  components: {
	    ChatAvatar,
	    ChatTitle
	  },
	  props: {
	    userId: {
	      type: Number,
	      required: true
	    },
	    contextDialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    AvatarSize: () => AvatarSize,
	    user() {
	      return this.$store.getters['users/get'](this.userId, true);
	    },
	    userDialogId() {
	      return this.userId.toString();
	    }
	  },
	  methods: {
	    onUserClick() {
	      void im_public.Messenger.openChat(this.userDialogId);
	    }
	  },
	  template: `
		<div class="bx-im-user-list-content__user-container" @click="onUserClick">
			<div class="bx-im-user-list-content__avatar-container">
				<ChatAvatar
					:avatarDialogId="userDialogId"
					:contextDialogId="contextDialogId"
					:size="AvatarSize.XS"
				/>
			</div>
			<ChatTitle 
				:dialogId="userDialogId" 
				:showItsYou="false" 
				class="bx-im-user-list-content__chat-title-container" 
			/>
		</div>
	`
	};

	// @vue/component
	const UserListContent = {
	  components: {
	    UserItem,
	    Loader
	  },
	  props: {
	    userIds: {
	      type: Array,
	      required: true
	    },
	    adjustPopupFunction: {
	      type: Function,
	      required: true
	    },
	    loading: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    contextDialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      hasError: false,
	      isLoadingUsers: false
	    };
	  },
	  computed: {
	    isLoading() {
	      return this.loading || this.isLoadingUsers;
	    }
	  },
	  watch: {
	    userIds() {
	      this.$nextTick(() => {
	        this.adjustPopupFunction();
	      });
	    }
	  },
	  created() {
	    if (this.needUserRequest()) {
	      this.requestUserData();
	    }
	  },
	  methods: {
	    getUserListService() {
	      if (!this.userListService) {
	        this.userListService = new UserListService();
	      }
	      return this.userListService;
	    },
	    getUser(userId) {
	      return this.$store.getters['users/get'](userId);
	    },
	    needUserRequest() {
	      return this.userIds.some(userId => !this.getUser(userId));
	    },
	    requestUserData() {
	      this.isLoadingUsers = true;
	      this.getUserListService().loadUsers(this.userIds).then(() => {
	        this.isLoadingUsers = false;
	      }).catch(error => {
	        // eslint-disable-next-line no-console
	        console.error(error);
	        this.hasError = true;
	        this.isLoadingUsers = false;
	      });
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-user-list-content__container bx-im-user-list-content__scope">
			<template v-if="!isLoading && !hasError">
				<UserItem v-for="userId in userIds" :userId="userId" :contextDialogId="contextDialogId" />
			</template>
			<div v-else-if="isLoading" class="bx-im-user-list-content__loader-container">
				<Loader />
			</div>
			<div v-else-if="hasError">
				{{ loc('IM_ELEMENTS_CHAT_INFO_POPUP_NO_ACCESS') }}
			</div>
		</div>
	`
	};

	const POPUP_ID$1 = 'im-user-list-popup';

	// @vue/component
	const UserListPopup = {
	  name: 'UserListPopup',
	  components: {
	    MessengerPopup,
	    UserListContent
	  },
	  props: {
	    showPopup: {
	      type: Boolean,
	      required: true
	    },
	    id: {
	      type: String,
	      required: false,
	      default: POPUP_ID$1
	    },
	    bindElement: {
	      type: Object,
	      required: true
	    },
	    userIds: {
	      type: Array,
	      required: true
	    },
	    contextDialogId: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    withAngle: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    loading: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    forceTop: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    offsetLeft: {
	      type: Number,
	      required: false,
	      default: 0
	    }
	  },
	  emits: ['close'],
	  computed: {
	    POPUP_ID: () => POPUP_ID$1,
	    config() {
	      const config = {
	        bindElement: this.bindElement,
	        targetContainer: document.body,
	        offsetTop: 4,
	        offsetLeft: this.offsetLeft,
	        padding: 0,
	        angle: this.withAngle
	      };
	      if (this.forceTop) {
	        config.bindOptions = {
	          position: 'top'
	        };
	      }
	      return config;
	    }
	  },
	  template: `
		<MessengerPopup
			v-if="showPopup"
			v-slot="{adjustPosition}"
			:config="config"
			@close="$emit('close')"
			:id="id"
		>
			<UserListContent 
				:userIds="userIds"
				:contextDialogId="contextDialogId"
				:loading="loading" 
				:adjustPopupFunction="adjustPosition"
			/>
		</MessengerPopup>
	`
	};

	// @vue/component
	const KeyboardButton = {
	  name: 'KeyboardButton',
	  props: {
	    config: {
	      type: Object,
	      required: true
	    },
	    keyboardBlocked: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['action', 'customCommand', 'blockKeyboard'],
	  data() {
	    return {};
	  },
	  computed: {
	    button() {
	      return this.config;
	    },
	    buttonClasses() {
	      const displayClass = this.button.display === im_v2_const.KeyboardButtonDisplay.block ? '--block' : '--line';
	      const classes = [displayClass];
	      if (this.keyboardBlocked || this.button.disabled) {
	        classes.push('--disabled');
	      }
	      if (this.button.wait) {
	        classes.push('--loading');
	      }
	      return classes;
	    },
	    buttonStyles() {
	      const styles = {};
	      const {
	        width,
	        bgColor,
	        textColor
	      } = this.button;
	      if (width) {
	        styles.width = `${width}px`;
	      }
	      if (bgColor) {
	        styles.backgroundColor = bgColor;
	      }
	      if (textColor) {
	        styles.color = textColor;
	      }
	      return styles;
	    }
	  },
	  methods: {
	    onClick() {
	      if (this.keyboardBlocked || this.button.disabled || this.button.wait) {
	        return;
	      }
	      if (this.button.action && this.button.actionValue) {
	        this.handleAction();
	      } else if (this.button.appId) {
	        im_v2_lib_logger.Logger.warn('Messenger keyboard: open app is not implemented.');
	      } else if (this.button.link) {
	        const preparedLink = main_core.Text.decode(this.button.link);
	        im_v2_lib_utils.Utils.browser.openLink(preparedLink);
	      } else if (this.button.command) {
	        this.handleCustomCommand();
	      }
	    },
	    handleAction() {
	      this.$emit('action', {
	        action: this.button.action,
	        payload: this.button.actionValue
	      });
	    },
	    handleCustomCommand() {
	      if (this.button.block) {
	        this.$emit('blockKeyboard');
	      }
	      this.button.wait = true;
	      this.$emit('customCommand', {
	        botId: this.button.botId,
	        command: this.button.command,
	        payload: this.button.commandParams
	      });
	    }
	  },
	  template: `
		<div
			class="bx-im-keyboard-button__container"
			:class="buttonClasses"
			:style="buttonStyles"
			@click="onClick"
		>
			{{ button.text }}
		</div>
	`
	};

	// @vue/component
	const KeyboardSeparator = {
	  name: 'KeyboardSeparator',
	  data() {
	    return {};
	  },
	  template: `
		<div class="bx-im-keyboard-button__separator"></div>
	`
	};

	var _dialogId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialogId");
	var _actionHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("actionHandlers");
	var _sendMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendMessage");
	var _insertText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("insertText");
	var _startCall = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("startCall");
	var _copyText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copyText");
	var _openChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openChat");
	class ActionManager {
	  constructor(dialogId) {
	    Object.defineProperty(this, _openChat, {
	      value: _openChat2
	    });
	    Object.defineProperty(this, _copyText, {
	      value: _copyText2
	    });
	    Object.defineProperty(this, _startCall, {
	      value: _startCall2
	    });
	    Object.defineProperty(this, _insertText, {
	      value: _insertText2
	    });
	    Object.defineProperty(this, _sendMessage, {
	      value: _sendMessage2
	    });
	    Object.defineProperty(this, _dialogId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _actionHandlers, {
	      writable: true,
	      value: {
	        [im_v2_const.KeyboardButtonAction.send]: babelHelpers.classPrivateFieldLooseBase(this, _sendMessage)[_sendMessage].bind(this),
	        [im_v2_const.KeyboardButtonAction.put]: babelHelpers.classPrivateFieldLooseBase(this, _insertText)[_insertText].bind(this),
	        [im_v2_const.KeyboardButtonAction.call]: babelHelpers.classPrivateFieldLooseBase(this, _startCall)[_startCall].bind(this),
	        [im_v2_const.KeyboardButtonAction.copy]: babelHelpers.classPrivateFieldLooseBase(this, _copyText)[_copyText].bind(this),
	        [im_v2_const.KeyboardButtonAction.dialog]: babelHelpers.classPrivateFieldLooseBase(this, _openChat)[_openChat].bind(this)
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _dialogId)[_dialogId] = dialogId;
	  }
	  handleAction(event) {
	    const {
	      action,
	      payload
	    } = event;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _actionHandlers)[_actionHandlers][action]) {
	      // eslint-disable-next-line no-console
	      console.error('Keyboard: action not found');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _actionHandlers)[_actionHandlers][action](payload);
	  }
	}
	function _sendMessage2(payload) {
	  im_v2_provider_service.SendingService.getInstance().sendMessage({
	    text: payload,
	    dialogId: babelHelpers.classPrivateFieldLooseBase(this, _dialogId)[_dialogId]
	  });
	}
	function _insertText2(payload) {
	  main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.insertText, {
	    text: payload,
	    dialogId: babelHelpers.classPrivateFieldLooseBase(this, _dialogId)[_dialogId]
	  });
	}
	function _startCall2(payload) {
	  im_v2_lib_phone.PhoneManager.getInstance().startCall(payload);
	}
	function _copyText2(payload) {
	  var _BX$clipboard;
	  if ((_BX$clipboard = BX.clipboard) != null && _BX$clipboard.copy(payload)) {
	    BX.UI.Notification.Center.notify({
	      content: main_core.Loc.getMessage('IM_ELEMENTS_KEYBOARD_BUTTON_ACTION_COPY_SUCCESS')
	    });
	  }
	}
	function _openChat2(payload) {
	  im_public.Messenger.openChat(payload);
	}

	var _messageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("messageId");
	var _dialogId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialogId");
	class BotService {
	  constructor(params) {
	    Object.defineProperty(this, _messageId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _dialogId$1, {
	      writable: true,
	      value: void 0
	    });
	    const {
	      messageId,
	      dialogId
	    } = params;
	    babelHelpers.classPrivateFieldLooseBase(this, _messageId)[_messageId] = messageId;
	    babelHelpers.classPrivateFieldLooseBase(this, _dialogId$1)[_dialogId$1] = dialogId;
	  }
	  sendCommand(event) {
	    const {
	      botId,
	      command,
	      payload
	    } = event;
	    im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.imMessageCommand, {
	      MESSAGE_ID: babelHelpers.classPrivateFieldLooseBase(this, _messageId)[_messageId],
	      DIALOG_ID: babelHelpers.classPrivateFieldLooseBase(this, _dialogId$1)[_dialogId$1],
	      BOT_ID: botId,
	      COMMAND: command,
	      COMMAND_PARAMS: payload
	    }).catch(error => {
	      // eslint-disable-next-line no-console
	      console.error('BotService: error sending command:', error);
	    });
	  }
	}

	const Keyboard = {
	  props: {
	    buttons: {
	      type: Array,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    },
	    messageId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  components: {
	    KeyboardButton,
	    KeyboardSeparator
	  },
	  data() {
	    return {
	      keyboardBlocked: false
	    };
	  },
	  emits: ['click'],
	  watch: {
	    buttons() {
	      this.keyboardBlocked = false;
	    }
	  },
	  computed: {
	    ButtonType: () => im_v2_const.KeyboardButtonType,
	    preparedButtons() {
	      return this.buttons.filter(button => {
	        return button.context !== im_v2_const.KeyboardButtonContext.mobile;
	      });
	    }
	  },
	  methods: {
	    onButtonActionClick(event) {
	      this.getActionManager().handleAction(event);
	    },
	    onButtonCustomCommandClick(event) {
	      this.getBotService().sendCommand(event);
	    },
	    getActionManager() {
	      if (!this.actionManager) {
	        this.actionManager = new ActionManager(this.dialogId);
	      }
	      return this.actionManager;
	    },
	    getBotService() {
	      if (!this.botService) {
	        this.botService = new BotService({
	          messageId: this.messageId,
	          dialogId: this.dialogId
	        });
	      }
	      return this.botService;
	    }
	  },
	  template: `
		<div class="bx-im-keyboard__container">
			<template v-for="button in preparedButtons">
				<KeyboardButton
					v-if="button.type === ButtonType.button"
					:config="button"
					:keyboardBlocked="keyboardBlocked"
					@blockKeyboard="keyboardBlocked = true"
					@action="onButtonActionClick"
					@customCommand="onButtonCustomCommandClick"
				/>
				<KeyboardSeparator v-else-if="button.type === ButtonType.newLine" />
			</template>
		</div>
	`
	};

	const UserStatusSize = {
	  S: 'S',
	  M: 'M',
	  L: 'L',
	  XL: 'XL',
	  XXL: 'XXL'
	};

	// @vue/component
	const UserStatus = {
	  name: 'UserStatus',
	  props: {
	    status: {
	      type: String,
	      required: true,
	      validator(value) {
	        return Object.values(im_v2_const.UserStatus).includes(value);
	      }
	    },
	    size: {
	      type: String,
	      default: UserStatusSize.M,
	      validator(value) {
	        return Object.values(UserStatusSize).includes(value);
	      }
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    containerClasses() {
	      return [`--size-${this.size.toLowerCase()}`, `--${this.status}`];
	    }
	  },
	  template: `
		<div :class="containerClasses" class="bx-im-user-status__container bx-im-user-status__scope"></div>
	`
	};

	// @vue/component
	const Dropdown = {
	  name: 'ChatDropdown',
	  props: {
	    items: {
	      type: Object,
	      required: true
	    },
	    id: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['itemChange'],
	  data() {
	    return {
	      selectedElement: '',
	      menuOpened: false
	    };
	  },
	  computed: {
	    formattedItems() {
	      const map = {};
	      this.items.forEach(item => {
	        map[item.value] = item;
	      });
	      return map;
	    },
	    defaultItem() {
	      return this.items.find(item => {
	        return item.default === true;
	      });
	    }
	  },
	  created() {
	    this.menuInstance = null;
	    if (this.defaultItem) {
	      this.selectedElement = this.defaultItem.value;
	    }
	  },
	  beforeUnmount() {
	    var _this$menuInstance;
	    (_this$menuInstance = this.menuInstance) == null ? void 0 : _this$menuInstance.destroy();
	  },
	  methods: {
	    toggleMenu() {
	      if (!this.menuInstance) {
	        this.menuInstance = this.getMenuInstance();
	      }
	      if (this.menuOpened) {
	        this.menuInstance.close();
	        return;
	      }
	      this.menuInstance.show();
	      const width = this.$refs.container.clientWidth;
	      this.menuInstance.getPopupWindow().setWidth(width);
	      this.menuOpened = true;
	    },
	    getMenuInstance() {
	      return main_popup.MenuManager.create({
	        id: this.id,
	        bindOptions: {
	          forceBindPosition: true,
	          position: 'bottom'
	        },
	        targetContainer: document.body,
	        bindElement: this.$refs.container,
	        items: this.getMenuItems(),
	        events: {
	          onClose: () => {
	            this.menuOpened = false;
	          }
	        }
	      });
	    },
	    getMenuItems() {
	      return Object.values(this.formattedItems).map(item => {
	        return {
	          text: item.text,
	          onclick: () => {
	            this.selectedElement = item.value;
	            this.$emit('itemChange', item.value);
	            this.menuInstance.close();
	          }
	        };
	      });
	    }
	  },
	  template: `
		<div class="bx-im-dropdown__container bx-im-dropdown__scope">
			<div @click="toggleMenu" class="ui-ctl ui-ctl-xl ui-ctl-w100 ui-ctl-after-icon ui-ctl-dropdown" ref="container">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<div class="ui-ctl-element">{{ formattedItems[selectedElement].text }}</div>
			</div>
		</div>
	`
	};

	const SpinnerSize = Object.freeze({
	  XXS: 'XXS',
	  S: 'S',
	  L: 'L'
	});
	const SpinnerColor = Object.freeze({
	  grey: 'grey',
	  blue: 'blue'
	});

	// @vue/component
	const Spinner = {
	  name: 'MessengerSpinner',
	  props: {
	    size: {
	      type: String,
	      default: SpinnerSize.S
	    },
	    color: {
	      type: String,
	      default: SpinnerColor.blue
	    }
	  },
	  computed: {
	    sizeClassName() {
	      return `--size-${this.size.toLowerCase()}`;
	    },
	    colorClassName() {
	      return `--color-${this.color.toLowerCase()}`;
	    }
	  },
	  template: `
		<div class="bx-im-elements-spinner__container bx-im-elements-spinner__scope">
			<div class="bx-im-elements-spinner__spinner" :class="[sizeClassName, colorClassName]"></div>
		</div>
	`
	};

	// @vue/component
	const LineLoader = {
	  name: 'LineLoader',
	  props: {
	    width: {
	      type: Number,
	      required: true
	    },
	    height: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    containerStyles() {
	      return {
	        width: `${this.width}px`,
	        height: `${this.height}px`
	      };
	    }
	  },
	  template: `
		<div class="bx-im-elements-line-loader__container" :style="containerStyles">
			<div class="bx-im-elements-line-loader__content"></div>
		</div>
	`
	};

	const ToggleSize = {
	  S: 'S',
	  M: 'M'
	};

	// @vue/component
	const Toggle = {
	  name: 'ToggleControl',
	  props: {
	    size: {
	      type: String,
	      required: true
	    },
	    isEnabled: {
	      type: Boolean,
	      default: true
	    }
	  },
	  emits: ['change'],
	  computed: {
	    containerClasses() {
	      const classes = [`--size-${this.size.toLowerCase()}`];
	      if (!this.isEnabled) {
	        classes.push('--off');
	      }
	      return classes;
	    }
	  },
	  template: `
		<div :class="containerClasses" class="bx-im-toggle__container bx-im-toggle__scope">
			<span class="bx-im-toggle__cursor"></span>
			<span class="bx-im-toggle__enabled"></span>
			<span class="bx-im-toggle__disabled"></span>
		</div>
	`
	};

	const ARROW_CONTROL_SIZE = 50;
	const TabsColorScheme = Object.freeze({
	  white: 'white',
	  gray: 'gray'
	});

	// @vue/component
	const MessengerTabs = {
	  name: 'MessengerTabs',
	  props: {
	    colorScheme: {
	      type: String,
	      required: true,
	      default: TabsColorScheme.white,
	      validator: value => Object.values(TabsColorScheme).includes(value.toLowerCase())
	    },
	    tabs: {
	      type: Array,
	      default: () => []
	    }
	  },
	  data() {
	    return {
	      hasLeftControl: false,
	      hasRightControl: false,
	      currentElementIndex: 0,
	      highlightOffsetLeft: 0,
	      highlightWidth: 0,
	      isFirstCall: true
	    };
	  },
	  computed: {
	    highlightStyle() {
	      return {
	        left: `${this.highlightOffsetLeft}px`,
	        width: `${this.highlightWidth}px`
	      };
	    },
	    colorSchemeClass() {
	      return this.colorScheme === TabsColorScheme.white ? '--white' : '--gray';
	    }
	  },
	  watch: {
	    currentElementIndex(newIndex) {
	      this.updateHighlightPosition(newIndex);
	      this.$emit('tabSelect', this.tabs[newIndex]);
	      this.scrollToElement(newIndex);
	    }
	  },
	  mounted() {
	    const savedTabIndex = localStorage.getItem('lastOpenedTabIndex');
	    if (this.$refs.tabs.scrollWidth > this.$refs.tabs.offsetWidth) {
	      this.hasRightControl = true;
	    }
	    if (savedTabIndex) {
	      this.currentElementIndex = parseInt(savedTabIndex, 10);
	    }
	    this.updateHighlightPosition(this.currentElementIndex);
	    setTimeout(() => {
	      this.isFirstCall = false;
	    }, 100);
	  },
	  beforeUnmount() {
	    localStorage.setItem('lastOpenedTabIndex', this.currentElementIndex.toString());
	  },
	  methods: {
	    getElementNodeByIndex(index) {
	      return [...this.$refs.tabs.children].filter(node => !main_core.Dom.hasClass(node, 'bx-im-elements-tabs__highlight'))[index];
	    },
	    updateHighlightPosition(index) {
	      const element = this.getElementNodeByIndex(index);
	      this.highlightOffsetLeft = element.offsetLeft;
	      this.highlightWidth = element.offsetWidth;
	    },
	    scrollToElement(elementIndex) {
	      const element = this.getElementNodeByIndex(elementIndex);
	      this.$refs.tabs.scroll({
	        left: element.offsetLeft - ARROW_CONTROL_SIZE,
	        behavior: 'smooth'
	      });
	    },
	    onTabClick(event) {
	      this.currentElementIndex = event.index;
	    },
	    isSelectedTab(index) {
	      return index === this.currentElementIndex;
	    },
	    onLeftClick() {
	      if (this.currentElementIndex <= 0) {
	        return;
	      }
	      this.currentElementIndex--;
	    },
	    onRightClick() {
	      if (this.currentElementIndex >= this.tabs.length - 1) {
	        return;
	      }
	      this.currentElementIndex++;
	    },
	    updateControlsVisibility() {
	      this.hasRightControl = this.$refs.tabs.scrollWidth > this.$refs.tabs.scrollLeft + this.$refs.tabs.clientWidth;
	      this.hasLeftControl = this.$refs.tabs.scrollLeft > 0;
	    }
	  },
	  template: `
		<div class="bx-im-elements-tabs__container bx-im-elements-tabs__scope" :class="colorSchemeClass">
			<div v-if="hasLeftControl" @click.stop="onLeftClick" class="bx-im-elements-tabs__control --left">
				<div class="bx-im-elements-tabs__forward-icon"></div>
			</div>
			<div v-if="hasRightControl" @click.stop="onRightClick" class="bx-im-elements-tabs__control --right">
				<div class="bx-im-elements-tabs__forward-icon"></div>
			</div>
			<div class="bx-im-elements-tabs__elements" ref="tabs" @scroll.passive="updateControlsVisibility">
				<div class="bx-im-elements-tabs__highlight" :class="isFirstCall ? '' : '--transition'" :style="highlightStyle"></div>
				<div
					v-for="(tab, index) in tabs"
					:key="tab.id"
					class="bx-im-elements-tabs__item"
					:class="[isSelectedTab(index) ? '--selected' : '']"
					@click="onTabClick({index: index})"
					:title="tab.title"
				>
					<div class="bx-im-elements-tabs__item-title" :class="isFirstCall ? '' : '--transition'">{{ tab.title }}</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const AudioPlayer$$1 = ui_vue3.BitrixVue.cloneComponent(ui_vue3_components_audioplayer.AudioPlayer, {
	  name: 'AudioPlayer',
	  components: {
	    MessageAvatar
	  },
	  props: {
	    file: {
	      type: Object,
	      required: true
	    },
	    authorId: {
	      type: Number,
	      required: true
	    },
	    messageId: {
	      type: [String, Number],
	      required: true
	    },
	    timelineType: {
	      type: Number,
	      required: true
	    },
	    withContextMenu: {
	      type: Boolean,
	      default: true
	    },
	    withAvatar: {
	      type: Boolean,
	      default: true
	    }
	  },
	  data() {
	    return {
	      ...this.parentData(),
	      showContextButton: false
	    };
	  },
	  computed: {
	    AvatarSize: () => AvatarSize,
	    fileSize() {
	      return im_v2_lib_utils.Utils.file.formatFileSize(this.file.size);
	    },
	    fileAuthorDialogId() {
	      return this.authorId.toString();
	    },
	    progressPosition() {
	      if (!this.loaded || this.state === ui_vue3_components_audioplayer.AudioPlayerState.none) {
	        return {
	          width: '100%'
	        };
	      }
	      return {
	        width: `${this.progressInPixel}px`
	      };
	    },
	    activeTimelineStyles() {
	      const TIMELINE_VERTICAL_SHIFT = 44;
	      const ACTIVE_TIMELINE_VERTICAL_SHIFT = 19;
	      const shift = this.timelineType * TIMELINE_VERTICAL_SHIFT + ACTIVE_TIMELINE_VERTICAL_SHIFT;
	      return {
	        ...this.progressPosition,
	        'background-position-y': `-${shift}px`
	      };
	    },
	    timelineStyles() {
	      const TIMELINE_VERTICAL_SHIFT = 44;
	      const shift = this.timelineType * TIMELINE_VERTICAL_SHIFT;
	      return {
	        'background-position-y': `-${shift}px`
	      };
	    }
	  },
	  template: `
		<div 
			class="bx-im-audio-player__container bx-im-audio-player__scope" 
			ref="body"
			@mouseover="showContextButton = true"
			@mouseleave="showContextButton = false"
		>
			<div class="bx-im-audio-player__control-container">
				<button :class="['bx-im-audio-player__control-button', {
					'bx-im-audio-player__control-loader': loading,
					'bx-im-audio-player__control-play': !loading && state !== State.play,
					'bx-im-audio-player__control-pause': !loading && state === State.play,
				}]" @click="clickToButton"></button>
				<div v-if="withAvatar" class="bx-im-audio-player__author-avatar-container">
					<MessageAvatar 
						:messageId="messageId"
						:authorId="authorId"
						:size="AvatarSize.XS" 
					/>
				</div>
			</div>
			<div class="bx-im-audio-player__timeline-container">
				<div class="bx-im-audio-player__track-container" @click="setPosition" ref="track">
					<div class="bx-im-audio-player__track-mask" :style="timelineStyles"></div>
					<div class="bx-im-audio-player__track-mask --active" :style="activeTimelineStyles"></div>
					<div class="bx-im-audio-player__track-seek" :style="seekPosition"></div>
					<div class="bx-im-audio-player__track-event" @mousemove="seeking"></div>
				</div>
				<div class="bx-im-audio-player__timer-container">
					{{fileSize}}, {{labelTime}}
				</div>
			</div>
			<button
				v-if="showContextButton && withContextMenu"
				class="bx-im-messenger__context-menu-icon bx-im-audio-player__context-menu-button"
				@click="$emit('contextMenuClick', $event)"
			></button>
			<audio 
				v-if="src" 
				:src="src" 
				class="bx-im-audio-player__audio-source" 
				ref="source" 
				:preload="preload"
				@abort="audioEventRouter('abort', $event)"
				@error="audioEventRouter('error', $event)"
				@suspend="audioEventRouter('suspend', $event)"
				@canplay="audioEventRouter('canplay', $event)"
				@canplaythrough="audioEventRouter('canplaythrough', $event)"
				@durationchange="audioEventRouter('durationchange', $event)"
				@loadeddata="audioEventRouter('loadeddata', $event)"
				@loadedmetadata="audioEventRouter('loadedmetadata', $event)"
				@timeupdate="audioEventRouter('timeupdate', $event)"
				@play="audioEventRouter('play', $event)"
				@playing="audioEventRouter('playing', $event)"
				@pause="audioEventRouter('pause', $event)"
			></audio>
		</div>
	`
	});

	// @vue/component
	const ChatTitleWithHighlighting$$1 = ui_vue3.BitrixVue.cloneComponent(ChatTitle, {
	  name: 'ChatTitleWithHighlighting',
	  props: {
	    textToHighlight: {
	      type: String,
	      default: ''
	    }
	  },
	  computed: {
	    dialogName() {
	      // noinspection JSUnresolvedVariable
	      return im_v2_lib_textHighlighter.highlightText(this.parentDialogName, this.textToHighlight);
	    }
	  }
	});

	// @vue/component
	const SearchInput$$1 = {
	  name: 'SearchInput',
	  components: {
	    Spinner
	  },
	  props: {
	    placeholder: {
	      type: String,
	      default: ''
	    },
	    searchMode: {
	      type: Boolean,
	      default: true
	    },
	    withIcon: {
	      type: Boolean,
	      default: true
	    },
	    withLoader: {
	      type: Boolean,
	      default: false
	    },
	    isLoading: {
	      type: Boolean,
	      default: false
	    },
	    delayForFocusOnStart: {
	      type: Number,
	      default: 0
	    }
	  },
	  emits: ['queryChange', 'inputFocus', 'inputBlur', 'keyPressed', 'close'],
	  data() {
	    return {
	      query: '',
	      hasFocus: false
	    };
	  },
	  computed: {
	    SpinnerSize: () => SpinnerSize,
	    SpinnerColor: () => SpinnerColor,
	    isEmptyQuery() {
	      return this.query.length === 0;
	    }
	  },
	  watch: {
	    searchMode(newValue) {
	      if (newValue === true) {
	        this.focus();
	      } else {
	        this.query = '';
	        this.blur();
	      }
	    }
	  },
	  created() {
	    if (this.delayForFocusOnStart > 0) {
	      setTimeout(() => {
	        this.focus();
	      }, this.delayForFocusOnStart);
	    }
	  },
	  methods: {
	    onInputUpdate() {
	      this.$emit('queryChange', this.query);
	    },
	    onFocus() {
	      this.focus();
	      this.$emit('inputFocus');
	    },
	    onCloseClick() {
	      this.query = '';
	      this.hasFocus = false;
	      this.$emit('queryChange', this.query);
	      this.$emit('close');
	    },
	    onClearInput() {
	      this.query = '';
	      this.focus();
	      this.$emit('queryChange', this.query);
	    },
	    onKeyUp(event) {
	      if (im_v2_lib_utils.Utils.key.isCombination(event, 'Escape')) {
	        this.onEscapePressed();
	        return;
	      }
	      this.$emit('keyPressed', event);
	    },
	    onEscapePressed() {
	      if (this.isEmptyQuery) {
	        this.onCloseClick();
	        this.blur();
	      } else {
	        this.onClearInput();
	      }
	    },
	    focus() {
	      this.hasFocus = true;
	      this.$refs.searchInput.focus();
	    },
	    blur() {
	      this.hasFocus = false;
	      this.$refs.searchInput.blur();
	    }
	  },
	  template: `
		<div class="bx-im-search-input__scope bx-im-search-input__container" :class="{'--has-focus': hasFocus}">
			<div v-if="!isLoading" class="bx-im-search-input__search-icon"></div>
			<Spinner 
				v-if="withLoader && isLoading" 
				:size="SpinnerSize.XXS" 
				:color="SpinnerColor.grey" 
				class="bx-im-search-input__loader"
			/>
			<input
				@focus="onFocus"
				@input="onInputUpdate"
				@keyup="onKeyUp"
				v-model="query"
				class="bx-im-search-input__element"
				:class="{'--with-icon': withIcon}"
				:placeholder="placeholder"
				ref="searchInput"
			/>
			<div v-if="hasFocus" class="bx-im-search-input__close-icon" @click="onCloseClick"></div>
		</div>
	`
	};

	const INPUT_PADDING = 5;

	// @vue/component
	const EditableChatTitle = {
	  name: 'EditableChatTitle',
	  components: {
	    ChatTitle
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['newTitleSubmit'],
	  data() {
	    return {
	      isEditing: false,
	      inputWidth: 0,
	      showEditIcon: false,
	      chatTitle: ''
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    canBeRenamed() {
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.rename, this.dialogId);
	    },
	    inputStyle() {
	      return {
	        width: `calc(${this.inputWidth}ch + ${INPUT_PADDING}px)`
	      };
	    }
	  },
	  watch: {
	    chatTitle() {
	      this.inputWidth = this.chatTitle.length;
	    }
	  },
	  mounted() {
	    this.chatTitle = this.dialog.name;
	  },
	  methods: {
	    async onTitleClick() {
	      if (!this.canBeRenamed) {
	        return;
	      }
	      if (!this.chatTitle) {
	        this.chatTitle = this.dialog.name;
	      }
	      this.isEditing = true;
	      await this.$nextTick();
	      this.$refs.titleInput.focus();
	    },
	    onNewTitleSubmit() {
	      if (!this.isEditing) {
	        return;
	      }
	      this.isEditing = false;
	      const nameNotChanged = this.chatTitle === this.dialog.name;
	      if (nameNotChanged || this.chatTitle === '') {
	        return;
	      }
	      this.$emit('newTitleSubmit', this.chatTitle);
	    },
	    onEditCancel() {
	      this.isEditing = false;
	      this.showEditIcon = false;
	      this.chatTitle = this.dialog.name;
	    }
	  },
	  template: `
		<div
			v-if="!isEditing"
			@click="onTitleClick"
			@mouseover="showEditIcon = true"
			@mouseleave="showEditIcon = false"
			class="bx-im-elements-editable-chat-title__wrap"
			:class="{'--can-rename': canBeRenamed}"
		>
			<div class="bx-im-elements-editable-chat-title__container">
				<ChatTitle :dialogId="dialogId" :withMute="true" />
			</div>
			<div class="bx-im-elements-editable-chat-title__edit-icon_container">
				<div v-if="showEditIcon && canBeRenamed" class="bx-im-elements-editable-chat-title__edit-icon"></div>
			</div>
		</div>
		<div v-else class="bx-im-elements-editable-chat-title__input_container">
			<input
				v-model="chatTitle"
				:style="inputStyle"
				@focus="$event.target.select()"
				@blur="onNewTitleSubmit"
				@keyup.enter="onNewTitleSubmit"
				@keyup.esc="onEditCancel"
				type="text"
				class="bx-im-elements-editable-chat-title__input"
				ref="titleInput"
			/>
		</div>
	`
	};

	// @vue/component
	const ScrollWithGradient = {
	  name: 'ScrollWithGradient',
	  props: {
	    containerMaxHeight: {
	      type: Number,
	      default: 0,
	      required: false
	    },
	    gradientHeight: {
	      type: Number,
	      default: 0
	    },
	    withShadow: {
	      type: Boolean,
	      default: true
	    }
	  },
	  data() {
	    return {
	      showTopGradient: false,
	      showBottomGradient: false
	    };
	  },
	  computed: {
	    contentHeightStyle() {
	      if (!this.containerMaxHeight) {
	        return {
	          height: '100%'
	        };
	      }
	      return {
	        maxHeight: `${this.containerMaxHeight}px`
	      };
	    },
	    gradientHeightStyle() {
	      return {
	        maxHeight: `${this.gradientHeightStyle}px`
	      };
	    }
	  },
	  mounted() {
	    // const container = this.$refs['scroll-container'];
	    // this.showBottomGradient = container.scrollHeight > container.clientHeight;
	  },
	  methods: {
	    onScroll(event) {
	      this.$emit('scroll', event);
	      const scrollPosition = Math.ceil(event.target.scrollTop + event.target.clientHeight);
	      this.showBottomGradient = scrollPosition !== event.target.scrollHeight;
	      if (event.target.scrollTop === 0) {
	        this.showTopGradient = false;
	        return;
	      }
	      this.showTopGradient = true;
	    }
	  },
	  template: `
		<div class="bx-im-scroll-with-gradient__container">
			<Transition name="gradient-fade">
				<div v-if="showTopGradient" class="bx-im-scroll-with-gradient__gradient --top" :style="gradientHeightStyle">
					<div v-if="withShadow" class="bx-im-scroll-with-gradient__gradient-inner"></div>
				</div>
			</Transition>
			<div 
				class="bx-im-scroll-with-gradient__content" 
				:style="contentHeightStyle" 
				@scroll="onScroll"
				ref="scroll-container"
			>
				<slot></slot>
			</div>
			<Transition name="gradient-fade">
				<div v-if="showBottomGradient" class="bx-im-scroll-with-gradient__gradient --bottom" :style="gradientHeightStyle">
					<div v-if="withShadow" class="bx-im-scroll-with-gradient__gradient-inner"></div>
				</div>
			</Transition>
		</div>
	`
	};

	class UserService {
	  async loadReadUsers(messageId) {
	    im_v2_lib_logger.Logger.warn('Dialog-status: UserService: loadReadUsers', messageId);
	    const response = await im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.imV2ChatMessageTailViewers, {
	      id: messageId
	    }).catch(error => {
	      // eslint-disable-next-line no-console
	      console.error('Dialog-status: UserService: loadReadUsers error', error);
	      throw new Error(error);
	    });
	    const users = response.data().users;
	    const userManager = new im_v2_lib_user.UserManager();
	    await userManager.setUsersToModel(Object.values(users));
	    return users.map(user => user.id);
	  }
	}

	// @vue/component
	const AdditionalUsers = {
	  components: {
	    UserListPopup
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    show: {
	      type: Boolean,
	      required: true
	    },
	    bindElement: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {
	      showPopup: false,
	      loadingAdditionalUsers: false,
	      additionalUsers: []
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    }
	  },
	  watch: {
	    show(newValue, oldValue) {
	      if (!oldValue && newValue) {
	        this.showPopup = true;
	        void this.loadUsers();
	      }
	    }
	  },
	  methods: {
	    async loadUsers() {
	      this.loadingAdditionalUsers = true;
	      const userIds = await this.getUserService().loadReadUsers(this.dialog.lastMessageId).catch(() => {
	        this.loadingAdditionalUsers = false;
	      });
	      this.additionalUsers = this.prepareAdditionalUsers(userIds);
	      this.loadingAdditionalUsers = false;
	    },
	    onPopupClose() {
	      this.showPopup = false;
	      this.$emit('close');
	    },
	    prepareAdditionalUsers(userIds) {
	      const firstViewerId = this.dialog.lastMessageViews.firstViewer.userId;
	      return userIds.filter(userId => {
	        return userId !== im_v2_application_core.Core.getUserId() && userId !== firstViewerId;
	      });
	    },
	    getUserService() {
	      if (!this.userService) {
	        this.userService = new UserService();
	      }
	      return this.userService;
	    }
	  },
	  template: `
		<UserListPopup
			id="bx-im-dialog-read-users"
			:showPopup="showPopup"
			:loading="loadingAdditionalUsers"
			:userIds="additionalUsers"
			:contextDialogId="dialogId"
			:bindElement="bindElement || {}"
			:withAngle="false"
			:forceTop="true"
			@close="onPopupClose"
		/>
	`
	};

	const TYPING_USERS_COUNT = 3;
	const MORE_USERS_CSS_CLASS = 'bx-im-dialog-chat-status__user-count';

	// @vue/component
	const DialogStatus = {
	  components: {
	    AdditionalUsers
	  },
	  props: {
	    dialogId: {
	      required: true,
	      type: String
	    }
	  },
	  data() {
	    return {
	      showAdditionalUsers: false,
	      additionalUsersLinkElement: null
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isChat() {
	      return !this.isUser;
	    },
	    typingStatus() {
	      if (!this.dialog.inited || this.dialog.writingList.length === 0) {
	        return '';
	      }
	      const firstTypingUsers = this.dialog.writingList.slice(0, TYPING_USERS_COUNT);
	      const text = firstTypingUsers.map(element => element.userName).join(', ');
	      const remainingUsersCount = this.dialog.writingList.length - TYPING_USERS_COUNT;
	      if (remainingUsersCount > 0) {
	        return this.loc('IM_ELEMENTS_STATUS_TYPING_PLURAL_MORE', {
	          '#USERS#': text,
	          '#COUNT#': remainingUsersCount
	        });
	      }
	      if (this.dialog.writingList.length > 1) {
	        return this.loc('IM_ELEMENTS_STATUS_TYPING_PLURAL', {
	          '#USERS#': text
	        });
	      }
	      return this.loc('IM_ELEMENTS_STATUS_TYPING', {
	        '#USER#': text
	      });
	    },
	    readStatus() {
	      if (!this.dialog.inited) {
	        return '';
	      }
	      if (this.lastMessageViews.countOfViewers === 0) {
	        return '';
	      }
	      if (this.isUser) {
	        return this.formatUserViewStatus();
	      }
	      return this.formatChatViewStatus();
	    },
	    lastMessageViews() {
	      return this.dialog.lastMessageViews;
	    }
	  },
	  methods: {
	    formatUserViewStatus() {
	      const {
	        date
	      } = this.lastMessageViews.firstViewer;
	      return this.loc('IM_ELEMENTS_STATUS_READ_USER', {
	        '#DATE#': im_v2_lib_dateFormatter.DateFormatter.formatByTemplate(date, im_v2_lib_dateFormatter.DateTemplate.messageReadStatus)
	      });
	    },
	    formatChatViewStatus() {
	      const {
	        countOfViewers,
	        firstViewer
	      } = this.lastMessageViews;
	      if (countOfViewers === 1) {
	        return this.loc('IM_ELEMENTS_STATUS_READ_CHAT', {
	          '#USER#': main_core.Text.encode(firstViewer.userName)
	        });
	      }
	      return this.loc('IM_ELEMENTS_STATUS_READ_CHAT_PLURAL', {
	        '#USERS#': main_core.Text.encode(firstViewer.userName),
	        '#LINK_START#': `<span class="${MORE_USERS_CSS_CLASS}" ref="moreUsersLink">`,
	        '#COUNT#': countOfViewers - 1,
	        '#LINK_END#': '</span>'
	      });
	    },
	    onClick(event) {
	      if (!event.target.matches(`.${MORE_USERS_CSS_CLASS}`)) {
	        return;
	      }
	      this.onMoreUsersClick();
	    },
	    onMoreUsersClick() {
	      this.additionalUsersLinkElement = document.querySelector(`.${MORE_USERS_CSS_CLASS}`);
	      this.showAdditionalUsers = true;
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<div @click="onClick" class="bx-im-dialog-chat-status__container">
			<div v-if="typingStatus" class="bx-im-dialog-chat-status__content">
				<div class="bx-im-dialog-chat-status__icon --typing"></div>
				<div class="bx-im-dialog-chat-status__text">{{ typingStatus }}</div>
			</div>
			<div v-else-if="readStatus" class="bx-im-dialog-chat-status__content">
				<div class="bx-im-dialog-chat-status__icon --read"></div>
				<div v-html="readStatus" class="bx-im-dialog-chat-status__text"></div>
			</div>
			<AdditionalUsers
				:dialogId="dialogId"
				:show="showAdditionalUsers"
				:bindElement="additionalUsersLinkElement || {}"
				@close="showAdditionalUsers = false"
			/>
		</div>
	`
	};

	const POPUP_ID$2 = 'im-create-chat-promo-popup';

	// @vue/component
	const PromoPopup = {
	  name: 'PromoPopup',
	  components: {
	    MessengerPopup
	  },
	  emits: ['close'],
	  computed: {
	    POPUP_ID: () => POPUP_ID$2,
	    config() {
	      return {
	        width: 492,
	        padding: 0,
	        overlay: true,
	        autoHide: false,
	        closeByEsc: false
	      };
	    }
	  },
	  template: `
		<MessengerPopup
			:config="config"
			@close="$emit('close')"
			:id="POPUP_ID"
		>
			<slot></slot>
		</MessengerPopup>
	`
	};

	var nm = "Anim 23";
	var v = "5.9.6";
	var fr = 60;
	var ip = 0;
	var op = 257.0000014305115;
	var w = 428;
	var h = 172;
	var ddd = 0;
	var markers = [];
	var assets = [{
	  nm: "A 3",
	  fr: 60,
	  id: "410:308",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 5,
	    hd: false,
	    nm: "A 3 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [382, 194],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [382, 107]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 6,
	    hd: false,
	    nm: "Anim 23 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 172], [428, 172], [0, 172], [0, 172], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "cont3",
	  fr: 60,
	  id: "410:310",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 7,
	    hd: false,
	    nm: "A 3 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [382, 194],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [382, 107]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 8,
	    hd: false,
	    nm: "cont3 - Null",
	    parent: 7,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 9,
	    ty: 0,
	    nm: "A 3",
	    td: 1,
	    refId: "410:308",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 10,
	    hd: false,
	    nm: "Anim 23 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 172], [428, 172], [0, 172], [0, 172], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 2",
	  fr: 60,
	  id: "405:636",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 16,
	    hd: false,
	    nm: "A 2 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 114.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [60, 181],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 114.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 174.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 17,
	    hd: false,
	    nm: "Anim 23 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 114.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 172], [428, 172], [0, 172], [0, 172], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "cont2",
	  fr: 60,
	  id: "405:638",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 18,
	    hd: false,
	    nm: "A 2 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 114.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [60, 181],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 114.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 174.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 19,
	    hd: false,
	    nm: "cont2 - Null",
	    parent: 18,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 20,
	    ty: 0,
	    nm: "A 2",
	    td: 1,
	    refId: "405:636",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 21,
	    hd: false,
	    nm: "Anim 23 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 172], [428, 172], [0, 172], [0, 172], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 1",
	  fr: 60,
	  id: "410:297",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 27,
	    hd: false,
	    nm: "A 1 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [4],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 174.00000071525574,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [60, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, -80]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 28,
	    hd: false,
	    nm: "Anim 23 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [4],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 174.00000071525574,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 172], [428, 172], [0, 172], [0, 172], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "cont1",
	  fr: 60,
	  id: "410:300",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 29,
	    hd: false,
	    nm: "A 1 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [4],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 174.00000071525574,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [60, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, -80]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 30,
	    hd: false,
	    nm: "cont1 - Null",
	    parent: 29,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [46, 13.73]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 31,
	    ty: 0,
	    nm: "A 1",
	    td: 1,
	    refId: "410:297",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 32,
	    hd: false,
	    nm: "Anim 23 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 172], [428, 172], [0, 172], [0, 172], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1590 - Null / Rectangle 1590 / Rectangle 1590 / Rectangle 1589 - Null / Rectangle 1589 / Rectangle 1589 / Rectangle 1592 - Null / Rectangle 1592 / Rectangle 1592 / Rectangle 1591 - Null / Rectangle 1591 / Rectangle 1591 / Rectangle 1588 - Null / Rectangle 1588 / Rectangle 1588",
	  fr: 60,
	  id: "ljwkeu9112alnhm752p",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 38,
	    hd: false,
	    nm: "A 3 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [382, 194],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [382, 107]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 39,
	    hd: false,
	    nm: "cont3 - Null",
	    parent: 38,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 40,
	    hd: false,
	    nm: "3 - Null",
	    parent: 39,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [17, 13.73]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 41,
	    hd: false,
	    nm: "Rectangle 1590 - Null",
	    parent: 40,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 29.27]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 42,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 41,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [76, 0], [78, 2], [78, 2], [76, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 43,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 41,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [76, 0], [78, 2], [78, 2], [76, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [39.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [158, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 44,
	    hd: false,
	    nm: "Rectangle 1589 - Null",
	    parent: 40,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 20.27]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 45,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 44,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [172, 0], [174, 2], [174, 2], [172, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 46,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 44,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [172, 0], [174, 2], [174, 2], [172, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [87.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [350, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 47,
	    hd: false,
	    nm: "Rectangle 1592 - Null",
	    parent: 40,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [40.651400000000024, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 48,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 47,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [9.6124, 0], [11.6124, 2], [11.6124, 2], [9.6124, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000007, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 49,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 47,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [9.6124, 0], [11.6124, 2], [11.6124, 2], [9.6124, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000007, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [6.3062, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [25.2248, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 50,
	    hd: false,
	    nm: "Rectangle 1591 - Null",
	    parent: 40,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0.007799999999974716, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 51,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 50,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [32.8372, 0], [34.8372, 2], [34.8372, 2], [32.8372, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 52,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 50,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [32.8372, 0], [34.8372, 2], [34.8372, 2], [32.8372, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [17.9186, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [71.6744, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 53,
	    hd: false,
	    nm: "Rectangle 1588 - Null",
	    parent: 40,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 12.27]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 54,
	    hd: false,
	    nm: "Rectangle 1588",
	    parent: 53,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [205, 0], [207, 2], [207, 2], [205, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 55,
	    hd: false,
	    nm: "Rectangle 1588",
	    parent: 53,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [205, 0], [207, 2], [207, 2], [205, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [104, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [416, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] 3 / Rectangle 3 - Null / Rectangle 3 / Rectangle 3",
	  fr: 60,
	  id: "ljwkeu91si44f2dxsr",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 56,
	    hd: false,
	    nm: "A 3 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [382, 194],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [382, 107]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 57,
	    hd: false,
	    nm: "cont3 - Null",
	    parent: 56,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 58,
	    ty: 0,
	    nm: "3",
	    refId: "ljwkeu9112alnhm752p",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 59,
	    hd: false,
	    nm: "Rectangle 3 - Null",
	    parent: 57,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 64]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 60,
	    hd: false,
	    nm: "Rectangle 3",
	    parent: 59,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [228, 0], [229.5608, 0.1536], [231.0616, 0.6088], [232.4448, 1.348], [233.6568, 2.3432], [234.652, 3.5552], [235.3912, 4.9384], [235.8464, 6.4392], [236, 8], [236, 56], [235.8464, 57.5608], [235.3912, 59.0616], [234.652, 60.4448], [233.6568, 61.6568], [232.4448, 62.652], [231.0616, 63.3912], [229.5608, 63.8464], [228, 64], [15.2615, 64], [13.7007, 63.8464], [12.1999, 63.3912], [10.8167, 62.652], [9.6047, 61.6568], [8.6095, 60.4448], [7.8703, 59.0616], [7.4151, 57.5608], [7.2615, 56], [7.2615, 6.5143], [7.2269, 5.8162], [7.1238, 5.1246], [6.9521, 4.447], [6.7147, 3.7892], [6.4137, 3.1583], [6.0512, 2.5598], [0, 0], [0, 0]],
	            i: [[0, 0], [-0.5304, 0], [-0.52, -0.1032], [-0.4904, -0.2032], [-0.4408, -0.2944], [-0.3752, -0.3752], [-0.2944, -0.4408], [-0.2032, -0.4904], [-0.1032, -0.52], [0, -0.5304], [0, -0.5304], [0.1032, -0.52], [0.2032, -0.4904], [0.2944, -0.4408], [0.3752, -0.3752], [0.4408, -0.2944], [0.4904, -0.2032], [0.52, -0.1032], [0.5304, 0], [0.5304, 0], [0.52, 0.1032], [0.4904, 0.2032], [0.4408, 0.2944], [0.3752, 0.3752], [0.2944, 0.4408], [0.2032, 0.4904], [0.1032, 0.52], [0, 0.5304], [0, 0.2388], [0.0233, 0.2374], [0.0466, 0.2339], [0.0699, 0.2282], [0.0918, 0.2204], [0.1138, 0.2098], [0.1335, 0.1978], [4.8411, 0.7681], [0, 0]],
	            o: [[2.4205, 0.0001], [0.530399999999986, 0], [0.5200000000000102, 0.10319999999999999], [0.49039999999999395, 0.20320000000000005], [0.44079999999999586, 0.2944], [0.37520000000000664, 0.3752], [0.294399999999996, 0.44079999999999986], [0.2032000000000096, 0.49040000000000017], [0.10319999999998686, 0.5199999999999996], [0, 0.5304000000000002], [0, 0.5304000000000002], [-0.10319999999998686, 0.5200000000000031], [-0.2032000000000096, 0.49040000000000106], [-0.294399999999996, 0.44080000000000297], [-0.37520000000000664, 0.37519999999999953], [-0.44079999999999586, 0.2944000000000031], [-0.49039999999999395, 0.2032000000000025], [-0.5200000000000102, 0.10320000000000107], [-0.530399999999986, 0], [-0.5304000000000002, 0], [-0.5199999999999996, -0.10320000000000107], [-0.4903999999999993, -0.2032000000000025], [-0.4407999999999994, -0.2944000000000031], [-0.37519999999999953, -0.37519999999999953], [-0.29439999999999955, -0.44080000000000297], [-0.20319999999999983, -0.49040000000000106], [-0.10320000000000018, -0.5200000000000031], [0, -0.5304000000000002], [0, -0.23880000000000035], [-0.023299999999999876, -0.23740000000000006], [-0.04659999999999975, -0.23390000000000022], [-0.06989999999999963, -0.22820000000000018], [-0.0918000000000001, -0.22040000000000015], [-0.11380000000000035, -0.2098], [-0.13349999999999973, -0.19779999999999998], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 61,
	    hd: false,
	    nm: "Rectangle 3",
	    parent: 59,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [228, 0], [229.5608, 0.1536], [231.0616, 0.6088], [232.4448, 1.348], [233.6568, 2.3432], [234.652, 3.5552], [235.3912, 4.9384], [235.8464, 6.4392], [236, 8], [236, 56], [235.8464, 57.5608], [235.3912, 59.0616], [234.652, 60.4448], [233.6568, 61.6568], [232.4448, 62.652], [231.0616, 63.3912], [229.5608, 63.8464], [228, 64], [15.2615, 64], [13.7007, 63.8464], [12.1999, 63.3912], [10.8167, 62.652], [9.6047, 61.6568], [8.6095, 60.4448], [7.8703, 59.0616], [7.4151, 57.5608], [7.2615, 56], [7.2615, 6.5143], [7.2269, 5.8162], [7.1238, 5.1246], [6.9521, 4.447], [6.7147, 3.7892], [6.4137, 3.1583], [6.0512, 2.5598], [0, 0], [0, 0]],
	            i: [[0, 0], [-0.5304, 0], [-0.52, -0.1032], [-0.4904, -0.2032], [-0.4408, -0.2944], [-0.3752, -0.3752], [-0.2944, -0.4408], [-0.2032, -0.4904], [-0.1032, -0.52], [0, -0.5304], [0, -0.5304], [0.1032, -0.52], [0.2032, -0.4904], [0.2944, -0.4408], [0.3752, -0.3752], [0.4408, -0.2944], [0.4904, -0.2032], [0.52, -0.1032], [0.5304, 0], [0.5304, 0], [0.52, 0.1032], [0.4904, 0.2032], [0.4408, 0.2944], [0.3752, 0.3752], [0.2944, 0.4408], [0.2032, 0.4904], [0.1032, 0.52], [0, 0.5304], [0, 0.2388], [0.0233, 0.2374], [0.0466, 0.2339], [0.0699, 0.2282], [0.0918, 0.2204], [0.1138, 0.2098], [0.1335, 0.1978], [4.8411, 0.7681], [0, 0]],
	            o: [[2.4205, 0.0001], [0.530399999999986, 0], [0.5200000000000102, 0.10319999999999999], [0.49039999999999395, 0.20320000000000005], [0.44079999999999586, 0.2944], [0.37520000000000664, 0.3752], [0.294399999999996, 0.44079999999999986], [0.2032000000000096, 0.49040000000000017], [0.10319999999998686, 0.5199999999999996], [0, 0.5304000000000002], [0, 0.5304000000000002], [-0.10319999999998686, 0.5200000000000031], [-0.2032000000000096, 0.49040000000000106], [-0.294399999999996, 0.44080000000000297], [-0.37520000000000664, 0.37519999999999953], [-0.44079999999999586, 0.2944000000000031], [-0.49039999999999395, 0.2032000000000025], [-0.5200000000000102, 0.10320000000000107], [-0.530399999999986, 0], [-0.5304000000000002, 0], [-0.5199999999999996, -0.10320000000000107], [-0.4903999999999993, -0.2032000000000025], [-0.4407999999999994, -0.2944000000000031], [-0.37519999999999953, -0.37519999999999953], [-0.29439999999999955, -0.44080000000000297], [-0.20319999999999983, -0.49040000000000106], [-0.10320000000000018, -0.5200000000000031], [0, -0.5304000000000002], [0, -0.23880000000000035], [-0.023299999999999876, -0.23740000000000006], [-0.04659999999999975, -0.23390000000000022], [-0.06989999999999963, -0.22820000000000018], [-0.0918000000000001, -0.22040000000000015], [-0.11380000000000035, -0.2098], [-0.13349999999999973, -0.19779999999999998], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [118.5, 32.5]
	        },
	        s: {
	          a: 0,
	          k: [474, 130]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] cont3 / Ellipse 3 - Null / Ellipse 3 / Ellipse 3",
	  fr: 60,
	  id: "ljwkeu91ewddnaz26q",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 62,
	    hd: false,
	    nm: "A 3 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [382, 194],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [382, 107]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 63,
	    ty: 0,
	    nm: "cont3",
	    refId: "ljwkeu91si44f2dxsr",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 64,
	    hd: false,
	    nm: "Ellipse 3 - Null",
	    parent: 62,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 39]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 65,
	    hd: false,
	    nm: "Ellipse 3",
	    parent: 64,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [12.5, 25], [0, 12.5], [12.5, 0], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [6.9036, 0], [0, 6.9036], [-6.9036, 0], [0, -6.9036], [0, 0]],
	            o: [[0, 6.903559999999999], [-6.90356, 0], [0, -6.90356], [6.903559999999999, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 66,
	    hd: false,
	    nm: "Ellipse 3",
	    parent: 64,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [12.5, 25], [0, 12.5], [12.5, 0], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [6.9036, 0], [0, 6.9036], [-6.9036, 0], [0, -6.9036], [0, 0]],
	            o: [[0, 6.903559999999999], [-6.90356, 0], [0, -6.90356], [6.903559999999999, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [13, 13]
	        },
	        s: {
	          a: 0,
	          k: [52, 52]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1592 - Null / Rectangle 1592 / Rectangle 1592 / Rectangle 1591 - Null / Rectangle 1591 / Rectangle 1591 / Rectangle 1593 - Null / Rectangle 1593 / Rectangle 1593",
	  fr: 60,
	  id: "ljwkeu98518darxkuyo",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 67,
	    hd: false,
	    nm: "A 2 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 114.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [60, 181],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 114.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 174.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 68,
	    hd: false,
	    nm: "cont2 - Null",
	    parent: 67,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 69,
	    hd: false,
	    nm: "2 - Null",
	    parent: 68,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [17, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 70,
	    hd: false,
	    nm: "Rectangle 1592 - Null",
	    parent: 69,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 71,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 70,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [16, 0], [18, 2], [18, 2], [16, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.104569999999999, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 72,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 70,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [16, 0], [18, 2], [18, 2], [16, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.104569999999999, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [9.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [38, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 73,
	    hd: false,
	    nm: "Rectangle 1591 - Null",
	    parent: 69,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 74,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 73,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [49, 0], [51, 2], [51, 2], [49, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 75,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 73,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [49, 0], [51, 2], [51, 2], [49, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [26, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [104, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 76,
	    hd: false,
	    nm: "Rectangle 1593 - Null",
	    parent: 69,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      },
	      p: {
	        a: 0,
	        k: [0, 11]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 77,
	    hd: false,
	    nm: "Rectangle 1593",
	    parent: 76,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[6, 0], [225, 0], [231, 6], [231, 58], [225, 64], [6, 64], [0, 58], [0, 6], [6, 0], [6, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0], [-3.3137, 0], [0, 0]],
	            o: [[0, 0], [3.313709999999986, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, -3.31371], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 78,
	    hd: false,
	    nm: "Rectangle 1593",
	    parent: 76,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[6, 0], [225, 0], [231, 6], [231, 58], [225, 64], [6, 64], [0, 58], [0, 6], [6, 0], [6, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0], [-3.3137, 0], [0, 0]],
	            o: [[0, 0], [3.313709999999986, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, -3.31371], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [116, 32.5]
	        },
	        s: {
	          a: 0,
	          k: [464, 130]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] 2 / Rectangle 2 - Null / Rectangle 2 / Rectangle 2",
	  fr: 60,
	  id: "ljwkeu97ngsbn04wt0a",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 79,
	    hd: false,
	    nm: "A 2 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 114.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [60, 181],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 114.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 174.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 80,
	    hd: false,
	    nm: "cont2 - Null",
	    parent: 79,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 81,
	    ty: 0,
	    nm: "2",
	    refId: "ljwkeu98518darxkuyo",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 82,
	    hd: false,
	    nm: "Rectangle 2 - Null",
	    parent: 80,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 98]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 83,
	    hd: false,
	    nm: "Rectangle 2",
	    parent: 82,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [249, 0], [250.5608, 0.1536], [252.0616, 0.6088], [253.4448, 1.348], [254.6568, 2.3432], [255.652, 3.5552], [256.3912, 4.9384], [256.8464, 6.4392], [257, 8], [257, 90], [256.8464, 91.5608], [256.3912, 93.0616], [255.652, 94.4448], [254.6568, 95.6568], [253.4448, 96.652], [252.0616, 97.3912], [250.5608, 97.8464], [249, 98], [15.9077, 98], [14.3469, 97.8464], [12.8461, 97.3912], [11.4629, 96.652], [10.2509, 95.6568], [9.2557, 94.4448], [8.5165, 93.0616], [8.0613, 91.5608], [7.9077, 90], [7.9077, 8.4857], [7.8757, 7.7705], [7.7797, 7.0601], [7.6205, 6.3625], [7.3997, 5.6809], [7.1189, 5.0217], [0, 0], [0, 0]],
	            i: [[0, 0], [-0.5304, 0], [-0.52, -0.1032], [-0.4904, -0.2032], [-0.4408, -0.2944], [-0.3752, -0.3752], [-0.2944, -0.4408], [-0.2032, -0.4904], [-0.1032, -0.52], [0, -0.5304], [0, -0.5304], [0.1032, -0.52], [0.2032, -0.4904], [0.2944, -0.4408], [0.3752, -0.3752], [0.4408, -0.2944], [0.4904, -0.2032], [0.52, -0.1032], [0.5304, 0], [0.5304, 0], [0.52, 0.1032], [0.4904, 0.2032], [0.4408, 0.2944], [0.3752, 0.3752], [0.2944, 0.4408], [0.2032, 0.4904], [0.1032, 0.52], [0, 0.5304], [0, 0.2472], [0.0224, 0.2464], [0.044, 0.2432], [0.0656, 0.2384], [0.0864, 0.2312], [0.1072, 0.2232], [5.2718, 1.1762], [0, 0]],
	            o: [[2.6359, 0.0002], [0.530399999999986, 0], [0.5200000000000102, 0.10319999999999999], [0.49039999999999395, 0.20320000000000005], [0.44079999999999586, 0.2944], [0.37520000000000664, 0.3752], [0.294399999999996, 0.44079999999999986], [0.20319999999998117, 0.49040000000000017], [0.10320000000001528, 0.5199999999999996], [0, 0.5304000000000002], [0, 0.5304000000000002], [-0.10320000000001528, 0.519999999999996], [-0.20319999999998117, 0.49039999999999395], [-0.294399999999996, 0.44079999999999586], [-0.37520000000000664, 0.37520000000000664], [-0.44079999999999586, 0.294399999999996], [-0.49039999999999395, 0.20319999999999538], [-0.5200000000000102, 0.10320000000000107], [-0.530399999999986, 0], [-0.5304000000000002, 0], [-0.5199999999999996, -0.10320000000000107], [-0.4903999999999993, -0.20319999999999538], [-0.4407999999999994, -0.294399999999996], [-0.37519999999999953, -0.37520000000000664], [-0.29439999999999955, -0.44079999999999586], [-0.2032000000000007, -0.49039999999999395], [-0.10320000000000018, -0.519999999999996], [0, -0.5304000000000002], [0, -0.24719999999999942], [-0.022400000000000198, -0.2464000000000004], [-0.043999999999999595, -0.24319999999999986], [-0.06559999999999988, -0.2384000000000004], [-0.08640000000000025, -0.2312000000000003], [-0.10719999999999974, -0.2232000000000003], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 84,
	    hd: false,
	    nm: "Rectangle 2",
	    parent: 82,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [249, 0], [250.5608, 0.1536], [252.0616, 0.6088], [253.4448, 1.348], [254.6568, 2.3432], [255.652, 3.5552], [256.3912, 4.9384], [256.8464, 6.4392], [257, 8], [257, 90], [256.8464, 91.5608], [256.3912, 93.0616], [255.652, 94.4448], [254.6568, 95.6568], [253.4448, 96.652], [252.0616, 97.3912], [250.5608, 97.8464], [249, 98], [15.9077, 98], [14.3469, 97.8464], [12.8461, 97.3912], [11.4629, 96.652], [10.2509, 95.6568], [9.2557, 94.4448], [8.5165, 93.0616], [8.0613, 91.5608], [7.9077, 90], [7.9077, 8.4857], [7.8757, 7.7705], [7.7797, 7.0601], [7.6205, 6.3625], [7.3997, 5.6809], [7.1189, 5.0217], [0, 0], [0, 0]],
	            i: [[0, 0], [-0.5304, 0], [-0.52, -0.1032], [-0.4904, -0.2032], [-0.4408, -0.2944], [-0.3752, -0.3752], [-0.2944, -0.4408], [-0.2032, -0.4904], [-0.1032, -0.52], [0, -0.5304], [0, -0.5304], [0.1032, -0.52], [0.2032, -0.4904], [0.2944, -0.4408], [0.3752, -0.3752], [0.4408, -0.2944], [0.4904, -0.2032], [0.52, -0.1032], [0.5304, 0], [0.5304, 0], [0.52, 0.1032], [0.4904, 0.2032], [0.4408, 0.2944], [0.3752, 0.3752], [0.2944, 0.4408], [0.2032, 0.4904], [0.1032, 0.52], [0, 0.5304], [0, 0.2472], [0.0224, 0.2464], [0.044, 0.2432], [0.0656, 0.2384], [0.0864, 0.2312], [0.1072, 0.2232], [5.2718, 1.1762], [0, 0]],
	            o: [[2.6359, 0.0002], [0.530399999999986, 0], [0.5200000000000102, 0.10319999999999999], [0.49039999999999395, 0.20320000000000005], [0.44079999999999586, 0.2944], [0.37520000000000664, 0.3752], [0.294399999999996, 0.44079999999999986], [0.20319999999998117, 0.49040000000000017], [0.10320000000001528, 0.5199999999999996], [0, 0.5304000000000002], [0, 0.5304000000000002], [-0.10320000000001528, 0.519999999999996], [-0.20319999999998117, 0.49039999999999395], [-0.294399999999996, 0.44079999999999586], [-0.37520000000000664, 0.37520000000000664], [-0.44079999999999586, 0.294399999999996], [-0.49039999999999395, 0.20319999999999538], [-0.5200000000000102, 0.10320000000000107], [-0.530399999999986, 0], [-0.5304000000000002, 0], [-0.5199999999999996, -0.10320000000000107], [-0.4903999999999993, -0.20319999999999538], [-0.4407999999999994, -0.294399999999996], [-0.37519999999999953, -0.37520000000000664], [-0.29439999999999955, -0.44079999999999586], [-0.2032000000000007, -0.49039999999999395], [-0.10320000000000018, -0.519999999999996], [0, -0.5304000000000002], [0, -0.24719999999999942], [-0.022400000000000198, -0.2464000000000004], [-0.043999999999999595, -0.24319999999999986], [-0.06559999999999988, -0.2384000000000004], [-0.08640000000000025, -0.2312000000000003], [-0.10719999999999974, -0.2232000000000003], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [129, 49.5]
	        },
	        s: {
	          a: 0,
	          k: [516, 198]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: [{
	      nm: "DropShadow",
	      ty: 25,
	      en: 1,
	      ef: [{
	        ty: 2,
	        v: {
	          a: 1,
	          k: [{
	            t: 96,
	            s: [0, 0, 0, 1],
	            o: {
	              x: [0],
	              y: [0]
	            },
	            i: {
	              x: [0.15],
	              y: [1]
	            }
	          }, {
	            t: 114.00000071525574,
	            s: [0, 0, 0, 1]
	          }]
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 1,
	          k: [{
	            t: 96,
	            s: [10],
	            o: {
	              x: [0],
	              y: [0]
	            },
	            i: {
	              x: [0.15],
	              y: [1]
	            }
	          }, {
	            t: 114.00000071525574,
	            s: [0]
	          }]
	        }
	      }, {
	        ty: 1,
	        v: {
	          a: 0,
	          k: 1.5707963267948966
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: -1
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 3
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "[GROUP] cont2 / Ellipse 2 - Null / Ellipse 2 / Ellipse 2",
	  fr: 60,
	  id: "ljwkeu97566xvua8q9p",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 85,
	    hd: false,
	    nm: "A 2 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 114.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [60, 181],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 114.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 174.00000071525574,
	          s: [60, 73],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 86,
	    ty: 0,
	    nm: "cont2",
	    refId: "ljwkeu97ngsbn04wt0a",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 87,
	    hd: false,
	    nm: "Ellipse 2 - Null",
	    parent: 85,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 73]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 88,
	    hd: false,
	    nm: "Ellipse 2",
	    parent: 87,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [12.5, 25], [0, 12.5], [12.5, 0], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [6.9036, 0], [0, 6.9036], [-6.9036, 0], [0, -6.9036], [0, 0]],
	            o: [[0, 6.903559999999999], [-6.90356, 0], [0, -6.90356], [6.903559999999999, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 89,
	    hd: false,
	    nm: "Ellipse 2",
	    parent: 87,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [12.5, 25], [0, 12.5], [12.5, 0], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [6.9036, 0], [0, 6.9036], [-6.9036, 0], [0, -6.9036], [0, 0]],
	            o: [[0, 6.903559999999999], [-6.90356, 0], [0, -6.90356], [6.903559999999999, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [13, 13]
	        },
	        s: {
	          a: 0,
	          k: [52, 52]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1590 - Null / Rectangle 1590 / Rectangle 1590 / Rectangle 1589 - Null / Rectangle 1589 / Rectangle 1589 / Rectangle 1592 - Null / Rectangle 1592 / Rectangle 1592 / Rectangle 1591 - Null / Rectangle 1591 / Rectangle 1591 / Rectangle 1588 - Null / Rectangle 1588 / Rectangle 1588",
	  fr: 60,
	  id: "ljwkeu9det9tk030otk",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 90,
	    hd: false,
	    nm: "A 1 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [4],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 174.00000071525574,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [60, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, -80]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 91,
	    hd: false,
	    nm: "cont1 - Null",
	    parent: 90,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [46, 13.73]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 92,
	    hd: false,
	    nm: "1 - Null",
	    parent: 91,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 93,
	    hd: false,
	    nm: "Rectangle 1590 - Null",
	    parent: 92,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 29.2676]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 94,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 93,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [76, 0], [78, 2], [78, 2], [76, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 95,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 93,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [76, 0], [78, 2], [78, 2], [76, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [39.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [158, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 96,
	    hd: false,
	    nm: "Rectangle 1589 - Null",
	    parent: 92,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 20.2676]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 97,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 96,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [172, 0], [174, 2], [174, 2], [172, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 98,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 96,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [172, 0], [174, 2], [174, 2], [172, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [87.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [350, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 99,
	    hd: false,
	    nm: "Rectangle 1592 - Null",
	    parent: 92,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [40.651399999999995, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 100,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 99,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [9.6124, 0], [11.6124, 2], [11.6124, 2], [9.6124, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000007, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 101,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 99,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [9.6124, 0], [11.6124, 2], [11.6124, 2], [9.6124, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000007, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [6.3062, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [25.2248, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 102,
	    hd: false,
	    nm: "Rectangle 1591 - Null",
	    parent: 92,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0.007800000000003138, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 103,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 102,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [32.8372, 0], [34.8372, 2], [34.8372, 2], [32.8372, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 104,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 102,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [32.8372, 0], [34.8372, 2], [34.8372, 2], [32.8372, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [17.9186, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [71.6744, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 105,
	    hd: false,
	    nm: "Rectangle 1588 - Null",
	    parent: 92,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 12.27]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 106,
	    hd: false,
	    nm: "Rectangle 1588",
	    parent: 105,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [205, 0], [207, 2], [207, 2], [205, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 107,
	    hd: false,
	    nm: "Rectangle 1588",
	    parent: 105,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [205, 0], [207, 2], [207, 2], [205, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [104, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [416, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] 1",
	  fr: 60,
	  id: "ljwkeu9dmspnbua2tyg",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 108,
	    hd: false,
	    nm: "A 1 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [4],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 174.00000071525574,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [60, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, -80]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 109,
	    hd: false,
	    nm: "cont1 - Null",
	    parent: 108,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [46, 13.73]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 110,
	    ty: 0,
	    nm: "1",
	    refId: "ljwkeu9det9tk030otk",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }]
	}, {
	  nm: "[GROUP] cont1 / Rectangle 1 - Null / Rectangle 1 / Rectangle 1 / Ellipse 1 - Null / Ellipse 1 / Ellipse 1",
	  fr: 60,
	  id: "ljwkeu9dma2e2m1rlsa",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 111,
	    hd: false,
	    nm: "A 1 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [4],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 174.00000071525574,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [60, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 192.00000143051147,
	          s: [60, -80]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 112,
	    ty: 0,
	    nm: "cont1",
	    refId: "ljwkeu9dmspnbua2tyg",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 113,
	    hd: false,
	    nm: "Rectangle 1 - Null",
	    parent: 111,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [30],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [30, 61],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 66,
	          s: [25, 64]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 114,
	    hd: false,
	    nm: "Rectangle 1",
	    parent: 113,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [30],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100]
	        }]
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 1,
	          k: [{
	            t: 48,
	            s: [{
	              c: true,
	              v: [[9.0197, 0], [221, 0], [222.5608, 0.1536], [224.0616, 0.6088], [225.4448, 1.348], [226.6568, 2.3432], [227.652, 3.5552], [228.3912, 4.9384], [228.8464, 6.4392], [229, 8], [229, 53], [228.8464, 54.5608], [228.3912, 56.0616], [227.652, 57.4448], [226.6568, 58.6568], [225.4448, 59.652], [224.0616, 60.3912], [222.5608, 60.8464], [221, 61], [12.5099, 61], [10.9491, 60.8464], [9.4483, 60.3912], [8.0651, 59.652], [6.8531, 58.6568], [5.8579, 57.4448], [5.1187, 56.0616], [4.6635, 54.5608], [4.5099, 53], [4.5099, 8.8104], [4.4659, 7.9744], [4.3355, 7.148], [4.1187, 6.34], [3.8195, 5.5584], [3.4395, 4.8128], [2.9843, 4.1112], [2.2548, 3.1067], [2.0422, 2.7336], [1.9161, 2.3231], [1.8826, 1.895], [1.9432, 1.47], [2.0951, 1.0683], [2.3309, 0.7094], [2.6393, 0.4106], [3.0053, 0.1863], [3.4117, 0.0473], [3.8384, 0.0002], [9.0197, 0], [9.0197, 0]],
	              i: [[0, 0], [-0.5304, 0], [-0.52, -0.1032], [-0.4904, -0.2032], [-0.4408, -0.2944], [-0.3752, -0.3752], [-0.2944, -0.4408], [-0.2032, -0.4904], [-0.1032, -0.52], [0, -0.5304], [0, -0.5304], [0.1032, -0.52], [0.2032, -0.4904], [0.2944, -0.4408], [0.3752, -0.3752], [0.4408, -0.2944], [0.4904, -0.2032], [0.52, -0.1032], [0.5304, 0], [0.5304, 0], [0.52, 0.1032], [0.4904, 0.2032], [0.4408, 0.2944], [0.3752, 0.3752], [0.2944, 0.4408], [0.2032, 0.4904], [0.1032, 0.52], [0, 0.5304], [0, 0.2856], [0.0296, 0.284], [0.0592, 0.2792], [0.088, 0.272], [0.116, 0.2608], [0.1424, 0.2472], [0.168, 0.2312], [0.0849, 0.117], [0.0574, 0.1327], [0.027, 0.1421], [-0.0046, 0.1445], [-0.0359, 0.14], [-0.0656, 0.1289], [-0.0922, 0.1114], [-0.1144, 0.0886], [-0.1309, 0.0616], [-0.1411, 0.0316], [-0.1446, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0.530399999999986, 0], [0.5200000000000102, 0.10319999999999999], [0.49039999999999395, 0.20320000000000005], [0.44079999999999586, 0.2944], [0.37520000000000664, 0.3752], [0.294399999999996, 0.44079999999999986], [0.2032000000000096, 0.49040000000000017], [0.10319999999998686, 0.5199999999999996], [0, 0.5304000000000002], [0, 0.5304000000000002], [-0.10319999999998686, 0.5200000000000031], [-0.2032000000000096, 0.49040000000000106], [-0.294399999999996, 0.44080000000000297], [-0.37520000000000664, 0.37519999999999953], [-0.44079999999999586, 0.2944000000000031], [-0.49039999999999395, 0.2032000000000025], [-0.5200000000000102, 0.10320000000000107], [-0.530399999999986, 0], [-0.5304000000000002, 0], [-0.5199999999999996, -0.10320000000000107], [-0.4903999999999993, -0.2032000000000025], [-0.4408000000000003, -0.2944000000000031], [-0.3752000000000004, -0.37519999999999953], [-0.29440000000000044, -0.44080000000000297], [-0.20319999999999983, -0.49040000000000106], [-0.10320000000000018, -0.5200000000000031], [0, -0.5304000000000002], [0, -0.2856000000000005], [-0.029600000000000293, -0.2839999999999998], [-0.0591999999999997, -0.27920000000000034], [-0.08800000000000008, -0.27200000000000024], [-0.1160000000000001, -0.2607999999999997], [-0.14239999999999986, -0.2472000000000003], [-0.16800000000000015, -0.23119999999999985], [-0.0849000000000002, -0.11699999999999999], [-0.057399999999999896, -0.13269999999999982], [-0.026999999999999913, -0.14210000000000012], [0.0045999999999999375, -0.14450000000000007], [0.03590000000000004, -0.1399999999999999], [0.06559999999999988, -0.12890000000000001], [0.09220000000000006, -0.11139999999999994], [0.11439999999999984, -0.08860000000000001], [0.13090000000000002, -0.0616], [0.14110000000000023, -0.0316], [0.14460000000000006, 0], [0, 0], [0, 0]]
	            }],
	            o: {
	              x: [0],
	              y: [0]
	            },
	            i: {
	              x: [1],
	              y: [1]
	            }
	          }, {
	            t: 66,
	            s: [{
	              c: true,
	              v: [[9.6105, 0], [235.476, 0], [237.139, 0.1611], [238.7381, 0.6387], [240.2119, 1.4143], [241.5033, 2.4584], [242.5637, 3.73], [243.3513, 5.1812], [243.8363, 6.7558], [244, 8.3934], [244, 55.6065], [243.8363, 57.2441], [243.3513, 58.8187], [242.5637, 60.2699], [241.5033, 61.5415], [240.2119, 62.5856], [238.7381, 63.3612], [237.139, 63.8388], [235.476, 64], [13.3293, 64], [11.6663, 63.8389], [10.0672, 63.3613], [8.5934, 62.5858], [7.302, 61.5417], [6.2416, 60.2701], [5.454, 58.8189], [4.969, 57.2443], [4.8053, 55.6067], [4.8053, 9.2438], [4.7584, 8.3667], [4.6195, 7.4997], [4.3885, 6.652], [4.0697, 5.832], [3.6648, 5.0497], [3.1798, 4.3136], [2.4025, 3.2597], [2.176, 2.8683], [2.0416, 2.4376], [2.0059, 1.9885], [2.0705, 1.5426], [2.2324, 1.1211], [2.4837, 0.7446], [2.8123, 0.4311], [3.2023, 0.1958], [3.6353, 0.05], [4.09, 0.0006], [9.6107, 0.0004], [9.6105, 0]],
	              i: [[0, 0], [-0.5651, 0], [-0.5541, -0.1083], [-0.5225, -0.2132], [-0.4697, -0.3089], [-0.3998, -0.3937], [-0.3137, -0.4625], [-0.2165, -0.5145], [-0.11, -0.5456], [0, -0.5565], [0, -0.5565], [0.11, -0.5456], [0.2165, -0.5145], [0.3137, -0.4625], [0.3998, -0.3937], [0.4697, -0.3089], [0.5225, -0.2132], [0.5541, -0.1083], [0.5651, 0], [0.5651, 0], [0.5541, 0.1083], [0.5225, 0.2132], [0.4697, 0.3089], [0.3998, 0.3937], [0.3137, 0.4625], [0.2165, 0.5145], [0.11, 0.5456], [0, 0.5565], [0, 0.2996], [0.0315, 0.298], [0.0631, 0.2929], [0.0938, 0.2854], [0.1236, 0.2736], [0.1517, 0.2594], [0.179, 0.2426], [0.0905, 0.1227], [0.0612, 0.1392], [0.0288, 0.1491], [-0.0049, 0.1516], [-0.0382, 0.1469], [-0.0699, 0.1352], [-0.0982, 0.1169], [-0.1219, 0.093], [-0.1395, 0.0646], [-0.1503, 0.0332], [-0.1541, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0.5651400000000137, 0], [0.5540599999999927, 0.10828000000000002], [0.5225199999999859, 0.21319], [0.4696700000000078, 0.30888000000000004], [0.3997799999999927, 0.39365000000000006], [0.31368000000000507, 0.4624799999999998], [0.21650999999999954, 0.5145200000000001], [0.10996000000000095, 0.5455699999999997], [0, 0.5564900000000002], [0, 0.5564899999999966], [-0.10996000000000095, 0.5455699999999979], [-0.21650999999999954, 0.5145199999999974], [-0.31368000000000507, 0.46247999999999934], [-0.3997799999999927, 0.39365000000000094], [-0.4696700000000078, 0.30888000000000204], [-0.5225199999999859, 0.21318999999999733], [-0.5540599999999927, 0.1082800000000006], [-0.5651400000000137, 0], [-0.5651399999999995, 0], [-0.5540599999999998, -0.1082800000000006], [-0.5225200000000001, -0.21318999999999733], [-0.4696700000000007, -0.30888000000000204], [-0.3997799999999998, -0.39365000000000094], [-0.31367999999999974, -0.46247999999999934], [-0.21651000000000042, -0.5145199999999974], [-0.10996000000000006, -0.5455699999999979], [0, -0.5564899999999966], [0, -0.29964999999999975], [-0.03153999999999968, -0.2979699999999994], [-0.06308000000000025, -0.29293000000000013], [-0.09375999999999962, -0.28537999999999997], [-0.12360000000000015, -0.2736299999999998], [-0.15173000000000014, -0.25936000000000003], [-0.17899999999999983, -0.24256999999999973], [-0.0904600000000002, -0.12274999999999991], [-0.0611600000000001, -0.13922999999999996], [-0.028770000000000184, -0.14909000000000017], [0.0049000000000001265, -0.15161000000000002], [0.03825000000000012, -0.14688999999999997], [0.06990000000000007, -0.13524000000000003], [0.0982400000000001, -0.11687999999999998], [0.12189000000000005, -0.09295999999999999], [0.1394700000000002, -0.06462999999999999], [0.15033999999999992, -0.03315], [0.15406999999999993, 0], [0, 0], [0, 0]]
	            }]
	          }]
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 115,
	    hd: false,
	    nm: "Rectangle 1",
	    parent: 113,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [30],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100]
	        }]
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 1,
	          k: [{
	            t: 48,
	            s: [{
	              c: true,
	              v: [[9.0197, 0], [221, 0], [222.5608, 0.1536], [224.0616, 0.6088], [225.4448, 1.348], [226.6568, 2.3432], [227.652, 3.5552], [228.3912, 4.9384], [228.8464, 6.4392], [229, 8], [229, 53], [228.8464, 54.5608], [228.3912, 56.0616], [227.652, 57.4448], [226.6568, 58.6568], [225.4448, 59.652], [224.0616, 60.3912], [222.5608, 60.8464], [221, 61], [12.5099, 61], [10.9491, 60.8464], [9.4483, 60.3912], [8.0651, 59.652], [6.8531, 58.6568], [5.8579, 57.4448], [5.1187, 56.0616], [4.6635, 54.5608], [4.5099, 53], [4.5099, 8.8104], [4.4659, 7.9744], [4.3355, 7.148], [4.1187, 6.34], [3.8195, 5.5584], [3.4395, 4.8128], [2.9843, 4.1112], [2.2548, 3.1067], [2.0422, 2.7336], [1.9161, 2.3231], [1.8826, 1.895], [1.9432, 1.47], [2.0951, 1.0683], [2.3309, 0.7094], [2.6393, 0.4106], [3.0053, 0.1863], [3.4117, 0.0473], [3.8384, 0.0002], [9.0197, 0], [9.0197, 0]],
	              i: [[0, 0], [-0.5304, 0], [-0.52, -0.1032], [-0.4904, -0.2032], [-0.4408, -0.2944], [-0.3752, -0.3752], [-0.2944, -0.4408], [-0.2032, -0.4904], [-0.1032, -0.52], [0, -0.5304], [0, -0.5304], [0.1032, -0.52], [0.2032, -0.4904], [0.2944, -0.4408], [0.3752, -0.3752], [0.4408, -0.2944], [0.4904, -0.2032], [0.52, -0.1032], [0.5304, 0], [0.5304, 0], [0.52, 0.1032], [0.4904, 0.2032], [0.4408, 0.2944], [0.3752, 0.3752], [0.2944, 0.4408], [0.2032, 0.4904], [0.1032, 0.52], [0, 0.5304], [0, 0.2856], [0.0296, 0.284], [0.0592, 0.2792], [0.088, 0.272], [0.116, 0.2608], [0.1424, 0.2472], [0.168, 0.2312], [0.0849, 0.117], [0.0574, 0.1327], [0.027, 0.1421], [-0.0046, 0.1445], [-0.0359, 0.14], [-0.0656, 0.1289], [-0.0922, 0.1114], [-0.1144, 0.0886], [-0.1309, 0.0616], [-0.1411, 0.0316], [-0.1446, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0.530399999999986, 0], [0.5200000000000102, 0.10319999999999999], [0.49039999999999395, 0.20320000000000005], [0.44079999999999586, 0.2944], [0.37520000000000664, 0.3752], [0.294399999999996, 0.44079999999999986], [0.2032000000000096, 0.49040000000000017], [0.10319999999998686, 0.5199999999999996], [0, 0.5304000000000002], [0, 0.5304000000000002], [-0.10319999999998686, 0.5200000000000031], [-0.2032000000000096, 0.49040000000000106], [-0.294399999999996, 0.44080000000000297], [-0.37520000000000664, 0.37519999999999953], [-0.44079999999999586, 0.2944000000000031], [-0.49039999999999395, 0.2032000000000025], [-0.5200000000000102, 0.10320000000000107], [-0.530399999999986, 0], [-0.5304000000000002, 0], [-0.5199999999999996, -0.10320000000000107], [-0.4903999999999993, -0.2032000000000025], [-0.4408000000000003, -0.2944000000000031], [-0.3752000000000004, -0.37519999999999953], [-0.29440000000000044, -0.44080000000000297], [-0.20319999999999983, -0.49040000000000106], [-0.10320000000000018, -0.5200000000000031], [0, -0.5304000000000002], [0, -0.2856000000000005], [-0.029600000000000293, -0.2839999999999998], [-0.0591999999999997, -0.27920000000000034], [-0.08800000000000008, -0.27200000000000024], [-0.1160000000000001, -0.2607999999999997], [-0.14239999999999986, -0.2472000000000003], [-0.16800000000000015, -0.23119999999999985], [-0.0849000000000002, -0.11699999999999999], [-0.057399999999999896, -0.13269999999999982], [-0.026999999999999913, -0.14210000000000012], [0.0045999999999999375, -0.14450000000000007], [0.03590000000000004, -0.1399999999999999], [0.06559999999999988, -0.12890000000000001], [0.09220000000000006, -0.11139999999999994], [0.11439999999999984, -0.08860000000000001], [0.13090000000000002, -0.0616], [0.14110000000000023, -0.0316], [0.14460000000000006, 0], [0, 0], [0, 0]]
	            }],
	            o: {
	              x: [0],
	              y: [0]
	            },
	            i: {
	              x: [1],
	              y: [1]
	            }
	          }, {
	            t: 66,
	            s: [{
	              c: true,
	              v: [[9.6105, 0], [235.476, 0], [237.139, 0.1611], [238.7381, 0.6387], [240.2119, 1.4143], [241.5033, 2.4584], [242.5637, 3.73], [243.3513, 5.1812], [243.8363, 6.7558], [244, 8.3934], [244, 55.6065], [243.8363, 57.2441], [243.3513, 58.8187], [242.5637, 60.2699], [241.5033, 61.5415], [240.2119, 62.5856], [238.7381, 63.3612], [237.139, 63.8388], [235.476, 64], [13.3293, 64], [11.6663, 63.8389], [10.0672, 63.3613], [8.5934, 62.5858], [7.302, 61.5417], [6.2416, 60.2701], [5.454, 58.8189], [4.969, 57.2443], [4.8053, 55.6067], [4.8053, 9.2438], [4.7584, 8.3667], [4.6195, 7.4997], [4.3885, 6.652], [4.0697, 5.832], [3.6648, 5.0497], [3.1798, 4.3136], [2.4025, 3.2597], [2.176, 2.8683], [2.0416, 2.4376], [2.0059, 1.9885], [2.0705, 1.5426], [2.2324, 1.1211], [2.4837, 0.7446], [2.8123, 0.4311], [3.2023, 0.1958], [3.6353, 0.05], [4.09, 0.0006], [9.6107, 0.0004], [9.6105, 0]],
	              i: [[0, 0], [-0.5651, 0], [-0.5541, -0.1083], [-0.5225, -0.2132], [-0.4697, -0.3089], [-0.3998, -0.3937], [-0.3137, -0.4625], [-0.2165, -0.5145], [-0.11, -0.5456], [0, -0.5565], [0, -0.5565], [0.11, -0.5456], [0.2165, -0.5145], [0.3137, -0.4625], [0.3998, -0.3937], [0.4697, -0.3089], [0.5225, -0.2132], [0.5541, -0.1083], [0.5651, 0], [0.5651, 0], [0.5541, 0.1083], [0.5225, 0.2132], [0.4697, 0.3089], [0.3998, 0.3937], [0.3137, 0.4625], [0.2165, 0.5145], [0.11, 0.5456], [0, 0.5565], [0, 0.2996], [0.0315, 0.298], [0.0631, 0.2929], [0.0938, 0.2854], [0.1236, 0.2736], [0.1517, 0.2594], [0.179, 0.2426], [0.0905, 0.1227], [0.0612, 0.1392], [0.0288, 0.1491], [-0.0049, 0.1516], [-0.0382, 0.1469], [-0.0699, 0.1352], [-0.0982, 0.1169], [-0.1219, 0.093], [-0.1395, 0.0646], [-0.1503, 0.0332], [-0.1541, 0], [0, 0], [0, 0]],
	              o: [[0, 0], [0.5651400000000137, 0], [0.5540599999999927, 0.10828000000000002], [0.5225199999999859, 0.21319], [0.4696700000000078, 0.30888000000000004], [0.3997799999999927, 0.39365000000000006], [0.31368000000000507, 0.4624799999999998], [0.21650999999999954, 0.5145200000000001], [0.10996000000000095, 0.5455699999999997], [0, 0.5564900000000002], [0, 0.5564899999999966], [-0.10996000000000095, 0.5455699999999979], [-0.21650999999999954, 0.5145199999999974], [-0.31368000000000507, 0.46247999999999934], [-0.3997799999999927, 0.39365000000000094], [-0.4696700000000078, 0.30888000000000204], [-0.5225199999999859, 0.21318999999999733], [-0.5540599999999927, 0.1082800000000006], [-0.5651400000000137, 0], [-0.5651399999999995, 0], [-0.5540599999999998, -0.1082800000000006], [-0.5225200000000001, -0.21318999999999733], [-0.4696700000000007, -0.30888000000000204], [-0.3997799999999998, -0.39365000000000094], [-0.31367999999999974, -0.46247999999999934], [-0.21651000000000042, -0.5145199999999974], [-0.10996000000000006, -0.5455699999999979], [0, -0.5564899999999966], [0, -0.29964999999999975], [-0.03153999999999968, -0.2979699999999994], [-0.06308000000000025, -0.29293000000000013], [-0.09375999999999962, -0.28537999999999997], [-0.12360000000000015, -0.2736299999999998], [-0.15173000000000014, -0.25936000000000003], [-0.17899999999999983, -0.24256999999999973], [-0.0904600000000002, -0.12274999999999991], [-0.0611600000000001, -0.13922999999999996], [-0.028770000000000184, -0.14909000000000017], [0.0049000000000001265, -0.15161000000000002], [0.03825000000000012, -0.14688999999999997], [0.06990000000000007, -0.13524000000000003], [0.0982400000000001, -0.11687999999999998], [0.12189000000000005, -0.09295999999999999], [0.1394700000000002, -0.06462999999999999], [0.15033999999999992, -0.03315], [0.15406999999999993, 0], [0, 0], [0, 0]]
	            }]
	          }]
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [115, 31]
	        },
	        s: {
	          a: 0,
	          k: [460, 124]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 116,
	    hd: false,
	    nm: "Ellipse 1 - Null",
	    parent: 111,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 36]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 117,
	    hd: false,
	    nm: "Ellipse 1",
	    parent: 116,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [24.3888, 16.3625], [22.6125, 19.8475], [19.8475, 22.6125], [16.3625, 24.3888], [12.5, 25], [8.6375, 24.3888], [5.1525, 22.6125], [2.3875, 19.8475], [0.6113, 16.3625], [0, 12.5], [0.6113, 8.6375], [2.3875, 5.1525], [5.1525, 2.3875], [8.6375, 0.6113], [12.5, 0], [16.3625, 0.6113], [19.8475, 2.3875], [22.6125, 5.1525], [24.3888, 8.6375], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [0.405, -1.2475], [0.7713, -1.0612], [1.0613, -0.7712], [1.2475, -0.405], [1.3112, 0], [1.2475, 0.405], [1.0613, 0.7713], [0.7713, 1.0613], [0.405, 1.2475], [0, 1.3112], [-0.405, 1.2475], [-0.7712, 1.0613], [-1.0612, 0.7713], [-1.2475, 0.405], [-1.3112, 0], [-1.2475, -0.405], [-1.0612, -0.7712], [-0.7712, -1.0612], [-0.405, -1.2475], [0, -1.3112], [0, 0]],
	            o: [[0, 1.3111999999999995], [-0.40500000000000114, 1.2474999999999987], [-0.7712000000000003, 1.0612999999999992], [-1.0611999999999995, 0.7713000000000001], [-1.2475000000000005, 0.40500000000000114], [-1.3111999999999995, 0], [-1.2475000000000005, -0.40500000000000114], [-1.0611999999999995, -0.7712000000000003], [-0.7711999999999999, -1.0611999999999995], [-0.405, -1.2475000000000005], [0, -1.3111999999999995], [0.405, -1.2475000000000005], [0.7713000000000001, -1.0611999999999995], [1.0613000000000001, -0.7711999999999999], [1.2475000000000005, -0.405], [1.3111999999999995, 0], [1.2474999999999987, 0.405], [1.0612999999999992, 0.7713000000000001], [0.7713000000000001, 1.0613000000000001], [0.40500000000000114, 1.2475000000000005], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 118,
	    hd: false,
	    nm: "Ellipse 1",
	    parent: 116,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [24.3888, 16.3625], [22.6125, 19.8475], [19.8475, 22.6125], [16.3625, 24.3888], [12.5, 25], [8.6375, 24.3888], [5.1525, 22.6125], [2.3875, 19.8475], [0.6113, 16.3625], [0, 12.5], [0.6113, 8.6375], [2.3875, 5.1525], [5.1525, 2.3875], [8.6375, 0.6113], [12.5, 0], [16.3625, 0.6113], [19.8475, 2.3875], [22.6125, 5.1525], [24.3888, 8.6375], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [0.405, -1.2475], [0.7713, -1.0612], [1.0613, -0.7712], [1.2475, -0.405], [1.3112, 0], [1.2475, 0.405], [1.0613, 0.7713], [0.7713, 1.0613], [0.405, 1.2475], [0, 1.3112], [-0.405, 1.2475], [-0.7712, 1.0613], [-1.0612, 0.7713], [-1.2475, 0.405], [-1.3112, 0], [-1.2475, -0.405], [-1.0612, -0.7712], [-0.7712, -1.0612], [-0.405, -1.2475], [0, -1.3112], [0, 0]],
	            o: [[0, 1.3111999999999995], [-0.40500000000000114, 1.2474999999999987], [-0.7712000000000003, 1.0612999999999992], [-1.0611999999999995, 0.7713000000000001], [-1.2475000000000005, 0.40500000000000114], [-1.3111999999999995, 0], [-1.2475000000000005, -0.40500000000000114], [-1.0611999999999995, -0.7712000000000003], [-0.7711999999999999, -1.0611999999999995], [-0.405, -1.2475000000000005], [0, -1.3111999999999995], [0.405, -1.2475000000000005], [0.7713000000000001, -1.0611999999999995], [1.0613000000000001, -0.7711999999999999], [1.2475000000000005, -0.405], [1.3111999999999995, 0], [1.2474999999999987, 0.405], [1.0612999999999992, 0.7713000000000001], [0.7713000000000001, 1.0613000000000001], [0.40500000000000114, 1.2475000000000005], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [13, 13]
	        },
	        s: {
	          a: 0,
	          k: [52, 52]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "Anim 23",
	  fr: 60,
	  id: "ljwkeu91tjou2oicjs",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 119,
	    hd: false,
	    nm: "Anim 23 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 258.0000014305115,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 120,
	    ty: 0,
	    nm: "A 3",
	    refId: "ljwkeu91ewddnaz26q",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 174.00000071525574,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 121,
	    ty: 0,
	    nm: "A 2",
	    refId: "ljwkeu97566xvua8q9p",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 96,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 114.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 240.0000014305115,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 258.0000014305115,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 122,
	    ty: 0,
	    nm: "A 1",
	    refId: "ljwkeu9dma2e2m1rlsa",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 48,
	          s: [4],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 66,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 174.00000071525574,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 192.00000143051147,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 172,
	    ip: 0,
	    op: 258.0000014305115,
	    st: 0,
	    hd: false,
	    bm: 0
	  }]
	}];
	var layers = [{
	  ty: 3,
	  ddd: 0,
	  ind: 119,
	  hd: false,
	  nm: "Anim 23 - Null",
	  ks: {
	    a: {
	      a: 0,
	      k: [0, 0]
	    },
	    o: {
	      a: 0,
	      k: 100
	    },
	    p: {
	      a: 0,
	      k: [0, 0]
	    },
	    r: {
	      a: 0,
	      k: 0
	    },
	    s: {
	      a: 0,
	      k: [100, 100]
	    },
	    sk: {
	      a: 0,
	      k: 0
	    },
	    sa: {
	      a: 0,
	      k: 0
	    }
	  },
	  st: 0,
	  ip: 0,
	  op: 258.0000014305115,
	  bm: 0,
	  sr: 1
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 0,
	  nm: "Anim 23",
	  refId: "ljwkeu91tjou2oicjs",
	  sr: 1,
	  ks: {
	    a: {
	      a: 0,
	      k: [0, 0]
	    },
	    p: {
	      a: 0,
	      k: [0, 0]
	    },
	    s: {
	      a: 0,
	      k: [100, 100]
	    },
	    sk: {
	      a: 0,
	      k: 0
	    },
	    sa: {
	      a: 0,
	      k: 0
	    },
	    r: {
	      a: 0,
	      k: 0
	    },
	    o: {
	      a: 0,
	      k: 100
	    }
	  },
	  ao: 0,
	  w: 428,
	  h: 172,
	  ip: 0,
	  op: 258.0000014305115,
	  st: 0,
	  hd: false,
	  bm: 0,
	  ef: []
	}];
	var meta = {
	  a: "",
	  d: "",
	  tc: "",
	  g: "Aninix"
	};
	var GroupChatAnimation = {
	  nm: nm,
	  v: v,
	  fr: fr,
	  ip: ip,
	  op: op,
	  w: w,
	  h: h,
	  ddd: ddd,
	  markers: markers,
	  assets: assets,
	  layers: layers,
	  meta: meta
	};

	// @vue/component
	const GroupChatPromo = {
	  components: {
	    PromoPopup,
	    MessengerButton: Button
	  },
	  emits: ['continue', 'close'],
	  data() {
	    return {};
	  },
	  computed: {
	    ButtonColor: () => ButtonColor,
	    ButtonSize: () => ButtonSize
	  },
	  mounted() {
	    ui_lottie.Lottie.loadAnimation({
	      animationData: GroupChatAnimation,
	      container: this.$refs.animationContainer,
	      renderer: 'svg',
	      loop: true,
	      autoplay: true
	    });
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<PromoPopup @close="$emit('close')">
			<div class="bx-im-group-chat-promo__container">
				<div class="bx-im-group-chat-promo__header">
					<div class="bx-im-group-chat-promo__title">
						{{ loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_TITLE') }}
					</div>
					<div class="bx-im-group-chat-promo__close" @click="$emit('close')"></div>
				</div>
				<div class="bx-im-group-chat-promo__content">
					<div class="bx-im-group-chat-promo__content_image" ref="animationContainer"></div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --like"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_DESCRIPTION_1') }}
						</div>
					</div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --chat"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_DESCRIPTION_2') }}
						</div>
					</div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --group"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_DESCRIPTION_3') }}
						</div>
					</div>
				</div>
				<div class="bx-im-group-chat-promo__button-panel">
					<MessengerButton
						:size="ButtonSize.XL"
						:color="ButtonColor.Primary"
						:isRounded="true" 
						:text="loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_CONTINUE')"
						@click="$emit('continue')"
					/>
					<MessengerButton
						:size="ButtonSize.XL"
						:color="ButtonColor.Link"
						:isRounded="true"
						:text="loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_CANCEL')"
						@click="$emit('close')"
					/>
				</div>
			</div>
		</PromoPopup>
	`
	};

	var nm$1 = "Anim 8";
	var v$1 = "5.9.6";
	var fr$1 = 60;
	var ip$1 = 0;
	var op$1 = 227.00000715255737;
	var w$1 = 428;
	var h$1 = 149;
	var ddd$1 = 0;
	var markers$1 = [];
	var assets$1 = [{
	  nm: "Frame 1684947",
	  fr: 60,
	  id: "421:359",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 4,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 5,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "A 2",
	  fr: 60,
	  id: "421:392",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 6,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 7,
	    hd: false,
	    nm: "A 2 - Null",
	    parent: 6,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 72.00000286102295,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [115, 28],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 72.00000286102295,
	          s: [115, 12],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [115, 12],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [115, 28]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 8,
	    ty: 0,
	    nm: "Frame 1684947",
	    td: 1,
	    refId: "421:359",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 9,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 72.00000286102295,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 4",
	  fr: 60,
	  id: "421:389",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 15,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 16,
	    hd: false,
	    nm: "A 4 - Null",
	    parent: 15,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 144.0000057220459,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [115, 94],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 144.0000057220459,
	          s: [115, 78],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [115, 78],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [115, 94]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 17,
	    ty: 0,
	    nm: "Frame 1684947",
	    td: 1,
	    refId: "421:359",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 18,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 144.0000057220459,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 3",
	  fr: 60,
	  id: "421:386",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 24,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 25,
	    hd: false,
	    nm: "A 3 - Null",
	    parent: 24,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000429153442,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [12, 94],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000429153442,
	          s: [12, 78],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [12, 78],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [12, 94]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 26,
	    ty: 0,
	    nm: "Frame 1684947",
	    td: 1,
	    refId: "421:359",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 27,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000429153442,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 1",
	  fr: 60,
	  id: "421:383",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 33,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 34,
	    hd: false,
	    nm: "A 1 - Null",
	    parent: 33,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 36.000001430511475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [12, 28],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 36.000001430511475,
	          s: [12, 12],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [12, 12],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [12, 28]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 35,
	    ty: 0,
	    nm: "Frame 1684947",
	    td: 1,
	    refId: "421:359",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 36,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 36.000001430511475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 5",
	  fr: 60,
	  id: "421:360",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 42,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 43,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 42,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 44,
	    ty: 0,
	    nm: "Frame 1684947",
	    td: 1,
	    refId: "421:359",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 45,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "Frame 1684937",
	  fr: 60,
	  id: "421:365",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 46,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 47,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 46,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 48,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 47,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 49,
	    ty: 0,
	    nm: "A 5",
	    td: 1,
	    refId: "421:360",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 50,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "Frame 1684941",
	  fr: 60,
	  id: "421:378",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 51,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 52,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 51,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 53,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 52,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 54,
	    hd: false,
	    nm: "Frame 1684941 - Null",
	    parent: 53,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 42]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 55,
	    ty: 0,
	    nm: "Frame 1684937",
	    td: 1,
	    refId: "421:365",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 56,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "Frame 1684940",
	  fr: 60,
	  id: "421:374",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 64,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 65,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 64,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 66,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 65,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 67,
	    hd: false,
	    nm: "Frame 1684940 - Null",
	    parent: 66,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 28]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 68,
	    ty: 0,
	    nm: "Frame 1684937",
	    td: 1,
	    refId: "421:365",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 69,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "Frame 1684939",
	  fr: 60,
	  id: "421:370",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 77,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 78,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 77,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 79,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 78,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 80,
	    hd: false,
	    nm: "Frame 1684939 - Null",
	    parent: 79,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 81,
	    ty: 0,
	    nm: "Frame 1684937",
	    td: 1,
	    refId: "421:365",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 82,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "Frame 1684938",
	  fr: 60,
	  id: "421:366",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 90,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 91,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 90,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 92,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 91,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 93,
	    hd: false,
	    nm: "Frame 1684938 - Null",
	    parent: 92,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 94,
	    ty: 0,
	    nm: "Frame 1684937",
	    td: 1,
	    refId: "421:365",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 95,
	    hd: false,
	    nm: "Anim 8 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 149], [428, 149], [0, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - 100",
	  fr: 60,
	  id: "ljwjxj6c3a61gv3e5vl",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 103,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 104,
	    hd: false,
	    nm: "A 2 - Null",
	    parent: 103,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 72.00000286102295,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [115, 28],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 72.00000286102295,
	          s: [115, 12],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [115, 12],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [115, 28]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 105,
	    hd: false,
	    nm: "1 101 - Null",
	    parent: 104,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29.000100000000003, 10]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 106,
	    hd: false,
	    nm: "Union - Null",
	    parent: 105,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 107,
	    hd: false,
	    nm: "Union",
	    parent: 106,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 108,
	    hd: false,
	    nm: "Union",
	    parent: 106,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [0, 0]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 109,
	    hd: false,
	    nm: "Combined Shape - Null",
	    parent: 105,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [9.2095, 7.6427]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 110,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 109,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 111,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 109,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10.79045, 12.3573]
	        },
	        s: {
	          a: 0,
	          k: [43.1618, 49.4292]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] 1 102",
	  fr: 60,
	  id: "ljwjxj6chl2m21i8oo8",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 112,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 113,
	    hd: false,
	    nm: "A 2 - Null",
	    parent: 112,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 72.00000286102295,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [115, 28],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 72.00000286102295,
	          s: [115, 12],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [115, 12],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [115, 28]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 114,
	    ty: 0,
	    nm: "1 103",
	    refId: "ljwjxj6c3a61gv3e5vl",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 115,
	    hd: false,
	    nm: "Rectangle 3467754 - Null",
	    parent: 113,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 116,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 115,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 117,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 115,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [48, 30]
	        },
	        s: {
	          a: 0,
	          k: [192, 120]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] 104",
	  fr: 60,
	  id: "ljwjxj6jlu3zrp0u77n",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 118,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 119,
	    hd: false,
	    nm: "A 4 - Null",
	    parent: 118,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 144.0000057220459,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [115, 94],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 144.0000057220459,
	          s: [115, 78],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [115, 78],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [115, 94]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 120,
	    hd: false,
	    nm: "1 105",
	    parent: 119,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [27, 10]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 121,
	    hd: false,
	    nm: "Union - Null",
	    parent: 120,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 122,
	    hd: false,
	    nm: "Union",
	    parent: 121,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 123,
	    hd: false,
	    nm: "Union",
	    parent: 121,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [0, 0]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 124,
	    hd: false,
	    nm: "Combined Shape - Null",
	    parent: 120,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [9.2095, 7.6427]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 125,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 124,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 126,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 124,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10.79045, 12.3573]
	        },
	        s: {
	          a: 0,
	          k: [43.1618, 49.4292]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] 1 106",
	  fr: 60,
	  id: "ljwjxj6jrcsugfpibo",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 127,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 128,
	    hd: false,
	    nm: "A 4 - Null",
	    parent: 127,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 144.0000057220459,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [115, 94],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 144.0000057220459,
	          s: [115, 78],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [115, 78],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [115, 94]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 129,
	    ty: 0,
	    nm: "1 107",
	    refId: "ljwjxj6jlu3zrp0u77n",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 130,
	    hd: false,
	    nm: "Rectangle 3467754 - Null",
	    parent: 128,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      },
	      p: {
	        a: 0,
	        k: [95, 59]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 131,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 130,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 132,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 130,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [48, 30]
	        },
	        s: {
	          a: 0,
	          k: [192, 120]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - 108",
	  fr: 60,
	  id: "ljwjxj6poy9cnhv837q",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 133,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 134,
	    hd: false,
	    nm: "A 3 - Null",
	    parent: 133,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000429153442,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [12, 94],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000429153442,
	          s: [12, 78],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [12, 78],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [12, 94]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 135,
	    hd: false,
	    nm: "1 109",
	    parent: 134,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [27, 10]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 136,
	    hd: false,
	    nm: "Union - Null",
	    parent: 135,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 137,
	    hd: false,
	    nm: "Union",
	    parent: 136,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 138,
	    hd: false,
	    nm: "Union",
	    parent: 136,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [0, 0]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 139,
	    hd: false,
	    nm: "Combined Shape - Null",
	    parent: 135,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [9.2095, 7.6427]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 140,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 139,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 141,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 139,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10.79045, 12.3573]
	        },
	        s: {
	          a: 0,
	          k: [43.1618, 49.4292]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] 1 110",
	  fr: 60,
	  id: "ljwjxj6pu0pb3tkdx2a",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 142,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 143,
	    hd: false,
	    nm: "A 3 - Null",
	    parent: 142,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000429153442,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [12, 94],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000429153442,
	          s: [12, 78],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [12, 78],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [12, 94]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 144,
	    ty: 0,
	    nm: "1 111",
	    refId: "ljwjxj6poy9cnhv837q",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 145,
	    hd: false,
	    nm: "Rectangle 3467754 - Null",
	    parent: 143,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      },
	      p: {
	        a: 0,
	        k: [0, 59]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 146,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 145,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 147,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 145,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [48, 30]
	        },
	        s: {
	          a: 0,
	          k: [192, 120]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - 112",
	  fr: 60,
	  id: "ljwjxj6uq8g8sixr9h",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 148,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 149,
	    hd: false,
	    nm: "A 1 - Null",
	    parent: 148,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 36.000001430511475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [12, 28],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 36.000001430511475,
	          s: [12, 12],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [12, 12],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [12, 28]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 150,
	    hd: false,
	    nm: "1 113 - Null",
	    parent: 149,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [27, 10]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 151,
	    hd: false,
	    nm: "Union - Null",
	    parent: 150,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 152,
	    hd: false,
	    nm: "Union",
	    parent: 151,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 153,
	    hd: false,
	    nm: "Union",
	    parent: 151,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 2,
	      it: [{
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [0, 0]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 154,
	    hd: false,
	    nm: "Combined Shape - Null",
	    parent: 150,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [9.2095, 7.6427]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 155,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 154,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 156,
	    hd: false,
	    nm: "Combined Shape",
	    parent: 154,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[20.0198, 23.2876], [21.5338, 20.5799], [21.213, 18.9459], [17.211, 16.1041], [14.6771, 14.9724], [14.5325, 13.9929], [13.6777, 13.8652], [13.6046, 12.7335], [14.5222, 10.4061], [15.5948, 9.1849], [15.2122, 7.1292], [15.2122, 3.1002], [7.9106, 1.3193], [6.173, 5.9406], [6.6613, 7.2427], [6.2658, 8.7207], [6.4021, 9.4414], [7.2315, 10.4362], [8.3201, 12.7769], [8.3937, 13.8561], [7.4679, 13.966], [7.3948, 14.8478], [6.2015, 15.4558], [4.99, 16.069], [0.3998, 19.0457], [0.0439, 20.6886], [1.5166, 23.2605], [10.1333, 24.7147], [11.4856, 24.7147], [20.0201, 23.2877], [20.0198, 23.2876]],
	            i: [[0, 0], [0.2283, 1.1626], [0, 0], [2.6542, 0.6737], [0.7799, 0.5037], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.2013, 1.3357], [-0.9134, -1.4471], [0, 0], [0, 0], [-0.1485, -0.5525], [-0.0098, -0.25], [0, 0], [0, 0], [0, 0], [0, 0], [0.0611, -0.2899], [0.3261, -0.1854], [0.5473, -0.2355], [0.4038, -1.5743], [0.1289, -0.6583], [-1.0766, -0.3582], [-3.0767, -0.066], [0, 0], [-2.6034, 0.8568], [0, 0]],
	            o: [[1.125399999999999, -0.37039000000000044], [0, 0], [-0.16122000000000014, -1.0214600000000011], [-0.8992299999999993, -0.24619000000000035], [-0.17055000000000042, -0.09566000000000052], [0, 0], [0, -0.07174999999999976], [1.0227900000000005, -0.3373600000000003], [0.6495499999999996, 0.3536400000000004], [0.7682600000000015, -2.1880000000000006], [0.20133000000000045, -1.3357200000000002], [-0.5116499999999995, -4.43095], [-2.25138, -0.40707000000000004], [0, 0], [-0.67685, 0.43095000000000017], [0.06189999999999962, 0.23032000000000075], [0.04717000000000038, 1.2547899999999998], [0.048210000000000086, 2.0709599999999995], [0.19543, 1.3005899999999997], [0, 0], [0.01252999999999993, 0.2957699999999992], [-0.5379300000000002, 0.23534000000000077], [-0.3338099999999997, 0.1898099999999996], [-2.09016, 0.8991100000000003], [-0.09288000000000002, 0.36208999999999847], [-0.21804, 1.1134500000000003], [2.6247399999999996, 0.8733299999999993], [0, 0], [3.044600000000001, -0.0653100000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10.79045, 12.3573]
	        },
	        s: {
	          a: 0,
	          k: [43.1618, 49.4292]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] 1 114",
	  fr: 60,
	  id: "ljwjxj6uv4vvu04bo6c",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 157,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 158,
	    hd: false,
	    nm: "A 1 - Null",
	    parent: 157,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 36.000001430511475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [12, 28],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 36.000001430511475,
	          s: [12, 12],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [12, 12],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [12, 28]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 159,
	    ty: 0,
	    nm: "1 115",
	    refId: "ljwjxj6uq8g8sixr9h",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 160,
	    hd: false,
	    nm: "Rectangle 3467754 - Null",
	    parent: 158,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 161,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 160,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 162,
	    hd: false,
	    nm: "Rectangle 3467754",
	    parent: 160,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[89, 0], [90.1706, 0.1152], [91.2962, 0.4566], [92.3336, 1.011], [93.2426, 1.7574], [93.989, 2.6664], [94.5434, 3.7038], [94.8848, 4.8294], [95, 6], [95, 53], [94.8848, 54.1706], [94.5434, 55.2962], [93.989, 56.3336], [93.2426, 57.2426], [92.3336, 57.989], [91.2962, 58.5434], [90.1706, 58.8848], [89, 59], [6, 59], [4.8294, 58.8848], [3.7038, 58.5434], [2.6664, 57.989], [1.7574, 57.2426], [1.011, 56.3336], [0.4566, 55.2962], [0.1152, 54.1706], [0, 53], [0, 6], [0.1152, 4.8294], [0.4566, 3.7038], [1.011, 2.6664], [1.7574, 1.7574], [2.6664, 1.011], [3.7038, 0.4566], [4.8294, 0.1152], [6, 0], [89, 0], [89, 0]],
	            i: [[0, 0], [-0.39, -0.0774], [-0.3678, -0.1524], [-0.3306, -0.2208], [-0.2814, -0.2814], [-0.2208, -0.3306], [-0.1524, -0.3678], [-0.0774, -0.39], [0, -0.3978], [0, -0.3978], [0.0774, -0.39], [0.1524, -0.3678], [0.2208, -0.3306], [0.2814, -0.2814], [0.3306, -0.2208], [0.3678, -0.1524], [0.39, -0.0774], [0.3978, 0], [0.3978, 0], [0.39, 0.0774], [0.3678, 0.1524], [0.3306, 0.2208], [0.2814, 0.2814], [0.2208, 0.3306], [0.1524, 0.3678], [0.0774, 0.39], [0, 0.3978], [0, 0.3978], [-0.0774, 0.39], [-0.1524, 0.3678], [-0.2208, 0.3306], [-0.2814, 0.2814], [-0.3306, 0.2208], [-0.3678, 0.1524], [-0.39, 0.0774], [-0.3978, 0], [-0.3978, 0], [0, 0]],
	            o: [[0.3978000000000037, 0], [0.39000000000000057, 0.0774], [0.36780000000000257, 0.15239999999999998], [0.330600000000004, 0.22079999999999989], [0.281400000000005, 0.2814000000000001], [0.220799999999997, 0.3306], [0.1524000000000001, 0.3677999999999999], [0.07739999999999725, 0.3899999999999997], [0, 0.39780000000000015], [0, 0.3977999999999966], [-0.07739999999999725, 0.39000000000000057], [-0.1524000000000001, 0.36780000000000257], [-0.220799999999997, 0.3305999999999969], [-0.281400000000005, 0.2813999999999979], [-0.330600000000004, 0.220799999999997], [-0.36780000000000257, 0.1524000000000001], [-0.39000000000000057, 0.07739999999999725], [-0.3978000000000037, 0], [-0.39780000000000015, 0], [-0.3899999999999997, -0.07739999999999725], [-0.3677999999999999, -0.1524000000000001], [-0.3306, -0.220799999999997], [-0.2814000000000001, -0.2813999999999979], [-0.2208, -0.3305999999999969], [-0.15239999999999998, -0.36780000000000257], [-0.0774, -0.39000000000000057], [0, -0.3977999999999966], [0, -0.39780000000000015], [0.0774, -0.3899999999999997], [0.15239999999999998, -0.3677999999999999], [0.22079999999999989, -0.3306], [0.2814000000000001, -0.2814000000000001], [0.3306, -0.2208], [0.3677999999999999, -0.15239999999999998], [0.3899999999999997, -0.0774], [0.39780000000000015, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [48, 30]
	        },
	        s: {
	          a: 0,
	          k: [192, 120]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684941 - Null / Frame 1684937 - Null / Rectangle 3467758 - Null / Rectangle 3467758 / Rectangle 3467758",
	  fr: 60,
	  id: "ljwjxj71niq5y7fz1c",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 163,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 164,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 163,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 165,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 164,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 166,
	    hd: false,
	    nm: "Frame 1684941 - Null",
	    parent: 165,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 42]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 167,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 166,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [16, 4]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 168,
	    hd: false,
	    nm: "Rectangle 3467758 - Null",
	    parent: 167,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 169,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 168,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [25.5, 0], [27, 1.5], [27, 1.5], [25.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284300000000009, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 170,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 168,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [25.5, 0], [27, 1.5], [27, 1.5], [25.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284300000000009, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [14, 2]
	        },
	        s: {
	          a: 0,
	          k: [56, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684941 - Null / Frame 1684937 / Ellipse 256 - Null / Ellipse 256 / Ellipse 256",
	  fr: 60,
	  id: "ljwjxj71utvgbljp81",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 171,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 172,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 171,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 173,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 172,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 174,
	    hd: false,
	    nm: "Frame 1684941 - Null",
	    parent: 173,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 42]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 175,
	    ty: 0,
	    nm: "Frame 1684937",
	    refId: "ljwjxj71niq5y7fz1c",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 176,
	    hd: false,
	    nm: "Ellipse 256 - Null",
	    parent: 174,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 177,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 176,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 178,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 176,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [6, 6]
	        },
	        s: {
	          a: 0,
	          k: [24, 24]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684940 - Null / Frame 1684937 - Null / Rectangle 3467758 - Null / Rectangle 3467758 / Rectangle 3467758",
	  fr: 60,
	  id: "ljwjxj7513hzkrcqsm9",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 179,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 180,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 179,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 181,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 180,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 182,
	    hd: false,
	    nm: "Frame 1684940 - Null",
	    parent: 181,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 28]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 183,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 182,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [16, 4]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 184,
	    hd: false,
	    nm: "Rectangle 3467758 - Null",
	    parent: 183,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 185,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 184,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [39.5, 0], [41, 1.5], [41, 1.5], [39.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284299999999973, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 186,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 184,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [39.5, 0], [41, 1.5], [41, 1.5], [39.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284299999999973, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [21, 2]
	        },
	        s: {
	          a: 0,
	          k: [84, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684940 - Null / Frame 1684937 / Ellipse 256 - Null / Ellipse 256 / Ellipse 256",
	  fr: 60,
	  id: "ljwjxj74h1h5lnmreo",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 187,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 188,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 187,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 189,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 188,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 190,
	    hd: false,
	    nm: "Frame 1684940 - Null",
	    parent: 189,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 28]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 191,
	    ty: 0,
	    nm: "Frame 1684937",
	    refId: "ljwjxj7513hzkrcqsm9",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 192,
	    hd: false,
	    nm: "Ellipse 256 - Null",
	    parent: 190,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 193,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 192,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 194,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 192,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [6, 6]
	        },
	        s: {
	          a: 0,
	          k: [24, 24]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684939 - Null / Frame 1684937 - Null / Rectangle 3467758 - Null / Rectangle 3467758 / Rectangle 3467758",
	  fr: 60,
	  id: "ljwjxj78wxf1mfb0soa",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 195,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 196,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 195,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 197,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 196,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 198,
	    hd: false,
	    nm: "Frame 1684939 - Null",
	    parent: 197,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 199,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 198,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [16, 4]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 200,
	    hd: false,
	    nm: "Rectangle 3467758 - Null",
	    parent: 199,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 201,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 200,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [20.5, 0], [22, 1.5], [22, 1.5], [20.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284300000000009, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 202,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 200,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [20.5, 0], [22, 1.5], [22, 1.5], [20.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284300000000009, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [11.5, 2]
	        },
	        s: {
	          a: 0,
	          k: [46, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684939 - Null / Frame 1684937 / Ellipse 256 - Null / Ellipse 256 / Ellipse 256",
	  fr: 60,
	  id: "ljwjxj7704sldcylg1er",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 203,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 204,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 203,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 205,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 204,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 206,
	    hd: false,
	    nm: "Frame 1684939 - Null",
	    parent: 205,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 207,
	    ty: 0,
	    nm: "Frame 1684937",
	    refId: "ljwjxj78wxf1mfb0soa",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 208,
	    hd: false,
	    nm: "Ellipse 256 - Null",
	    parent: 206,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 209,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 208,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 210,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 208,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [6, 6]
	        },
	        s: {
	          a: 0,
	          k: [24, 24]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684938 - Null / Frame 1684937 - Null / Rectangle 3467758 - Null / Rectangle 3467758 / Rectangle 3467758",
	  fr: 60,
	  id: "ljwjxj7bvp481hc3ogh",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 211,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 212,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 211,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 213,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 212,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 214,
	    hd: false,
	    nm: "Frame 1684938 - Null",
	    parent: 213,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 215,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 214,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [16, 4]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 216,
	    hd: false,
	    nm: "Rectangle 3467758 - Null",
	    parent: 215,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 217,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 216,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [31.5, 0], [33, 1.5], [33, 1.5], [31.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284299999999973, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 218,
	    hd: false,
	    nm: "Rectangle 3467758",
	    parent: 216,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 20.000000298023224
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1.5, 0], [31.5, 0], [33, 1.5], [33, 1.5], [31.5, 3], [1.5, 3], [0, 1.5], [0, 1.5], [1.5, 0], [1.5, 0]],
	            i: [[0, 0], [0, 0], [0, -0.8284], [0, 0], [0.8284, 0], [0, 0], [0, 0.8284], [0, 0], [-0.8284, 0], [0, 0]],
	            o: [[0, 0], [0.8284299999999973, 0], [0, 0], [0, 0.82843], [0, 0], [-0.82843, 0], [0, 0], [0, -0.82843], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [17, 2]
	        },
	        s: {
	          a: 0,
	          k: [68, 8]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684938 - Null / Frame 1684937 / Ellipse 256 - Null / Ellipse 256 / Ellipse 256",
	  fr: 60,
	  id: "ljwjxj7aen5ny1ibdkh",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 219,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 220,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 219,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 221,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 220,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 222,
	    hd: false,
	    nm: "Frame 1684938 - Null",
	    parent: 221,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 223,
	    ty: 0,
	    nm: "Frame 1684937",
	    refId: "ljwjxj7bvp481hc3ogh",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 224,
	    hd: false,
	    nm: "Ellipse 256 - Null",
	    parent: 222,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 225,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 224,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 226,
	    hd: false,
	    nm: "Ellipse 256",
	    parent: 224,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[11, 5.5], [10.7311, 7.1995], [9.9495, 8.7329], [8.7329, 9.9495], [7.1995, 10.7311], [5.5, 11], [3.8005, 10.7311], [2.2671, 9.9495], [1.0505, 8.7329], [0.269, 7.1995], [0, 5.5], [0.269, 3.8005], [1.0505, 2.2671], [2.2671, 1.0505], [3.8005, 0.269], [5.5, 0], [7.1995, 0.269], [8.7329, 1.0505], [9.9495, 2.2671], [10.7311, 3.8005], [11, 5.5], [11, 5.5]],
	            i: [[0, 0], [0.1782, -0.5489], [0.3394, -0.4669], [0.467, -0.3393], [0.5489, -0.1782], [0.577, 0], [0.5489, 0.1782], [0.467, 0.3394], [0.3394, 0.467], [0.1782, 0.5489], [0, 0.577], [-0.1782, 0.5489], [-0.3393, 0.467], [-0.4669, 0.3394], [-0.5489, 0.1782], [-0.5769, 0], [-0.5489, -0.1782], [-0.4669, -0.3393], [-0.3393, -0.4669], [-0.1782, -0.5489], [0, -0.5769], [0, 0]],
	            o: [[0, 0.577], [-0.17820000000000036, 0.5488999999999997], [-0.3392999999999997, 0.4670000000000005], [-0.46690000000000076, 0.3393999999999995], [-0.5488999999999997, 0.17820000000000036], [-0.5769000000000002, 0], [-0.5489000000000002, -0.17820000000000036], [-0.46689999999999987, -0.3392999999999997], [-0.33929999999999993, -0.46690000000000076], [-0.1782, -0.5488999999999997], [0, -0.5769000000000002], [0.17820000000000003, -0.5489000000000002], [0.3393999999999999, -0.46689999999999987], [0.4670000000000001, -0.33929999999999993], [0.5489000000000002, -0.1782], [0.577, 0], [0.5488999999999997, 0.17820000000000003], [0.4670000000000005, 0.3393999999999999], [0.3393999999999995, 0.4670000000000001], [0.17820000000000036, 0.5489000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [6, 6]
	        },
	        s: {
	          a: 0,
	          k: [24, 24]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 5 - Null / Frame 1684937 - Null / Frame 1684941 / Frame 1684940 / Frame 1684939 / Frame 1684938",
	  fr: 60,
	  id: "ljwjxj7155m8q0q86ig",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 227,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 228,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 227,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 229,
	    hd: false,
	    nm: "Frame 1684937 - Null",
	    parent: 228,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [13.5, 14]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 230,
	    ty: 0,
	    nm: "Frame 1684941",
	    refId: "ljwjxj71utvgbljp81",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ddd: 0,
	    ind: 231,
	    ty: 0,
	    nm: "Frame 1684940",
	    refId: "ljwjxj74h1h5lnmreo",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ddd: 0,
	    ind: 232,
	    ty: 0,
	    nm: "Frame 1684939",
	    refId: "ljwjxj7704sldcylg1er",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ddd: 0,
	    ind: 233,
	    ty: 0,
	    nm: "Frame 1684938",
	    refId: "ljwjxj7aen5ny1ibdkh",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Frame 1684937 / Rectangle 3467764 - Null / Rectangle 3467764 / Rectangle 3467764 / Rectangle 3467763 - Null / Rectangle 3467763 / Rectangle 3467763 / Rectangle 3467762 - Null / Rectangle 3467762 / Rectangle 3467762 / Rectangle 3467761 - Null / Rectangle 3467761 / Rectangle 3467761",
	  fr: 60,
	  id: "ljwjxj70gqxtpz5o59u",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 234,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 235,
	    hd: false,
	    nm: "A 5 - Null",
	    parent: 234,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [128.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 180.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 210.00000715255737,
	          s: [224.5, 0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000715255737,
	          s: [128.5, 0]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 236,
	    ty: 0,
	    nm: "Frame 1684937",
	    refId: "ljwjxj7155m8q0q86ig",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 237,
	    hd: false,
	    nm: "Rectangle 3467764 - Null",
	    parent: 235,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      },
	      p: {
	        a: 0,
	        k: [93.5, 105]
	      },
	      r: {
	        a: 0,
	        k: -180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 238,
	    hd: false,
	    nm: "Rectangle 3467764",
	    parent: 237,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1, 0], [46, 0], [50, 4], [50, 11], [46, 15], [4, 15], [0, 11], [0, 1], [1, 0], [1, 0]],
	            i: [[0, 0], [0, 0], [0, -2.2091], [0, 0], [2.2091, 0], [0, 0], [0, 2.2091], [0, 0], [-0.5523, 0], [0, 0]],
	            o: [[0, 0], [2.209139999999998, 0], [0, 0], [0, 2.2091399999999997], [0, 0], [-2.20914, 0], [0, 0], [0, -0.55228], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 239,
	    hd: false,
	    nm: "Rectangle 3467764",
	    parent: 237,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 44.999998807907104
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1, 0], [46, 0], [50, 4], [50, 11], [46, 15], [4, 15], [0, 11], [0, 1], [1, 0], [1, 0]],
	            i: [[0, 0], [0, 0], [0, -2.2091], [0, 0], [2.2091, 0], [0, 0], [0, 2.2091], [0, 0], [-0.5523, 0], [0, 0]],
	            o: [[0, 0], [2.209139999999998, 0], [0, 0], [0, 2.2091399999999997], [0, 0], [-2.20914, 0], [0, 0], [0, -0.55228], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [25.5, 8]
	        },
	        s: {
	          a: 0,
	          k: [102, 32]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 240,
	    hd: false,
	    nm: "Rectangle 3467763 - Null",
	    parent: 235,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 89.99999761581421
	      },
	      p: {
	        a: 0,
	        k: [13.5, 124]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 241,
	    hd: false,
	    nm: "Rectangle 3467763",
	    parent: 240,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 89.99999761581421
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1, 0], [48, 0], [52, 4], [52, 11], [48, 15], [4, 15], [0, 11], [0, 1], [1, 0], [1, 0]],
	            i: [[0, 0], [0, 0], [0, -2.2091], [0, 0], [2.2091, 0], [0, 0], [0, 2.2091], [0, 0], [-0.5523, 0], [0, 0]],
	            o: [[0, 0], [2.209139999999998, 0], [0, 0], [0, 2.2091399999999997], [0, 0], [-2.20914, 0], [0, 0], [0, -0.55228], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 94
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 242,
	    hd: false,
	    nm: "Rectangle 3467763",
	    parent: 240,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 89.99999761581421
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1, 0], [48, 0], [52, 4], [52, 11], [48, 15], [4, 15], [0, 11], [0, 1], [1, 0], [1, 0]],
	            i: [[0, 0], [0, 0], [0, -2.2091], [0, 0], [2.2091, 0], [0, 0], [0, 2.2091], [0, 0], [-0.5523, 0], [0, 0]],
	            o: [[0, 0], [2.209139999999998, 0], [0, 0], [0, 2.2091399999999997], [0, 0], [-2.20914, 0], [0, 0], [0, -0.55228], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 94
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [26.5, 8]
	        },
	        s: {
	          a: 0,
	          k: [106, 32]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 243,
	    hd: false,
	    nm: "Rectangle 3467762 - Null",
	    parent: 235,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 89.99999761581421
	      },
	      p: {
	        a: 0,
	        k: [13.5, 81]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 244,
	    hd: false,
	    nm: "Rectangle 3467762",
	    parent: 243,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 89.99999761581421
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1, 0], [69, 0], [73, 4], [73, 16], [69, 20], [4, 20], [0, 16], [0, 1], [1, 0], [1, 0]],
	            i: [[0, 0], [0, 0], [0, -2.2091], [0, 0], [2.2091, 0], [0, 0], [0, 2.2091], [0, 0], [-0.5523, 0], [0, 0]],
	            o: [[0, 0], [2.209140000000005, 0], [0, 0], [0, 2.2091400000000014], [0, 0], [-2.20914, 0], [0, 0], [0, -0.55228], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 94
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 245,
	    hd: false,
	    nm: "Rectangle 3467762",
	    parent: 243,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 89.99999761581421
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[1, 0], [69, 0], [73, 4], [73, 16], [69, 20], [4, 20], [0, 16], [0, 1], [1, 0], [1, 0]],
	            i: [[0, 0], [0, 0], [0, -2.2091], [0, 0], [2.2091, 0], [0, 0], [0, 2.2091], [0, 0], [-0.5523, 0], [0, 0]],
	            o: [[0, 0], [2.209140000000005, 0], [0, 0], [0, 2.2091400000000014], [0, 0], [-2.20914, 0], [0, 0], [0, -0.55228], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 94
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [37, 10.5]
	        },
	        s: {
	          a: 0,
	          k: [148, 42]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 246,
	    hd: false,
	    nm: "Rectangle 3467761 - Null",
	    parent: 235,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 247,
	    hd: false,
	    nm: "Rectangle 3467761",
	    parent: 246,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [102, 0], [102, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0.9333333333333333, 0.9490196078431372, 0.9568627450980393, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 248,
	    hd: false,
	    nm: "Rectangle 3467761",
	    parent: 246,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [102, 0], [102, 149], [0, 149], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0.9333333333333333, 0.9490196078431372, 0.9568627450980393, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [51.5, 75]
	        },
	        s: {
	          a: 0,
	          k: [206, 300]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: [{
	      nm: "DropShadow",
	      ty: 25,
	      en: 1,
	      ef: [{
	        ty: 2,
	        v: {
	          a: 0,
	          k: [0, 0, 0, 1]
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 5
	        }
	      }, {
	        ty: 1,
	        v: {
	          a: 0,
	          k: 1.5707963267948966
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: -2
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 4
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "[FRAME] Frame 1684947 - Null / A 2 / A 4 / A 3 / A 1 / Rectangle 3467765 - Null / Rectangle 3467765 / Rectangle 3467765 / A 5",
	  fr: 60,
	  id: "ljwjxj6cer3cc1ml337",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 249,
	    hd: false,
	    nm: "Frame 1684947 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [54.5, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 250,
	    ty: 0,
	    nm: "A 2",
	    refId: "ljwjxj6chl2m21i8oo8",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 54.00000214576721,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 72.00000286102295,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 251,
	    ty: 0,
	    nm: "A 4",
	    refId: "ljwjxj6jrcsugfpibo",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 126.00000500679016,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 144.0000057220459,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 252,
	    ty: 0,
	    nm: "A 3",
	    refId: "ljwjxj6pu0pb3tkdx2a",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000357627869,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000429153442,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 253,
	    ty: 0,
	    nm: "A 1",
	    refId: "ljwjxj6uv4vvu04bo6c",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 18.000000715255737,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 36.000001430511475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 254,
	    hd: false,
	    nm: "Rectangle 3467765 - Null",
	    parent: 249,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 255,
	    hd: false,
	    nm: "Rectangle 3467765",
	    parent: 254,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[10, 0], [214, 0], [222, 8], [222, 141], [214, 149], [10, 149], [0, 139], [0, 10], [10, 0], [10, 0]],
	            i: [[0, 0], [0, 0], [0, -4.4183], [0, 0], [4.4183, 0], [0, 0], [0, 5.5229], [0, 0], [-5.5228, 0], [0, 0]],
	            o: [[0, 0], [4.41828000000001, 0], [0, 0], [0, 4.41828000000001], [0, 0], [-5.52285, 0], [0, 0], [0, -5.52285], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 256,
	    hd: false,
	    nm: "Rectangle 3467765",
	    parent: 254,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[10, 0], [214, 0], [222, 8], [222, 141], [214, 149], [10, 149], [0, 139], [0, 10], [10, 0], [10, 0]],
	            i: [[0, 0], [0, 0], [0, -4.4183], [0, 0], [4.4183, 0], [0, 0], [0, 5.5229], [0, 0], [-5.5228, 0], [0, 0]],
	            o: [[0, 0], [4.41828000000001, 0], [0, 0], [0, 4.41828000000001], [0, 0], [-5.52285, 0], [0, 0], [0, -5.52285], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [111.5, 75]
	        },
	        s: {
	          a: 0,
	          k: [446, 300]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: [{
	      nm: "DropShadow",
	      ty: 25,
	      en: 1,
	      ef: [{
	        ty: 2,
	        v: {
	          a: 0,
	          k: [0, 0, 0, 1]
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 5
	        }
	      }, {
	        ty: 1,
	        v: {
	          a: 0,
	          k: 1.5707963267948966
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: -2
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 4
	        }
	      }]
	    }]
	  }, {
	    ddd: 0,
	    ind: 257,
	    ty: 0,
	    nm: "A 5",
	    refId: "ljwjxj70gqxtpz5o59u",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 162.00000643730164,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 180.00000715255737,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 210.00000715255737,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [1],
	            y: [1]
	          }
	        }, {
	          t: 228.00000715255737,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0
	  }]
	}, {
	  nm: "[FRAME] Anim 8 - Null / Frame 1684947",
	  fr: 60,
	  id: "ljwjxj6bl8jb19cpd3h",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 258,
	    hd: false,
	    nm: "Anim 8 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 228.00000715255737,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 259,
	    ty: 0,
	    nm: "Frame 1684947",
	    refId: "ljwjxj6cer3cc1ml337",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 149,
	    ip: 0,
	    op: 228.00000715255737,
	    st: 0,
	    hd: false,
	    bm: 0,
	    ef: []
	  }]
	}];
	var layers$1 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 0,
	  nm: "Anim 8",
	  refId: "ljwjxj6bl8jb19cpd3h",
	  sr: 1,
	  ks: {
	    a: {
	      a: 0,
	      k: [0, 0]
	    },
	    p: {
	      a: 0,
	      k: [0, 0]
	    },
	    s: {
	      a: 0,
	      k: [100, 100]
	    },
	    sk: {
	      a: 0,
	      k: 0
	    },
	    sa: {
	      a: 0,
	      k: 0
	    },
	    r: {
	      a: 0,
	      k: 0
	    },
	    o: {
	      a: 0,
	      k: 100
	    }
	  },
	  ao: 0,
	  w: 428,
	  h: 149,
	  ip: 0,
	  op: 228.00000715255737,
	  st: 0,
	  hd: false,
	  bm: 0,
	  ef: []
	}];
	var meta$1 = {
	  a: "",
	  d: "",
	  tc: "",
	  g: "Aninix"
	};
	var ConferenceAnimation = {
	  nm: nm$1,
	  v: v$1,
	  fr: fr$1,
	  ip: ip$1,
	  op: op$1,
	  w: w$1,
	  h: h$1,
	  ddd: ddd$1,
	  markers: markers$1,
	  assets: assets$1,
	  layers: layers$1,
	  meta: meta$1
	};

	// @vue/component
	const ConferencePromo = {
	  components: {
	    PromoPopup,
	    MessengerButton: Button
	  },
	  emits: ['continue', 'close'],
	  data() {
	    return {};
	  },
	  computed: {
	    ButtonColor: () => ButtonColor,
	    ButtonSize: () => ButtonSize
	  },
	  mounted() {
	    ui_lottie.Lottie.loadAnimation({
	      animationData: ConferenceAnimation,
	      container: this.$refs.animationContainer,
	      renderer: 'svg',
	      loop: true,
	      autoplay: true
	    });
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<PromoPopup @close="$emit('close')">
			<div class="bx-im-group-chat-promo__container">
				<div class="bx-im-group-chat-promo__header">
					<div class="bx-im-group-chat-promo__title">
						{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CONFERENCE_TITLE') }}
					</div>
					<div class="bx-im-group-chat-promo__close" @click="$emit('close')"></div>
				</div>
				<div class="bx-im-group-chat-promo__content">
					<div class="bx-im-group-chat-promo__content_image" ref="animationContainer"></div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --camera"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CONFERENCE_DESCRIPTION_1') }}
						</div>
					</div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --link"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CONFERENCE_DESCRIPTION_2') }}
						</div>
					</div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --like"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CONFERENCE_DESCRIPTION_3') }}
						</div>
					</div>
				</div>
				<div class="bx-im-group-chat-promo__button-panel">
					<MessengerButton
						:size="ButtonSize.XL"
						:color="ButtonColor.Primary"
						:isRounded="true" 
						:text="loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_CONTINUE')"
						@click="$emit('continue')"
					/>
					<MessengerButton
						:size="ButtonSize.XL"
						:color="ButtonColor.Link"
						:isRounded="true"
						:text="loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_CANCEL')"
						@click="$emit('close')"
					/>
				</div>
			</div>
		</PromoPopup>
	`
	};

	var nm$2 = "Anim 3";
	var v$2 = "5.9.6";
	var fr$2 = 60;
	var ip$2 = 0;
	var op$2 = 245.0000041127205;
	var w$2 = 428;
	var h$2 = 143;
	var ddd$2 = 0;
	var markers$2 = [];
	var assets$2 = [{
	  nm: "A 01",
	  fr: 60,
	  id: "401:202",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 4,
	    hd: false,
	    nm: "A 01 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 168.00000339746475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [374.2959, 119],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 168.00000339746475,
	          s: [374.2959, 103],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 103],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 119]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 5,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 168.00000339746475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "Group 1684335",
	  fr: 60,
	  id: "401:204",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 6,
	    hd: false,
	    nm: "A 01 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 168.00000339746475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [374.2959, 119],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 168.00000339746475,
	          s: [374.2959, 103],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 103],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 119]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 7,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 6,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 8,
	    ty: 0,
	    nm: "A 01",
	    td: 1,
	    refId: "401:202",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 9,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 02",
	  fr: 60,
	  id: "401:195",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 15,
	    hd: false,
	    nm: "A 02 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000160932541,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [374.2959, 61],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000160932541,
	          s: [374.2959, 45],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 45],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 61]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 16,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000160932541,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "Group 1684335",
	  fr: 60,
	  id: "401:197",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 17,
	    hd: false,
	    nm: "A 02 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000160932541,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [374.2959, 61],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000160932541,
	          s: [374.2959, 45],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 45],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 61]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 18,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 17,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 19,
	    ty: 0,
	    nm: "A 02",
	    td: 1,
	    refId: "401:195",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 20,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 03",
	  fr: 60,
	  id: "401:187",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 26,
	    hd: false,
	    nm: "A 03 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 138.00000250339508,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [220.2959, 90],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 138.00000250339508,
	          s: [220.2959, 74],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 74],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 90]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 27,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 138.00000250339508,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "Group 1684335",
	  fr: 60,
	  id: "401:189",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 28,
	    hd: false,
	    nm: "A 03 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 138.00000250339508,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [220.2959, 90],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 138.00000250339508,
	          s: [220.2959, 74],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 74],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 90]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 29,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 28,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 30,
	    ty: 0,
	    nm: "A 03",
	    td: 1,
	    refId: "401:187",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 31,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "A 04",
	  fr: 60,
	  id: "401:179",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 37,
	    hd: false,
	    nm: "A 04 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 78.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [220.2959, 32],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 78.00000071525574,
	          s: [220.2959, 16],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 16],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 32]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 38,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 78.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "Group 1684335",
	  fr: 60,
	  id: "401:181",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 39,
	    hd: false,
	    nm: "A 04 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 78.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [220.2959, 32],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 78.00000071525574,
	          s: [220.2959, 16],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 16],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 32]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 40,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 39,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 41,
	    ty: 0,
	    nm: "A 04",
	    td: 1,
	    refId: "401:179",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 42,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "Group 1684340",
	  fr: 60,
	  id: "401:173",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 48,
	    hd: false,
	    nm: "Group 1684340 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [201, 2]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 49,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "Group 1684342",
	  fr: 60,
	  id: "401:174",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 50,
	    hd: false,
	    nm: "Group 1684340 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [201, 2]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 51,
	    hd: false,
	    nm: "Group 1684342 - Null",
	    parent: 50,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 52,
	    ty: 0,
	    nm: "Group 1684340",
	    td: 1,
	    refId: "401:173",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 53,
	    hd: false,
	    nm: "Anim 3 - Mask",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [428, 0], [428, 0], [428, 143], [428, 143], [0, 143], [0, 143], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    tt: 1
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1591 - Null / Rectangle 1591 / Rectangle 1591 / Rectangle 1590 - Null / Rectangle 1590 / Rectangle 1590 / Rectangle 1589 - Null / Rectangle 1589 / Rectangle 1589",
	  fr: 60,
	  id: "ljwdbxff4wvtj17d1gk",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 61,
	    hd: false,
	    nm: "A 01 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 168.00000339746475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [374.2959, 119],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 168.00000339746475,
	          s: [374.2959, 103],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 103],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 119]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 62,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 61,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 63,
	    hd: false,
	    nm: "Group 1684334 - Null",
	    parent: 62,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [4.189400000000035, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 64,
	    hd: false,
	    nm: "Rectangle 1591 - Null",
	    parent: 63,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [65.81049999999999, 9]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 65,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 64,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [2, 0], [4, 2], [4, 2], [2, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999998, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 66,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 64,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [2, 0], [4, 2], [4, 2], [2, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999998, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [2.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [10, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 67,
	    hd: false,
	    nm: "Rectangle 1590 - Null",
	    parent: 63,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 68,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 67,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [44.6818, 0], [46.6818, 2], [46.6818, 2], [44.6818, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 69,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 67,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [44.6818, 0], [46.6818, 2], [46.6818, 2], [44.6818, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [23.8409, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [95.3636, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 70,
	    hd: false,
	    nm: "Rectangle 1589 - Null",
	    parent: 63,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 71,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 70,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [67.4242, 0], [69.4242, 2], [69.4242, 2], [67.4242, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 72,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 70,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [67.4242, 0], [69.4242, 2], [69.4242, 2], [67.4242, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [35.2121, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [140.8484, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684334 / Rectangle 1587 - Null / Rectangle 1587 / Rectangle 1587",
	  fr: 60,
	  id: "ljwdbxffzoxhncgmjxs",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 73,
	    hd: false,
	    nm: "A 01 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 168.00000339746475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [374.2959, 119],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 168.00000339746475,
	          s: [374.2959, 103],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 103],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 119]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 74,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 73,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 75,
	    ty: 0,
	    nm: "Group 1684334",
	    refId: "ljwdbxff4wvtj17d1gk",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 76,
	    hd: false,
	    nm: "Rectangle 1587 - Null",
	    parent: 74,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 77,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 76,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [73, 0], [79, 6], [79, 18], [73, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 78,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 76,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [73, 0], [79, 6], [79, 18], [73, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [40, 12.5]
	        },
	        s: {
	          a: 0,
	          k: [160, 50]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684335 / Ellipse 197 - Null / Ellipse 197 / Ellipse 197",
	  fr: 60,
	  id: "ljwdbxffxxuiageeecf",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 79,
	    hd: false,
	    nm: "A 01 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 168.00000339746475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [374.2959, 119],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 168.00000339746475,
	          s: [374.2959, 103],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 103],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 119]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 80,
	    ty: 0,
	    nm: "Group 1684335",
	    refId: "ljwdbxffzoxhncgmjxs",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 81,
	    hd: false,
	    nm: "Ellipse 197 - Null",
	    parent: 79,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 82,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 81,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 83,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 81,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10, 10]
	        },
	        s: {
	          a: 0,
	          k: [40, 40]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1590 - Null / Rectangle 1590 / Rectangle 1590 / Rectangle 1589 - Null / Rectangle 1589 / Rectangle 1589",
	  fr: 60,
	  id: "ljwdbxfmrthz4z8ps7",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 84,
	    hd: false,
	    nm: "A 02 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000160932541,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [374.2959, 61],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000160932541,
	          s: [374.2959, 45],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 45],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 61]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 85,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 84,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 86,
	    hd: false,
	    nm: "Group 1684334 - Null",
	    parent: 85,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [4.189400000000035, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 87,
	    hd: false,
	    nm: "Rectangle 1590 - Null",
	    parent: 86,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 88,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 87,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [44.6818, 0], [46.6818, 2], [46.6818, 2], [44.6818, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 89,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 87,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [44.6818, 0], [46.6818, 2], [46.6818, 2], [44.6818, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [23.8409, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [95.3636, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 90,
	    hd: false,
	    nm: "Rectangle 1589 - Null",
	    parent: 86,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 91,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 90,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [67.4242, 0], [69.4242, 2], [69.4242, 2], [67.4242, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 92,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 90,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [67.4242, 0], [69.4242, 2], [69.4242, 2], [67.4242, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [35.2121, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [140.8484, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684334 / Rectangle 1587 - Null / Rectangle 1587 / Rectangle 1587",
	  fr: 60,
	  id: "ljwdbxfmrvb2eowygsk",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 93,
	    hd: false,
	    nm: "A 02 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000160932541,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [374.2959, 61],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000160932541,
	          s: [374.2959, 45],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 45],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 61]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 94,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 93,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 95,
	    ty: 0,
	    nm: "Group 1684334",
	    refId: "ljwdbxfmrthz4z8ps7",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 96,
	    hd: false,
	    nm: "Rectangle 1587 - Null",
	    parent: 94,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 97,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 96,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [73, 0], [79, 6], [79, 18], [73, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 98,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 96,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [73, 0], [79, 6], [79, 18], [73, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [40, 12.5]
	        },
	        s: {
	          a: 0,
	          k: [160, 50]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684335 / Ellipse 197 - Null / Ellipse 197 / Ellipse 197",
	  fr: 60,
	  id: "ljwdbxfmpxjcrh1gff",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 99,
	    hd: false,
	    nm: "A 02 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000160932541,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [374.2959, 61],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 108.00000160932541,
	          s: [374.2959, 45],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [374.3, 45],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [374.3, 61]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 180
	      },
	      s: {
	        a: 0,
	        k: [100, -100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 100,
	    ty: 0,
	    nm: "Group 1684335",
	    refId: "ljwdbxfmrvb2eowygsk",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 101,
	    hd: false,
	    nm: "Ellipse 197 - Null",
	    parent: 99,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 102,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 101,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 103,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 101,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10, 10]
	        },
	        s: {
	          a: 0,
	          k: [40, 40]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1591 - Null / Rectangle 1591 / Rectangle 1591 / Rectangle 1590 - Null / Rectangle 1590 / Rectangle 1590 / Rectangle 1589 - Null / Rectangle 1589 / Rectangle 1589",
	  fr: 60,
	  id: "ljwdbxfsfn70ceer0qe",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 104,
	    hd: false,
	    nm: "A 03 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 138.00000250339508,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [220.2959, 90],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 138.00000250339508,
	          s: [220.2959, 74],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 74],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 90]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 105,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 104,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 106,
	    hd: false,
	    nm: "Group 1684334 - Null",
	    parent: 105,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [5.728500000000025, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 107,
	    hd: false,
	    nm: "Rectangle 1591 - Null",
	    parent: 106,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [91.2715, 9]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 108,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 107,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [2, 0], [4, 2], [4, 2], [2, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999998, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 109,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 107,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [2, 0], [4, 2], [4, 2], [2, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999998, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [2.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [10, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 110,
	    hd: false,
	    nm: "Rectangle 1590 - Null",
	    parent: 106,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 111,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 110,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [61.8182, 0], [63.8182, 2], [63.8182, 2], [61.8182, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 112,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 110,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [61.8182, 0], [63.8182, 2], [63.8182, 2], [61.8182, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [32.409099999999995, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [129.63639999999998, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 113,
	    hd: false,
	    nm: "Rectangle 1589 - Null",
	    parent: 106,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 114,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 113,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [92.9091, 0], [94.9091, 2], [94.9091, 2], [92.9091, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 115,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 113,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [92.9091, 0], [94.9091, 2], [94.9091, 2], [92.9091, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [47.95455, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [191.8182, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684334 / Rectangle 1587 - Null / Rectangle 1587 / Rectangle 1587",
	  fr: 60,
	  id: "ljwdbxfszjo6kj8zfzd",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 116,
	    hd: false,
	    nm: "A 03 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 138.00000250339508,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [220.2959, 90],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 138.00000250339508,
	          s: [220.2959, 74],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 74],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 90]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 117,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 116,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 118,
	    ty: 0,
	    nm: "Group 1684334",
	    refId: "ljwdbxfsfn70ceer0qe",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 119,
	    hd: false,
	    nm: "Rectangle 1587 - Null",
	    parent: 117,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 120,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 119,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [102, 0], [108, 6], [108, 18], [102, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 121,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 119,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [102, 0], [108, 6], [108, 18], [102, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [54.5, 12.5]
	        },
	        s: {
	          a: 0,
	          k: [218, 50]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684335 / Ellipse 197 - Null / Ellipse 197 / Ellipse 197",
	  fr: 60,
	  id: "ljwdbxfr8c6fkx7v0h5",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 122,
	    hd: false,
	    nm: "A 03 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 138.00000250339508,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [220.2959, 90],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 138.00000250339508,
	          s: [220.2959, 74],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 74],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 90]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 123,
	    ty: 0,
	    nm: "Group 1684335",
	    refId: "ljwdbxfszjo6kj8zfzd",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 124,
	    hd: false,
	    nm: "Ellipse 197 - Null",
	    parent: 122,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 125,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 124,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 126,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 124,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10, 10]
	        },
	        s: {
	          a: 0,
	          k: [40, 40]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1591 - Null / Rectangle 1591 / Rectangle 1591 / Rectangle 1590 - Null / Rectangle 1590 / Rectangle 1590 / Rectangle 1589 - Null / Rectangle 1589 / Rectangle 1589",
	  fr: 60,
	  id: "ljwdbxfwo1xg5l0tro",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 127,
	    hd: false,
	    nm: "A 04 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 78.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [220.2959, 32],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 78.00000071525574,
	          s: [220.2959, 16],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 16],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 32]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 128,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 127,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 129,
	    hd: false,
	    nm: "Group 1684334 - Null",
	    parent: 128,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [5.728500000000025, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 130,
	    hd: false,
	    nm: "Rectangle 1591 - Null",
	    parent: 129,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [91.2715, 9]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 131,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 130,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [2, 0], [4, 2], [4, 2], [2, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999998, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 132,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 130,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [2, 0], [4, 2], [4, 2], [2, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999998, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [2.5, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [10, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 133,
	    hd: false,
	    nm: "Rectangle 1590 - Null",
	    parent: 129,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 7]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 134,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 133,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [61.8182, 0], [63.8182, 2], [63.8182, 2], [61.8182, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 135,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 133,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [61.8182, 0], [63.8182, 2], [63.8182, 2], [61.8182, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [32.409099999999995, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [129.63639999999998, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 136,
	    hd: false,
	    nm: "Rectangle 1589 - Null",
	    parent: 129,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 137,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 136,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [92.9091, 0], [94.9091, 2], [94.9091, 2], [92.9091, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 138,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 136,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [92.9091, 0], [94.9091, 2], [94.9091, 2], [92.9091, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [47.95455, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [191.8182, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684334 / Rectangle 1587 - Null / Rectangle 1587 / Rectangle 1587",
	  fr: 60,
	  id: "ljwdbxfw12rq6vu92sx",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 139,
	    hd: false,
	    nm: "A 04 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 78.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [220.2959, 32],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 78.00000071525574,
	          s: [220.2959, 16],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 16],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 32]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 140,
	    hd: false,
	    nm: "Group 1684335 - Null",
	    parent: 139,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [23, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 141,
	    ty: 0,
	    nm: "Group 1684334",
	    refId: "ljwdbxfwo1xg5l0tro",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 142,
	    hd: false,
	    nm: "Rectangle 1587 - Null",
	    parent: 140,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 143,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 142,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [102, 0], [108, 6], [108, 18], [102, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 144,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 142,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 80.0000011920929
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [102, 0], [108, 6], [108, 18], [102, 24], [6, 24], [0, 18], [0, 0]],
	            i: [[0, 0], [0, 0], [0, -3.3137], [0, 0], [3.3137, 0], [0, 0], [0, 3.3137], [0, 0]],
	            o: [[0, 0], [3.3137100000000004, 0], [0, 0], [0, 3.3137100000000004], [0, 0], [-3.31371, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 10
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [54.5, 12.5]
	        },
	        s: {
	          a: 0,
	          k: [218, 50]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Group 1684335 / Ellipse 197 - Null / Ellipse 197 / Ellipse 197",
	  fr: 60,
	  id: "ljwdbxfwvupgyk4x7m",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 145,
	    hd: false,
	    nm: "A 04 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 78.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      },
	      p: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [220.2959, 32],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 78.00000071525574,
	          s: [220.2959, 16],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 228.00000339746475,
	          s: [220.3, 16],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          },
	          ti: [0, 0],
	          to: [0, 0]
	        }, {
	          t: 246.0000041127205,
	          s: [220.3, 32]
	        }]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 146,
	    ty: 0,
	    nm: "Group 1684335",
	    refId: "ljwdbxfw12rq6vu92sx",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 147,
	    hd: false,
	    nm: "Ellipse 197 - Null",
	    parent: 145,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 148,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 147,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 149,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 147,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[19, 9.5], [18.5354, 12.4355], [17.1855, 15.0841], [15.0841, 17.1855], [12.4355, 18.5354], [9.5, 19], [6.5645, 18.5354], [3.9159, 17.1855], [1.8145, 15.0841], [0.4646, 12.4355], [0, 9.5], [0.4646, 6.5645], [1.8145, 3.9159], [3.9159, 1.8145], [6.5645, 0.4646], [9.5, 0], [12.4355, 0.4646], [15.0841, 1.8145], [17.1855, 3.9159], [18.5354, 6.5645], [19, 9.5], [19, 9.5]],
	            i: [[0, 0], [0.3078, -0.9481], [0.5861, -0.8065], [0.8066, -0.5861], [0.9481, -0.3078], [0.9966, 0], [0.9481, 0.3078], [0.8066, 0.5861], [0.5861, 0.8066], [0.3078, 0.9481], [0, 0.9966], [-0.3078, 0.9481], [-0.5861, 0.8066], [-0.8065, 0.5861], [-0.9481, 0.3078], [-0.9965, 0], [-0.9481, -0.3078], [-0.8065, -0.5861], [-0.5861, -0.8065], [-0.3078, -0.9481], [0, -0.9965], [0, 0]],
	            o: [[0, 0.9966000000000008], [-0.3078000000000003, 0.9481000000000002], [-0.5860999999999983, 0.8065999999999995], [-0.8064999999999998, 0.5860999999999983], [-0.9481000000000002, 0.3078000000000003], [-0.9964999999999993, 0], [-0.9481000000000002, -0.3078000000000003], [-0.8065000000000002, -0.5860999999999983], [-0.5860999999999998, -0.8064999999999998], [-0.3078, -0.9481000000000002], [0, -0.9964999999999993], [0.30779999999999996, -0.9481000000000002], [0.5860999999999998, -0.8065000000000002], [0.8066, -0.5860999999999998], [0.9481000000000002, -0.3078], [0.9966000000000008, 0], [0.9481000000000002, 0.30779999999999996], [0.8065999999999995, 0.5860999999999998], [0.5860999999999983, 0.8066], [0.3078000000000003, 0.9481000000000002], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10, 10]
	        },
	        s: {
	          a: 0,
	          k: [40, 40]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }]
	}, {
	  nm: "[GROUP] Union - Null / Union - Stroke / Union / Union",
	  fr: 60,
	  id: "ljwdbxg0z3bdjz8nefg",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 150,
	    hd: false,
	    nm: "Group 1684340 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [201, 2]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 151,
	    hd: false,
	    nm: "Group 1684342 - Null",
	    parent: 150,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 152,
	    hd: false,
	    nm: "Group 1684343 - Null",
	    parent: 151,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 153,
	    hd: false,
	    nm: "Union - Null",
	    parent: 152,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 154,
	    hd: false,
	    nm: "Union - Stroke",
	    parent: 153,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    ty: 4,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[21, 0], [11, 10], [11, 111.37], [1.4541, 117.5], [11, 121.82], [11, 131], [21, 141], [173, 141], [183, 131], [183, 10], [173, 0], [21, 0]],
	            i: [[0, 0], [0, -5.5228], [0, 0], [2.7782, -0.818], [-7.3198, -1.109], [0, 0], [-5.5228, 0], [0, 0], [0, 5.523], [0, 0], [5.523, 0], [0, 0]],
	            o: [[-5.5228, 0], [0, 0], [-3.34645, 2.8900000000000006], [-4.50111, 1.3250000000000028], [0, 0], [0, 5.522999999999996], [0, 0], [5.522999999999996, 0], [0, 0], [0, -5.52285], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "st",
	        o: {
	          a: 0,
	          k: 100
	        },
	        w: {
	          a: 0,
	          k: 2
	        },
	        c: {
	          a: 0,
	          k: [0.4980392156862745, 0.8705882352941177, 0.9882352941176471, 1]
	        },
	        ml: 4,
	        lc: 1,
	        lj: 1,
	        nm: "Stroke",
	        hd: false
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [92, 71]
	        },
	        s: {
	          a: 0,
	          k: [368, 284]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    hasMask: true,
	    masksProperties: [{
	      nm: "Mask",
	      pt: {
	        a: 0,
	        k: {
	          c: true,
	          v: [[21, 0], [11, 10], [11, 111.37], [1.4541, 117.5], [11, 121.82], [11, 131], [21, 141], [173, 141], [183, 131], [183, 10], [173, 0], [21, 0]],
	          i: [[0, 0], [0, -5.5228], [0, 0], [2.7782, -0.818], [-7.3198, -1.109], [0, 0], [-5.5228, 0], [0, 0], [0, 5.523], [0, 0], [5.523, 0], [0, 0]],
	          o: [[-5.5228, 0], [0, 0], [-3.34645, 2.8900000000000006], [-4.50111, 1.3250000000000028], [0, 0], [0, 5.522999999999996], [0, 0], [5.522999999999996, 0], [0, 0], [0, -5.52285], [0, 0], [0, 0]]
	        }
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      mode: "a",
	      x: {
	        a: 0,
	        k: 0
	      }
	    }]
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 155,
	    hd: false,
	    nm: "Union",
	    parent: 153,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[21, 0], [11, 10], [11, 111.37], [1.4541, 117.5], [11, 121.82], [11, 131], [21, 141], [173, 141], [183, 131], [183, 10], [173, 0], [21, 0]],
	            i: [[0, 0], [0, -5.5228], [0, 0], [2.7782, -0.818], [-7.3198, -1.109], [0, 0], [-5.5228, 0], [0, 0], [0, 5.523], [0, 0], [5.523, 0], [0, 0]],
	            o: [[-5.5228, 0], [0, 0], [-3.34645, 2.8900000000000006], [-4.50111, 1.3250000000000028], [0, 0], [0, 5.522999999999996], [0, 0], [5.522999999999996, 0], [0, 0], [0, -5.52285], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 2
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 156,
	    hd: false,
	    nm: "Union",
	    parent: 153,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[21, 0], [11, 10], [11, 111.37], [1.4541, 117.5], [11, 121.82], [11, 131], [21, 141], [173, 141], [183, 131], [183, 10], [173, 0], [21, 0]],
	            i: [[0, 0], [0, -5.5228], [0, 0], [2.7782, -0.818], [-7.3198, -1.109], [0, 0], [-5.5228, 0], [0, 0], [0, 5.523], [0, 0], [5.523, 0], [0, 0]],
	            o: [[-5.5228, 0], [0, 0], [-3.34645, 2.8900000000000006], [-4.50111, 1.3250000000000028], [0, 0], [0, 5.522999999999996], [0, 0], [5.522999999999996, 0], [0, 0], [0, -5.52285], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 2
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [92, 71]
	        },
	        s: {
	          a: 0,
	          k: [368, 284]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: [{
	      nm: "DropShadow",
	      ty: 25,
	      en: 1,
	      ef: [{
	        ty: 2,
	        v: {
	          a: 0,
	          k: [0, 0, 0, 1]
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 5
	        }
	      }, {
	        ty: 1,
	        v: {
	          a: 0,
	          k: 1.5707963267948966
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: -4
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 4
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "[GROUP] Group 1684343",
	  fr: 60,
	  id: "ljwdbxg040zsdaghc3z",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 157,
	    hd: false,
	    nm: "Group 1684340 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [201, 2]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 158,
	    hd: false,
	    nm: "Group 1684342 - Null",
	    parent: 157,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 159,
	    ty: 0,
	    nm: "Group 1684343",
	    refId: "ljwdbxg0z3bdjz8nefg",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }]
	}, {
	  nm: "[GROUP] Group 1684342",
	  fr: 60,
	  id: "ljwdbxg0y0q6kkv2kit",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 160,
	    hd: false,
	    nm: "Group 1684340 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [201, 2]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 161,
	    ty: 0,
	    nm: "Group 1684342",
	    refId: "ljwdbxg040zsdaghc3z",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }]
	}, {
	  nm: "[GROUP] Rectangle 1590 - Null / Rectangle 1590 / Rectangle 1590 / Rectangle 1589 - Null / Rectangle 1589 / Rectangle 1589 / Rectangle 1595 - Null / Rectangle 1595 / Rectangle 1595 / Rectangle 1594 - Null / Rectangle 1594 / Rectangle 1594 / Rectangle 1592 - Null / Rectangle 1592 / Rectangle 1592 / Rectangle 1591 - Null / Rectangle 1591 / Rectangle 1591 / Rectangle 1588 - Null / Rectangle 1588 / Rectangle 1588 / Ellipse 197 - Null / Ellipse 197 / Ellipse 197 / Rectangle 1593 - Null / Rectangle 1593 / Rectangle 1593 / Rectangle 1587 - Null / Rectangle 1587 / Rectangle 1587",
	  fr: 60,
	  id: "ljwdbxg2fo2jz6ftsk7",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 162,
	    hd: false,
	    nm: "Group 1684333 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 9]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 163,
	    hd: false,
	    nm: "Rectangle 1590 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [46.0078, 42.7637]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 164,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 163,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [95.876, 0], [97.876, 2], [97.876, 2], [95.876, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 165,
	    hd: false,
	    nm: "Rectangle 1590",
	    parent: 163,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [95.876, 0], [97.876, 2], [97.876, 2], [95.876, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [49.438, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [197.752, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 166,
	    hd: false,
	    nm: "Rectangle 1589 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [46.0078, 34.4692]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 167,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 166,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [145.6434, 0], [147.6434, 2], [147.6434, 2], [145.6434, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 168,
	    hd: false,
	    nm: "Rectangle 1589",
	    parent: 166,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [145.6434, 0], [147.6434, 2], [147.6434, 2], [145.6434, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [74.3217, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [297.2868, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 169,
	    hd: false,
	    nm: "Rectangle 1595 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [184, 105]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 170,
	    hd: false,
	    nm: "Rectangle 1595",
	    parent: 169,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[7, 0], [7, 0], [14, 7], [14, 7], [7, 14], [7, 14], [0, 7], [0, 7], [7, 0], [7, 0]],
	            i: [[0, 0], [0, 0], [0, -3.866], [0, 0], [3.866, 0], [0, 0], [0, 3.866], [0, 0], [-3.866, 0], [0, 0]],
	            o: [[0, 0], [3.86599, 0], [0, 0], [0, 3.86599], [0, 0], [-3.86599, 0], [0, 0], [0, -3.86599], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0.3176470588235294, 0.7450980392156863, 0.9529411764705882, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 171,
	    hd: false,
	    nm: "Rectangle 1595",
	    parent: 169,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[7, 0], [7, 0], [14, 7], [14, 7], [7, 14], [7, 14], [0, 7], [0, 7], [7, 0], [7, 0]],
	            i: [[0, 0], [0, 0], [0, -3.866], [0, 0], [3.866, 0], [0, 0], [0, 3.866], [0, 0], [-3.866, 0], [0, 0]],
	            o: [[0, 0], [3.86599, 0], [0, 0], [0, 3.86599], [0, 0], [-3.86599, 0], [0, 0], [0, -3.86599], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [0.3176470588235294, 0.7450980392156863, 0.9529411764705882, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [7.5, 7.5]
	        },
	        s: {
	          a: 0,
	          k: [30, 30]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 172,
	    hd: false,
	    nm: "Rectangle 1594 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [160, 110]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 173,
	    hd: false,
	    nm: "Rectangle 1594",
	    parent: 172,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [17, 0], [19, 2], [19, 2], [17, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.104569999999999, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 174,
	    hd: false,
	    nm: "Rectangle 1594",
	    parent: 172,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [17, 0], [19, 2], [19, 2], [17, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.104569999999999, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [10, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [40, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 175,
	    hd: false,
	    nm: "Rectangle 1592 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [86.6514, 13.7329]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 176,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 175,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [9.6124, 0], [11.6124, 2], [11.6124, 2], [9.6124, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000007, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 177,
	    hd: false,
	    nm: "Rectangle 1592",
	    parent: 175,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [9.6124, 0], [11.6124, 2], [11.6124, 2], [9.6124, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000007, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [6.3062, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [25.2248, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 178,
	    hd: false,
	    nm: "Rectangle 1591 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [46.0078, 13.7329]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 179,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 178,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [32.8372, 0], [34.8372, 2], [34.8372, 2], [32.8372, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 180,
	    hd: false,
	    nm: "Rectangle 1591",
	    parent: 178,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [32.8372, 0], [34.8372, 2], [34.8372, 2], [32.8372, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045700000000025, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [17.9186, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [71.6744, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 181,
	    hd: false,
	    nm: "Rectangle 1588 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [46.0078, 26.174799999999998]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 182,
	    hd: false,
	    nm: "Rectangle 1588",
	    parent: 181,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [170.5271, 0], [172.5271, 2], [172.5271, 2], [170.5271, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 183,
	    hd: false,
	    nm: "Rectangle 1588",
	    parent: 181,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[2, 0], [170.5271, 0], [172.5271, 2], [172.5271, 2], [170.5271, 4], [2, 4], [0, 2], [0, 2], [2, 0], [2, 0]],
	            i: [[0, 0], [0, 0], [0, -1.1046], [0, 0], [1.1046, 0], [0, 0], [0, 1.1046], [0, 0], [-1.1046, 0], [0, 0]],
	            o: [[0, 0], [1.1045699999999954, 0], [0, 0], [0, 1.1045699999999998], [0, 0], [-1.10457, 0], [0, 0], [0, -1.10457], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [86.76355, 2.5]
	        },
	        s: {
	          a: 0,
	          k: [347.0542, 10]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 184,
	    hd: false,
	    nm: "Ellipse 197 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 185,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 184,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [24.3888, 16.3625], [22.6125, 19.8475], [19.8475, 22.6125], [16.3625, 24.3888], [12.5, 25], [8.6375, 24.3888], [5.1525, 22.6125], [2.3875, 19.8475], [0.6113, 16.3625], [0, 12.5], [0.6113, 8.6375], [2.3875, 5.1525], [5.1525, 2.3875], [8.6375, 0.6113], [12.5, 0], [16.3625, 0.6113], [19.8475, 2.3875], [22.6125, 5.1525], [24.3888, 8.6375], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [0.405, -1.2475], [0.7713, -1.0612], [1.0613, -0.7712], [1.2475, -0.405], [1.3112, 0], [1.2475, 0.405], [1.0613, 0.7713], [0.7713, 1.0613], [0.405, 1.2475], [0, 1.3112], [-0.405, 1.2475], [-0.7712, 1.0613], [-1.0612, 0.7713], [-1.2475, 0.405], [-1.3112, 0], [-1.2475, -0.405], [-1.0612, -0.7712], [-0.7712, -1.0612], [-0.405, -1.2475], [0, -1.3112], [0, 0]],
	            o: [[0, 1.3111999999999995], [-0.40500000000000114, 1.2474999999999987], [-0.7712000000000003, 1.0612999999999992], [-1.0611999999999995, 0.7713000000000001], [-1.2475000000000005, 0.40500000000000114], [-1.3111999999999995, 0], [-1.2475000000000005, -0.40500000000000114], [-1.0611999999999995, -0.7712000000000003], [-0.7711999999999999, -1.0611999999999995], [-0.405, -1.2475000000000005], [0, -1.3111999999999995], [0.405, -1.2475000000000005], [0.7713000000000001, -1.0611999999999995], [1.0613000000000001, -0.7711999999999999], [1.2475000000000005, -0.405], [1.3111999999999995, 0], [1.2474999999999987, 0.405], [1.0612999999999992, 0.7713000000000001], [0.7713000000000001, 1.0613000000000001], [0.40500000000000114, 1.2475000000000005], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 186,
	    hd: false,
	    nm: "Ellipse 197",
	    parent: 184,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[25, 12.5], [24.3888, 16.3625], [22.6125, 19.8475], [19.8475, 22.6125], [16.3625, 24.3888], [12.5, 25], [8.6375, 24.3888], [5.1525, 22.6125], [2.3875, 19.8475], [0.6113, 16.3625], [0, 12.5], [0.6113, 8.6375], [2.3875, 5.1525], [5.1525, 2.3875], [8.6375, 0.6113], [12.5, 0], [16.3625, 0.6113], [19.8475, 2.3875], [22.6125, 5.1525], [24.3888, 8.6375], [25, 12.5], [25, 12.5]],
	            i: [[0, 0], [0.405, -1.2475], [0.7713, -1.0612], [1.0613, -0.7712], [1.2475, -0.405], [1.3112, 0], [1.2475, 0.405], [1.0613, 0.7713], [0.7713, 1.0613], [0.405, 1.2475], [0, 1.3112], [-0.405, 1.2475], [-0.7712, 1.0613], [-1.0612, 0.7713], [-1.2475, 0.405], [-1.3112, 0], [-1.2475, -0.405], [-1.0612, -0.7712], [-0.7712, -1.0612], [-0.405, -1.2475], [0, -1.3112], [0, 0]],
	            o: [[0, 1.3111999999999995], [-0.40500000000000114, 1.2474999999999987], [-0.7712000000000003, 1.0612999999999992], [-1.0611999999999995, 0.7713000000000001], [-1.2475000000000005, 0.40500000000000114], [-1.3111999999999995, 0], [-1.2475000000000005, -0.40500000000000114], [-1.0611999999999995, -0.7712000000000003], [-0.7711999999999999, -1.0611999999999995], [-0.405, -1.2475000000000005], [0, -1.3111999999999995], [0.405, -1.2475000000000005], [0.7713000000000001, -1.0611999999999995], [1.0613000000000001, -0.7711999999999999], [1.2475000000000005, -0.405], [1.3111999999999995, 0], [1.2474999999999987, 0.405], [1.0612999999999992, 0.7713000000000001], [0.7713000000000001, 1.0613000000000001], [0.40500000000000114, 1.2475000000000005], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 20
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [13, 13]
	        },
	        s: {
	          a: 0,
	          k: [52, 52]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 187,
	    hd: false,
	    nm: "Rectangle 1593 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 50
	      },
	      p: {
	        a: 0,
	        k: [44, 54.998]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 188,
	    hd: false,
	    nm: "Rectangle 1593",
	    parent: 187,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[7, 0], [166, 0], [173, 7], [173, 36], [166, 43], [7, 43], [0, 36], [0, 7], [7, 0], [7, 0]],
	            i: [[0, 0], [0, 0], [0, -3.866], [0, 0], [3.866, 0], [0, 0], [0, 3.866], [0, 0], [-3.866, 0], [0, 0]],
	            o: [[0, 0], [3.8659900000000107, 0], [0, 0], [0, 3.8659899999999965], [0, 0], [-3.86599, 0], [0, 0], [0, -3.86599], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 189,
	    hd: false,
	    nm: "Rectangle 1593",
	    parent: 187,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 50
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[7, 0], [166, 0], [173, 7], [173, 36], [166, 43], [7, 43], [0, 36], [0, 7], [7, 0], [7, 0]],
	            i: [[0, 0], [0, 0], [0, -3.866], [0, 0], [3.866, 0], [0, 0], [0, 3.866], [0, 0], [-3.866, 0], [0, 0]],
	            o: [[0, 0], [3.8659900000000107, 0], [0, 0], [0, 3.8659899999999965], [0, 0], [-3.86599, 0], [0, 0], [0, -3.86599], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 30
	        },
	        c: {
	          a: 0,
	          k: [0.3215686274509804, 0.3607843137254902, 0.4117647058823529, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [87, 22]
	        },
	        s: {
	          a: 0,
	          k: [348, 88]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 3,
	    ddd: 0,
	    ind: 190,
	    hd: false,
	    nm: "Rectangle 1587 - Null",
	    parent: 162,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [29, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 191,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 190,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [195, 0], [195, 125], [6, 125], [6, 8.5], [0, 0], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [4, 1.5002], [0, 0]],
	            o: [[2, 0.00023], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: []
	  }, {
	    ty: 4,
	    ddd: 0,
	    ind: 192,
	    hd: false,
	    nm: "Rectangle 1587",
	    parent: 190,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1,
	    shapes: [{
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "sh",
	        nm: "Path",
	        hd: false,
	        ks: {
	          a: 0,
	          k: {
	            c: true,
	            v: [[0, 0], [195, 0], [195, 125], [6, 125], [6, 8.5], [0, 0], [0, 0]],
	            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [4, 1.5002], [0, 0]],
	            o: [[2, 0.00023], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
	          }
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 100
	        },
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }, {
	      ty: "gr",
	      nm: "Group",
	      hd: false,
	      np: 3,
	      it: [{
	        ty: "rc",
	        nm: "Rectangle",
	        hd: false,
	        p: {
	          a: 0,
	          k: [98, 63]
	        },
	        s: {
	          a: 0,
	          k: [392, 252]
	        },
	        r: {
	          a: 0,
	          k: 0
	        }
	      }, {
	        ty: "fl",
	        o: {
	          a: 0,
	          k: 0
	        },
	        c: {
	          a: 0,
	          k: [0, 1, 0, 1]
	        },
	        nm: "Fill",
	        hd: false,
	        r: 1
	      }, {
	        ty: "tr",
	        a: {
	          a: 0,
	          k: [0, 0]
	        },
	        p: {
	          a: 0,
	          k: [0, 0]
	        },
	        s: {
	          a: 0,
	          k: [100, 100]
	        },
	        sk: {
	          a: 0,
	          k: 0
	        },
	        sa: {
	          a: 0,
	          k: 0
	        },
	        r: {
	          a: 0,
	          k: 0
	        },
	        o: {
	          a: 0,
	          k: 100
	        }
	      }]
	    }],
	    ef: [{
	      nm: "DropShadow",
	      ty: 25,
	      en: 1,
	      ef: [{
	        ty: 2,
	        v: {
	          a: 0,
	          k: [0, 0, 0, 1]
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 10
	        }
	      }, {
	        ty: 1,
	        v: {
	          a: 0,
	          k: 1.5707963267948966
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: -1
	        }
	      }, {
	        ty: 0,
	        v: {
	          a: 0,
	          k: 3
	        }
	      }]
	    }]
	  }]
	}, {
	  nm: "[FRAME] Anim 3 - Null / A 01 / A 02 / A 03 / A 04 / Group 1684340 / Group 1684333",
	  fr: 60,
	  id: "ljwdbxfe30funpu7y6i",
	  layers: [{
	    ty: 3,
	    ddd: 0,
	    ind: 193,
	    hd: false,
	    nm: "Anim 3 - Null",
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      o: {
	        a: 0,
	        k: 100
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      }
	    },
	    st: 0,
	    ip: 0,
	    op: 246.0000041127205,
	    bm: 0,
	    sr: 1
	  }, {
	    ddd: 0,
	    ind: 194,
	    ty: 0,
	    nm: "A 01",
	    refId: "ljwdbxffxxuiageeecf",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 150.00000268220901,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 168.00000339746475,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 195,
	    ty: 0,
	    nm: "A 02",
	    refId: "ljwdbxfmpxjcrh1gff",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 90.00000089406967,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 108.00000160932541,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 196,
	    ty: 0,
	    nm: "A 03",
	    refId: "ljwdbxfr8c6fkx7v0h5",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 120.00000178813934,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 138.00000250339508,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 197,
	    ty: 0,
	    nm: "A 04",
	    refId: "ljwdbxfwvupgyk4x7m",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 1,
	        k: [{
	          t: 60,
	          s: [0],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 78.00000071525574,
	          s: [100],
	          o: {
	            x: [0.5],
	            y: [0.35]
	          },
	          i: {
	            x: [0.15],
	            y: [1]
	          }
	        }, {
	          t: 228.00000339746475,
	          s: [100],
	          o: {
	            x: [0],
	            y: [0]
	          },
	          i: {
	            x: [0.58],
	            y: [1]
	          }
	        }, {
	          t: 246.0000041127205,
	          s: [0]
	        }]
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 198,
	    ty: 0,
	    nm: "Group 1684340",
	    refId: "ljwdbxg0y0q6kkv2kit",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }, {
	    ddd: 0,
	    ind: 199,
	    ty: 0,
	    nm: "Group 1684333",
	    refId: "ljwdbxg2fo2jz6ftsk7",
	    sr: 1,
	    ks: {
	      a: {
	        a: 0,
	        k: [0, 0]
	      },
	      p: {
	        a: 0,
	        k: [0, 0]
	      },
	      s: {
	        a: 0,
	        k: [100, 100]
	      },
	      sk: {
	        a: 0,
	        k: 0
	      },
	      sa: {
	        a: 0,
	        k: 0
	      },
	      r: {
	        a: 0,
	        k: 0
	      },
	      o: {
	        a: 0,
	        k: 100
	      }
	    },
	    ao: 0,
	    w: 428,
	    h: 143,
	    ip: 0,
	    op: 246.0000041127205,
	    st: 0,
	    hd: false,
	    bm: 0
	  }]
	}];
	var layers$2 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 0,
	  nm: "Anim 3",
	  refId: "ljwdbxfe30funpu7y6i",
	  sr: 1,
	  ks: {
	    a: {
	      a: 0,
	      k: [0, 0]
	    },
	    p: {
	      a: 0,
	      k: [0, 0]
	    },
	    s: {
	      a: 0,
	      k: [100, 100]
	    },
	    sk: {
	      a: 0,
	      k: 0
	    },
	    sa: {
	      a: 0,
	      k: 0
	    },
	    r: {
	      a: 0,
	      k: 0
	    },
	    o: {
	      a: 0,
	      k: 100
	    }
	  },
	  ao: 0,
	  w: 428,
	  h: 143,
	  ip: 0,
	  op: 246.0000041127205,
	  st: 0,
	  hd: false,
	  bm: 0,
	  ef: []
	}];
	var meta$2 = {
	  a: "",
	  d: "",
	  tc: "",
	  g: "Aninix"
	};
	var ChannelAnimation = {
	  nm: nm$2,
	  v: v$2,
	  fr: fr$2,
	  ip: ip$2,
	  op: op$2,
	  w: w$2,
	  h: h$2,
	  ddd: ddd$2,
	  markers: markers$2,
	  assets: assets$2,
	  layers: layers$2,
	  meta: meta$2
	};

	// @vue/component
	const ChannelPromo = {
	  name: 'ChannelPromo',
	  components: {
	    PromoPopup,
	    MessengerButton: Button
	  },
	  emits: ['continue', 'close'],
	  data() {
	    return {};
	  },
	  computed: {
	    ButtonColor: () => ButtonColor,
	    ButtonSize: () => ButtonSize
	  },
	  mounted() {
	    ui_lottie.Lottie.loadAnimation({
	      animationData: ChannelAnimation,
	      container: this.$refs.animationContainer,
	      renderer: 'svg',
	      loop: true,
	      autoplay: true
	    });
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<PromoPopup @close="$emit('close')">
			<div class="bx-im-group-chat-promo__container">
				<div class="bx-im-group-chat-promo__header">
					<div class="bx-im-group-chat-promo__title">
						{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CHANNEL_TITLE') }}
					</div>
					<div class="bx-im-group-chat-promo__close" @click="$emit('close')"></div>
				</div>
				<div class="bx-im-group-chat-promo__content">
					<div class="bx-im-group-chat-promo__content_image" ref="animationContainer"></div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --like"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CHANNEL_DESCRIPTION_1') }}
						</div>
					</div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --channel"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CHANNEL_DESCRIPTION_2') }}
						</div>
					</div>
					<div class="bx-im-group-chat-promo__content_item">
						<div class="bx-im-group-chat-promo__content_icon --chat"></div>
						<div class="bx-im-group-chat-promo__content_text">
							{{ loc('IM_RECENT_CREATE_CHAT_PROMO_CHANNEL_DESCRIPTION_3') }}
						</div>
					</div>
				</div>
				<div class="bx-im-group-chat-promo__button-panel">
					<MessengerButton
						:size="ButtonSize.XL"
						:color="ButtonColor.Primary"
						:isRounded="true" 
						:text="loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_CONTINUE')"
						@click="$emit('continue')"
					/>
					<MessengerButton
						:size="ButtonSize.XL"
						:color="ButtonColor.Link"
						:isRounded="true"
						:text="loc('IM_RECENT_CREATE_CHAT_PROMO_GROUP_CHAT_CANCEL')"
						@click="$emit('close')"
					/>
				</div>
			</div>
		</PromoPopup>
	`
	};

	// @vue/component
	const CreateChatPromo = {
	  name: 'CreateChatPromo',
	  components: {
	    GroupChatPromo,
	    ConferencePromo,
	    ChannelPromo
	  },
	  props: {
	    chatType: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['continue', 'close'],
	  data() {
	    return {};
	  },
	  computed: {
	    ChatType: () => im_v2_const.ChatType
	  },
	  template: `
		<GroupChatPromo v-if="chatType === ChatType.chat" @close="$emit('close')" @continue="$emit('continue')" />
		<ConferencePromo v-else-if="chatType === ChatType.videoconf" @close="$emit('close')" @continue="$emit('continue')" />
		<ChannelPromo v-else-if="chatType === ChatType.channel" @close="$emit('close')" @continue="$emit('continue')" />
	`
	};

	// @vue/component
	const ListLoadingState = {
	  name: 'ListLoadingState',
	  data() {
	    return {};
	  },
	  template: `
		<div class="bx-im-list-loading-state__container"></div>
	`
	};

	// @vue/component
	const CopilotRolesDialog = {
	  name: 'CopilotRolesDialog',
	  props: {
	    title: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['selectRole', 'close'],
	  computed: {
	    titleText() {
	      return this.title || this.loc('IM_ELEMENTS_COPILOT_ROLES_DIALOG_DEFAULT_TITLE');
	    }
	  },
	  created() {
	    this.roleDialog = new ai_rolesDialog.RolesDialog({
	      moduleId: 'im',
	      contextId: 'im-copilot-create-chat',
	      title: this.titleText
	    });
	    this.subscribeToEvents();
	  },
	  mounted() {
	    void this.roleDialog.show();
	  },
	  beforeUnmount() {
	    if (!this.roleDialog) {
	      return;
	    }
	    this.roleDialog.hide();
	    this.unsubscribeFromEvents();
	  },
	  methods: {
	    subscribeToEvents() {
	      this.roleDialog.subscribe(ai_rolesDialog.RolesDialogEvents.SELECT_ROLE, this.onSelectRole);
	      this.roleDialog.subscribe(ai_rolesDialog.RolesDialogEvents.HIDE, this.onHide);
	    },
	    unsubscribeFromEvents() {
	      this.roleDialog.unsubscribe(ai_rolesDialog.RolesDialogEvents.SELECT_ROLE, this.onSelectRole);
	      this.roleDialog.unsubscribe(ai_rolesDialog.RolesDialogEvents.HIDE, this.onHide);
	    },
	    onSelectRole(event) {
	      const {
	        role
	      } = event.getData();
	      if (!role) {
	        return;
	      }
	      this.$emit('selectRole', role);
	    },
	    onHide() {
	      this.$emit('close');
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: '<template></template>'
	};

	exports.AvatarSize = AvatarSize;
	exports.ChatAvatar = ChatAvatar;
	exports.MessageAvatar = MessageAvatar;
	exports.ChatTitle = ChatTitle;
	exports.MessageAuthorTitle = MessageAuthorTitle;
	exports.Button = Button;
	exports.ButtonColor = ButtonColor;
	exports.ButtonSize = ButtonSize;
	exports.ButtonIcon = ButtonIcon;
	exports.MessengerPopup = MessengerPopup;
	exports.MessengerMenu = MessengerMenu;
	exports.MenuItem = MenuItem;
	exports.MenuItemIcon = MenuItemIcon;
	exports.Attach = Attach;
	exports.ChatInfoPopup = ChatInfoPopup;
	exports.UserListPopup = UserListPopup;
	exports.Keyboard = Keyboard;
	exports.UserStatus = UserStatus;
	exports.UserStatusSize = UserStatusSize;
	exports.Dropdown = Dropdown;
	exports.Loader = Loader;
	exports.Spinner = Spinner;
	exports.SpinnerSize = SpinnerSize;
	exports.SpinnerColor = SpinnerColor;
	exports.LineLoader = LineLoader;
	exports.Toggle = Toggle;
	exports.ToggleSize = ToggleSize;
	exports.MessengerTabs = MessengerTabs;
	exports.TabsColorScheme = TabsColorScheme;
	exports.AudioPlayer = AudioPlayer$$1;
	exports.ChatTitleWithHighlighting = ChatTitleWithHighlighting$$1;
	exports.SearchInput = SearchInput$$1;
	exports.EditableChatTitle = EditableChatTitle;
	exports.ScrollWithGradient = ScrollWithGradient;
	exports.DialogStatus = DialogStatus;
	exports.CreateChatPromo = CreateChatPromo;
	exports.ListLoadingState = ListLoadingState;
	exports.CopilotRolesDialog = CopilotRolesDialog;

}((this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}),BX,BX.Messenger.v2.Lib,BX,BX.Messenger.v2.Lib,BX,BX.Vue3.Directives,BX.UI,BX.Messenger.v2.Model,BX.Event,BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Provider.Service,BX.Messenger.v2.Lib,BX.Main,BX,BX.Vue3.Components,BX.Vue3,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Const,BX.UI,BX.AI));
//# sourceMappingURL=registry.bundle.js.map
