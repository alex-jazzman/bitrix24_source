import { Loc } from 'main.core';

import { EventType } from 'im.v2.const';
import { SmileManager } from 'im.v2.lib.smile-manager';

import { emoji } from '../../../smile-selector/emoji';

import './css/tab-emoji.css';

import type { EventEmitter } from 'main.core.events';
import type { Set } from 'im.v2.lib.smile-manager';

// @vue/component
export const TabEmoji = {
	name: 'TabEmoji',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): { recentEmoji: Set }
	{
		return {
			recentEmoji: new Set(),
		};
	},
	computed: {
		categoryTitles(): {[key: string]: string}
		{
			const categoryTitles = emoji.reduce((acc, category) => {
				const prefix = 'IM_TEXTAREA_EMOJI_CATEGORY_';
				const title = Loc.getMessage(`${prefix}${category.code}`);

				return { ...acc, [category.code]: title };
			}, {});
			categoryTitles[this.frequentlyUsedLoc] = Loc.getMessage(this.frequentlyUsedLoc);

			return categoryTitles;
		},
		visibleRecentEmoji(): Array<String>
		{
			const visibleEmoji = [...this.recentEmoji];

			return visibleEmoji.slice(0, this.maxRecentEmoji);
		},
	},
	created()
	{
		const smileManager = SmileManager.getInstance();
		if (!smileManager.recentEmoji)
		{
			return;
		}

		this.emojiSetTitle = 'emoji';
		this.emoji = emoji;
		this.recentEmoji = new Set(smileManager.recentEmoji);
		this.maxRecentEmoji = 18;
		this.frequentlyUsedLoc = 'IM_TEXTAREA_EMOJI_CATEGORY_FREQUENTLY';
	},
	beforeUnmount()
	{
		const smileManager = SmileManager.getInstance();

		if (this.visibleRecentEmoji.length > smileManager.recentEmoji.size)
		{
			smileManager.updateRecentEmoji(new Set(this.recentEmoji));
		}
	},
	methods: {
		insertInTextarea(emojiText: string)
		{
			this.getEmitter().emit(EventType.textarea.insertText, {
				text: emojiText,
				dialogId: this.dialogId,
			});
		},
		onRecentEmojiClick(emojiText: string)
		{
			this.insertInTextarea(emojiText);
		},
		onEmojiClick(emojiText: string)
		{
			this.insertInTextarea(emojiText);
			this.addEmojiToRecent(emojiText);
		},
		addEmojiToRecent(symbol: string)
		{
			this.recentEmoji.add(symbol);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div class="bx-im-emoji-content__scope">
			<div class="bx-im-emoji-content__box">
				<div
					v-if="recentEmoji.size > 0"
					class="bx-im-emoji-content__box_category"
					key="frequently-used"
				>
					<p class="bx-im-emoji-content__box_category-title">
						{{categoryTitles[frequentlyUsedLoc]}}
					</p>
					<span
						v-for="symbol in visibleRecentEmoji"
						class="bx-im-emoji-content__box_category-emoji"
						role="img"
						:key="'recent-'+ symbol"
						@click="onRecentEmojiClick(symbol)"
					>
						{{symbol}}
					</span>
				</div>
				<div
					v-for="category in emoji"
					:key="category.id"
					class="bx-im-emoji-content__box_category"
				>
					<template v-if="category.showForWindows ?? true">
						<p class="bx-im-emoji-content__box_category-title">
							{{categoryTitles[category.code]}}
						</p>
						<span
							v-for="element in category.emoji"
							:key="element.symbol"
							class="bx-im-emoji-content__box_category-emoji"
							role="img"
							@click="onEmojiClick(element.symbol)"
						>
							{{element.symbol}}
						</span>
					</template>
				</div>
			</div>
		</div>
	`,
};
