import { Type } from 'main.core';

import { ThemeManager } from 'im.v2.lib.theme';
import { LegacyRecentService } from 'im.v2.provider.service.recent';

import { FeatureBlock } from './components/feature-block';

import './css/base.css';

import type { BackgroundStyle } from 'im.v2.lib.theme';

export const IconClass = {
	group: '--group',
	chat: '--chat',
	list: '--list',
};

export const EmptyStateListItemName = {
	audio: 'audio',
	messages: 'messages',
	chat: 'chat',
	collaboration: 'collaboration',
	business: 'business',
	result: 'result',
};

export type EmptyStateListItem = {
	title: string,
	subtitle: string,
	name: $Values<typeof EmptyStateListItemName>,
};

// @vue/component
export const BaseEmptyState = {
	components: { FeatureBlock },
	props:
	{
		text: {
			type: String,
			default: '',
		},
		subtext: {
			type: String,
			default: '',
		},
		backgroundId: {
			type: [String, Number],
			default: '',
		},
		listItems: {
			type: Array,
			default: () => [],
		},
		iconClassName: {
			type: String,
			default: '',
		},
	},
	computed:
	{
		items(): EmptyStateListItem[]
		{
			return this.listItems;
		},
		iconClass(): string
		{
			if (this.iconClassName)
			{
				return this.iconClassName;
			}

			return this.isEmptyRecent ? IconClass.group : IconClass.chat;
		},
		preparedText(): string
		{
			if (this.text)
			{
				return this.text;
			}

			if (this.isEmptyRecent)
			{
				return this.loc('IM_CONTENT_CHAT_NO_CHATS_START_MESSAGE');
			}

			return this.loc('IM_CONTENT_CHAT_START_MESSAGE_V2');
		},
		preparedSubtext(): string
		{
			if (this.subtext)
			{
				return this.subtext;
			}

			return '';
		},
		isEmptyRecent(): boolean
		{
			return LegacyRecentService.getInstance().getCollection().length === 0;
		},
		backgroundStyle(): BackgroundStyle
		{
			if (Type.isStringFilled(this.backgroundId) || Type.isNumber(this.backgroundId))
			{
				return ThemeManager.getBackgroundStyleById(this.backgroundId);
			}

			return ThemeManager.getCurrentBackgroundStyle();
		},
	},
	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-content-chat-start__container" :style="backgroundStyle">
			<div class="bx-im-content-chat-start__content">
				<div class="bx-im-content-chat-start__icon" :class="iconClass"></div>
				<div class="bx-im-content-chat-start__title">
					{{ preparedText }}
				</div>
				<div v-if="preparedSubtext" class="bx-im-content-chat-start__subtitle">
					{{ preparedSubtext }}
				</div>
				<div v-if="items.length > 0" class="bx-im-content-chat-start__blocks">
					<FeatureBlock
						v-for="item in items"
						:name="item.name"
						:title="item.title"
						:subtitle="item.subtitle"
					/>
				</div>
				<slot name="bottom-content"></slot>
			</div>
		</div>
	`,
};
