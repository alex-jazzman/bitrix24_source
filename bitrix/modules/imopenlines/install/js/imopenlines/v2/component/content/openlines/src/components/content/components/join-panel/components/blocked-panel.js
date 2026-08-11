import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { type ImModelChat } from 'im.v2.model';

import { type ImolModelSession } from 'imopenlines.v2.model';
import { FinishService } from 'imopenlines.v2.provider.service';

// @vue/component
export const BlockedPanel = {
	name: 'BlockedPanel',
	components: { UiButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		session(): ImolModelSession
		{
			return this.$store.getters['openLines/sessions/getByChatId'](this.dialog.chatId, true);
		},
		blockReasonText(): string
		{
			if (this.session?.blockReason === 'USER')
			{
				return this.loc('IM_OL_CHAT_BLOCK_USER');
			}

			return this.loc('IM_OL_CHAT_BLOCK_DEFAULT');
		},
	},
	methods: {
		markSpam(): Promise
		{
			return this.getFinishService().markSpamChat(this.dialogId);
		},
		getFinishService(): FinishService
		{
			if (!this.finishService)
			{
				this.finishService = new FinishService();
			}

			return this.finishService;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-imol-textarea_blocked-panel">
			<p class="bx-imol-textarea_blocked-text">{{ blockReasonText }}</p>
			<ul class="bx-imol-textarea_join-panel-list-button">
				<li class="bx-imol-textarea_join-panel-item-button">
					<UiButton
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.FILLED_ALERT"
						:text="loc('IMOL_CONTENT_TEXTAREA_JOIN_PANEL_CLOSE')"
						@click="markSpam"
					/>
				</li>
			</ul>
		</div>
	`,
};
