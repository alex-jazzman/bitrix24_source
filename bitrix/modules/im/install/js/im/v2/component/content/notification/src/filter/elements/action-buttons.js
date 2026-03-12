import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

// @vue/component
export const NotificationFilterActionButtons = {
	name: 'NotificationFilterPopupActionButtons',
	components: { UiButton },
	emits: ['search', 'reset'],
	computed: {
		OutlineIcons: () => OutlineIcons,
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
	},
	methods: {
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-content-notification-filter-popup__actions-container">
			<UiButton
				:text="loc('IM_NOTIFICATIONS_FILTER_SEARCH_BUTTON')"
				class="--air"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.LARGE"
				:leftIcon="OutlineIcons.SEARCH"
				:dataset="{ testId: 'im_content-notification-filter__popup-search-button' }"
				@click="$emit('search')"
			/>
			<UiButton
				:text="loc('IM_NOTIFICATIONS_FILTER_RESET_BUTTON')"
				class="--air"
				:style="AirButtonStyle.PLAIN"
				:size="ButtonSize.LARGE"
				:dataset="{ testId: 'im_content-notification-filter__popup-reset-button' }"
				@click="$emit('reset')"
			/>
		</div>
	`,
};
