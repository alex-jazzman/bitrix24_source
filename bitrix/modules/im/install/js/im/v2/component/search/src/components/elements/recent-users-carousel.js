import { Type } from 'main.core';

import { DialogIdChatPrefix } from 'im.v2.const';

import {
	getSearchGroupId,
	getSearchGroupTitleId,
	getSearchOptionId,
} from '../../helpers/search-navigation-aria';

import { SelfChat } from './self-chat';
import { CarouselUser } from './carousel-user';

import '../css/recent-users-carousel.css';

// @vue/component
export const RecentUsersCarousel = {
	name: 'RecentUsersCarousel',
	components: { CarouselUser, SelfChat },
	props: {
		/**
		 * Dialog ids of the tiles in the order they are rendered, the notes chat first: the head is the
		 * chat the notes tile opens, the rest are the interlocutors. The whole composition is needed and
		 * not the interlocutors alone -- the traversal indexes of the tiles are counted along it, and the
		 * numbering of the list below starts where it ends.
		 *
		 * @type string[]
		 */
		itemsWithNotesFirst: {
			type: Array,
			default: () => [],
		},
		activeNavIndex: {
			type: Number,
			default: null,
		},
		navIndexBase: {
			type: Number,
			default: null,
		},
		searchAreaId: {
			type: String,
			default: null,
		},
	},
	emits: ['clickItem', 'openContextMenu'],
	computed:
	{
		// The notes chat is handed down instead of being worked out again, so the tile opens by click exactly
		// the chat the traversal order opens by Enter. A composition without a head renders no tile at all:
		// one tile per item is what keeps the number of tiles and the numbering of the list below together.
		notesDialogId(): ?string
		{
			return this.itemsWithNotesFirst[0] ?? null;
		},
		userDialogIds(): string[]
		{
			return this.itemsWithNotesFirst.slice(1);
		},
		withAriaNavigation(): boolean
		{
			return Type.isStringFilled(this.searchAreaId) && this.navIndexBase !== null;
		},
		groupId(): ?string
		{
			return this.withAriaNavigation ? getSearchGroupId(this.searchAreaId, 'carousel') : null;
		},
		groupTitleId(): ?string
		{
			return this.withAriaNavigation ? getSearchGroupTitleId(this.searchAreaId, 'carousel') : null;
		},
	},
	methods:
	{
		getNavIndex(tileIndex: number): ?number
		{
			return this.navIndexBase === null ? null : this.navIndexBase + tileIndex;
		},
		isActive(tileIndex: number): boolean
		{
			const navIndex = this.getNavIndex(tileIndex);

			// Highlight follows the traversal index and never the dialogId: the same interlocutor
			// is present both here and in the recent list, so a dialogId match would light up two items.
			return navIndex !== null && navIndex === this.activeNavIndex;
		},
		getOptionId(dialogId: string, tileIndex: number): ?string
		{
			const navIndex = this.getNavIndex(tileIndex);
			if (!this.withAriaNavigation || navIndex === null)
			{
				return null;
			}

			return getSearchOptionId(this.searchAreaId, navIndex, dialogId);
		},
		isChat(dialogId: string): boolean
		{
			return dialogId.startsWith(DialogIdChatPrefix);
		},
		loc(key: string): string
		{
			return this.$Bitrix.Loc.getMessage(key);
		},
	},
	template: `
		<div
			:id="groupId"
			:role="withAriaNavigation ? 'group' : null"
			:aria-labelledby="groupTitleId"
			class="bx-im-recent-users-carousel__container bx-im-recent-users-carousel__scope"
			data-testid="im-search-carousel"
		>
			<div class="bx-im-recent-users-carousel__title-container" data-testid="im-search-carousel-title">
				<span :id="groupTitleId" class="bx-im-recent-users-carousel__section-title">
					{{ loc('IM_SEARCH_SECTION_RECENT_CHATS') }}
				</span>
			</div>
			<div class="bx-im-recent-users-carousel__users-container">
				<SelfChat
					v-if="notesDialogId"
					:dialogId="notesDialogId"
					:active="isActive(0)"
					:navIndex="getNavIndex(0)"
					:id="getOptionId(notesDialogId, 0)"
					:role="withAriaNavigation ? 'option' : null"
					:aria-selected="withAriaNavigation ? isActive(0) : null"
					@clickItem="$emit('clickItem', $event)"
				/>
				<CarouselUser
					v-for="(userDialogId, index) in userDialogIds"
					:key="userDialogId"
					:userDialogId="userDialogId"
					:active="isActive(index + 1)"
					:navIndex="getNavIndex(index + 1)"
					:id="getOptionId(userDialogId, index + 1)"
					:role="withAriaNavigation ? 'option' : null"
					:aria-selected="withAriaNavigation ? isActive(index + 1) : null"
					@clickItem="$emit('clickItem', $event)"
					@openContextMenu="$emit('openContextMenu', $event)"
				/>
			</div>
		</div>
	`,
};
