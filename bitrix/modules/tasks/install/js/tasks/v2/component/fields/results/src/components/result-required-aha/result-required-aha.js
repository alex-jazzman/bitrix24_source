import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineSm, TextMd } from 'ui.system.typography.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Hint } from 'tasks.v2.component.elements.hint';

import './result-required-aha.css';

// @vue/component
export const ResultRequiredAha = {
	components: {
		UiButton,
		Hint,
		TextMd,
		HeadlineSm,
	},
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
		popupWidth: {
			type: Number,
			default: 530,
		},
		hasResults: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close', 'addResult'],
	setup(): void
	{
		return {
			Outline,
			AirButtonStyle,
			ButtonSize,
		};
	},
	computed: {
		title(): string
		{
			return this.hasResults
				? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_TITLE')
				: this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_TITLE')
			;
		},
		description(): string
		{
			return this.hasResults
				? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_DESC')
				: this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_DESC')
			;
		},
	},
	template: `
		<Hint
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: popupWidth,
				maxWidth: popupWidth,
				padding: 0,
			}"
			@close="$emit('close')"
		>
			<div class="tasks-field-results-hint-container">
				<div class="tasks-field-results-hint-icon"/>
				<div class="tasks-field-results-hint-info">
					<HeadlineSm className="tasks-field-results-hint-info-text">{{ title }}</HeadlineSm>
					<TextMd className="tasks-field-results-hint-info-text">{{ description }}</TextMd>
					<div class="tasks-field-results-hint-button">
						<UiButton
							:text="loc('TASKS_V2_RESULT_ADD')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="Outline.PLUS_L"
							:wide="false"
							@click="$emit('addResult')"
						/>
					</div>
				</div>
			</div>
		</Hint>
	`,
};
