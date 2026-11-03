import {
	AvatarRoundMarta,
	AvatarHexagonGuest,
	AvatarHexagonProject,
	AvatarRoundExtranet,
	AvatarRoundGuest,
	AvatarRoundCopilot,
	AvatarBase,
} from 'ui.avatar';
import { Event } from 'main.core';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { AvatarSize, getAvatarPixelSize } from '../../const/const';

import './css/base-ui-avatar.css';

export const AvatarType = {
	extranet: 'extranet',
	collaber: 'collaber',
	collab: 'collab',
	collabV2: 'collabV2',
	copilot: 'copilot',
	default: 'default',
	aiAssistantMarta: 'aiAssistantMarta',
};

const AvatarClassByChatType = {
	[AvatarType.extranet]: AvatarRoundExtranet,
	[AvatarType.collaber]: AvatarRoundGuest,
	[AvatarType.collab]: AvatarHexagonGuest,
	[AvatarType.collabV2]: AvatarHexagonProject,
	[AvatarType.copilot]: AvatarRoundCopilot,
	[AvatarType.aiAssistantMarta]: AvatarRoundMarta,
	default: AvatarBase,
};

// @vue/component
export const BaseUiAvatar = {
	props: {
		type: {
			type: String,
			required: true,
			validator(value): boolean
			{
				return Object.values(AvatarType).includes(value);
			},
		},
		/**
		 * Optional override
		 */
		avatarClass: {
			type: Function,
			default: null,
		},
		size: {
			type: String,
			default: AvatarSize.M,
		},
		url: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		backgroundColor: {
			type: String,
			default: '',
		},
		/**
		 * When false, the built-in silhouette placeholder is suppressed
		 * (used when an im-specific overlay, e.g. a chat-type icon, is rendered on top).
		 * Read when the avatar instance is created, i.e. on `created` and on a `type` change.
		 */
		withDefaultUserpic: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['imageDisplayStateChange'],
	data(): Object
	{
		return {
			// The image is actually painted, so the base underneath it can be hidden.
			isImageLoaded: false,
		};
	},
	computed: {
		AvatarSize: () => AvatarSize,
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		calculatedSize(): number
		{
			return getAvatarPixelSize(this.size, this.isAirDesignEnabled);
		},
	},
	watch: {
		type()
		{
			this.updateAvatarType();
		},
		avatarClass()
		{
			this.updateAvatarType();
		},
		title()
		{
			this.avatar.setTitle(this.title);
		},
		url()
		{
			this.brokenImageUrl = '';
			this.setAvatarImage();
		},
		backgroundColor()
		{
			this.setBackgroundColor();
		},
	},
	created()
	{
		this.avatarImage = null;
		this.avatarImageUrl = '';
		// The last url the preload failed on. It only lives while that url stays the current one,
		// so re-creating the avatar keeps the letters, while any other url is retried from scratch.
		this.brokenImageUrl = '';
		// The image is in the avatar and is not known to be broken (reported to the parent).
		this.isImageDisplayed = false;
		this.initAvatarClass();
	},
	mounted()
	{
		this.renderAvatar();
	},
	beforeUnmount()
	{
		this.unbindAvatarImageEvents();
	},
	methods: {
		initAvatarClass()
		{
			const AvatarClass = this.avatarClass || AvatarClassByChatType[this.type] || AvatarClassByChatType.default;
			this.avatar = new AvatarClass({
				size: this.calculatedSize,
				title: this.title,
			});

			this.setAvatarImage();
			this.setBackgroundColor();

			if (!this.withDefaultUserpic)
			{
				this.avatar.removeDefaultUserPic();
			}
		},
		renderAvatar()
		{
			if (!this.avatar || !this.$refs.avatarContainer)
			{
				return;
			}

			this.avatar.renderTo(this.$refs.avatarContainer);
		},
		setAvatarImage()
		{
			this.unbindAvatarImageEvents();
			this.isImageLoaded = false;

			// A url already known to be broken keeps the letters: re-creating the avatar instance
			// on a type change must not report the image as displayed until the next error.
			if (!this.url || this.url === this.brokenImageUrl)
			{
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
			Event.bind(this.avatarImage, 'load', this.handleAvatarImageLoad);
			Event.bind(this.avatarImage, 'error', this.handleAvatarImageError);
			this.avatarImage.src = this.avatarImageUrl;
		},
		handleAvatarImageLoad()
		{
			const loadedUrl = this.avatarImageUrl;
			this.unbindAvatarImageEvents();

			if (loadedUrl !== this.url)
			{
				return;
			}

			this.isImageLoaded = true;
		},
		handleAvatarImageError()
		{
			const failedUrl = this.avatarImageUrl;
			this.unbindAvatarImageEvents();

			if (failedUrl !== this.url)
			{
				return;
			}

			this.brokenImageUrl = failedUrl;
			this.avatar.removeUserPic();
			this.avatar.setTitle(this.title);
			this.setImageDisplayState(false);
		},
		setImageDisplayState(isDisplayed: boolean)
		{
			if (this.isImageDisplayed === isDisplayed)
			{
				return;
			}

			this.isImageDisplayed = isDisplayed;
			this.$emit('imageDisplayStateChange', isDisplayed);
		},
		unbindAvatarImageEvents()
		{
			if (!this.avatarImage)
			{
				this.avatarImageUrl = '';

				return;
			}

			Event.unbind(this.avatarImage, 'load', this.handleAvatarImageLoad);
			Event.unbind(this.avatarImage, 'error', this.handleAvatarImageError);
			this.avatarImage.removeAttribute('src');
			this.avatarImage = null;
			this.avatarImageUrl = '';
		},
		setBackgroundColor()
		{
			if (!this.backgroundColor)
			{
				return;
			}

			this.avatar.setBaseColor(this.backgroundColor);
		},

		updateAvatarType()
		{
			this.unbindAvatarImageEvents();
			this.$refs.avatarContainer.innerHTML = '';
			this.initAvatarClass();
			this.renderAvatar();
		},
	},
	template: `
		<div
			class="bx-im-base-ui-avatar__container"
			:class="{ '--has-image': isImageLoaded }"
			ref="avatarContainer"
		></div>
	`,
};
