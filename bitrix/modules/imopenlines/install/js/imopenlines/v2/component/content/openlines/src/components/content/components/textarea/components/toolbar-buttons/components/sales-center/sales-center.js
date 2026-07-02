import { Extension } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';

import './css/sales-center.css';

const settings = Extension.getSettings('imopenlines.v2.component.content.openlines');
const SALES_HUB_URL = settings.get('salesHubUrl');
const SALES_CENTER_PARAMS = settings.get('salesCenterParams');

// @vue/component
export const SalesCenter = {
	name: 'SalesCenter',
	components: { BIcon },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		sessionId(): string
		{
			const currentSession = this.$store.getters['openLines/currentSession/getByDialogId'](this.dialogId);

			return currentSession?.sessionId?.toString() ?? '';
		},
		dealId(): string
		{
			const crmData = this.$store.getters['openLines/crm/getByDialogId'](this.dialogId);

			return crmData?.dealId?.toString() ?? '';
		},
	},
	methods:
	{
		buildSalesCenterUrl(dialogId: string, sessionId: number, dealId: number): string
		{
			const params = new URLSearchParams();
			params.set('dialogId', dialogId);
			params.set('sessionId', sessionId.toString());
			params.set('ownerId', dealId.toString());
			for (const [key, value] of Object.entries(SALES_CENTER_PARAMS))
			{
				params.set(key, value);
			}

			return `${SALES_HUB_URL}?${params.toString()}`;
		},
		openSalesCenter(): void
		{
			const url = this.buildSalesCenterUrl(this.dialogId, this.sessionId, this.dealId);
			BX.SidePanel.Instance.open(url, {
				allowChangeHistory: false,
				width: 1140,
			});
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			class="bx-imol-textarea-sales-center"
			:title="loc('IMOL_CONTENT_TEXTAREA_SALES_CENTER_DESCRIPTION')"
			@click="openSalesCenter"
		>
			<BIcon :name="OutlineIcons.MONEY" />
			<span class="bx-imol-textarea-sales-center__text">
				{{ loc('IMOL_CONTENT_TEXTAREA_SALES_CENTER_TITLE') }}
			</span>
		</button>
	`,
};
