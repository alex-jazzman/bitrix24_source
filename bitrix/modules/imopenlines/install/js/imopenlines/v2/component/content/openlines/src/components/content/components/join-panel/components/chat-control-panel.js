import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { AnswerService, SkipService } from 'imopenlines.v2.provider.service';
import { type JsonObject } from 'main.core';

import { ChatTransfer } from '../../entity-selector/chat-transfer/chat-transfer';

// @vue/component
export const ChatControlPanel = {
	name: 'ChatControlPanel',
	components: { UiButton, ChatTransfer },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isQueueTypeAll: {
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
	},
	methods: {
		replyDialog(): Promise
		{
			return this.getAnswerService().requestAnswer(this.dialogId);
		},
		skipDialog(): Promise
		{
			return this.getSkipService().requestSkip(this.dialogId);
		},
		getAnswerService(): AnswerService
		{
			if (!this.answerService)
			{
				this.answerService = new AnswerService();
			}

			return this.answerService;
		},
		getSkipService(): SkipService
		{
			if (!this.skipService)
			{
				this.skipService = new SkipService();
			}

			return this.skipService;
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
			<li class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_ANSWER')"
					@click="replyDialog"
				/>
			</li>
			<li v-if="!isQueueTypeAll" class="bx-imol-textarea_join-panel-item-button">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED_ALERT"
					:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_SKIP')"
					@click="skipDialog"
				/>
			</li>
			<li class="bx-imol-textarea_join-panel-item-button" ref="transfer-chat">
				<UiButton
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.OUTLINE"
					:text="loc('IMOL_CONTENT_BUTTON_TRANSFER')"
					@click="openChatTransferPopup"
				/>
			</li>
		</ul>
		<ChatTransfer
			:bindElement="$refs['transfer-chat'] || {}"
			:dialogId="dialogId"
			:showPopup="showChatTransferPopup"
			:popupConfig="{offsetTop: -700, offsetLeft: 0}"
			@close="showChatTransferPopup = false"
		/>

	`,
};
