import { defineComponent, PropType } from 'ui.vue3';
import { Loc, Text, Type } from 'main.core';
import { Router } from 'crm.router';

const SCRIPT_LINK_ROLE = 'report-drawer-script-link';

export const ScriptName = defineComponent({
	name: 'ScriptName',

	props: {
		scriptName: {
			type: String,
			required: true,
		},
		assessmentSettingId: {
			type: Number as PropType<null | number>,
			required: true,
		},
		legacy: {
			type: Boolean,
		},
	},

	computed: {
		className(): Array<string | Object>
		{
			return [
				'crm-ai-report-drawer__content-block-script-name',
				'ui-typography-text-md',
				{ '--legacy-assessment': this.legacy },
			];
		},

		markup(): string
		{
			return Loc.getMessage(
				'CRM_AI_REPORT_DRAWER_ASSESSMENT_SCRIPT_NAME',
				{
					'#SCRIPT_NAME#': `
						<span
							data-role="${SCRIPT_LINK_ROLE}"
							class="crm-ai-report-drawer__content-block-script-name-highlight"
						>
							${Text.encode(this.scriptName)}
						</span>
					`,
				},
			) ?? '';
		},
	},

	methods: {
		handleClick(event: MouseEvent): void
		{
			const target = event.target;
			if (!(target instanceof HTMLElement) || !target.closest(`[data-role="${SCRIPT_LINK_ROLE}"]`))
			{
				return;
			}

			const route = Type.isInteger(this.assessmentSettingId)
				? `/crm/copilot-call-assessment/details/${this.assessmentSettingId}/`
				: '/crm/copilot-call-assessment/'
			;

			Router.openSlider(route, {
				width: 900,
				cacheable: false,
			});
		},
	},

	template: `
		<span :class="className" @click="handleClick" v-html="markup" />
	`,
});
