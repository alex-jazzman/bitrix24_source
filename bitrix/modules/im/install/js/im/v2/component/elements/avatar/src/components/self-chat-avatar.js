import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { AvatarSize, getAvatarPixelSize } from '../const/const';

import '../css/self-chat-avatar.css';

// @vue/component
export const SelfChatAvatar = {
	name: 'SelfChatAvatar',
	inheritAttrs: false,
	props: {
		size: {
			type: String,
			default: AvatarSize.M,
		},
	},
	computed: {
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		sizeStyles(): { width: string, height: string }
		{
			const pixelSize = getAvatarPixelSize(this.size, this.isAirDesignEnabled);

			return {
				width: `${pixelSize}px`,
				height: `${pixelSize}px`,
			};
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-self-chat-avatar__container" :style="sizeStyles" :title="loc('IM_ELEMENTS_CHAT_MY_NOTES')"></div>
	`,
};
