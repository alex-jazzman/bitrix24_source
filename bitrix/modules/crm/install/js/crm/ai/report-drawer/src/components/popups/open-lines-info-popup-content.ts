import { defineComponent, type PropType } from 'ui.vue3';
import { Loc, Runtime, Type } from 'main.core';

import { type OpenLinesInfoPopupData } from '../../types';

export const OpenLinesInfoPopupContent = defineComponent({
	name: 'CrmAiReportDrawerOpenLinesInfoPopupContent',

	props: {
		infoPopupData: {
			type: Object as PropType<OpenLinesInfoPopupData>,
			required: true,
		},
	},

	computed: {
		chatLinkFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHAT_LINK_TITLE') ?? '';
		},
		chatStartTimeFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHAT_START_TIME_TITLE') ?? '';
		},
		chatEndTimeFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHAT_END_TIME_TITLE') ?? '';
		},
		channelFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CHANNEL_TITLE') ?? '';
		},
		hasChatAction(): boolean
		{
			return this.infoPopupData.chat.action?.type === 'open-lines-chat'
				&& Type.isStringFilled(this.infoPopupData.chat.action.value)
			;
		},
	},

	methods: {
		handleChatClick(event: MouseEvent): void
		{
			if (!this.hasChatAction)
			{
				return;
			}

			const action = this.infoPopupData.chat.action;
			if (!action || action.type !== 'open-lines-chat')
			{
				return;
			}

			this.openOpenLineChat(action.value);
		},

		openOpenLineChat(dialogId: string): void
		{
			Runtime.loadExtension('im.public.iframe').then((exports) => {
				const messengerExports = Array.isArray(exports) ? exports[0] : exports;
				const messenger = (messengerExports as { Messenger?: { openLines: (value: string) => void } }).Messenger;

				messenger?.openLines(dialogId);
			}).catch((exception) => {
				console.error('Error loading "im.public.iframe":', exception);
			});
		},
	},

	template: `
		<div class="crm-ai-report-drawer__info-popup">
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ chatLinkFieldTitle }}
				</div>
				<div class="crm-ai-report-drawer__info-popup-field-value-wrapper">
					<a
						v-if="hasChatAction"
						href="#"
						class="crm-ai-report-drawer__info-popup-field-value --accent ui-typography-text-md"
						@click.prevent="handleChatClick"
					>
						{{ infoPopupData.chat.text }}
					</a>
					<span
						v-else
						class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
						:class="{ '--accent': infoPopupData.chat.isAccent === true }"
					>
						{{ infoPopupData.chat.text }}
					</span>
				</div>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ chatStartTimeFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.startedAt }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ chatEndTimeFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.endedAt }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ channelFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.channel }}
				</span>
			</div>
		</div>
	`,
});
