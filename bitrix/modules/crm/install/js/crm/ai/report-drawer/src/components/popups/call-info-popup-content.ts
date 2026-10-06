import { defineComponent, type PropType } from 'ui.vue3';
import { Loc, Runtime, Type } from 'main.core';

import {
	type CallInfoPopupData,
	type InfoPopupPhoneCallActionData,
	type InfoPopupValueData,
} from '../../types';

export function resolveEntityIconPath(ownerTypeId: number): string
{
	const entityTypeEnumeration = (BX as any).CrmEntityType.enumeration;

	switch (ownerTypeId)
	{
		case entityTypeEnumeration.lead:
			return '--ui-icon-set__path_lead';
		case entityTypeEnumeration.contact:
			return '--ui-icon-set__path_contact';
		case entityTypeEnumeration.deal:
			return '--ui-icon-set__path_deal';
		case entityTypeEnumeration.company:
			return '--ui-icon-set__path_company';
		case entityTypeEnumeration.invoice:
		case entityTypeEnumeration.smartinvoice:
			return '--ui-icon-set__path_invoice';
		case entityTypeEnumeration.quote:
			return '--ui-icon-set__path_commercial-offer';
		default:
			return '--ui-icon-set__path_item';
	}
}

export const CallInfoPopupContent = defineComponent({
	name: 'CrmAiReportDrawerCallInfoPopupContent',

	props: {
		infoPopupData: {
			type: Object as PropType<CallInfoPopupData>,
			required: true,
		},
	},

	computed: {
		entityFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_CALL_ENTITY_TITLE') ?? '';
		},
		dateFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_DATE_AND_DURATION_TITLE') ?? '';
		},
		fromNumberFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_FROM_NUMBER_TITLE') ?? '';
		},
		toNumberFieldTitle(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_TO_NUMBER_TITLE') ?? '';
		},
		hiddenPhoneNumberText(): string
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_INFO_POPUP_HIDDEN_PHONE_NUMBER') ?? '';
		},
		hasEntityLink(): boolean
		{
			return Type.isStringFilled(this.infoPopupData.entity.href);
		},
		hasFromNumberAction(): boolean
		{
			return this.hasPhoneCallAction(this.infoPopupData.fromNumber);
		},
		hasToNumberAction(): boolean
		{
			return this.hasPhoneCallAction(this.infoPopupData.toNumber);
		},
		displayFromNumberText(): string
		{
			return this.getDisplayPhoneNumberText(this.infoPopupData.fromNumber, 'from');
		},
		displayToNumberText(): string
		{
			return this.getDisplayPhoneNumberText(this.infoPopupData.toNumber, 'to');
		},
		entityIconStyle(): Record<string, string>
		{
			return {
				'--crm-ai-report-drawer__info-popup-field-icon-path': `var(${resolveEntityIconPath(
					this.infoPopupData.entity.ownerTypeId,
				)})`,
			};
		},
	},

	methods: {
		getDisplayPhoneNumberText(valueData: InfoPopupValueData, fieldName: 'from' | 'to'): string
		{
			return !this.isHiddenClientNumberField(fieldName)
				? valueData.text
				: this.hiddenPhoneNumberText
			;
		},

		isHiddenClientNumberField(fieldName: 'from' | 'to'): boolean
		{
			const isClientNumberField = this.infoPopupData.isIncomingCall
				? fieldName === 'from'
				: fieldName === 'to'
			;

			return !this.infoPopupData.hasClient && isClientNumberField;
		},

			hasPhoneCallAction(valueData: InfoPopupValueData): boolean
			{
				return valueData.action?.type === 'phone-call'
					&& Type.isStringFilled(valueData.action.phoneNumber)
				;
			},

			getPhoneCallAction(valueData: InfoPopupValueData): InfoPopupPhoneCallActionData | null
			{
				if (!this.hasPhoneCallAction(valueData))
				{
					return null;
				}

				return valueData.action as InfoPopupPhoneCallActionData;
			},

			getPhoneCallHref(valueData: InfoPopupValueData): string
			{
				const action = this.getPhoneCallAction(valueData);
				if (!action)
				{
					return '#';
				}

				return this.getPhoneCallHrefByAction(action);
			},

			getPhoneCallHrefByAction(action: InfoPopupPhoneCallActionData): string
			{
				return `callto://${action.phoneNumber}`;
			},

			handlePhoneClick(event: MouseEvent, valueData: InfoPopupValueData): void
			{
				const action = this.getPhoneCallAction(valueData);
				if (!action)
				{
					return;
				}

				event.preventDefault();
				this.startPhoneCall(action);
			},

			startPhoneCall(action: InfoPopupPhoneCallActionData): void
			{
				const crmEntityType = (BX as any).CrmEntityType;
				const topWindow = window.top as Window & {
					BXIM?: {
						phoneTo: (phone: string, callParams?: object) => void,
					},
				};
				const params: Record<string, string | number | boolean | Array<Record<string, string | number>>> = {
					AUTO_FOLD: true,
				};

			if (Type.isInteger(action.entityTypeId) && Type.isInteger(action.entityId))
			{
				params.ENTITY_TYPE_NAME = crmEntityType.resolveName(action.entityTypeId);
				params.ENTITY_ID = action.entityId;
			}

			if (
				Type.isInteger(action.ownerTypeId)
				&& Type.isInteger(action.ownerId)
				&& (
					action.ownerTypeId !== action.entityTypeId
					|| action.ownerId !== action.entityId
				)
			)
				{
					params.BINDINGS = [{
						OWNER_TYPE_NAME: crmEntityType.resolveName(action.ownerTypeId),
						OWNER_ID: action.ownerId,
					}];
				}

				if (Type.isInteger(action.activityId) && action.activityId > 0)
				{
					params.SRC_ACTIVITY_ID = action.activityId;
				}

				if (topWindow.BXIM?.phoneTo)
				{
					topWindow.BXIM.phoneTo(action.phoneNumber, params);

					return;
				}

				const fallbackHref = this.getPhoneCallHrefByAction(action);

				Runtime.loadExtension('im.public').then((exports) => {
					const messengerExports = Array.isArray(exports) ? exports[0] : exports;
					const messenger = (messengerExports as { Messenger?: { startPhoneCall: (phone: string, callParams: object) => void } }).Messenger;

					if (!messenger?.startPhoneCall)
					{
						window.location.href = fallbackHref;

						return;
					}

					void messenger.startPhoneCall(action.phoneNumber, params);
				}).catch((exception) => {
					console.error('Error loading "im.public":', exception);
					window.location.href = fallbackHref;
				});
			},
	},

	template: `
		<div class="crm-ai-report-drawer__info-popup">
			<div class="crm-ai-report-drawer__info-popup-field">
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
					>
						{{ infoPopupData.entity.title }}
					</a>
					<span
						v-else
						class="crm-ai-report-drawer__info-popup-field-value --accent ui-typography-text-md"
					>
						{{ infoPopupData.entity.title }}
					</span>
				</div>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ dateFieldTitle }}
				</div>
				<span class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md">
					{{ infoPopupData.dateAndDuration }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ fromNumberFieldTitle }}
				</div>
					<a
						v-if="hasFromNumberAction"
						:href="getPhoneCallHref(infoPopupData.fromNumber)"
						class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
						:class="{ '--accent': infoPopupData.fromNumber.isAccent === true }"
						@click.prevent.stop="handlePhoneClick($event, infoPopupData.fromNumber)"
					>
						{{ displayFromNumberText }}
					</a>
				<span
					v-else
					class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
					:class="{ '--accent': infoPopupData.fromNumber.isAccent === true }"
				>
					{{ displayFromNumberText }}
				</span>
			</div>
			<div class="crm-ai-report-drawer__info-popup-field">
				<div class="crm-ai-report-drawer__info-popup-field-title ui-typography-text-xs">
					{{ toNumberFieldTitle }}
				</div>
					<a
						v-if="hasToNumberAction"
						:href="getPhoneCallHref(infoPopupData.toNumber)"
						class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
						:class="{ '--accent': infoPopupData.toNumber.isAccent === true }"
						@click.prevent.stop="handlePhoneClick($event, infoPopupData.toNumber)"
					>
						{{ displayToNumberText }}
					</a>
				<span
					v-else
					class="crm-ai-report-drawer__info-popup-field-value ui-typography-text-md"
					:class="{ '--accent': infoPopupData.toNumber.isAccent === true }"
				>
					{{ displayToNumberText }}
				</span>
			</div>
		</div>
	`,
});
