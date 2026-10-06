import { defineComponent } from 'ui.vue3';

export const FailedCriterion = defineComponent({
	name: 'FailedCriterion',

	props: {
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
		summary: {
			type: String,
			required: true,
		},
	},

	data(): { isContentHidden: boolean, isConditionsHidden: boolean }
	{
		return {
			isContentHidden: false,
			isConditionsHidden: true,
		};
	},

	methods: {
		toggleContentSpoiler(): void
		{
			this.isContentHidden = !this.isContentHidden;
		},

		toggleConditionsSpoiler(): void
		{
			this.isConditionsHidden = !this.isConditionsHidden;
		},
	},

	template: `
		<div class="crm-ai-report-drawer__content-block crm-ai-report-drawer__failed-criteria-block --ui-context-content-light">
			<div class="crm-ai-report-drawer__failed-criteria-block-header crm-ai-report-drawer__spoiler-toggle-trigger" @click="toggleContentSpoiler()">
				<div class="crm-ai-report-drawer__failed-criteria-block-cross" />
				<div class="crm-ai-report-drawer__failed-criteria-block-title ui-typography-text-lg ui-typography-text-bold">
					{{ title }}
				</div>
				<div class="crm-ai-report-drawer__spoiler-chevron" />
			</div>
			<div
				:class="[
					'crm-ai-report-drawer__failed-criteria-block-ai-analysis',
					'crm-ai-report-drawer__spoiler-content',
					isContentHidden ? '--hidden' : '',
				]"
			>
				<div class="crm-ai-report-drawer__spoiler-content-inner">
					<div class="crm-ai-report-drawer__failed-criteria-block-commentary ui-typography-text-lg">
						{{ summary }}
					</div>
					<div class="crm-ai-report-drawer__failed-criteria-block-description ui-typography-text-md" @click="toggleConditionsSpoiler">
						{{ loc('CRM_AI_REPORT_DRAWER_FAILED_CRITERIA_CONDITIONS_TITLE') }}
						<span class="crm-ai-report-drawer__spoiler-chevron" />
					</div>
					<div :class="['crm-ai-report-drawer__spoiler-content', isConditionsHidden ? '--hidden' : '']">
						<div class="crm crm-ai-report-drawer__spoiler-content-inner ui-typography-text-md">
							{{ description }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
});
