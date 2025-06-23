import { EventEmitter } from 'main.core.events';

import { Messenger } from 'im.public';
import { EventType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { ForwardSearch, ChatSearchInput } from 'im.v2.component.search';

import type { JsonObject } from 'main.core';

import './forward-content.css';

// @vue/component
export const ForwardContent = {
	name: 'ForwardContent',
	components: { ForwardSearch, ChatSearchInput },
	props:
	{
		messagesIds: {
			type: Array,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			searchQuery: '',
			isLoading: false,
		};
	},
	beforeUnmount()
	{
		Analytics.getInstance().messageForward.onClosePopup();
	},
	methods:
	{
		onLoading(value: boolean)
		{
			this.isLoading = value;
		},
		onUpdateSearch(query: string)
		{
			Analytics.getInstance().messageForward.onStartSearch({ dialogId: this.dialogId });
			this.searchQuery = query.trim().toLowerCase();
		},
		async onSelectItem(event: {dialogId: string, nativeEvent: KeyboardEvent})
		{
			const { dialogId } = event;

			EventEmitter.emit(EventType.dialog.closeBulkActionsMode, {
				dialogId,
			});

			await Messenger.openChat(dialogId);

			EventEmitter.emit(EventType.textarea.insertForward, {
				messagesIds: this.messagesIds,
				dialogId,
			});

			this.$emit('close');
		},
	},
	template: `
		<div class="bx-im-entity-selector-forward__container">
			<div class="bx-im-entity-selector-forward__input">
				<ChatSearchInput 
					:searchMode="true" 
					:isLoading="isLoading" 
					:withIcon="false" 
					:delayForFocusOnStart="1"
					@updateSearch="onUpdateSearch"
				/>
			</div>
			<div class="bx-im-entity-selector-forward__search-result-container">
				<ForwardSearch
					:query="searchQuery"
					:dialogId="dialogId"
					@clickItem="onSelectItem"
					@loading="onLoading"
				/>
			</div>
		</div>
	`,
};
