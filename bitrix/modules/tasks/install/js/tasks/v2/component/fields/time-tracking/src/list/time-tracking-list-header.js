import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Text2Xs } from 'ui.system.typography.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './time-tracking-list-header.css';

// @vue/component
export const TimeTrackingListHeader = {
	name: 'TasksTimeTrackingListHeader',
	components: {
		UiButton,
		Text2Xs,
	},
	props: {
		empty: {
			type: Boolean,
			default: false,
		},
		addBtnDisabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['add'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	template: `
		<div class="tasks-time-tracking-list-row --header">
			<div class="tasks-time-tracking-list-column --header --date">
				<Text2Xs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_DATE') }}</Text2Xs>
			</div>
			<div class="tasks-time-tracking-list-column --header --time">
				<Text2Xs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_TIME') }}</Text2Xs>
			</div>
			<div class="tasks-time-tracking-list-column --header --author">
				<Text2Xs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_AUTHOR') }}</Text2Xs>
				<UiButton
					v-if="!empty"
					:leftIcon="Outline.PLUS_L"
					:text="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_COLUMN_BTN')"
					:style="AirButtonStyle.OUTLINE_ACCENT_2"
					:size="ButtonSize.SMALL"
					:disabled="addBtnDisabled"
					@click="$emit('add')"
				/>
			</div>
		</div>
	`,
};
