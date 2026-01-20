import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineXs } from 'ui.system.typography.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './time-tracking-list-empty.css';

// @vue/component
export const TimeTrackingListEmpty = {
	name: 'TasksTimeTrackingListEmpty',
	components: {
		HeadlineXs,
		UiButton,
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
		<div class="tasks-time-tracking-list-empty">
			<div class="tasks-time-tracking-list-empty-icon"/>
			<div class="tasks-time-tracking-list-empty-text">
				<HeadlineXs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_EMPTY_INFO') }}</HeadlineXs>
				<HeadlineXs>{{ loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_EMPTY_ADD') }}</HeadlineXs>
			</div>
			<div class="tasks-time-tracking-list-empty-button" @click="$emit('add')">
				<UiButton
					:leftIcon="Outline.PLUS_L"
					:text="loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_EMPTY_ADD_BTN')"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.MEDIUM"
				/>
			</div>
		</div>
	`,
};
