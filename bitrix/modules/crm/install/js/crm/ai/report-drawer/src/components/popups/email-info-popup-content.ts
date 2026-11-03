import { defineComponent, type PropType } from 'ui.vue3';
import { Loc, Type, Uri } from 'main.core';
import { Router } from 'crm.router';

import { resolveEntityIconPath } from './call-info-popup-content';

import { type EmailInfoPopupData, type InfoPopupEmailActionData, type ResponsibleData } from '../../types';

const EMAIL_ACTIVITY_PLANNER_SLIDER_URL = '/bitrix/components/bitrix/crm.activity.planner/slider.php';
const EMAIL_ACTIVITY_SLIDER_WIDTH = 1080;

export const EmailInfoPopupContent = defineComponent({
	name: 'CrmAiReportDrawerEmailInfoPopupContent',

	props: {
		infoPopupData: {
			type: Object as PropType<EmailInfoPopupData>,
			required: true,
		},
	},

	computed: {
		entityFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_EMAIL_ENTITY_TITLE') ?? '';
		},
		conversationStartedAtFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_EMAIL_STARTED_AT_TITLE') ?? '';
		},
		lastAnalyzedAtFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_EMAIL_LAST_ANALYZED_AT_TITLE') ?? '';
		},
		managersFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_EMAIL_MANAGERS_TITLE') ?? '';
		},
		openEmailText(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_EMAIL_OPEN') ?? '';
		},
		managers(): ResponsibleData[]
		{
			return Array.isArray(this.infoPopupData.managers) ? this.infoPopupData.managers : [];
		},
		hasEntity(): boolean
		{
			return !Type.isNil(this.infoPopupData.entity);
		},
		hasEntityLink(): boolean
		{
			return Type.isStringFilled(this.infoPopupData.entity?.href);
		},
		hasConversationStartedAt(): boolean
		{
			return Type.isStringFilled(this.infoPopupData.conversationStartedAt);
		},
		hasLastAnalyzedAt(): boolean
		{
			return Type.isStringFilled(this.infoPopupData.lastAnalyzedAt);
		},
		hasManagers(): boolean
		{
			return this.managers.length > 0;
		},
		hasEmailAction(): boolean
		{
			const action = this.infoPopupData.activity?.action;

			return action?.type === 'email-activity'
				&& Type.isInteger(action.value)
				&& action.value > 0
			;
		},
		entityIconStyle(): Record<string, string>
		{
			const ownerTypeId = this.infoPopupData.entity?.ownerTypeId ?? 0;

			return {
				'--crm-ai-report-drawer__info-popup-field-icon-path': `var(${resolveEntityIconPath(ownerTypeId)})`,
			};
		},
	},

	methods: {
		handleEmailClick(): void
		{
			const action = this.infoPopupData.activity?.action;
			if (!this.hasEmailAction || action?.type !== 'email-activity')
			{
				return;
			}

			this.openEmailActivity(action);
		},

		openEmailActivity(action: InfoPopupEmailActionData): void
		{
			const uri = new Uri(EMAIL_ACTIVITY_PLANNER_SLIDER_URL);
			uri.setQueryParam('site_id', Loc.getMessage('SITE_ID') ?? '');
			uri.setQueryParam('action', 'view');
			uri.setQueryParam('activity_id', String(action.value));

			Router.openSlider(uri.toString(), {
				width: EMAIL_ACTIVITY_SLIDER_WIDTH,
			});
		},
	},

	template: `
		<div
			class="crm-ai-report-drawer__info-popup"
			data-testid="crm-ai-report-drawer-email-info-popup"
		>
			<div v-if="hasEntity" class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ entityFieldTitle }}
				</div>
				<div class="crm-ai-report-drawer__info-popup-field-value-wrapper">
					<span
						class="crm-ai-report-drawer__info-popup-field-icon --entity"
						:style="entityIconStyle"
					></span>
					<a
						v-if="hasEntityLink"
						:href="infoPopupData.entity.href"
						class="crm-ai-report-drawer__info-popup-field-value --accent ui-typography-text-md"
						data-testid="crm-ai-report-drawer-email-entity-link"
					>
						{{ infoPopupData.entity.title }}
					</a>
					<span
						v-else
						class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
					>
						{{ infoPopupData.entity.title }}
					</span>
				</div>
			</div>
			<div v-if="hasConversationStartedAt" class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ conversationStartedAtFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.conversationStartedAt }}
				</span>
			</div>
			<div v-if="hasLastAnalyzedAt" class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ lastAnalyzedAtFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.lastAnalyzedAt }}
				</span>
			</div>
			<div v-if="hasManagers" class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ managersFieldTitle }}
				</div>
				<div class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					<div v-for="manager in managers" :key="manager.responsibleId">
						<a
							v-if="manager.responsibleProfileUrl"
							:href="manager.responsibleProfileUrl"
							class="crm-ai-report-drawer__info-popup-field-value --accent"
							:data-testid="'crm-ai-report-drawer-email-manager-link-' + manager.responsibleId"
						>
							{{ manager.responsibleName }}
						</a>
						<span v-else>{{ manager.responsibleName }}</span>
					</div>
				</div>
			</div>
			<div v-if="hasEmailAction" class="crm-ai-report-drawer__info-popup-field">
				<a
					href="#"
					data-testid="crm-ai-report-drawer-email-open-activity"
					class="crm-ai-report-drawer__info-popup-field-value --accent ui-typography-text-md"
					@click.prevent="handleEmailClick"
				>
					{{ openEmailText }}
				</a>
			</div>
		</div>
	`,
});
