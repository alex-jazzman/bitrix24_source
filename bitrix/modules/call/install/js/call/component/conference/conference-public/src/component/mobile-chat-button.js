import { BitrixVue } from "ui.vue";
import { Vuex } from "ui.vue.vuex";

const MobileChatButton = {
	computed:
	{
		dialogCounter()
		{
			if (this.dialog)
			{
				return this.dialog.counter;
			}
		},
		localize()
		{
			return BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
		},
		...Vuex.mapState({
			dialog: state => state.dialogues.collection[state.application.dialog.dialogId],
			conference: state => state.conference
		})
	},
	methods:
	{
		openChat()
		{
			this.getApplication().toggleChat();
		},
		getApplication()
		{
			return this.$Bitrix.Application.get();
		}
	},
	template: `
		<div class="bx-im-component-call-open-chat-button-container">
			<div @click="openChat" class="ui-btn-sm ui-btn-icon-chat bx-im-component-call-open-chat-button">
				{{ localize['BX_IM_COMPONENT_CALL_OPEN_CHAT'] }}
				<div v-if="dialogCounter > 0" class="bx-im-component-call-open-chat-button-counter">{{ dialogCounter }}</div>
			</div>
		</div>
	`
};

export {MobileChatButton};
