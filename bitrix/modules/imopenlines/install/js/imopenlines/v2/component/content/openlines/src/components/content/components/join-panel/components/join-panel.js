import { type JsonObject } from 'main.core';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Messenger } from 'im.public';
import { Layout } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';

import { AnswerService, JoinService, StartService } from 'imopenlines.v2.provider.service';
import { QuickReplyManager } from 'imopenlines.v2.lib.quick-reply';

import { ChatTransfer } from '../../entity-selector/chat-transfer/chat-transfer';

// @vue/component
export const JoinPanel = {
	name: 'JoinPanel',
	components: { UiButton, ChatTransfer },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isNewSession: {
			type: Boolean,
			required: true,
		},
		isClosed: {
			type: Boolean,
			required: true,
		},
		hasSession: {
			type: Boolean,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showChatTransferPopup: false,
		};
	},
	computed: {
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		textStartJoinButtons(): string
		{
			return this.isClosed
				? this.loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_START')
				: this.loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_JOIN_BUTTON');
		},
		canTransfer(): boolean
		{
			return this.hasSession && !this.isClosed;
		},
	},
	methods: {
		async handleDialogAccess(): Promise
		{
			if (this.isClosed)
			{
				return this.getStartService().startDialog(this.dialogId);
			}

			await this.getJoinService().joinToDialog(this.dialogId);
			QuickReplyManager.getInstance().resetCache(this.dialogId);
		},
		answerDialog(): Promise
		{
			return this.getAnswerService().requestAnswer(this.dialogId);
		},
		closeDialog()
		{
			void Messenger.openLines();
			LayoutManager.getInstance().setLastOpenedElement(Layout.openlinesV2, '');
		},
		getAnswerService(): AnswerService
		{
			if (!this.answerService)
			{
				this.answerService = new AnswerService();
			}

			return this.answerService;
		},
		getStartService(): StartService
		{
			if (!this.startService)
			{
				this.startService = new StartService();
			}

			return this.startService;
		},
		getJoinService(): JoinService
		{
			if (!this.joinService)
			{
				this.joinService = new JoinService();
			}

			return this.joinService;
		},
		openChatTransferPopup()
		{
			this.showChatTransferPopup = true;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ul class="bx-imol-textarea_join-panel-list-button">
			<li v-if="isNewSession && !isClosed" class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_ANSWER')"
					@click="answerDialog"
				/>
			</li>
			<li v-if="!isNewSession" class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:text=textStartJoinButtons
					@click="handleDialogAccess"
				/>
			</li>
			<li v-if="canTransfer" class="bx-imol-textarea_join-panel-item-button" ref="transfer-chat">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.OUTLINE"
					:text="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
					@click="openChatTransferPopup"
				/>
			</li>
			<li class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED_ALERT"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_CLOSE')"
					@click="closeDialog"
				/>
			</li>
		</ul>
		<ChatTransfer
			v-if="canTransfer"
			:bindElement="$refs['transfer-chat'] || {}"
			:dialogId="dialogId"
			:showPopup="showChatTransferPopup"
			:popupConfig="{offsetTop: -700, offsetLeft: 0}"
			@close="showChatTransferPopup = false"
		/>
	`,
};
