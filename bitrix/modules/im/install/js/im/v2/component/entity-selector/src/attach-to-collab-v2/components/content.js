import { type JsonObject } from 'main.core';

import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';

import { AttachToCollabV2Confirm } from '../classes/confirm';

import '../css/content.css';

// @vue/component
export const AttachToCollabV2Content = {
	name: 'AttachToCollabV2Content',
	components: { ChatSearchInput, RecentSearch },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		recentSectionType: {
			type: String || null,
			default: null,
		},
		searchParams: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['popupClose'],
	data(): JsonObject
	{
		return {
			searchQuery: '',
			isLoading: false,
		};
	},
	methods: {
		onSearchLoading(value: boolean)
		{
			this.isLoading = value;
		},
		onUpdateSearch(query: string)
		{
			this.searchQuery = query.trim().toLowerCase();
		},
		onOpenSearchItem(event: { dialogId: string })
		{
			const { dialogId: selectedDialogId } = event;

			const confirm = new AttachToCollabV2Confirm({
				currentDialogId: this.dialogId,
				selectedDialogId,
				recentType: this.recentSectionType,
			});

			this.$emit('popupClose');

			confirm.show();
		},
	},
	template: `
		<div class="bx-im-entity-selector-attach-to-collab-v2__container">
			<div class="bx-im-entity-selector-attach-to-collab-v2__input">
				<ChatSearchInput
					:searchMode="true"
					:isLoading="isLoading"
					:withIcon="false"
					:delayForFocusOnStart="1"
					@updateSearch="onUpdateSearch"
				/>
			</div>
			<div class="bx-im-entity-selector-attach-to-collab-v2__search-result-container">
				<RecentSearch
					:searchMode="true"
					:showUsersCarousel="false"
					:additionalSearchParams="searchParams"
					:recentSectionType="recentSectionType"
					:query="searchQuery"
					@loading="onSearchLoading"
					@openItem="onOpenSearchItem"
				/>
			</div>
		</div>
	`,
};
