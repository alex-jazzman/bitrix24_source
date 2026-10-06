import { defineComponent, PropType } from 'ui.vue3';
import { Type, Loc, Text } from 'main.core';
import { ProgressRound } from 'ui.progressround';

import { type ResponsibleData } from '../../types';

export const ManagerPopupContent = defineComponent({
	name: 'CrmAiReportDrawerManagerPopupContent',

	props: {
		responsible: {
			type: Object as PropType<ResponsibleData>,
			required: true,
		},
	},

	computed: {
		normalizedRating(): number
		{
			if (!Type.isNumber(this.responsible.rating))
			{
				return 0;
			}

			return Math.min(Math.max(Math.round(this.responsible.rating), 0), 100);
		},

		managerPopupTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_MANAGER_POPUP_TITLE') ?? '';
		},

		managerPopupDescription(): string
		{
			return Loc.getMessage(
				'CRM_AI_REPORT_DRAWER_MANAGER_POPUP_DESCRIPTION',
				{
					'#RATING#': String(this.normalizedRating),
				},
			) ?? '';
		},

		responsibleAvatarStyle(): { backgroundImage?: string }
		{
			if (!Type.isStringFilled(this.responsible.responsibleAvatarUrl))
			{
				return {};
			}

			return {
				backgroundImage: `url(${encodeURI(Text.encode(this.responsible.responsibleAvatarUrl))})`,
			};
		},

		hasResponsibleProfileUrl(): boolean
		{
			return Type.isStringFilled(this.responsible.responsibleProfileUrl);
		},
	},

	mounted(): void
	{
		const chart = new ProgressRound({
			value: this.normalizedRating,
			maxValue: 100,
			color: ProgressRound.Color.PRIMARY,
			width: 30,
			textBefore: '',
			textAfter: '',
			colorTrack: 'var(--ui-color-base-7)',
			colorBar: '',
			statusType: ProgressRound.Status.NONE,
			lineSize: 8,
			fill: true,
			finished: false,
			rotation: false,
			useAirDesign: true,
		});

		chart.renderTo(this.$refs.chartContainer as HTMLElement);
	},

	template: `
		<div class="crm-ai-report-drawer__manager-popup">
			<div class="crm-ai-report-drawer__manager-popup-main">
				<div class="crm-ai-report-drawer__manager-popup-info">
					<span class="crm-ai-report-drawer__manager-popup-avatar ui-icon ui-icon-common-user">
						<i :style="responsibleAvatarStyle"></i>
					</span>
					<div class="crm-ai-report-drawer__manager-popup-text">
						<div class="crm-ai-report-drawer__manager-popup-caption ui-typography-text-xs">
							{{ managerPopupTitle }}
						</div>
						<a
							v-if="hasResponsibleProfileUrl"
							:href="responsible.responsibleProfileUrl"
							class="crm-ai-report-drawer__manager-popup-name ui-typography-text-md"
						>
							{{ responsible.responsibleName }}
						</a>
						<span
							v-else
							class="crm-ai-report-drawer__manager-popup-name ui-typography-text-md"
						>
							{{ responsible.responsibleName }}
						</span>
					</div>
				</div>
				<div class="crm-ai-report-drawer__manager-popup-rating">
					<div ref="chartContainer" class="crm-ai-report-drawer__manager-popup-rating-chart"></div>
					<div class="crm-ai-report-drawer__manager-popup-rating-value">
						<span class="ui-typography-heading-h4">{{ normalizedRating }}</span>
						<span class="crm-ai-report-drawer__manager-popup-rating-percent ui-typography-text-xs">%</span>
					</div>
				</div>
			</div>
			<div class="crm-ai-report-drawer__manager-popup-description ui-typography-text-md">
				{{ managerPopupDescription }}
			</div>
		</div>
	`,
});
