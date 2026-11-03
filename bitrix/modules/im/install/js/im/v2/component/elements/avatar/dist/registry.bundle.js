/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_const, im_v2_lib_copilot, im_v2_lib_feature, ui_avatar, main_core, ui_fonts_opensans, im_v2_lib_utils, im_v2_lib_channel) {
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

	/**
	 * Pixel sizes used when the Air design is enabled.
	 * Overrides on top of `AvatarSizeMap`; the exported base map is intentionally left untouched
	 * so legacy (flag-off) branches keep their original geometry.
	 */
	const AvatarSizeMapAir = Object.freeze({
		[AvatarSize.L]: 44
	});

	/**
	 * Resolves the numeric avatar size for a given `AvatarSize` step.
	 * When the Air design is enabled, Air-specific overrides take precedence.
	 */
	function getAvatarPixelSize(size, isAirDesignEnabled = false) {
		if (isAirDesignEnabled && AvatarSizeMapAir[size]) {
			return AvatarSizeMapAir[size];
		}
		return AvatarSizeMap[size];
	}
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
			},
			/**
			 * When false, the built-in silhouette placeholder is suppressed
			 * (used when an im-specific overlay, e.g. a chat-type icon, is rendered on top).
			 * Read when the avatar instance is created, i.e. on `created` and on a `type` change.
			 */
			withDefaultUserpic: {
				type: Boolean,
				default: true
			}
		},
		emits: ['imageDisplayStateChange'],
		data() {
			return {
				// The image is actually painted, so the base underneath it can be hidden.
				isImageLoaded: false
			};
		},
		computed: {
			AvatarSize: () => AvatarSize,
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			calculatedSize() {
				return getAvatarPixelSize(this.size, this.isAirDesignEnabled);
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
				this.brokenImageUrl = '';
				this.setAvatarImage();
			},
			backgroundColor() {
				this.setBackgroundColor();
			}
		},
		created() {
			this.avatarImage = null;
			this.avatarImageUrl = '';
			// The last url the preload failed on. It only lives while that url stays the current one,
			// so re-creating the avatar keeps the letters, while any other url is retried from scratch.
			this.brokenImageUrl = '';
			// The image is in the avatar and is not known to be broken (reported to the parent).
			this.isImageDisplayed = false;
			this.initAvatarClass();
		},
		mounted() {
			this.renderAvatar();
		},
		beforeUnmount() {
			this.unbindAvatarImageEvents();
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
				if (!this.withDefaultUserpic) {
					this.avatar.removeDefaultUserPic();
				}
			},
			renderAvatar() {
				if (!this.avatar || !this.$refs.avatarContainer) {
					return;
				}
				this.avatar.renderTo(this.$refs.avatarContainer);
			},
			setAvatarImage() {
				this.unbindAvatarImageEvents();
				this.isImageLoaded = false;

				// A url already known to be broken keeps the letters: re-creating the avatar instance
				// on a type change must not report the image as displayed until the next error.
				if (!this.url || this.url === this.brokenImageUrl) {
					this.avatar.removeUserPic();
					this.avatar.setTitle(this.title);
					this.setImageDisplayState(false);
					return;
				}

				// The image goes into the avatar right away, so no placeholder is ever shown in its
				// place; the preload only tells us when it is painted and when it cannot be displayed.
				this.avatar.setUserPic(this.url);
				this.setImageDisplayState(true);
				this.avatarImage = new Image();
				this.avatarImageUrl = this.url;
				main_core.Event.bind(this.avatarImage, 'load', this.handleAvatarImageLoad);
				main_core.Event.bind(this.avatarImage, 'error', this.handleAvatarImageError);
				this.avatarImage.src = this.avatarImageUrl;
			},
			handleAvatarImageLoad() {
				const loadedUrl = this.avatarImageUrl;
				this.unbindAvatarImageEvents();
				if (loadedUrl !== this.url) {
					return;
				}
				this.isImageLoaded = true;
			},
			handleAvatarImageError() {
				const failedUrl = this.avatarImageUrl;
				this.unbindAvatarImageEvents();
				if (failedUrl !== this.url) {
					return;
				}
				this.brokenImageUrl = failedUrl;
				this.avatar.removeUserPic();
				this.avatar.setTitle(this.title);
				this.setImageDisplayState(false);
			},
			setImageDisplayState(isDisplayed) {
				if (this.isImageDisplayed === isDisplayed) {
					return;
				}
				this.isImageDisplayed = isDisplayed;
				this.$emit('imageDisplayStateChange', isDisplayed);
			},
			unbindAvatarImageEvents() {
				if (!this.avatarImage) {
					this.avatarImageUrl = '';
					return;
				}
				main_core.Event.unbind(this.avatarImage, 'load', this.handleAvatarImageLoad);
				main_core.Event.unbind(this.avatarImage, 'error', this.handleAvatarImageError);
				this.avatarImage.removeAttribute('src');
				this.avatarImage = null;
				this.avatarImageUrl = '';
			},
			setBackgroundColor() {
				if (!this.backgroundColor) {
					return;
				}
				this.avatar.setBaseColor(this.backgroundColor);
			},
			updateAvatarType() {
				this.unbindAvatarImageEvents();
				this.$refs.avatarContainer.innerHTML = '';
				this.initAvatarClass();
				this.renderAvatar();
			}
		},
		template: `
		<div
			class="bx-im-base-ui-avatar__container"
			:class="{ '--has-image': isImageLoaded }"
			ref="avatarContainer"
		></div>
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
	const LegacyAvatar = {
		name: 'MessengerLegacyAvatar',
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
				if (!this.withSpecialTypes || !this.withSpecialTypeIcon || this.isChannel || this.dialog.type === im_v2_const.ChatType.vibecodeApp) {
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
		<div :title="containerTitle" :class="containerClasses" class="bx-im-legacy-avatar__scope bx-im-legacy-avatar__container">
			<!-- Avatar -->
			<template v-if="hasImage">
				<img :src="avatarUrl" :alt="dialog.name" class="bx-im-legacy-avatar__content --image" @error="onImageLoadError" draggable="false"/>
				<div v-if="showSpecialTypeIcon" :style="backgroundColorStyle" class="bx-im-legacy-avatar__special-type_icon"></div>
			</template>
			<div v-else-if="withAvatarLetters && avatarText" :style="backgroundColorStyle" class="bx-im-legacy-avatar__content --text">
				{{ avatarText }}
			</div>
			<div v-else :style="backgroundColorStyle" class="bx-im-legacy-avatar__content bx-im-legacy-avatar__icon"></div>
		</div>
	`
	};

	// Chat types rendered with a round avatar and letters/photo (i.e. not a square special placeholder).
	const COMMON_TYPES = new Set([im_v2_const.ChatType.user, im_v2_const.ChatType.chat, im_v2_const.ChatType.open, im_v2_const.ChatType.lines, im_v2_const.ChatType.copilot, im_v2_const.ChatType.taskComments]);

	// Special types that still show letters (in a square) instead of a chat-type icon.
	const TYPES_WITH_LETTERS = new Set([im_v2_const.ChatType.openChannel, im_v2_const.ChatType.channel, im_v2_const.ChatType.taskComments]);
	const SIZES_WITH_TEXT = new Set([AvatarSize.M, AvatarSize.L, AvatarSize.XL, AvatarSize.XXL, AvatarSize.XXXL]);

	/**
	 * Default avatar branch built on top of the design-system avatar (`ui.avatar`).
	 * Used instead of `LegacyAvatar` when the Air design is enabled.
	 *
	 * Content priority (mirrors the legacy component): photo -> initials -> chat-type icon placeholder.
	 * Regular users and group/open chats render as a round `AvatarRound`; special chat types
	 * render as a square `AvatarSquare` with the chat-type icon layered on top as an im overlay.
	 */
	// @vue/component
	const Avatar = {
		name: 'MessengerAvatar',
		components: {
			BaseUiAvatar
		},
		props: {
			dialogId: {
				type: [String, Number],
				default: 0
			},
			// Accepted for prop-compatibility with the dispatcher; not used by this branch.
			contextDialogId: {
				type: [String, Number, null],
				default: null
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
				isImageBroken: false
			};
		},
		computed: {
			AvatarType: () => AvatarType,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isSpecialType() {
				return !COMMON_TYPES.has(this.dialog.type);
			},
			isSquare() {
				return this.withSpecialTypes && this.isSpecialType;
			},
			avatarClass() {
				return this.isSquare ? ui_avatar.AvatarSquare : null;
			},
			avatarUrl() {
				return this.customSource.length > 0 ? this.customSource : this.dialog.avatar;
			},
			// An image that is still loading counts as displayed: it is already in the avatar,
			// so nothing must take its place until we know it cannot be shown.
			hasImage() {
				return Boolean(this.avatarUrl) && !this.isImageBroken;
			},
			isEnoughSizeForText() {
				return SIZES_WITH_TEXT.has(this.size.toUpperCase());
			},
			showAvatarLetters() {
				if (TYPES_WITH_LETTERS.has(this.dialog.type)) {
					return true;
				}
				return !this.isSpecialType;
			},
			hasLetters() {
				return this.withAvatarLetters && this.showAvatarLetters && this.isEnoughSizeForText && Boolean(this.dialog.name);
			},
			showTypeIcon() {
				return !this.hasImage && !this.hasLetters;
			},
			avatarTitle() {
				// Pass the title only when initials should be shown, so the DS base doesn't
				// derive initials where a chat-type icon must be rendered instead.
				return this.hasLetters ? this.dialog.name : '';
			},
			// The base under the image is hidden once the image is painted, so the colour is always
			// passed: while the image is pending it is the chat colour that fills the avatar.
			computedBackgroundColor() {
				return this.backgroundColor || this.dialog.color;
			},
			typeIconClasses() {
				const typeClass = im_v2_const.ChatType[this.dialog.type] ? `--${this.dialog.type}` : '--default';
				return [typeClass];
			},
			containerTitle() {
				return this.withTooltip ? this.dialog.name : '';
			}
		},
		watch: {
			avatarUrl() {
				this.isImageBroken = false;
			}
		},
		methods: {
			handleImageDisplayStateChange(isDisplayed) {
				this.isImageBroken = !isDisplayed;
			}
		},
		template: `
		<div class="bx-im-avatar__scope" :title="containerTitle">
			<!-- The DS silhouette is never used here: the image, the letters or the type icon take its place -->
			<BaseUiAvatar
				:type="AvatarType.default"
				:avatarClass="avatarClass"
				:size="size"
				:url="avatarUrl"
				:title="avatarTitle"
				:backgroundColor="computedBackgroundColor"
				:withDefaultUserpic="false"
				@imageDisplayStateChange="handleImageDisplayStateChange"
			/>
			<div v-if="showTypeIcon" class="bx-im-avatar__type-icon" :class="typeIconClasses"></div>
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
			LegacyAvatar
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
		<LegacyAvatar
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
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			sizeStyles() {
				const pixelSize = getAvatarPixelSize(this.size, this.isAirDesignEnabled);
				return {
					width: `${pixelSize}px`,
					height: `${pixelSize}px`
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
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			defaultAvatarComponent() {
				return this.isAirDesignEnabled ? Avatar : LegacyAvatar;
			},
			avatarComponent() {
				const matchingItem = this.avatarComponentConfig.find(item => item.condition());
				return matchingItem ? matchingItem.component : this.defaultAvatarComponent;
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
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			defaultAvatarComponent() {
				return this.isAirDesignEnabled ? Avatar : LegacyAvatar;
			},
			avatarComponent() {
				const avatarMap = {
					[im_v2_const.UserType.extranet]: ExtranetUserAvatar,
					[im_v2_const.UserType.collaber]: CollaberAvatar,
					[im_v2_const.UserType.guest]: CollaberAvatar,
					[im_v2_const.UserType.bot]: this.getBotAvatar()
				};
				return avatarMap[this.user.type] ?? this.defaultAvatarComponent;
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
				return copilotManager.isCopilotChatOrBot(this.authorId) ? CopilotAvatar : this.defaultAvatarComponent;
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
			isCollabPlaceholder() {
				return !main_core.Type.isStringFilled(this.url);
			},
			collabEmptyAvatarUrl() {
				return this.isCollabPlaceholder ? COLLAB_EMPTY_AVATAR_URL : this.url;
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
			:class="{ '--placeholder-image': isCollabPlaceholder }"
		/>
		<div v-else class="bx-im-empty-avatar__container" :class="containerClasses">
			<div v-if="!url" class="bx-im-empty-avatar__avatar --default"></div>
			<img v-else class="bx-im-empty-avatar__avatar --image" :src="url" :alt="title"/>
		</div>
	`
	};

	exports.AvatarSize = AvatarSize;
	exports.BaseUiAvatar = BaseUiAvatar;
	exports.ChatAvatar = ChatAvatar;
	exports.ChatAvatarType = ChatAvatarType;
	exports.EmptyAvatar = EmptyAvatar;
	exports.EmptyAvatarType = EmptyAvatarType;
	exports.MessageAvatar = MessageAvatar;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI, BX, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
