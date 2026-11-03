import { Text } from 'main.core';
import { FocusNavigator } from 'ui.a11y';

import '../css/mention-empty-state.css';

// @vue/component
export const SearchStatusLine = {
	name: 'MentionSearchStatusLine',
	props:
	{
		text: {
			type: String,
			required: true,
		},
	},
	emits: ['retry', 'focusTextarea'],
	setup(): Object
	{
		// the notice names what exactly is retried, and the accessible name of the button refers to it
		return { noticeId: `bx-im-mention-status-notice-${Text.getRandom()}` };
	},
	computed:
	{
		retryTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_MENTION_SEARCH_ERROR_RETRY');
		},
	},
	// a successful retry removes the notice together with the button, and a control removed under the
	// focus leaves it on the body: the field the list was opened from takes the focus back beforehand
	beforeUnmount()
	{
		const action = this.$refs.action;
		if (action && FocusNavigator.getActiveElement(action) === action)
		{
			this.$emit('focusTextarea');
		}
	},
	template: `
		<div
			class="bx-im-mention-empty-state__scope bx-im-mention-empty-state__container"
			data-testid="im-textarea-mention-status"
		>
			<span class="bx-im-mention-empty-state__title" :id="noticeId">{{ text }}</span>
			<button
				type="button"
				class="bx-im-mention-empty-state__action"
				data-testid="im-textarea-mention-retry-btn"
				ref="action"
				:aria-describedby="noticeId"
				@click="$emit('retry')"
			>
				{{ retryTitle }}
			</button>
		</div>
	`,
};
