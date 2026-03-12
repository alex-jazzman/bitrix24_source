import { Loc } from 'main.core';

import { EventType } from 'im.v2.const';
import { SearchInput } from 'im.v2.component.elements.search-input';

import type { EventEmitter } from 'main.core.events';

// @vue/component
export const ChatSearchInput = {
	name: 'ChatSearchInput',
	components: { SearchInput },
	props: {
		searchMode: {
			type: Boolean,
			required: true,
		},
		isLoading: {
			type: Boolean,
			required: false,
		},
		delayForFocusOnStart: {
			type: [Number, null],
			default: null,
		},
		withIcon: {
			type: Boolean,
			default: true,
		},
		placeholder: {
			type: String,
			default: Loc.getMessage('IM_SEARCH_INPUT_PLACEHOLDER_V2'),
		},
	},
	emits: ['closeSearch', 'openSearch', 'updateSearch'],
	methods: {
		onInputFocus()
		{
			this.$emit('openSearch');
		},
		onClose()
		{
			this.$emit('closeSearch');
		},
		onInputUpdate(query: string)
		{
			this.$emit('updateSearch', query);
		},
		onKeyPressed(event: KeyboardEvent)
		{
			this.getEmitter().emit(EventType.search.keyPressed, { keyboardEvent: event });
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<SearchInput
			:placeholder="placeholder"
			:searchMode="searchMode"
			:isLoading="isLoading"
			:withLoader="true"
			:delayForFocusOnStart="delayForFocusOnStart"
			:withIcon="withIcon"
			@inputFocus="onInputFocus"
			@queryChange="onInputUpdate"
			@keyPressed="onKeyPressed"
			@close="onClose"
			@closeByEsc="onClose"
		/>
	`,
};
