import { type JsonObject } from 'main.core';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

// @vue/component
export const DateGroupTitle = {
	name: 'DateGroupTitle',
	props:
	{
		title: {
			type: String,
			required: true,
		},
		date: {
			type: String,
			default: '',
		},
	},
	emits: ['dateNavigationClick'],
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		isDateNavigationAvailable(): boolean
		{
			return this.date.length > 0 && FeatureManager.isFeatureAvailable(Feature.isMessageDateNavigationAvailable);
		},
		// The day of the group is published on the sticky element of the divider: it is the element
		// whose position tells which group the user sees now, and the calendar opens on its month
		// Nothing to open the calendar from - nothing to publish.
		navigationDate(): string | null
		{
			return this.isDateNavigationAvailable ? this.date : null;
		},
		// The accessible name keeps the date the divider shows: without it the screen reader would
		// name every divider the same, and WCAG 2.5.3 asks the name to contain the visible label.
		dateNavigationTitle(): string
		{
			return this.$Bitrix.Loc.getMessage(
				'IM_MESSAGE_LIST_DATE_GROUP_DATE_NAVIGATION_TITLE',
				{ '#DATE#': this.title },
			);
		},
	},
	methods:
	{
		onClick(): void
		{
			this.$emit('dateNavigationClick', { date: this.date });
		},
	},
	// The clickable element is the whole pill, and it is a native button, so Enter and
	// Space activate it without a key handler of our own.
	template: `
		<div class="bx-im-message-list-date-group-title__container" :data-date="navigationDate">
			<button
				v-if="isDateNavigationAvailable"
				type="button"
				class="bx-im-message-list-date-group-title__text --interactive"
				:aria-label="dateNavigationTitle"
				aria-haspopup="dialog"
				data-testid="im-message-list-date-group-title"
				@click="onClick"
			>{{ title }}</button>
			<div
				v-else
				class="bx-im-message-list-date-group-title__text"
				data-testid="im-message-list-date-group-title"
			>{{ title }}</div>
		</div>
	`,
};
