import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { ChatButton, ButtonSize, ButtonColor } from 'im.v2.component.elements.button';
import { SearchInput } from 'im.v2.component.elements.search-input';
import { ChatType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';
import { CollabManager } from 'im.v2.lib.collab';

import './detail-header.css';

const ICON_SIZE = 24;

// @vue/component
export const DetailHeader = {
	name: 'DetailHeader',
	components: { ChatButton, SearchInput, BIcon },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		secondLevel: {
			type: Boolean,
			default: false,
		},
		withAddButton: {
			type: Boolean,
			default: false,
		},
		addButtonAsIcon: {
			type: Boolean,
			default: false,
		},
		withSearch: {
			type: Boolean,
			default: false,
		},
		isSearchHeaderOpened: {
			type: Boolean,
			default: false,
		},
		searchPlaceholder: {
			type: String,
			default: 'IM_SIDEBAR_SEARCH_MESSAGE_PLACEHOLDER',
		},
		searchInputTestId: {
			type: String,
			default: null,
		},
		delayForFocusOnStart: {
			type: Number || null,
			default: null,
		},
	},
	emits: ['back', 'addClick', 'changeQuery', 'toggleSearchPanelOpened'],
	computed:
	{
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isCollab(): boolean
		{
			return this.dialog.type === ChatType.collab;
		},
		addButtonColor(): ButtonColor
		{
			if (this.isCollab && CollabManager.shouldUseAccentColor(this.dialog))
			{
				return this.ButtonColor.Collab;
			}

			return this.ButtonColor.PrimaryLight;
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sidebar-detail-header__container bx-im-sidebar-detail-header__scope">
			<div class="bx-im-sidebar-detail-header__title-container">
				<button
					v-if="secondLevel"
					class="bx-im-sidebar-detail-header__ds-icon"
					@click="$emit('back')"
					data-testid="im-sidebar-detail-header-back-button"
				>
					<BIcon :name="Outline.CHEVRON_LEFT_L" :size="ICON_SIZE" />
				</button>
				<button
					v-else
					class="bx-im-sidebar-detail-header__ds-icon"
					@click="$emit('back')"
					data-testid="im-sidebar-detail-header-close-button"
				>
					<BIcon :name="Outline.CROSS_L" :size="ICON_SIZE" />
				</button>
				<div v-if="!isSearchHeaderOpened" class="bx-im-sidebar-detail-header__title-text">{{ title }}</div>
				<slot name="action">
					<div
						v-if="withAddButton && !addButtonAsIcon && !isSearchHeaderOpened"
						class="bx-im-sidebar-detail-header__add-button"
						ref="add-button"
					>
						<ChatButton
							:text="loc('IM_SIDEBAR_ADD_BUTTON_TEXT')"
							:size="ButtonSize.S"
							:color="addButtonColor"
							:isRounded="true"
							:isUppercase="false"
							icon="plus"
							@click="$emit('addClick', {target: $refs['add-button']})"
						/>
					</div>
				</slot>
				<div v-if="withSearch" class="bx-im-sidebar-detail-header__search">
					<SearchInput
						v-if="isSearchHeaderOpened"
						:placeholder="loc(searchPlaceholder)"
						:withIcon="false"
						:delayForFocusOnStart="delayForFocusOnStart"
						:data-testid="searchInputTestId"
						@queryChange="$emit('changeQuery', $event)"
						@close="$emit('toggleSearchPanelOpened', $event)"
						@closeByEsc="$emit('toggleSearchPanelOpened', $event)"
						class="bx-im-sidebar-search-header__input"
					/>
					<div
						v-else-if="addButtonAsIcon"
						@click="$emit('toggleSearchPanelOpened', $event)"
						class="bx-im-sidebar-detail-header__ds-icon"
						data-testid="im-sidebar-members-search-icon"
					>
						<BIcon :name="Outline.SEARCH" :size="ICON_SIZE" />
					</div>
					<div
						v-else
						@click="$emit('toggleSearchPanelOpened', $event)"
						class="bx-im-sidebar-detail-header__search__icon --search"
					></div>
				</div>
				<div
					v-if="withAddButton && addButtonAsIcon && !isSearchHeaderOpened"
					class="bx-im-sidebar-detail-header__add-icon-button"
					ref="add-button"
				>
					<div
						class="bx-im-sidebar-detail-header__ds-icon"
						@click="$emit('addClick', {target: $refs['add-button']})"
						data-testid="im-sidebar-members-add-icon"
					>
						<BIcon :name="Outline.ADD_PERSON" :size="ICON_SIZE" />
					</div>
				</div>
			</div>
		</div>
	`,
};
