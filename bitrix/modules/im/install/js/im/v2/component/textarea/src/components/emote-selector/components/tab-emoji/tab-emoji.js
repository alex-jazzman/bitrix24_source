import { Extension, Loc, Text, Type } from 'main.core';
import { markRaw } from 'ui.vue3';

import { EventType } from 'im.v2.const';
import { SmileManager } from 'im.v2.lib.smile-manager';

import { GridFocusZone } from '../../helpers/grid-focus';
import { emoji } from './const/emoji';
import { normalizeRecentEmoji } from './helpers/helpers';

import './css/tab-emoji.css';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';

const CELL_SELECTOR = '.bx-im-emoji-content__box_category-emoji';
const SECTION_SELECTOR = '.bx-im-emoji-content__box_category';
// The popup lays its button panel over the bottom of the grid instead of shrinking it, so the visible
// area of the scrollport is shorter than its box. The grid engine is shared with surfaces that have no
// such panel, so the pair is handed to it rather than known by it.
const BOTTOM_OVERLAY = {
	within: '.bx-im-emote-popup__container',
	selector: '.bx-im-emote-popup__buttons-container',
};
// Fixed grid width: exactly eight cells per row, whatever the popup width (analogous to the four of
// the sticker grid). The cells of the frequently-used block and of every category are chunked into
// real role="row" rows of this size, the last row of each section as short as its remainder.
const COLUMNS = 8;

// @vue/component
export const TabEmoji = {
	name: 'TabEmoji',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			excludedEmoji: new Set(),
			recentEmoji: new Set(),
			recentEmojiNeedsResave: false,
		};
	},
	computed: {
		listAriaLabel(): string
		{
			return Loc.getMessage('IM_TEXTAREA_EMOJI_LIST_ARIA');
		},
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
		visibleEmoji(): Array<JsonObject>
		{
			return this.emoji.map((category) => {
				return {
					...category,
					emoji: category.emoji.filter((element) => !this.excludedEmoji.has(element.symbol)),
				};
			});
		},
		visibleRecentEmoji(): Array<string>
		{
			const visibleEmoji = [...this.recentEmoji]
				.filter((symbol) => !this.excludedEmoji.has(symbol))
			;

			return visibleEmoji.slice(0, this.maxRecentEmoji);
		},
		// Real rows of the grid: the cells of the frequently-used block chunked into role="row" rows of
		// eight, the last one as short as the remainder. The engine reads these rows; the column count
		// only sizes the chunk, the navigation itself is column-agnostic.
		recentRows(): Array<Array<string>>
		{
			const rows = [];
			for (let index = 0; index < this.visibleRecentEmoji.length; index += COLUMNS)
			{
				rows.push(this.visibleRecentEmoji.slice(index, index + COLUMNS));
			}

			return rows;
		},
		// The catalog carrying, per category, its cells chunked into rows of eight. A hidden category
		// keeps its place in the list but stays out of the grid: the template gives it neither a rowgroup
		// nor any row (an empty group with a dangling label is worse for a screen reader than none).
		catalogRows(): Array<JsonObject>
		{
			return this.visibleEmoji.map((category) => {
				const rows = [];
				for (let index = 0; index < category.emoji.length; index += COLUMNS)
				{
					rows.push(category.emoji.slice(index, index + COLUMNS));
				}

				return { ...category, rows };
			});
		},
	},
	created()
	{
		this.gridFocusZone = null;
		this.categoryTitleIdPrefix = `bx-im-emoji-category-${Text.getRandom(8)}`;

		const settings = Extension.getSettings('im.v2.component.textarea');
		const excludedEmoji = settings.get('emojiPickerExcluded');
		if (Type.isArray(excludedEmoji) && excludedEmoji.every((symbol) => Type.isString(symbol)))
		{
			this.excludedEmoji = new Set(excludedEmoji);
		}

		const smileManager = SmileManager.getInstance();
		if (!smileManager.recentEmoji)
		{
			return;
		}

		this.emojiSetTitle = 'emoji';
		this.emoji = emoji;
		const { recentEmoji, changed } = normalizeRecentEmoji(smileManager.recentEmoji);
		this.recentEmoji = recentEmoji;
		this.recentEmojiNeedsResave = changed;
		this.maxRecentEmoji = 18;
		this.frequentlyUsedLoc = 'IM_TEXTAREA_EMOJI_CATEGORY_FREQUENTLY';
	},
	mounted()
	{
		this.initGridFocusZone();
	},
	beforeUnmount()
	{
		this.destroyGridFocusZone();

		const smileManager = SmileManager.getInstance();
		const hasNewEmoji = this.recentEmoji.size > smileManager.recentEmoji.size;

		if (this.recentEmojiNeedsResave || hasNewEmoji)
		{
			smileManager.updateRecentEmoji(new Set(this.recentEmoji));
		}
	},
	methods: {
		initGridFocusZone(): void
		{
			const container = this.$refs.grid;
			if (!container)
			{
				return;
			}

			// The zone object holds DOM nodes and must stay out of reactive state.
			this.gridFocusZone = markRaw(new GridFocusZone(container, CELL_SELECTOR, {
				sectionSelector: SECTION_SELECTOR,
				bottomOverlay: BOTTOM_OVERLAY,
			}));
			this.gridFocusZone.activate();
		},
		destroyGridFocusZone(): void
		{
			this.gridFocusZone?.deactivate();
			this.gridFocusZone = null;
		},
		isCategoryVisible(category: JsonObject): boolean
		{
			return category.showForWindows ?? true;
		},
		getCategoryTitleId(categoryCode: string): string
		{
			return `${this.categoryTitleIdPrefix}-${categoryCode}`;
		},
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
		onRecentEmojiKeydown(event: KeyboardEvent, emojiText: string)
		{
			this.onRecentEmojiClick(emojiText);
			this.keepFocusOnCell(event.currentTarget);
		},
		onEmojiKeydown(event: KeyboardEvent, emojiText: string)
		{
			this.onEmojiClick(emojiText);
			this.keepFocusOnCell(event.currentTarget);
		},
		keepFocusOnCell(cell: HTMLElement)
		{
			// The insert focuses the field itself (im.v2.lib.textarea), which would drop focus out of
			// the grid on the very first Enter. Mouse insertion keeps its old behavior.
			cell.focus({ preventScroll: true });
		},
		addEmojiToRecent(symbol: string)
		{
			if (this.recentEmoji.size >= this.maxRecentEmoji)
			{
				return;
			}

			this.recentEmoji.add(symbol);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div class="bx-im-emoji-content__scope">
			<div
				ref="grid"
				class="bx-im-emoji-content__box"
				role="grid"
				:aria-label="listAriaLabel"
				data-testid="im-textarea-emoji-grid"
			>
				<div
					v-if="visibleRecentEmoji.length > 0"
					class="bx-im-emoji-content__box_category"
					role="rowgroup"
					:aria-labelledby="getCategoryTitleId(frequentlyUsedLoc)"
					key="frequently-used"
				>
					<div class="bx-im-emoji-content__box_category-header" role="row">
						<p
							class="bx-im-emoji-content__box_category-title"
							role="rowheader"
							:id="getCategoryTitleId(frequentlyUsedLoc)"
						>
							{{categoryTitles[frequentlyUsedLoc]}}
						</p>
					</div>
					<div
						v-for="(row, rowIndex) in recentRows"
						:key="rowIndex"
						class="bx-im-emoji-content__box_category-row"
						role="row"
					>
						<span
							v-for="symbol in row"
							class="bx-im-emoji-content__box_category-emoji --focus-visible"
							role="gridcell"
							tabindex="-1"
							:key="'recent-'+ symbol"
							@click="onRecentEmojiClick(symbol)"
							@keydown.enter.prevent="onRecentEmojiKeydown($event, symbol)"
							@keydown.space.prevent="onRecentEmojiKeydown($event, symbol)"
						>
							{{symbol}}
						</span>
					</div>
				</div>
				<div
					v-for="category in catalogRows"
					:key="category.id"
					class="bx-im-emoji-content__box_category"
					:role="isCategoryVisible(category) ? 'rowgroup' : null"
					:aria-labelledby="isCategoryVisible(category) ? getCategoryTitleId(category.code) : null"
				>
					<template v-if="isCategoryVisible(category)">
						<div class="bx-im-emoji-content__box_category-header" role="row">
							<p
								class="bx-im-emoji-content__box_category-title"
								role="rowheader"
								:id="getCategoryTitleId(category.code)"
							>
								{{categoryTitles[category.code]}}
							</p>
						</div>
						<div
							v-for="(row, rowIndex) in category.rows"
							:key="rowIndex"
							class="bx-im-emoji-content__box_category-row"
							role="row"
						>
							<span
								v-for="element in row"
								:key="element.symbol"
								class="bx-im-emoji-content__box_category-emoji --focus-visible"
								role="gridcell"
								tabindex="-1"
								@click="onEmojiClick(element.symbol)"
								@keydown.enter.prevent="onEmojiKeydown($event, element.symbol)"
								@keydown.space.prevent="onEmojiKeydown($event, element.symbol)"
							>
								{{element.symbol}}
							</span>
						</div>
					</template>
				</div>
			</div>
		</div>
	`,
};
