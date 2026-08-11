import { type JsonObject } from 'main.core';

import { Messenger } from 'im.public';

import { ToolbarButtonsManager } from 'imopenlines.v2.lib.toolbar-buttons';
import { runActionWithLoading } from 'imopenlines.v2.lib.utils';
import { type ImolModelCrmForm } from 'imopenlines.v2.model';

import { CrmForm } from './components/crm-form/crm-form';
import { QuickCommand } from './components/quick-command/quick-command';
import { QuickReply } from './components/quick-reply/quick-reply';
import { SalesCenter } from './components/sales-center/sales-center';
import { SilentMode } from './components/silent-mode/silent-mode';
import { MarketplaceLinks } from './components/marketplace-links/marketplace-links';

import './css/toolbar-buttons.css';

// @vue/component
export const ToolbarButtons = {
	name: 'ToolbarButtons',
	components: { SilentMode, SalesCenter, CrmForm, QuickReply, MarketplaceLinks, QuickCommand },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			crmForms: [],
			isCrmFormsLoading: false,
			isSilentModeLoading: false,
		};
	},
	computed:
	{
		isSilentModeActive(): boolean
		{
			return this.toolbarButtonsManager.getSilentModeStatus(this.dialogId);
		},
		chatId(): number
		{
			return this.$store.getters['chats/get'](this.dialogId, true).chatId;
		},
	},
	created()
	{
		this.toolbarButtonsManager = new ToolbarButtonsManager(this.$store, this.dialogId);
	},
	beforeUnmount()
	{
		this.toolbarButtonsManager.destroy();
	},
	methods:
	{
		async onSilentModeToggle(): Promise<void>
		{
			await runActionWithLoading(this, 'isSilentModeLoading', () => {
				return this.toolbarButtonsManager.toggleSilentMode(this.dialogId);
			});
		},
		async onCrmFormOpen(): Promise<void>
		{
			this.crmForms = await runActionWithLoading(this, 'isCrmFormsLoading', () => {
				return this.toolbarButtonsManager.loadCrmForms();
			});
		},
		async onCrmFormSelect(form: ImolModelCrmForm): Promise<void>
		{
			await runActionWithLoading(this, 'isCrmFormsLoading', () => {
				return this.toolbarButtonsManager.sendCrmForm(this.dialogId, form);
			});
		},
		onQuickReplySelect(text: string): void
		{
			Messenger.textarea.insertText(this.chatId, text);
		},
		onQuickCommandSelect(text: string, options: { replace: boolean, withNewLine: boolean }): void
		{
			Messenger.textarea.insertText(this.chatId, text, options);
		},
	},
	template: `
		<div class="bx-imol-textarea-buttons">
			<CrmForm
				:forms="crmForms"
				:isLoading="isCrmFormsLoading"
				@open="onCrmFormOpen"
				@selectForm="onCrmFormSelect"
			/>
			<QuickReply
				:dialogId="dialogId"
				@selectReply="onQuickReplySelect"
			/>
			<QuickCommand @selectCommand="onQuickCommandSelect" />
			<SilentMode
				:isActive="isSilentModeActive"
				:isLoading="isSilentModeLoading"
				:dialogId="dialogId"
				@toggle="onSilentModeToggle"
			/>
			<SalesCenter :dialogId="dialogId" />
			<MarketplaceLinks />
		</div>
	`,
};
