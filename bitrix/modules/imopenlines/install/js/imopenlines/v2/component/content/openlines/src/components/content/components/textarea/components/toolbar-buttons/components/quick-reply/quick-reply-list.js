import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';

import './css/quick-reply-list.css';

const SCROLL_LOAD_OFFSET = 100;

// @vue/component
export const QuickReplyList = {
	name: 'QuickReplyList',
	components: { BIcon, ScrollWithGradient, Spinner },
	props:
	{
		replies: {
			type: Array,
			default: () => [],
		},
		highlightedId: {
			type: Number,
			default: 0,
		},
		isLoadingNextPage: {
			type: Boolean,
			default: false,
		},
		hasNextPage: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['select', 'edit', 'loadNextPage'],
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		SpinnerSize: () => SpinnerSize,
		SpinnerColor: () => SpinnerColor,
		isEmpty(): boolean
		{
			return this.replies.length === 0;
		},
	},
	methods:
	{
		onScroll(event: Event): void
		{
			if (!this.hasNextPage || this.isLoadingNextPage)
			{
				return;
			}
			const el = event.target;
			const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
			if (remaining <= SCROLL_LOAD_OFFSET)
			{
				this.$emit('loadNextPage');
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ScrollWithGradient class="bx-imol-quick-reply-popup__list" @scroll="onScroll">
			<div v-if="isEmpty" class="bx-imol-quick-reply-popup__empty">
				{{ loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_POPUP_EMPTY') }}
			</div>
			<template v-else>
				<div
					v-for="reply in replies"
					:key="reply.id"
					:class="{ '--highlighted': reply.id === highlightedId }"
					class="bx-imol-quick-reply-popup__item"
					@click="$emit('select', reply)"
				>
					<span class="bx-imol-quick-reply-popup__item-text --ellipsis">{{ reply.text }}</span>
					<BIcon
						v-if="reply.canEdit"
						:name="OutlineIcons.EDIT_L"
						class="bx-imol-quick-reply-popup__item-edit"
						@click.stop="$emit('edit', reply)"
					/>
				</div>
			</template>
			<Spinner
				v-if="isLoadingNextPage"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.grey"
				class="bx-imol-quick-reply-popup__list-loader"
			/>
		</ScrollWithGradient>
	`,
};
