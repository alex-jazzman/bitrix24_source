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

	computed: {
		testIdPrefix(): string
		{
			return String(this.$attrs['data-testid'] ?? '');
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
			<div class="crm-ai-report-drawer__failed-criteria-block-header crm-ai-report-drawer__spoiler-toggle-trigger" :data-testid="testIdPrefix + '-header'" @click="toggleContentSpoiler()">
				<div class="crm-ai-report-drawer__failed-criteria-block-cross" />
				<div class="crm-ai-report-drawer__failed-criteria-block-title ui-typography-text-lg ui-typography-text-bold" :data-testid="testIdPrefix + '-title'">
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
					<div class="crm-ai-report-drawer__failed-criteria-block-commentary ui-typography-text-lg" :data-testid="testIdPrefix + '-summary'">
						{{ summary }}
					</div>
					<div class="crm-ai-report-drawer__failed-criteria-block-description ui-typography-text-md" :data-testid="testIdPrefix + '-conditions-toggle'" @click="toggleConditionsSpoiler">
						{{ loc('CRM_AI_REPORT_DRAWER_FAILED_CRITERIA_CONDITIONS_TITLE') }}
						<span class="crm-ai-report-drawer__spoiler-chevron" />
					</div>
					<div :class="['crm-ai-report-drawer__spoiler-content', isConditionsHidden ? '--hidden' : '']" :data-testid="testIdPrefix + '-conditions-content'">
						<div class="crm crm-ai-report-drawer__spoiler-content-inner ui-typography-text-md" :data-testid="testIdPrefix + '-conditions-text'">
							{{ description }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
});
