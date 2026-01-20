import { TextLg } from 'ui.system.typography.vue';
import { Outline } from 'ui.icon-set.api.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

// @vue/component
export const ResultListEmpty = {
	name: 'ResultListEmpty',
	components: {
		TextLg,
		UiButton,
	},
	emits: ['addResult'],
	setup(): void
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	template: `
		<div class="tasks-field-results-result-list-empty">
			<div class="tasks-field-results-result-list-empty-image"/>
			<TextLg className="tasks-field-results-result-list-empty-title">
				{{ loc('TASKS_V2_RESULT_LIST_EMPTY') }}
			</TextLg>
			<div class="tasks-field-results-result-list-empty-button">
				<UiButton
					:text="loc('TASKS_V2_RESULT_ADD')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.PLUS_L"
					:wide="false"
					@click="$emit('addResult')"
				/>
			</div>
		</div>
	`,
};
