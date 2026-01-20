import { highlighter } from 'tasks.v2.lib.highlighter';
import { HeadlineSm, TextMd } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';

import { Hint } from 'tasks.v2.component.elements.hint';

import './important-messages-aha.css';

// @vue/component
export const ImportantMessagesAha = {
	components: {
		UiButton,
		Hint,
		TextMd,
		HeadlineSm,
	},
	props: {
		isShown: {
			type: Boolean,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			default: () => null,
		},
	},
	emits: ['close'],
	setup(): void
	{
		return {
			Outline,
			AirButtonStyle,
			ButtonSize,
		};
	},
	created()
	{
		void highlighter.highlight(this.bindElement, 2000);
	},
	template: `
		<Hint
			v-if="isShown"
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: 500,
				maxWidth: 500,
				padding: 0,
				offsetLeft: bindElement.offsetWidth / 4,
				angle: {
					offset: bindElement.offsetWidth / 4,
				}
			}"
			@close="$emit('close')"
		>
			<div class="tasks-important-messages-aha-container">
				<div class="tasks-important-messages-aha-icon"/>
				<div class="tasks-important-messages-aha-info">
					<HeadlineSm class="tasks-important-messages-aha-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_IMPORTANT_MESSAGES_TITLE') }}
					</HeadlineSm>
					<TextMd class="tasks-important-messages-aha-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_IMPORTANT_MESSAGES_DESC') }}
					</TextMd>
				</div>
			</div>
		</Hint>
	`,
};
