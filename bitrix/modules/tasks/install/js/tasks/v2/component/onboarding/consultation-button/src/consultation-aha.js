import 'spotlight';
import { HeadlineSm, TextMd } from 'ui.system.typography.vue';

import { Hint } from 'tasks.v2.component.elements.hint';

import './style.css';

// @vue/component
export const ConsultationAha = {
	components: {
		Hint,
		TextMd,
		HeadlineSm,
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		close: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			pulsar: null,
		};
	},
	mounted(): void
	{
		// standard product aha-moment pulse (main.spotlight)
		this.pulsar = new BX.SpotLight({
			targetElement: this.bindElement,
			targetVertex: 'middle-center',
			color: 'var(--ui-color-primary)',
		});
		this.pulsar.show();
	},
	beforeUnmount(): void
	{
		if (this.pulsar)
		{
			this.pulsar.close();
			this.pulsar = null;
		}
	},
	template: `
		<Hint
			:bindElement
			:options="{
				closeIcon: true,
				maxWidth: 520,
				padding: 0,
				ariaLabel: loc('TASKS_COMPONENT_ONBOARDING_CONSULTATION_BUTTON_TITLE'),
				focusTrap: {
					initialFocus: true,
					restoreFocus: bindElement,
				},
			}"
			@close="close"
		>
			<div class="tasks-consultation-aha">
				<div class="tasks-consultation-aha__image"/>
				<div class="tasks-consultation-aha__info">
					<HeadlineSm tag="h2" class="tasks-consultation-aha__text">
						{{ loc('TASKS_COMPONENT_ONBOARDING_CONSULTATION_BUTTON_TITLE') }}
					</HeadlineSm>
					<TextMd class="tasks-consultation-aha__text">
						{{ loc('TASKS_COMPONENT_ONBOARDING_CONSULTATION_BUTTON_TEXT') }}
					</TextMd>
				</div>
			</div>
		</Hint>
	`,
};
