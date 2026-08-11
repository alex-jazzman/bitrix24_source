/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_const, im_v2_lib_copilot, ui_avatar, ui_fonts_opensans, im_v2_lib_utils, im_v2_lib_channel, im_v2_lib_feature, main_core) {
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
	const AvatarSizeMap = Object.freeze({
		[AvatarSize.XXXL]: 94,
		[AvatarSize.XXL]: 60,
		[AvatarSize.XL]: 48,
		[AvatarSize.L]: 42,
		[AvatarSize.M]: 32,
		[AvatarSize.S]: 22,
		[AvatarSize.XS]: 18,
		[AvatarSize.XXS]: 14
	});
	const ChatAvatarType = {
		selfChat: 'selfChat'
	};
	const EmptyAvatarType = Object.freeze({
		default: 'default',
		squared: 'squared',
		collab: 'collab'
	});

	const AvatarType = {
		extranet: 'extranet',
		collaber: 'collaber',
		collab: 'collab',
		collabV2: 'collabV2',
		copilot: 'copilot',
		default: 'default',
		aiAssistantMarta: 'aiAssistantMarta'
	};
	const AvatarClassByChatType = {
		[AvatarType.extranet]: ui_avatar.AvatarRoundExtranet,
		[AvatarType.collaber]: ui_avatar.AvatarRoundGuest,
		[AvatarType.collab]: ui_avatar.AvatarHexagonGuest,
		[AvatarType.collabV2]: ui_avatar.AvatarHexagonProject,
		[AvatarType.copilot]: ui_avatar.AvatarRoundCopilot,
		[AvatarType.aiAssistantMarta]: ui_avatar.AvatarRoundMarta,
		default: ui_avatar.AvatarBase
	};

	// @vue/component
	const BaseUiAvatar = {
		props: {
			type: {
				type: String,
				required: true,
				validator(value) {
					return Object.values(AvatarType).includes(value);
				}
			},
			/**
			 * Optional override
			 */
			avatarClass: {
				type: Function,
				default: null
			},
			size: {
				type: String,
				default: AvatarSize.M
			},
			url: {
				type: String,
				default: ''
			},
			title: {
				type: String,
				default: ''
			},
			backgroundColor: {
				type: String,
				default: ''
			}
		},
		computed: {
			AvatarSize: () => AvatarSize,
			calculatedSize() {
				return AvatarSizeMap[this.size];
			}
		},
		watch: {
			type() {
				this.updateAvatarType();
			},
			avatarClass() {
				this.updateAvatarType();
			},
			title() {
				this.avatar.setTitle(this.title);
			},
			url() {
				this.setAvatarImage();
			},
			backgroundColor() {
				this.setBackgroundColor();
			}
		},
		created() {
			this.initAvatarClass();
		},
		mounted() {
			this.renderAvatar();
		},
		methods: {
			initAvatarClass() {
				const AvatarClass = this.avatarClass || AvatarClassByChatType[this.type] || AvatarClassByChatType.default;
				this.avatar = new AvatarClass({
					size: this.calculatedSize,
					title: this.title
				});
				this.setAvatarImage();
				this.setBackgroundColor();
			},
			renderAvatar() {
				if (!this.avatar || !this.$refs.avatarContainer) {
					return;
				}
				this.avatar.renderTo(this.$refs.avatarContainer);
			},
			setAvatarImage() {
				if (!this.url) {
					this.avatar.removeUserPic();
					this.avatar.setTitle(this.title);
					return;
				}
				this.avatar.setUserPic(this.url);
			},
			setBackgroundColor() {
				if (!this.backgroundColor) {
					return;
				}
				this.avatar.setBaseColor(this.backgroundColor);
			},
			updateAvatarType() {
				this.$refs.avatarContainer.innerHTML = '';
				this.initAvatarClass();
				this.renderAvatar();
			}
		},
		template: `
		<div class="bx-im-base-ui-avatar__container" ref="avatarContainer"></div>
	`
	};

	// @vue/component
	const MartaAvatar = {
		name: 'MartaAvatar',
		components: {
			BaseUiAvatar
		},
		props: {
			dialogId: {
				type: [String, Number],
				default: 0
			},
			size: {
				type: String,
				default: AvatarSize.M
			}
		},
		computed: {
			AvatarType: () => AvatarType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogName() {
				return this.dialog.name;
			},
			dialogAvatarUrl() {
				return this.dialog.avatar;
			}
		},
		template: `
		<BaseUiAvatar
			:type="AvatarType.aiAssistantMarta"
			:title="dialogName"
			:size="size"
			:url="dialogAvatarUrl"
		/>
	`
	};

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
			},
			backgroundColor: {
				type: String,
				default: ''
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
			isChannel() {
				return im_v2_lib_channel.ChannelManager.isChannel(this.dialogId);
			},
			isSpecialType() {
				const commonTypes = [im_v2_const.ChatType.user, im_v2_const.ChatType.chat, im_v2_const.ChatType.open, im_v2_const.ChatType.lines, im_v2_const.ChatType.copilot, im_v2_const.ChatType.taskComments];
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
				if (this.backgroundColor) {
					return {
						backgroundColor: this.backgroundColor
					};
				}
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
				const SPECIAL_TYPES_WITH_LETTERS = [im_v2_const.ChatType.openChannel, im_v2_const.ChatType.channel, im_v2_const.ChatType.taskComments];
				if (SPECIAL_TYPES_WITH_LETTERS.includes(this.dialog.type)) {
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
	const CollabChatAvatar = {
		name: 'CollabChatAvatar',
		components: {
			BaseUiAvatar
		},
		props: {
			dialogId: {
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
			customSource: {
				type: String,
				default: ''
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
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogName() {
				return this.dialog.name;
			},
			dialogAvatarUrl() {
				return this.dialog.avatar;
			},
			avatarType() {
				return this.useCollabV2Avatar ? AvatarType.collabV2 : AvatarType.collab;
			},
			backgroundColor() {
				return this.useCollabV2Avatar ? this.dialog.color : '';
			},
			useCollabV2Avatar() {
				return this.isCollabV2Available && !this.dialog.containsCollaber;
			},
			isCollabV2Available() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			},
			avatarKey() {
				return `${this.dialogId}_${this.avatarType}`;
			}
		},
		template: `
		<BaseUiAvatar
			:type="avatarType"
			:key="avatarKey" 
			:title="dialogName" 
			:size="size" 
			:url="dialogAvatarUrl"
			:backgroundColor="backgroundColor"
		/>
	`
	};

	// @vue/component
	const CollaberAvatar = {
		name: 'CollaberAvatar',
		components: {
			BaseUiAvatar
		},
		props: {
			dialogId: {
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
			customSource: {
				type: String,
				default: ''
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
			AvatarType: () => AvatarType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogName() {
				return this.dialog.name;
			},
			dialogAvatarUrl() {
				return this.dialog.avatar;
			},
			collaberBackgroundColor() {
				return im_v2_const.Color.collab60;
			}
		},
		template: `
		<BaseUiAvatar
			:type="AvatarType.collaber"
			:key="dialogId"
			:title="dialogName" 
			:size="size" 
			:url="dialogAvatarUrl"
			:backgroundColor="collaberBackgroundColor" 
		/>
	`
	};

	// @vue/component
	const CopilotAvatar = {
		name: 'CopilotAvatar',
		components: {
			BaseUiAvatar
		},
		props: {
			/**
			 * Identifier used to resolve the fallback avatar source. May be either:
			 * - a ai-assistant chat id (when used from chat-avatar.js)
			 * - a bot user id (when used from message-avatar.js, equals authorId)
			 */
			dialogId: {
				type: [String, Number],
				default: 0
			},
			/**
			 * Parent ai-assistant chat id where the role is configured.
			 * When set, the role-based avatar and chat name are resolved from this chat
			 * instead of `dialogId`. Falls back to `dialogId` when empty.
			 */
			contextDialogId: {
				type: String,
				default: ''
			},
			size: {
				type: String,
				default: AvatarSize.M
			},
			customSource: {
				type: String,
				default: ''
			}
		},
		computed: {
			AvatarType: () => AvatarType,
			copilotChatDialogId() {
				return this.contextDialogId || this.dialogId;
			},
			// Fallback source: bot's own chat record. Used when no role-based avatar is provided.
			fallbackAvatarSource() {
				return this.$store.getters['chats/get'](this.dialogId, true)?.avatar;
			},
			copilotChatDialog() {
				return this.$store.getters['chats/get'](this.copilotChatDialogId, true);
			},
			dialogName() {
				return this.copilotChatDialog.name;
			},
			isTitleBasedAvatar() {
				return this.$store.getters['copilot/chats/titleIsCustom'](this.copilotChatDialogId);
			},
			isCopilot2026Styles() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			},
			isDefaultRole() {
				if (!this.contextDialogId) {
					return true;
				}
				const role = this.$store.getters['copilot/chats/getRole'](this.contextDialogId);
				return Boolean(role?.default);
			},
			avatarClass() {
				if (!this.isCopilot2026Styles) {
					return ui_avatar.AvatarRoundCopilot;
				}
				if (this.isTitleBasedAvatar || !this.isDefaultRole) {
					return ui_avatar.AvatarRoundBitrixGpt;
				}
				return ui_avatar.AvatarRound;
			},
			dialogAvatarUrl() {
				if (this.isCopilot2026Styles && this.isTitleBasedAvatar) {
					return '';
				}
				return this.customSource.length > 0 ? this.customSource : this.fallbackAvatarSource;
			}
		},
		template: `
		<BaseUiAvatar
			:type="AvatarType.copilot"
			:avatarClass="avatarClass"
			:title="dialogName"
			:size="size"
			:url="dialogAvatarUrl"
		/>
	`
	};

	// @vue/component
	const ExtranetChatAvatar = {
		name: 'ExtranetChatAvatar',
		components: {
			Avatar
		},
		props: {
			dialogId: {
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
			customSource: {
				type: String,
				default: ''
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
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogName() {
				return this.dialog.name;
			},
			dialogAvatarUrl() {
				return this.dialog.avatar;
			},
			extranetBackgroundColor() {
				return im_v2_const.Color.orange50;
			}
		},
		template: `
		<Avatar
			:dialogId="dialogId"
			:title="dialogName" 
			:size="size" 
			:url="dialogAvatarUrl" 
			:backgroundColor="extranetBackgroundColor" 
		/>
	`
	};

	// @vue/component
	const ExtranetUserAvatar = {
		name: 'ExtranetUserAvatar',
		components: {
			BaseUiAvatar
		},
		props: {
			dialogId: {
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
			customSource: {
				type: String,
				default: ''
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
			AvatarType: () => AvatarType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogName() {
				return this.dialog.name;
			},
			dialogAvatarUrl() {
				return this.dialog.avatar;
			}
		},
		template: `
		<BaseUiAvatar
			:type="AvatarType.extranet"
			:title="dialogName"
			:size="size"
			:url="dialogAvatarUrl"
		/>
	`
	};

	// @vue/component
	const SelfChatAvatar = {
		name: 'SelfChatAvatar',
		inheritAttrs: false,
		props: {
			size: {
				type: String,
				default: AvatarSize.M
			}
		},
		computed: {
			sizeStyles() {
				return {
					width: `${AvatarSizeMap[this.size]}px`,
					height: `${AvatarSizeMap[this.size]}px`
				};
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-self-chat-avatar__container" :style="sizeStyles" :title="loc('IM_ELEMENTS_CHAT_MY_NOTES')"></div>
	`
	};

	// @vue/component
	const ChatAvatar = {
		name: 'ChatAvatar',
		props: {
			avatarDialogId: {
				type: [String, Number],
				default: '0'
			},
			contextDialogId: {
				type: [String, null],
				default: null
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
			},
			customType: {
				type: String,
				default: ''
			}
		},
		computed: {
			isUser() {
				return this.avatarDialog.type === im_v2_const.ChatType.user;
			},
			user() {
				return this.$store.getters['users/get'](this.avatarDialogId, true);
			},
			customAvatarUrl() {
				if (!this.isAiAssistantBitrixGptInChat) {
					return '';
				}
				return this.copilotRoleAvatarUrl;
			},
			avatarDialog() {
				return this.$store.getters['chats/get'](this.avatarDialogId, true);
			},
			isCollabChat() {
				return this.avatarDialog.type === im_v2_const.ChatType.collab;
			},
			isCollaber() {
				return this.user?.type === im_v2_const.UserType.collaber;
			},
			isGuest() {
				return this.$store.getters['users/isGuest'](this.avatarDialogId);
			},
			isExtranetChat() {
				return this.avatarDialog.extranet;
			},
			isExtranet() {
				return this.user?.type === im_v2_const.UserType.extranet;
			},
			isAiAssistantMarta() {
				return this.$store.getters['users/bots/isAiAssistant'](this.avatarDialogId);
			},
			isAiAssistantBitrixGptInChat() {
				return this.copilotManager.isCopilotChatOrBot(this.avatarDialogId);
			},
			isSelfChat() {
				return this.customType === ChatAvatarType.selfChat;
			},
			copilotRoleAvatarUrl() {
				if (!this.contextDialogId) {
					return this.copilotManager.getDefaultAvatarUrl();
				}
				return this.copilotManager.getRoleAvatarUrl({
					avatarDialogId: this.avatarDialogId,
					contextDialogId: this.contextDialogId
				});
			},
			avatarComponentConfig() {
				return [{
					condition: () => this.isSelfChat,
					component: SelfChatAvatar
				}, {
					condition: () => this.isExtranet,
					component: ExtranetUserAvatar
				}, {
					condition: () => this.isCollaber,
					component: CollaberAvatar
				}, {
					condition: () => this.isGuest,
					component: CollaberAvatar
				}, {
					condition: () => this.isCollabChat,
					component: CollabChatAvatar
				}, {
					condition: () => this.isAiAssistantBitrixGptInChat,
					component: CopilotAvatar
				}, {
					condition: () => this.isAiAssistantMarta,
					component: MartaAvatar
				}, {
					condition: () => this.isExtranetChat,
					component: ExtranetChatAvatar
				}];
			},
			avatarComponent() {
				const matchingItem = this.avatarComponentConfig.find(item => item.condition());
				return matchingItem ? matchingItem.component : Avatar;
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		template: `
		<component
			:is="avatarComponent"
			:dialogId="avatarDialogId"
			:contextDialogId="contextDialogId"
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
		props: {
			messageId: {
				type: [String, Number],
				default: 0
			},
			contextDialogId: {
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
			customAvatarUrl() {
				const copilotManager = new im_v2_lib_copilot.CopilotManager();
				if (!copilotManager.isCopilotMessage(this.messageId)) {
					return '';
				}
				return copilotManager.getMessageRoleAvatar(this.messageId);
			},
			user() {
				return this.$store.getters['users/get'](this.authorId, true);
			},
			avatarComponent() {
				const avatarMap = {
					[im_v2_const.UserType.extranet]: ExtranetUserAvatar,
					[im_v2_const.UserType.collaber]: CollaberAvatar,
					[im_v2_const.UserType.guest]: CollaberAvatar,
					[im_v2_const.UserType.bot]: this.getBotAvatar()
				};
				return avatarMap[this.user.type] ?? Avatar;
			},
			isAiAssistantMarta() {
				return this.$store.getters['users/bots/isAiAssistant'](this.authorId);
			}
		},
		methods: {
			getBotAvatar() {
				if (this.isAiAssistantMarta) {
					return MartaAvatar;
				}
				const copilotManager = new im_v2_lib_copilot.CopilotManager();
				return copilotManager.isCopilotChatOrBot(this.authorId) ? CopilotAvatar : Avatar;
			}
		},
		template: `
		<component
			:is="avatarComponent"
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

	const COLLAB_EMPTY_AVATAR_URL = '/bitrix/js/im/v2/component/elements/avatar/src/components/base/css/images/camera.png';

	// @vue/component
	const EmptyAvatar = {
		name: 'EmptyAvatar',
		components: {
			BaseUiAvatar
		},
		props: {
			url: {
				type: String,
				default: ''
			},
			title: {
				type: String,
				default: ''
			},
			type: {
				type: String,
				default: EmptyAvatarType.default
			},
			size: {
				type: String,
				default: AvatarSize.M
			}
		},
		data() {
			return {
				imageLoadError: false
			};
		},
		computed: {
			AvatarSize: () => AvatarSize,
			AvatarType: () => AvatarType,
			Color: () => im_v2_const.Color,
			isSquared() {
				return this.type === EmptyAvatarType.squared;
			},
			isCollabType() {
				return this.type === EmptyAvatarType.collab;
			},
			collabEmptyAvatarUrl() {
				if (!main_core.Type.isStringFilled(this.url)) {
					return COLLAB_EMPTY_AVATAR_URL;
				}
				return this.url;
			},
			containerClasses() {
				const classes = [`--size-${this.size.toLowerCase()}`];
				if (this.isSquared) {
					classes.push('--squared');
				}
				return classes;
			}
		},
		template: `
		<BaseUiAvatar
			v-if="isCollabType"
			:type="AvatarType.collab"
			:url="collabEmptyAvatarUrl" 
			:size="size"
			:title="title"
			:backgroundColor="Color.collab10"
		/>
		<div v-else class="bx-im-empty-avatar__container" :class="containerClasses">
			<div v-if="!url" class="bx-im-empty-avatar__avatar --default"></div>
			<img v-else class="bx-im-empty-avatar__avatar --image" :src="url" :alt="title"/>
		</div>
	`
	};

	exports.AvatarSize = AvatarSize;
	exports.ChatAvatar = ChatAvatar;
	exports.ChatAvatarType = ChatAvatarType;
	exports.EmptyAvatar = EmptyAvatar;
	exports.EmptyAvatarType = EmptyAvatarType;
	exports.MessageAvatar = MessageAvatar;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.UI, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX);
//# sourceMappingURL=registry.bundle.js.map
